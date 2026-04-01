const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token no proporcionado' });

    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.active)
      return res.status(401).json({ error: 'Usuario no encontrado' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Solo administradores' });
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch {}
  next();
};

module.exports = { auth, adminOnly, optionalAuth };
