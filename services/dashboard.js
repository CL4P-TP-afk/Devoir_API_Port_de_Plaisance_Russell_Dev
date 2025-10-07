const Reservation = require('../models/reservation');

/**
 * Rend le tableau de bord admin.
 *
 * Classe les réservations en trois sections côté serveur, puis rend la vue EJS `pages/dashboard` :
 *  - `currentReservations` : réservations qui ont commencé et dont la fin est aujourd’hui (minuit local) ou plus tard
 *  - `upcomingReservations` : réservations à venir (startDate > maintenant)
 *  - `expiredReservations` : réservations terminées (endDate < minuit local d’aujourd’hui)
 *
 * Notes d’implémentation :
 * - Les comparaisons de dates se font en **heure locale** (conversion via `new Date()`).
 * - Le minuit local est calculé via `todayMidnight.setHours(0,0,0,0)` pour éviter les faux positifs.
 * - La logique de classement est volontairement simple et calée sur l’UI actuelle.
 *
 * Variables passées à la vue :
 *  - `currentReservations` {Array<*>} : liste en cours
 *  - `upcomingReservations` {Array<*>} : liste à venir
 *  - `expiredReservations` {Array<*>} : liste terminées
 *  - `today` {string} : date du jour formatée fr-FR (affichage)
 *  - `message` {string|null} : message optionnel via querystring (`req.query.message`)
 *
 * @async
 * @param {*} req - Requête Express (peut contenir `query.message?: string`)
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
exports.renderDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // minuit local

    // Récupère toutes les réservations, puis répartit côté serveur.
    const allReservations = await Reservation.find({});

    const currentReservations = [];
    const upcomingReservations = [];
    const expiredReservations = [];

    allReservations.forEach(resa => {
      const now = new Date();
      const start = new Date(resa.startDate);
      const end = new Date(resa.endDate);

      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      if (start <= now && end >= todayMidnight) {
        currentReservations.push(resa);
      } else if (start > now) {
        upcomingReservations.push(resa);
      } else if (end < todayMidnight) {
        expiredReservations.push(resa);
      }
    });

    console.log(`▶️ Résas en cours : ${currentReservations.length}`);
    console.log(`📅 À venir : ${upcomingReservations.length}`);
    console.log(`🗑 Périmées : ${expiredReservations.length}`);

    res.render('pages/dashboard', {
      currentReservations,
      upcomingReservations,
      expiredReservations,
      today: today.toLocaleDateString('fr-FR'),
      message: req.query.message || null
    });

  } catch (err) {
    console.error('Erreur Dashboard:', err);
    res.status(500).send("Erreur lors du chargement du tableau de bord.");
  }
};
