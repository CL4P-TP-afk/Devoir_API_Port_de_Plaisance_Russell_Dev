const Reservation = require('../models/reservation');

exports.renderDashboard = async (req, res) => {
  try {
    const today = new Date(); // ex: 2025-08-05T07:00:00+02:00 (locale)
    today.setHours(0, 0, 0, 0); // minuit locale

    // 👉 Convertir chaque `endDate` en local puis comparer
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
