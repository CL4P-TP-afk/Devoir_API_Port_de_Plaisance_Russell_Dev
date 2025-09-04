// scripts/seed-init.js
// Import "immuable" depuis seed-init/*.json (aucun dump ne doit écrire ici)
// - Purge les collections (reset)
// - Insère users/catways/reservations depuis seed-init/
// - Force un mot de passe connu pour tous les users

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;            
const MONGO_DBNAME = process.env.MONGO_DBNAME || 'apinode';

// Mot de passe commun appliqué à TOUS les users lors du seed:init
const FORCE_PASSWORD = 'ChangeMe123!';

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

(async () => {
  try {
    if (!MONGO_URI) {
      console.error('[Seed:init] MONGO_URI manquant dans env/.env');
      process.exit(1);
    }

    console.log('[Seed:init] Connexion MongoDB…');
    await mongoose.connect(MONGO_URI, { dbName: MONGO_DBNAME });
    console.log(`[Seed:init] Connecté db="${mongoose.connection.name}"`);

    const baseDir = path.join(__dirname, '../seed-init');
    if (!fs.existsSync(baseDir)) {
      console.error(`[Seed:init] Dossier introuvable: ${baseDir}`);
      process.exit(1);
    }

    // Chargement des fichiers "immuables"
    let users = loadJSON(path.join(baseDir, 'users.json'));
    let catways = loadJSON(path.join(baseDir, 'catways.json'));
    let reservations = loadJSON(path.join(baseDir, 'reservations.json'));

    // Normalisation users + mot de passe forcé
    users = users.map(u => {
      const doc = { ...u };

      if (doc._id) delete doc._id; // éviter collision d'ObjectId
      doc.name = doc.name ? String(doc.name).trim() : 'Utilisateur';
      doc.email = doc.email ? String(doc.email).trim().toLowerCase() : undefined;

      // ⚠️ Mot de passe forcé pour éviter toute ambiguïté (hashé ici)
      doc.password = bcrypt.hashSync(FORCE_PASSWORD, 10);

      // Valeur par défaut
      if (!doc.role) doc.role = 'user';

      return doc;
    });

    // Normalisation catways
    catways = catways.map(c => {
      const doc = { ...c };
      if (doc._id) delete doc._id;
      return doc;
    });

    // Normalisation reservations (re-parsing des dates si nécessaires)
    reservations = reservations.map(r => {
      const doc = { ...r };
      if (doc._id) delete doc._id;
      if (doc.startDate) doc.startDate = new Date(doc.startDate);
      if (doc.endDate) doc.endDate = new Date(doc.endDate);
      return doc;
    });

    console.log('[Seed:init] RESET: purge des collections…');
    await Promise.all([
      User.deleteMany({}),
      Catway.deleteMany({}),
      Reservation.deleteMany({})
    ]);

    if (users.length) {
      await User.insertMany(users, { ordered: false });
      console.log(`[Seed:init] Users insérés: ${users.length} (password="${FORCE_PASSWORD}")`);
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

    await mongoose.disconnect();
    console.log('[Seed:init] Terminé ✅ (source: seed-init/*)');
    process.exit(0);
  } catch (err) {
    console.error('[Seed:init] Erreur ❌', err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
})();
