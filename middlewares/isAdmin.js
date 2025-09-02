// middlewares/isAdmin.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

module.exports = async function (req, res, next) {
  let token = req.cookies?.token || req.headers['authorization'];

  if (!!token && token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    const user = decoded.user;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit : admin uniquement' });
    }

    // Injection dans req & res.locals (comme checkJWT)
    req.user = user;
    res.locals.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};
