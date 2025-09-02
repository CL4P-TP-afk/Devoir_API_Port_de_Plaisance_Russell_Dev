// routes/docs.js
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

// petite aide: décoder le token si présent (sans 401)
function decodeUser(req) {
  try {
    let token = req.cookies?.token || req.headers?.authorization;
    if (!token) return null;
    if (token.startsWith('Bearer ')) token = token.slice(7);
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded?.user || null;
  } catch {
    return null;
  }
}

router.get('/', (req, res) => {
  const user = decodeUser(req); // ← on récupère l'user s'il existe

  const returnPath = user
    ? (user.role === 'admin' ? '/dashboard' : '/user-dashboard')
    : '/';

  res.render('pages/docs', {
    user,                 // si tu veux l'utiliser ailleurs
    swaggerUrl: '/api-docs',
    returnPath            // ← clé: on passe le chemin calculé à la vue
  });
});

module.exports = router;
