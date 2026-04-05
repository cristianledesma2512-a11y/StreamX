require('dotenv').config();
const express     = require('express');
const path         = require('path');
const session      = require('express-session');
const MongoStore   = require('connect-mongo');
const bcrypt       = require('bcryptjs');
const helmet       = require('helmet');
const compression  = require('compression');
const morgan       = require('morgan');

const { connectDB }  = require('./config/db');
const logger          = require('./utils/logger');
const adminRoutes    = require('./routes/admin');
const publicRoutes   = require('./routes/public');
const { errorHandler, notFoundHandler } = require('./middleware');
const AdminUser = require('./models/AdminUser');

const app    = express();
const PORT   = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', true);

// ─── SEGURIDAD CORREGIDA PARA STREAMING ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:   ["'self'"],
      scriptSrc:    ["'self'", "'unsafe-inline'", 'cdn.tailwindcss.com', 'cdn.jsdelivr.net', '*.jsdelivr.net'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:     ["'self'", "'unsafe-inline'", 'cdn.tailwindcss.com', 'fonts.googleapis.com', 'cdnjs.cloudflare.com'],
      fontSrc:      ["'self'", 'fonts.gstatic.com', 'cdnjs.cloudflare.com'],
      imgSrc:       ["'self'", 'data:', 'https:', '*'], 
      frameSrc:     ["'self'", 'https:'],
      // connectSrc: Permite que el reproductor descargue los datos del video (.m3u8 y .ts)
      connectSrc:   ["'self'", 'blob:', 'https:', 'data:', '*'], 
      // mediaSrc: Permite que el elemento <video> reproduzca los canales
      mediaSrc:     ["'self'", 'blob:', 'https:', 'data:'],
      workerSrc:    ["'self'", 'blob:'],
      upgradeInsecureRequests: null,
    },
  },
  hsts: false,
}));

app.use(compression());

app.use(morgan(isProd ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'streamx-dev-secret-cambiar',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 7 * 24 * 60 * 60,
    touchAfter: 24 * 3600,
  }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: false, 
  },
  name: 'sx.sid',
}));

app.use((req, res, next) => {
  res.locals.adminUser = req.session?.adminId
    ? { id: req.session.adminId, username: req.session.username, role: req.session.role }
    : null;
  res.locals.sessionAdminId = req.session?.adminId || null;
  res.locals.appName = 'StreamX';
  next();
});

app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

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

connectDB()
  .then(() => ensureSeedAdmin())
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`StreamX corriendo en puerto ${PORT} [${isProd ? 'PRODUCCIÓN' : 'desarrollo'}]`);
    });
  })
  .catch((err) => {
    logger.error('No se pudo arrancar:', err.message);
    process.exit(1);
  });

process.on('SIGTERM', () => {
  logger.info('SIGTERM — cerrando servidor...');
  process.exit(0);
});