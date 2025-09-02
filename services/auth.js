const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Traitement de la connexion (depuis le formulaire de la page d’accueil "/")
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
    }else{
      res.redirect('/user-dashboard');
    }
    
  } catch (e) {
    console.error("Erreur login:", e);
    res.render('pages/index', { error: "Erreur lors de la connexion" });
  }
};

// Déconnexion
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};
