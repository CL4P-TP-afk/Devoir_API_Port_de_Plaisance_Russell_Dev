const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../models/user');
const Catway = require('../models/catway');
const Reservation = require('../models/reservation');

const { MONGO_URI, MONGO_DBNAME } = process.env;

const mode = (process.argv.find(a => a.startsWith('--mode=')) || '--mode=safe').split('=')[1];

function readSeedFile(name) {
  const file = path.join(__dirname, '..', 'seed', `${name}.json`);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  try { return JSON.parse(raw); }
  catch (e) { console.error(`[Seed] Erreur JSON seed/${name}.json`); throw e; }
}

async function insertSafe(Model, data, uniqueKey) {
  // Insère en ignorant les doublons selon 'uniqueKey' si fourni
  // Sinon on tente insertMany avec ordered:false (ignore duplicates)
  if (!data.length) return 0;

  if (uniqueKey) {
    let count = 0;
    for (const doc of data) {
      const query = { [uniqueKey]: doc[uniqueKey] };
      if (doc._id) delete doc._id; // éviter collision _id
      const exists = await Model.findOne(query).lean();
      if (exists) continue;
      await Model.create(doc);
      count++;
    }
    return count;
  } else {
    try {
      const res = await Model.insertMany(
        data.map(d => { const x={...d}; delete x._id; return x; }),
        { ordered: false }
      );
      return res.length;
    } catch (e) {
      // ignore duplicate key errors
      if (e.writeErrors) {
        const inserted = e.result?.result?.nInserted ?? 0;
        return inserted;
      }
      throw e;
    }
  }
}

async function main() {
  if (!MONGO_URI) throw new Error('MONGO_URI manquant');

  const dbName = MONGO_DBNAME || 'apinode';
  console.log(`[Seed] Connexion à Mongo (${mode})…`);
  await mongoose.connect(MONGO_URI, { dbName });
  console.log(`[Seed] Connecté à "${mongoose.connection.name}"`);

  const users = readSeedFile('users');
  const catways = readSeedFile('catways');
  const reservations = readSeedFile('reservations')
    // Reconvertir les dates si elles sont des chaînes
    .map(r => ({
      ...r,
      startDate: r.startDate ? new Date(r.startDate) : undefined,
      endDate: r.endDate ? new Date(r.endDate) : undefined
    }));

  if (mode === 'reset') {
    console.log('[Seed] RESET: purge des collections…');
    await Promise.all([
      User.deleteMany({}),
      Catway.deleteMany({}),
      Reservation.deleteMany({})
    ]);
  }

  // users: unicité par email
  const createdUsers = await insertSafe(User, users, 'email');
  console.log(`[Seed] Users insérés: +${createdUsers} (safe=${mode==='safe'})`);

  // catways: unicité par catwayNumber
  const createdCatways = await insertSafe(Catway, catways, 'catwayNumber');
  console.log(`[Seed] Catways insérés: +${createdCatways}`);

  // reservations: on tente insertMany non ordonné (ignore duplicates)
  const createdResa = await insertSafe(Reservation, reservations, null);
  console.log(`[Seed] Reservations insérées: +${createdResa}`);

  await mongoose.disconnect();
  console.log('[Seed] Terminé ✅');
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
