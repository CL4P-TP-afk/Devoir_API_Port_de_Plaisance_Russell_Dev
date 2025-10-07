const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Authentification (formulaire de la page d’accueil "/")
 * ------------------------------------------------------
 * - Normalise l’email (trim + lowercase)
 * - Vérifie l’existence de l’utilisateur et la correspondance du mot de passe
 * - Génère un JWT (payload minimal : { user: { id, name, email, role } })
 * - Dépose le cookie `token` (httpOnly, sameSite=lax ; secure en production)
 * - Redirige :
 *    - admin   -> /dashboard
 *    - user    -> /user-dashboard
 *
 * En cas d’erreur d’identification, renvoie la page de login avec message HTML.
 *
 * @async
 * @param {*} req - Requête Express (body: { email, password })
 * @param {*} res - Réponse Express (redirige ou render)
 * @returns {Promise<void>} Aucune valeur (redirige ou rend une vue)
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const emailNorm = (email || '').trim().toLowerCase();
  try {
    const user = await User.findOne({ email: emailNorm });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.render('pages/index', { error: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      process.env.SECRET_KEY,
      { expiresIn: '1d' }
    );

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,    // ✅ Secure seulement en production (HTTPS sur Render)
      sameSite: 'lax'    // ✅ Empêche certains détournements
    });

    if (user.role === 'admin') {
      res.redirect('/dashboard');
    } else {
      res.redirect('/user-dashboard');
    }

  } catch (e) {
    console.error("Erreur login:", e);
    res.render('pages/index', { error: "Erreur lors de la connexion" });
  }
};

/**
 * Déconnexion
 * -----------
 * - Supprime le cookie `token`
 * - Redirige vers la page d’accueil `/`
 *
 * @param {*} _req - Requête Express (non utilisée)
 * @param {*} res - Réponse Express (redirige)
 * @returns {void}
 */
exports.logout = (_req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};
