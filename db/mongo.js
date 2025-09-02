// db/mongo.js
const mongoose = require('mongoose');

const getMongoUri = () => {
  // Priorité à MONGO_URI ; fallback sur URL_MONGO pour compat rétro
  return process.env.MONGO_URI || process.env.URL_MONGO || '';
};

exports.initClientDbConnection = async () => {
  const uri = getMongoUri();

  if (!uri || typeof uri !== 'string') {
    const msg = '[Mongo] Aucune URI fournie (MONGO_URI ou URL_MONGO manquante).';
    console.error(msg);
    throw new Error(msg);
  }

  // Options Mongoose 8 : pas besoin de useNewUrlParser / useUnifiedTopology
  // dbName : uniquement si tu ne l’indiques pas déjà dans l’URI
  const options = {};
  if (process.env.MONGO_DBNAME) {
    options.dbName = process.env.MONGO_DBNAME;
  }

  try {
    console.log('[Mongo] Connexion en cours…');
    await mongoose.connect(uri.trim(), options);

    const { host, port, name } = mongoose.connection;
    console.log(`[Mongo] Connecté à ${host}:${port} / db="${name}"`);
  } catch (err) {
    console.error('[Mongo] Échec de connexion :', err.message);
    throw err;
  }

  // Logs utiles sur les changements d’état
  mongoose.connection.on('disconnected', () => {
    console.warn('[Mongo] Déconnecté');
  });
  mongoose.connection.on('reconnected', () => {
    console.info('[Mongo] Reconnecté');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[Mongo] Erreur de connexion :', err);
  });

  // Fermeture propre à l’arrêt du process (Ctrl+C, etc.)
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('\n[Mongo] Connexion fermée (SIGINT).');
    process.exit(0);
  });
};
