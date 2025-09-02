const Reservation = require('../models/reservation');
const Catway = require('../models/catway');
const { body, validationResult } = require('express-validator');

//Récupère toutes les réservations d'un catway particulier (par son ID) 
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

// Récupère une réservation spécifique par son ID et le catway associé.
exports.getById = async (req, res) => {
  const { id, idReservation } = req.params;
  const reservation = await Reservation.findById(idReservation);
  const catway = await Catway.findById(id);
  if (!reservation || !catway) return res.status(404).render("pages/reservations", { error: "Réservation introuvable", reservations: [] });
  const users = await require('../models/user').find({}, 'name').sort({ name: 1 });
  res.render("pages/reservations", { reservations: [reservation], catway, users });
};

// Ajoute une nouvelle réservation.
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

// Met à jour une réservation existante. 
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

// Supprime une réservation.
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