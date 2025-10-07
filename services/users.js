const User = require('../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @typedef {Object} CreateUserBody
 * @property {string} name - Nom complet (min 3).
 * @property {string} email - Email (normalisé en minuscule).
 * @property {string} password - Mot de passe (sera hashé par le pre('save')).
 * @property {"admin"|"user"} role - Rôle utilisateur.
 */

/**
 * @typedef {Object} UpdateUserBody
 * @property {string} name
 * @property {string} email
 * @property {string} [password] - Optionnel ; si fourni il sera hashé via pre('save').
 * @property {"admin"|"user"} [role]
 */

/**
 * GET /users
 * Récupère tous les utilisateurs et rend la page HTML `pages/users`.
 *
 * Variables passées à la vue :
 *  - `users`: liste triée par nom
 *  - `message`: message éventuel via querystring
 *  - `searchedUser`: résultat de recherche (ou null)
 *
 * @async
 * @param {*} req - Requête Express
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
exports.getAll = async (req, res) => {
  const users = await User.find({}).sort({ name: 1 });
  res.render('pages/users', { users, message: req.query.message || null, searchedUser: null });
};

/**
 * GET /users/:id
 * Récupère un utilisateur par son ID et rend `pages/users` avec uniquement cet utilisateur.
 * Si introuvable, redirige vers /users avec un message.
 *
 * @async
 * @param {*} req - Requête Express
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
exports.getById = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.redirect('/users?message=Utilisateur non trouvé');
  res.render('pages/users', { users: [user], message: null });
};

/**
 * POST /users
 * Ajoute un nouvel utilisateur après validations `express-validator`.
 * - Vérifie l’unicité de l’email (normalisé en minuscule).
 * - Le hash du mot de passe est réalisé par le hook `pre('save')` du modèle.
 * - Redirige vers /users avec message de succès/erreur.
 *
 * @type {Array<*>}
 */
exports.add = [
  // Règles de validation
  body('name').isLength({ min: 3 }).withMessage('Le nom doit contenir au moins 3 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Veuillez entrer une adresse email valide'),
  body('password')
    .isStrongPassword({
      minLength: 3,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0
    })
    .withMessage('Le mot de passe doit contenir au moins 3 caractères, une minuscule, une majuscule, un chiffre'),

  // Contrôleur
  /**
   * Crée l'utilisateur si validation OK.
   * @param {*} req - Requête Express (body conforme à {@link CreateUserBody})
   * @param {*} res - Réponse Express
   * @returns {Promise<void>}
   */
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.redirect('/users?message=' + errors.array()[0].msg);

    try {
      const { name, email, password, role } = req.body;
      const emailNorm = (email || '').trim().toLowerCase();
      const exists = await User.findOne({ email: emailNorm });

      if (exists) return res.redirect('/users?message=Email déjà utilisé');

      await User.create({ name, email: emailNorm, password, role });
      res.redirect('/users?message=Utilisateur créé avec succès');
    } catch (e) {
      console.error("Erreur création user", e);
      res.redirect('/users?message=Erreur lors de la création');
    }
  }
];

/**
 * PUT /users/:id
 * Met à jour un utilisateur après validations :
 * - normalise l’email et vérifie l’unicité si modifié
 * - rôle optionnel (admin|user)
 * - si `password` fourni et non vide, il sera hashé par le pre('save')
 * - redirige vers /users avec message
 *
 * @type {Array<*>}
 */
exports.update = [
  // Règles de validation
  body('name').isLength({ min: 3 }).withMessage('Le nom doit contenir au moins 3 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Veuillez entrer une adresse email valide'),
  body('password')
    .optional({ checkFalsy: true })
    .isStrongPassword({
      minLength: 3,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0
    })
    .withMessage('Le mot de passe doit contenir au moins 3 caractères, une minuscule, une majuscule, un chiffre'),
  body('role').optional().isIn(['admin', 'user']),

  // Contrôleur
  /**
   * Met à jour l'utilisateur si validation OK.
   * @param {*} req - Requête Express (params.id et body conforme à {@link UpdateUserBody})
   * @param {*} res - Réponse Express
   * @returns {Promise<void>}
   */
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.redirect('/users?message=' + errors.array()[0].msg);

    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) return res.redirect('/users?message=Utilisateur introuvable');

      const emailNorm = (req.body.email || '').trim().toLowerCase();

      // Vérifie unicité si l'email change
      if (emailNorm !== user.email) {
        const conflict = await User.findOne({ email: emailNorm, _id: { $ne: id } });
        if (conflict) return res.redirect('/users?message=Email déjà utilisé par un autre compte');
      }

      user.name = req.body.name;
      user.email = emailNorm;
      user.role = req.body.role;

      // Si mot de passe rempli -> sera hashé par pre('save')
      if (req.body.password && req.body.password.trim() !== "") {
        user.password = req.body.password;
      }

      await user.save();
      res.redirect('/users?message=Utilisateur modifié');
    } catch (e) {
      console.error("Erreur update:", e);
      res.redirect('/users?message=Erreur modification');
    }
  }
];

/**
 * DELETE /users/:id
 * Supprime un utilisateur par son ID.
 * Redirige vers /users avec message.
 *
 * @async
 * @param {*} req - Requête Express (params.id)
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
exports.delete = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/users?message=Utilisateur supprimé');
  } catch (e) {
    console.error("Erreur suppression", e);
    res.redirect('/users?message=Erreur suppression');
  }
};

/**
 * GET /users/search?name=...
 * Recherche un utilisateur par nom (insensible à la casse).
 * Ré-affiche la page `pages/users` avec :
 *  - `users`: la liste complète (pour le tableau)
 *  - `searchedUser`: l’utilisateur trouvé (ou null)
 *  - `message`: message d’erreur si aucun nom / aucun résultat
 *
 * @async
 * @param {*} req - Requête Express (peut contenir `query.name?: string`)
 * @param {*} res - Réponse Express
 * @returns {Promise<void>}
 */
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
