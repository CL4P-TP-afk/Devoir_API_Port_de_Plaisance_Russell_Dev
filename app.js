/**
 * @file app.js
 * Point d’entrée de l’application Express.
 *
 * Rôle :
 * - charge les middlewares globaux (logger, CORS, cookies, methodOverride, EJS layouts),
 * - expose Swagger UI sur `/api-docs`,
 * - monte les routeurs applicatifs :
 *   - `/auth` (authentification),
 *   - `/users`, `/catways`, `/catways/:id/reservations`,
 *   - `/dashboard`, `/user-dashboard`, `/reserver`,
 *   - `/docs` (page docs EJS), `/healthz` (sonde),
 * - fournit un fallback 404 JSON pour l’API (sans casser les vues).
 *
 * Note : `app.set('trust proxy', 1)` est activé car Render est derrière un proxy.
 * Config via variables d’environnement (voir README).
 */
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const { swaggerUi, swaggerDocument } = require('./swagger'); // swagger UI
const docsRouter = require('./routes/docs'); // docs page
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');

const mongodb = require('./db/mongo');
mongodb.initClientDbConnection();

const app = express();
app.set('trust proxy', 1); // ✅ Render est derrière un proxy

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middlewares globaux
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride('_method'));

app.use(cors({
  exposedHeaders: ['Authorization'],
  origin: '*'
}));

// Middleware injectant des variables globales dans toutes les vues EJS.
app.use((req, res, next) => {
  res.locals.user = req.decoded?.user || null;
  res.locals.success = req.query.success || null;
  res.locals.error = req.query.error || null;
  res.locals.message = req.query.message || null;
  next();
});

// Swagger UI (OpenAPI), plein écran
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

// Page “Docs” intégrée (iframe avec bouton Retour)
app.use('/docs', docsRouter);

// Routes applicatives
app.use('/auth', authRouter);
app.use('/', indexRouter);

// Middleware 404 JSON (fallback pour les endpoints API) — retourne { name, version, status, message }.
app.use(function (req, res, next) {
  res.status(404).json({ name: 'API', version: '1.0', status: 404, message: 'not_found' });
});

module.exports = app;
