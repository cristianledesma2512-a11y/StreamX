require('dotenv').config();
const express    = require('express');
const path       = require('path');
const session    = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt     = require('bcryptjs');
const helmet     = require('helmet');
const compression = require('compression');
const morgan     = require('morgan');

const { connectDB }  = require('./config/db');
const logger         = require('./utils/logger');
const adminRoutes    = require('./routes/admin');
const publicRoutes   = require('./routes/public');
const { errorHandler, notFoundHandler } = require('./middleware');
const AdminUser = require('./models/AdminUser');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", 'cdn.tailwindcss.com', 'cdn.jsdelivr.net'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'cdn.tailwindcss.com', 'fonts.googleapis.com'],
      fontSrc:     ["'self'", 'fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'image.tmdb.org', '*.tmdb.org'],
      frameSrc:    ["'self'", '*'],   // iframes de reproductores
      connectSrc:  ["'self'"],
    },
  },
}));

// ─── Performance ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── Logging HTTP ─────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Template engine ──────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

// ─── Static ───────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag: true,
}));

// ─── Sesiones ─────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'streamx-dev-secret-cambiar',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, ttl: 7 * 24 * 60 * 60 }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  name: 'sx.sid', // no dejar el default 'connect.sid'
}));

// ─── Locals globales ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.adminUser = req.session?.adminId
    ? { id: req.session.adminId, username: req.session.username, role: req.session.role }
    : null;
  res.locals.sessionAdminId = req.session?.adminId || null;
  res.locals.appName = 'StreamX';
  next();
});

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// ─── 404 y Error handler ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Seed admin inicial ───────────────────────────────────────────────────────
async function ensureSeedAdmin() {
  const u = process.env.ADMIN_SEED_USERNAME;
  const p = process.env.ADMIN_SEED_PASSWORD;
  if (!u || !p) return;
  const count = await AdminUser.countDocuments();
  if (count > 0) return;
  const hash = await bcrypt.hash(String(p), 12);
  await AdminUser.create({ username: String(u).trim().toLowerCase(), passwordHash: hash, role: 'super' });
  logger.info(`Admin inicial creado: ${u}`);
}

// ─── Arranque ─────────────────────────────────────────────────────────────────
connectDB()
  .then(() => ensureSeedAdmin())
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`StreamX corriendo en http://127.0.0.1:${PORT}`);
      logger.info(`Panel admin: http://127.0.0.1:${PORT}/admin/login`);
      logger.info(`Healthcheck: http://127.0.0.1:${PORT}/health`);
    });
  })
  .catch((err) => {
    logger.error('No se pudo arrancar:', err.message);
    process.exit(1);
  });

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido — cerrando servidor...');
  process.exit(0);
});
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException:', err);
  process.exit(1);
});
