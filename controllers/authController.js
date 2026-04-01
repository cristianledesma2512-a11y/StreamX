const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');
const logger = require('../utils/logger');

function getLogin(req, res) {
  if (req.session?.adminId) return res.redirect('/admin');
  return res.render('admin/login', { error: null, next: req.query.next || '/admin' });
}

async function postLogin(req, res) {
  const { username, password } = req.body;
  const next = (req.body.next || '/admin').startsWith('/') ? req.body.next || '/admin' : '/admin';

  try {
    const user = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      logger.warn(`Login fallido: ${username} desde ${req.ip}`);
      return res.status(401).render('admin/login', { error: 'Usuario o contraseña incorrectos', next });
    }

    // Actualizar stats de login
    await AdminUser.findByIdAndUpdate(user._id, {
      $set: { lastLoginAt: new Date() },
      $inc: { loginCount: 1 },
    });

    req.session.adminId = user._id.toString();
    req.session.username = user.username;
    req.session.role = user.role;

    logger.info(`Login exitoso: ${user.username} (${user.role})`);
    return res.redirect(next);
  } catch (e) {
    logger.error('Error en login:', e);
    return res.status(500).render('admin/login', { error: 'Error interno', next });
  }
}

function postLogout(req, res) {
  const username = req.session?.username;
  req.session.destroy(() => {
    logger.info(`Logout: ${username}`);
    res.redirect('/admin/login');
  });
}

module.exports = { getLogin, postLogin, postLogout };
