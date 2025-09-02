// scripts/seed-init.js
// Import "immuable" depuis seed-init/*.json (aucun dump ne doit écrire ici)

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const URL = process.env.MONGO_URI;
const DB  = process.env.MONGO_DBNAME || 'apinode';

const User = require('../models/user');
const Catway = require('../models/catway');
const Reservation = require('../models/reservation');

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`[Seed:init] JSON invalide: ${filePath}`, e.message);
    return [];
  }
}

function isBcryptHash(value) {
  // bcrypt hash: $2a$, $2b$, $2y$
  return typeof value === 'string' && /^\$2[aby]\$/.test(value);
}

(async () => {
  try {
    if (!URL) {
      console.error('[Seed:init] MONGO_URI manquant dans env');
      process.exit(1);
    }

    console.log('[Seed:init] Connexion MongoDB…');
    await mongoose.connect(URL, { dbName: DB });
    console.log(`[Seed:init] Connecté db="${DB}"`);

    const baseDir = path.join(__dirname, '../seed-init');
    if (!fs.existsSync(baseDir)) {
      console.error(`[Seed:init] Dossier introuvable: ${baseDir}`);
      process.exit(1);
    }

    const users = loadJSON(path.join(baseDir, 'users.json')).map(u => {
      if (u.password && !isBcryptHash(u.password)) {
        u.password = bcrypt.hashSync(String(u.password), 10);
      }
      if (u.name) u.name = String(u.name).trim();
      if (u.email) u.email = String(u.email).trim().toLowerCase();
      return u;
    });

    const catways = loadJSON(path.join(baseDir, 'catways.json'));
    const reservations = loadJSON(path.join(baseDir, 'reservations.json'));

    console.log('[Seed:init] Nettoyage des collections…');
    await Promise.all([
      User.deleteMany({}),
      Catway.deleteMany({}),
      Reservation.deleteMany({})
    ]);

    if (users.length) {
      await User.insertMany(users, { ordered: false });
      console.log(`[Seed:init] Users insérés: ${users.length}`);
    } else {
      console.log('[Seed:init] Aucun users.json à insérer');
    }

    if (catways.length) {
      await Catway.insertMany(catways, { ordered: false });
      console.log(`[Seed:init] Catways insérés: ${catways.length}`);
    } else {
      console.log('[Seed:init] Aucun catways.json à insérer');
    }

    if (reservations.length) {
      await Reservation.insertMany(reservations, { ordered: false });
      console.log(`[Seed:init] Reservations insérées: ${reservations.length}`);
    } else {
      console.log('[Seed:init] Aucun reservations.json à insérer');
    }

    console.log('[Seed:init] Terminé ✅ (source: seed-init/*)');
    process.exit(0);
  } catch (err) {
    console.error('[Seed:init] Erreur ❌', err);
    process.exit(1);
  }
})();
