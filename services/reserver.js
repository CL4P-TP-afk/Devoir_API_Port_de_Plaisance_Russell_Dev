const Reservation = require('../models/reservation');
const Catway = require('../models/catway');
const User = require('../models/user');

/* ----------------------------- Helpers ----------------------------- */

/** Construit une map { catwayNumber -> catwayType } et { catwayNumber -> isReservable } */
function buildCatwayLookups(catways) {
  const typeByNumber = new Map();
  const reservableByNumber = new Map();
  catways.forEach(c => {
    typeByNumber.set(c.catwayNumber, c.catwayType);
    reservableByNumber.set(c.catwayNumber, !!c.isReservable);
  });
  return { typeByNumber, reservableByNumber };
}

/**
 * Construit une map { reservationId -> [catways filtrés] } :
 * - même type que le catway actuel de la réservation
 * - seulement catways réservable = true
 * - triés par catwayNumber
 */
function buildAllowedCatwaysByResId(allCatways, allReservations, typeByNumber) {
  const byType = {
    long: allCatways.filter(c => c.catwayType === 'long' && c.isReservable).sort((a,b)=>a.catwayNumber-b.catwayNumber),
    short: allCatways.filter(c => c.catwayType === 'short' && c.isReservable).sort((a,b)=>a.catwayNumber-b.catwayNumber),
  };

  const allowed = {};
  allReservations.forEach(r => {
    const currentType = typeByNumber.get(r.catwayNumber); // type du catway actuel de la résa
    if (currentType === 'long') allowed[r._id] = byType.long;
    else if (currentType === 'short') allowed[r._id] = byType.short;
    else allowed[r._id] = []; // au cas improbable où on ne trouve pas le type
  });
  return allowed;
}

/* --------------------------- Pages /reserver --------------------------- */

// Formulaire initial
exports.showForm = async (req, res) => {
  const users = await User.find({}, 'name email').sort({ name: 1 });
  const allReservations = await Reservation.find({}).sort({ startDate: 1 });
  // On récupère TOUS les catways pour pouvoir connaître le type du catway actuel des résas
  const allCatwaysFull = await Catway.find({}).sort({ catwayNumber: 1 });
  // Liste des catways réservable (utile pour la création / affichage général)
  const allCatways = allCatwaysFull.filter(c => c.isReservable);

  const { typeByNumber } = buildCatwayLookups(allCatwaysFull);
  const now = new Date();

  const reservations = {
    "En cours": allReservations.filter(r => r.startDate <= now && r.endDate >= now),
    "À venir": allReservations.filter(r => r.startDate > now),
    "Terminées": allReservations.filter(r => r.endDate < now)
  };

  // Map des catways autorisés par réservation (même type)
  const allowedCatwaysByResId = buildAllowedCatwaysByResId(allCatwaysFull, allReservations, typeByNumber);

  res.render('pages/reserver', {
    users,
    formData: {},
    availableCatways: [],
    message: req.query.message || null,
    reservations,
    allCatways,               // catways réservable (utiles pour la création)
    allowedCatwaysByResId,    // <--- pour filtrer la liste déroulante de chaque résa dans la vue
    searchResults: [],
    searchQuery: ''
  });
};


// Liste les catways disponibles après soumission du formulaire
exports.listAvailableCatways = async (req, res) => {
  const { clientName, boatName, catwayType, startDate, endDate, userId } = req.body;
  const formData = { clientName, boatName, catwayType, startDate, endDate, userId };
  const users = await User.find({}, 'name email').sort({ name: 1 });

  const now = new Date();
  const allReservations = await Reservation.find({}).sort({ startDate: 1 });
  const allCatwaysFull = await Catway.find({}).sort({ catwayNumber: 1 });
  const allCatways = allCatwaysFull.filter(c => c.isReservable);
  const { typeByNumber } = buildCatwayLookups(allCatwaysFull);

  const reservations = {
    "En cours": allReservations.filter(r => r.startDate <= now && r.endDate >= now),
    "À venir": allReservations.filter(r => r.startDate > now),
    "Terminées": allReservations.filter(r => r.endDate < now)
  };

  if (!clientName || !boatName || !catwayType || !startDate || !endDate || !userId) {
    const allowedCatwaysByResId = buildAllowedCatwaysByResId(allCatwaysFull, allReservations, typeByNumber);
    return res.render('pages/reserver', {
      users,
      formData,
      availableCatways: [],
      message: "Tous les champs sont requis",
      reservations,
      allCatways,
      allowedCatwaysByResId,
      searchResults: [],
      searchQuery: ''
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const matchingCatways = await Catway.find({
    catwayType,
    isReservable: true
  }).sort({ catwayNumber: 1 });

  const reservationsOverlap = await Reservation.find({
    catwayNumber: { $in: matchingCatways.map(c => c.catwayNumber) },
    $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }]
  });

  const reservedCatwayNumbers = reservationsOverlap.map(r => r.catwayNumber);
  const availableCatways = matchingCatways.filter(c => !reservedCatwayNumbers.includes(c.catwayNumber));

  const allowedCatwaysByResId = buildAllowedCatwaysByResId(allCatwaysFull, allReservations, typeByNumber);

  res.render('pages/reserver', {
    users,
    formData,
    availableCatways,
    message: availableCatways.length ? null : "Aucun catway disponible",
    reservations,
    allCatways,
    allowedCatwaysByResId,
    searchResults: [],
    searchQuery: ''
  });
};


// Page de confirmation
exports.confirmReservationPage = async (req, res) => {
  const { clientName, boatName, startDate, endDate, userId, catwayNumber } = req.query;
  const user = await User.findById(userId);
  const catway = await Catway.findOne({ catwayNumber });

  if (!user || !catway) {
    return res.status(400).send("Paramètres invalides");
  }

  res.render('pages/reserver-confirm', {
    clientName,
    boatName,
    startDate,
    endDate,
    user,
    catway
  });
};

// Création finale
exports.finalizeReservation = async (req, res) => {
  const { clientName, boatName, startDate, endDate, catwayNumber } = req.body;

  const start = new Date(startDate);
  const end = new Date(endDate);

  try {
    // ✅ Vérifier que le catway est toujours dispo
    const conflit = await Reservation.findOne({
      catwayNumber,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (conflit) {
      return res.redirect('/reserver?message=Conflit détecté : ce catway a été réservé entre-temps.');
    }

    await Reservation.create({
      catwayNumber,
      clientName,
      boatName,
      startDate: start,
      endDate: end
    });

    res.redirect('/dashboard?message=Réservation enregistrée');
  } catch (err) {
    console.error("Erreur réservation finale:", err);
    res.status(500).send("Erreur lors de la création");
  }
};

// Recherche d'une réservation par nom client
exports.searchReservationByClient = async (req, res) => {
  const query = req.query.clientName || '';
  const users = await User.find({}, 'name email').sort({ name: 1 });

  const allCatwaysFull = await Catway.find({}).sort({ catwayNumber: 1 });
  const allCatways = allCatwaysFull.filter(c => c.isReservable);
  const { typeByNumber } = buildCatwayLookups(allCatwaysFull);

  const allReservations = await Reservation.find({}).sort({ startDate: 1 });
  const now = new Date();

  const reservations = {
    "En cours": allReservations.filter(r => r.startDate <= now && r.endDate >= now),
    "À venir": allReservations.filter(r => r.startDate > now),
    "Terminées": allReservations.filter(r => r.endDate < now)
  };

  const searchResults = await Reservation.find({
    clientName: { $regex: new RegExp(query, 'i') }
  }).sort({ startDate: 1 });

  const allowedCatwaysByResId = buildAllowedCatwaysByResId(allCatwaysFull, allReservations, typeByNumber);

  res.render('pages/reserver', {
    users,
    formData: {},
    availableCatways: [],
    message: req.query.message || null,
    reservations,
    allCatways,
    allowedCatwaysByResId,
    searchResults,
    searchQuery: query
  });
};

// Modifier une réservation
exports.updateReservation = async (req, res) => {
  const { id } = req.params;
  const { boatName, startDate, endDate, catwayNumber } = req.body;

  const start = new Date(startDate);
  const end = new Date(endDate);

  try {
    const current = await Reservation.findById(id);
    if (!current) return res.redirect('/reserver?message=Réservation introuvable');

    // 🔒 Vérifie que le nouveau catway est du même type que l'actuel
    const currentCatway = await Catway.findOne({ catwayNumber: current.catwayNumber });
    const newCatway = await Catway.findOne({ catwayNumber: Number(catwayNumber) });

    if (!newCatway) {
      return res.redirect('/reserver?message=Catway cible introuvable');
    }
    if (!currentCatway) {
      return res.redirect('/reserver?message=Catway actuel introuvable');
    }
    if (currentCatway.catwayType !== newCatway.catwayType) {
      return res.redirect('/reserver?message=Refus : le catway choisi n\'a pas le même type (long/short)');
    }
    if (!newCatway.isReservable) {
      return res.redirect('/reserver?message=Refus : le catway choisi n\'est pas réservable');
    }

    // ✅ Vérifie conflit avec d'autres résas (sauf celle en cours)
    const conflict = await Reservation.findOne({
      _id: { $ne: id },
      catwayNumber: Number(catwayNumber),
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (conflict) {
      return res.redirect('/reserver?message=Conflit : catway déjà réservé à ces dates');
    }

    current.boatName = boatName;
    current.startDate = start;
    current.endDate = end;
    current.catwayNumber = Number(catwayNumber);

    await current.save();
    res.redirect('/reserver?message=Réservation modifiée');
  } catch (err) {
    console.error("Erreur modification réservation:", err);
    res.redirect('/reserver?message=Erreur modification');
  }
};

// Supprimer une réservation
exports.deleteReservation = async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.redirect('/reserver?message=Réservation supprimée');
  } catch (err) {
    console.error("Erreur suppression:", err);
    res.redirect('/reserver?message=Erreur suppression');
  }
};
