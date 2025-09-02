const express = require('express');
const router = express.Router();

const service = require('../services/reservation');

const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');

// Toutes les routes nécessitent une connexion
router.use(checkJWT, isAdmin);

// route pour lister toutes les réservations
router.get('/:id/reservations', service.getAll);
// route pour lire les infos d'une réservation
router.get('/:id/reservations/:idReservation', service.getById);
// route pour créer une réservation
router.post('/:id/reservations', service.add);
// route pour modifier une réservation
router.patch('/:id/reservations/:idReservation', service.update);
// route pour supprimer une réservation
router.delete('/:id/reservations/:idReservation', service.delete);


module.exports = router;