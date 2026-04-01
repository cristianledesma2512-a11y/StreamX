const logger = require('../utils/logger');

function requireAdmin(req, res, next) {
  if (req.session?.adminId) return next();
  const nextUrl = encodeURIComponent(req.originalUrl || '/admin');
  return res.redirect(`/admin/login?next=${nextUrl}`);
}

function requireSuper(req, res, next) {
  if (req.session?.adminId && req.session.role === 'super') return next();
  return res.status(403).render('admin/error', { message: 'Solo el super administrador puede hacer esto.' });
}

/** Wrappea async route handlers y pasa errores a next() */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Error handler global */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  logger.error(`${status} ${req.method} ${req.path} — ${err.message}`, { stack: err.stack });

  if (req.path.startsWith('/admin')) {
    return res.status(status).render('admin/error', { message: err.message || 'Error interno' });
  }
  return res.status(status).render('error', { message: err.message || 'Error interno', status });
}

/** 404 handler */
function notFoundHandler(req, res) {
  if (req.path.startsWith('/admin')) {
    return res.status(404).render('admin/error', { message: 'Página no encontrada (404)' });
  }
  return res.status(404).render('error', { message: 'Página no encontrada', status: 404 });
}

module.exports = { requireAdmin, requireSuper, asyncHandler, errorHandler, notFoundHandler };
