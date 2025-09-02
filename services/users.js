const User = require('../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Récupère tous les utilisateurs.
exports.getAll = async (req, res) => {
  const users = await User.find({}).sort({ name: 1 });
  res.render('pages/users', { users, message: req.query.message || null, searchedUser: null });
};

// Récupère un utilisateur par son ID.
exports.getById = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.redirect('/users?message=Utilisateur non trouvé');
  res.render('pages/users', { users: [user], message: null });
};

// Ajoute un nouvel utilisateur.
exports.add = [
    // Définition des règles de validation
        body('name').isLength({ min: 3 }).withMessage('Le nom doit contenir au moins 3 caractères'),
        body('email').isEmail().normalizeEmail().withMessage('Veuillez entrer une adresse email valide'),
        body('password').isStrongPassword({
             minLength: 3,
             minLowercase: 1,
             minUppercase: 1,
             minNumbers: 1,
             minSymbols: 0 
            }).withMessage('Le mot de passe doit contenir au moins 3 caractères, une minuscule, une majuscule, un chiffre'),

    // Fonction de traitement de la requête
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.redirect('/users?message=' + errors.array()[0].msg);

    try {
      const { name, email, password, role } = req.body;
      const emailNorm = (email || '').trim().toLowerCase();
      const exists = await User.findOne({ email: emailNorm });

      if (exists) return res.redirect('/users?message=Email déjà utilisé');

      await User.create({ name, email: email.toLowerCase(), password, role });
      res.redirect('/users?message=Utilisateur créé avec succès');
    } catch (e) {
      console.error("Erreur création user", e);
      res.redirect('/users?message=Erreur lors de la création');
    }
  }
];

//Met à jour un utilisateur existant.
exports.update = [
     // Définition des règles de validation
        body('name').isLength({ min: 3 }).withMessage('Le nom doit contenir au moins 3 caractères'),
        body('email').isEmail().normalizeEmail().withMessage('Veuillez entrer une adresse email valide'),
        body('password').optional({ checkFalsy: true }).isStrongPassword({
             minLength: 3,
             minLowercase: 1,
             minUppercase: 1,
             minNumbers: 1,
             minSymbols: 0 
            }).withMessage('Le mot de passe doit contenir au moins 3 caractères, une minuscule, une majuscule, un chiffre'),
        body('role').optional().isIn(['admin', 'user']),

    // Fonction de traitement de la requête
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.redirect('/users?message=' + errors.array()[0].msg);

    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) return res.redirect('/users?message=Utilisateur introuvable');

      const emailNorm = (req.body.email || '').trim().toLowerCase();

      if (emailNorm !== user.email) {
        const conflict = await User.findOne({ email: emailNorm, _id: { $ne: id } });
        if (conflict) return res.redirect('/users?message=Email déjà utilisé par un autre compte');
      }

      user.name = req.body.name;
      user.email = emailNorm;
      user.role = req.body.role;

      if (req.body.password && req.body.password.trim() !== "") {
      user.password = req.body.password; // le pre('save') fera le hash
      }
      

      await user.save();
      res.redirect('/users?message=Utilisateur modifié');
    } catch (e) {
      console.error("Erreur update:", e);
      res.redirect('/users?message=Erreur modification');
    }
  }
];


// Supprime un utilisateur.
exports.delete = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/users?message=Utilisateur supprimé');
  } catch (e) {
    console.error("Erreur suppression", e);
    res.redirect('/users?message=Erreur suppression');
  }
};

//recherche un user par son nom
exports.searchByName = async (req, res) => {
  const { name } = req.query;

  const users = await User.find({}).sort({ name: 1 });

  if (!name) {
    return res.render('pages/users', {
      users,
      message: "Veuillez entrer un nom à rechercher",
      searchedUser: null
    });
  }

  const searchedUser = await User.findOne({ name: { $regex: new RegExp(name, "i") } });

  if (!searchedUser) {
    return res.render('pages/users', {
      users,
      message: `Aucun utilisateur trouvé avec le nom : ${name}`,
      searchedUser: null
    });
  }

  return res.render('pages/users', {
    users,
    message: null,
    searchedUser
  });
};
