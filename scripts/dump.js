const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../models/user');
const Catway = require('../models/catway');
const Reservation = require('../models/reservation');

const { MONGO_URI, MONGO_DBNAME } = process.env;

async function main() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI manquant dans env/.env');
  }
  const dbName = MONGO_DBNAME || 'apinode';

  console.log(`[Dump] Connexion à Mongo…`);
  await mongoose.connect(MONGO_URI, { dbName });
  console.log(`[Dump] Connecté à "${mongoose.connection.name}"`);

  const seedDir = path.join(__dirname, '..', 'seed');
  if (!fs.existsSync(seedDir)) fs.mkdirSync(seedDir, { recursive: true });

  const collections = [
    { name: 'users', model: User },
    { name: 'catways', model: Catway },
    { name: 'reservations', model: Reservation }
  ];

  for (const { name, model } of collections) {
    const docs = await model.find({}).lean();
    const file = path.join(seedDir, `${name}.json`);

    // Astuce : on enlève les champs techniques inutiles
    const clean = docs.map(({ __v, ...d }) => d);

    fs.writeFileSync(file, JSON.stringify(clean, null, 2), 'utf8');
    console.log(`[Dump] ${name}: ${clean.length} doc(s) -> seed/${name}.json`);
  }

  await mongoose.disconnect();
  console.log('[Dump] Terminé ✅');
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
