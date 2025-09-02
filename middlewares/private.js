const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

exports.checkJWT = (req, res, next) => {
  let token = req.cookies.token || req.headers['authorization'];

  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  if (!token) return res.status(401).json('token_required');

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded.user;
    res.locals.user = decoded.user; // ✅ Utilisé dans layout.ejs

    next();
  } catch (err) {
    return res.status(401).json('token_not_valid');
  }
};
