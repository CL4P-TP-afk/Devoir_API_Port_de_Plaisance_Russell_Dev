const Catway = require('../models/catway');
const { body, validationResult } = require('express-validator');

/**
 * Liste tous les catways (page HTML).
 *
 * - Trie par `catwayNumber` ascendant
 * - Rends `pages/catways` avec { catways, query, searchedCatway:null }
 *
 * @async
 * @param {*} req - Requête Express
 * @param {*} res - Réponse Express
 * @param {*} next - Next function
 * @returns {Promise<void>}
 */
exports.getAll = async (req, res, next) => {
  try {
    let catways = await Catway.find({}).sort({ catwayNumber: 1 });
    if (catways) {
      res.render("pages/catways", { catways, query: req.query, searchedCatway: null });
    }
  } catch (e) {
    res.status(500).send('Erreur serveur');
  }
};

/**
 * Récupère un catway par son numéro puis redirige vers la liste.
 * (Cette action ne rend pas de détail, elle valide juste l’existence.)
 *
 * @async
 * @param {*} req - params.id: numéro de catway (string/number)
 * @param {*} res - Réponse Express
 * @param {*} next - Next function
 * @returns {Promise<void>}
 */
exports.getById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const catway = await Catway.findOne({ catwayNumber: id });
    if (!catway) return res.status(404).send('Catway non trouvé');
    // Option: rendre une page de détail dédiée. Ici, redirection vers liste
    res.redirect('/catways');
  } catch (e) {
    res.status(500).send('Erreur serveur');
  }
};

/**
 * Chaîne de middlewares pour créer un catway.
 *
 * 1) Validations express-validator :
 *    - catwayNumber: entier >= 1
 *    - catwayType: "long" | "short"
 *    - catwayState: optionnel (trim)
 *
 * 2) Handler:
 *    - en cas d’erreur de validation, rend la page avec message
 *    - tente la création
 *    - gère l’unicité (code Mongo 11000) -> message “numéro déjà existant”
 *    - redirige vers /catways?success=1 si OK
 *
 * @type {Array<*>}
 */
exports.add = [
  // Définition des règles de validation
  body('catwayNumber').isInt({ min: 1 }).withMessage('Le numéro du catway doit être un entier positif'),
  body('catwayType').trim().isIn(["long", "short"]).withMessage('Le type doit être "long" ou "short"'),
  body('catwayState').trim().optional(),

  // Fonction de traitement de la requête
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render("pages/catways", {
        catways: await Catway.find(),
        query: { error: "Champs invalides" },
        searchedCatway: null
      });
    }

    const { catwayNumber, catwayType, catwayState, isReservable } = req.body;

    try {
      await Catway.create({
        catwayNumber,
        catwayType,
        catwayState,
        isReservable: isReservable === 'on'
      });
      res.redirect('/catways?success=1');
    } catch (e) {
      if (e.code === 11000) {
        // 🔁 doublon détecté (unicité catwayNumber)
        const catways = await Catway.find();
        return res.status(400).render("pages/catways", {
          catways,
          query: { error: "Ce numéro de catway existe déjà." },
          searchedCatway: null
        });
      }
      console.error(e);
      res.status(500).send("Erreur serveur");
    }
  }
];

/**
 * Chaîne de middlewares pour mettre à jour un catway (état + réservabilité).
 *
 * Body attendu:
 *  - catwayState: string (requis)
 *  - isReservable: "true" | "false" (string), converti en booléen
 *
 * Redirige vers /catways?successUpdate=1 en cas de succès.
 *
 * @type {Array<*>}
 */
exports.update = [
  body('catwayState').notEmpty().withMessage('Etat requis'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const updateFields = {
      catwayState: req.body.catwayState,
      isReservable: req.body.isReservable === 'true' // reçoit une string
    };

    try {
      await Catway.findByIdAndUpdate(req.params.id, updateFields);
      res.redirect('/catways?successUpdate=1');
    } catch (e) {
      res.status(500).send('Erreur serveur');
    }
  }
];

/**
 * Supprime un catway par son _id (Mongo).
 *
 * @async
 * @param {*} req - params.id: ObjectId du catway
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
exports.delete = async (req, res) => {
  try {
    await Catway.findByIdAndDelete(req.params.id);
    res.redirect('/catways?successDelete=1');
  } catch (e) {
    res.status(500).send('Erreur serveur');
  }
};

/**
 * Recherche un catway par son numéro et ré-affiche la page avec un bloc “résultat”.
 *
 * Body attendu:
 *  - searchNumber: string/number (sera parsé en int)
 *
 * @async
 * @param {*} req - Requête Express
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
exports.searchByNumber = async (req, res) => {
  const searchNumber = parseInt(req.body.searchNumber, 10);

  try {
    const catways = await Catway.find({}).sort({ catwayNumber: 1 });
    const foundCatway = await Catway.findOne({ catwayNumber: searchNumber });

    if (!foundCatway) {
      return res.render('pages/catways', {
        catways,
        query: { error: "Aucun catway trouvé avec ce numéro" },
        searchedCatway: null
      });
    }

    res.render('pages/catways', {
      catways,
      query: req.query,
      searchedCatway: foundCatway
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la recherche');
  }
};
