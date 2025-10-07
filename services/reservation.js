const Reservation = require('../models/reservation');
const Catway = require('../models/catway');
const { body, validationResult } = require('express-validator');

/**
 * Affiche la page des réservations d’un catway donné (par _id Mongo du catway).
 * - Récupère le catway par `req.params.id`
 * - Charge les réservations (triées par `startDate`)
 * - Charge la liste des utilisateurs (noms) pour le formulaire
 * - Rend `pages/reservations` avec { catway, reservations, users, success, error }
 *
 * @async
 * @param {*} req - params.id : ObjectId du catway
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
exports.getAll = async (req, res) => {
  try {
    const id = req.params.id;
    const catway = await Catway.findById(id);
    if (!catway) return res.redirect('/catways?error=Catway introuvable');

    const reservations = await Reservation.find({ catwayNumber: catway.catwayNumber }).sort({ startDate: 1 });
    const users = await require('../models/user').find({}, 'name').sort({ name: 1 });

    res.render('pages/reservations', {
      catway,
      reservations,
      users,
      success: req.query.success,
      error: req.query.error
    });
  } catch (e) {
    return res.redirect(`/catways?error=Erreur de récupération`);
  }
};

/**
 * Affiche la page avec une réservation précise (par _id) pour un catway donné.
 * - params : { id (catway), idReservation }
 * - Si non trouvé -> 404 avec page `pages/reservations` (liste vide + message)
 *
 * @async
 * @param {*} req - params.id, params.idReservation
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
exports.getById = async (req, res) => {
  const { id, idReservation } = req.params;
  const reservation = await Reservation.findById(idReservation);
  const catway = await Catway.findById(id);
  if (!reservation || !catway) return res.status(404).render("pages/reservations", { error: "Réservation introuvable", reservations: [] });
  const users = await require('../models/user').find({}, 'name').sort({ name: 1 });
  res.render("pages/reservations", { reservations: [reservation], catway, users });
};

/**
 * Chaîne de middlewares pour **créer** une réservation.
 *
 * Validations :
 *  - clientName : doit exister dans la collection Users (par le `name`)
 *  - boatName : minLength 3
 *  - startDate, endDate : dates valides
 *
 * Règles métier dans le handler :
 *  - Catway existant (par _id)
 *  - Catway réservable (isReservable === true)
 *  - Aucun **chevauchement** de dates pour le même `catwayNumber`
 *  - Redirections HTML avec messages de succès/erreur
 *
 * @type {Array<*>}
 */
exports.add = [
  // Définition des règles de validation
  body('clientName')
    .trim()
    .custom(async (value) => {
      const user = await require('../models/user').findOne({ name: value });
      if (!user) {
        throw new Error("Ce client n'existe pas dans les utilisateurs enregistrés");
      }
      return true;
    }),
  body('boatName').trim().isLength({ min: 3 }).withMessage('Le nom du bâteau doit contenir au moins 3 caractères'),
  body('startDate').isDate().withMessage('Date de début doit être une date'),
  body('endDate').isDate().withMessage('Date de fin doit être une date'),

  // Fonction de traitement de la requête
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.redirect(`/catways/${req.params.id}/reservations?error=Formulaire invalide`);

    const catway = await Catway.findById(req.params.id);
    if (!catway) return res.redirect('/catways?error=Catway introuvable');

    if (!catway.isReservable) {
      return res.redirect(`/catways/${catway._id}/reservations?error=Ce catway n'est pas réservable actuellement`);
    }

    const temp = {
      catwayNumber: catway.catwayNumber,
      clientName: req.body.clientName,
      boatName: req.body.boatName,
      startDate: req.body.startDate,
      endDate: req.body.endDate
    };

    try {
      // Vérification de chevauchement
      const conflit = await Reservation.findOne({
        catwayNumber: catway.catwayNumber,
        $or: [
          {
            startDate: { $lte: req.body.endDate },
            endDate: { $gte: req.body.startDate }
          }
        ]
      });

      if (conflit) {
        return res.redirect(`/catways/${catway._id}/reservations?error=Ce catway est déjà réservé à cette période`);
      }

      await Reservation.create(temp);
      return res.redirect(`/catways/${catway._id}/reservations?success=Réservation ajoutée avec succès`);
    } catch (e) {
      return res.redirect(`/catways/${catway._id}/reservations?error=Erreur serveur lors de la création`);
    }
  }
];

/**
 * Chaîne de middlewares pour **mettre à jour** une réservation existante.
 *
 * Validations :
 *  - clientName (optionnel) : s’il est présent, doit exister dans Users
 *  - boatName (optionnel) : minLength 3
 *  - startDate/endDate (optionnels) : dates valides
 *
 * Règles métier :
 *  - Catway existant & réservable
 *  - Aucune collision de dates avec les autres réservations du même catway
 *    (on exclut la réservation en cours via `_id: { $ne: ... }`)
 *
 * Redirection vers `/catways/:id/reservations` avec message
 *
 * @type {Array<*>}
 */
exports.update = [
  // Définition des règles de validation
  body('clientName').optional().custom(async (value) => {
    const user = await require('../models/user').findOne({ name: value });
    if (!user) {
      throw new Error("Client introuvable parmi les utilisateurs enregistrés");
    }
    return true;
  }),
  body('boatName').trim().optional().isLength({ min: 3 }).withMessage('Le nom du bâteau doit contenir au moins 3 caractères'),
  body('startDate').optional().isDate().withMessage('startDate doit être une date'),
  body('endDate').optional().isDate().withMessage('endDate doit être une date'),

  // Fonction de traitement de la requête
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.redirect(`/catways/${req.params.id}/reservations?error=Formulaire invalide`);

    const catway = await Catway.findById(req.params.id);
    if (!catway) return res.redirect('/catways?error=Catway introuvable');
    if (!catway.isReservable) {
      return res.redirect(`/catways/${catway._id}/reservations?error=Ce catway n'est pas réservable actuellement`);
    }

    const idReservation = req.params.idReservation;
    const reservation = await Reservation.findById(idReservation);
    if (!reservation) return res.redirect(`/catways/${catway._id}/reservations?error=Réservation introuvable`);

    const fields = ['clientName', 'boatName', 'startDate', 'endDate'];
    fields.forEach(field => {
      if (req.body[field]) reservation[field] = req.body[field];
    });

    try {
      // Vérification de chevauchement (hors de sa propre réservation)
      const conflit = await Reservation.findOne({
        _id: { $ne: reservation._id }, // exclure la résa qu'on édite
        catwayNumber: catway.catwayNumber,
        $or: [
          {
            startDate: { $lte: req.body.endDate || reservation.endDate },
            endDate: { $gte: req.body.startDate || reservation.startDate }
          }
        ]
      });

      if (conflit) {
        return res.redirect(`/catways/${catway._id}/reservations?error=Conflit : ce catway est déjà réservé à cette période`);
      }

      await reservation.save();
      return res.redirect(`/catways/${catway._id}/reservations?success=Réservation modifiée`);
    } catch (e) {
      return res.redirect(`/catways/${catway._id}/reservations?error=Erreur serveur lors de la modification`);
    }
  }
];

/**
 * Supprime une réservation (par _id) pour un catway donné.
 * - Vérifie d’abord l’existence du catway par `req.params.id`
 * - Supprime la réservation `req.params.idReservation`
 * - Redirige avec message de succès/erreur
 *
 * @async
 * @param {*} req - params.id (catway), params.idReservation
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
exports.delete = async (req, res) => {
  const catway = await Catway.findById(req.params.id);
  if (!catway) return res.redirect('/catways?error=Catway introuvable');

  try {
    await Reservation.deleteOne({ _id: req.params.idReservation });
    return res.redirect(`/catways/${catway._id}/reservations?success=Réservation supprimée`);
  } catch (e) {
    return res.redirect(`/catways/${catway._id}/reservations?error=Erreur lors de la suppression`);
  }
};
