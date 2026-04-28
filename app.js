require('dotenv').config();
const express     = require('express');
const path        = require('path');
const session     = require('express-session');
const MongoStore  = require('connect-mongo');
const bcrypt      = require('bcryptjs');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');

// --- Importaciones de Configuración y Rutas ---
const { connectDB }  = require('./config/db');
const logger         = require('./utils/logger');
const adminRoutes    = require('./routes/admin');
const publicRoutes   = require('./routes/public'); // Este maneja la API y la Web
const ytproxy        = require('./routes/ytproxy');
const { errorHandler, notFoundHandler } = require('./middleware');
const AdminUser = require('./models/AdminUser');

const app    = express();
const PORT   = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ─── Trust proxy (Necesario para Render/Railway) ─────────────────────────────
app.set('trust proxy', 1);

// ─── Seguridad (Helmet) ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "'unsafe-hashes'",
                    'cdn.tailwindcss.com', 'cdn.jsdelivr.net', '*.jsdelivr.net',
                    'www.gstatic.com', '*.googleapis.com', '*.firebaseio.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:    ["'self'", "'unsafe-inline'", 'cdn.tailwindcss.com', 'fonts.googleapis.com'],
      fontSrc:     ["'self'", 'fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'https:', 'blob:'],
      frameSrc:    ["'self'", 'https:'],
      connectSrc:  ["'self'", 'blob:', 'https:', 'wss:', 'ws:',
                    '*.jsdelivr.net', '*.akamaized.net', '*.akamaihd.net',
                    '*.cloudfront.net', '*.firebaseio.com', '*.googleapis.com',
                    '*.telesur.telefonica.net', 'stream.france24.com',
                    '*.rttv.com', '*.pluto.tv', '*.cbsnews.com',
                    '*.leanstream.co', '*.wurl.tv', '*.streamtp10.com',
                    '*.streamtpnew.com', 'live-hls-web-aje.getaj.net',
                    '*.nhk.or.jp', '*.trt.com.tr', '*.rtve.es'],
      mediaSrc:    ["'self'", 'blob:', 'https:'],
      workerSrc:   ["'self'", 'blob:'],
    },
  },
  hsts: false,
}));

// ─── Middlewares de Optimización ─────────────────────────────────────────────
app.use(compression());
app.use(morgan(isProd ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Motor de Plantillas ─────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

// ─── Archivos Estáticos ──────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
}));

// ─── Manejo de Sesiones ──────────────────────────────────────────────────────
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
    secure: isProd, 
  },
  name: 'sx.sid',
}));

// ─── Variables Globales para las Vistas (Locals) ─────────────────────────────
app.use((req, res, next) => {
  res.locals.adminUser = req.session?.adminId
    ? { id: req.session.adminId, username: req.session.username, role: req.session.role }
    : null;
  res.locals.sessionAdminId = req.session?.adminId || null;
  res.locals.appName = 'StreamX';
  next();
});

// ─── Definición de Rutas ──────────────────────────────────────────────────────

// ─── Rutas (NUEVO ORDEN PRIORITARIO) ──────────────────────────────────────────

// 1. EL PROXY (Ruta única y específica)
// Al usar '/api/ytproxy', Express solo entrará aquí si la URL es exacta.
app.use('/api/ytproxy', ytproxy); 

// 2. LAS RUTAS DE LA APP Y WEB
// Esto manejará /api/movies, /api/series, etc.
app.use('/api', publicRoutes); 

// 3. LA WEB PRINCIPAL
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// ─── 404 y Error handler (ASEGÚRATE QUE ESTÉN AL FINAL) ──────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Función para crear Admin Inicial (Seed) ──────────────────────────────────
async function ensureSeedAdmin() {
  const u = process.env.ADMIN_SEED_USERNAME;
  const p = process.env.ADMIN_SEED_PASSWORD;
  if (!u || !p) return;
  const count = await AdminUser.countDocuments();
  if (count > 0) return;
  const hash = await bcrypt.hash(String(p), 12);
  await AdminUser.create({ 
    username: String(u).trim().toLowerCase(), 
    passwordHash: hash, 
    role: 'super' 
  });
  logger.info(`Admin inicial creado: ${u}`);
}

// ─── Arranque del Servidor ────────────────────────────────────────────────────
connectDB()
  .then(() => ensureSeedAdmin())
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`StreamX corriendo en puerto ${PORT} [${isProd ? 'PRODUCCIÓN' : 'desarrollo'}]`);
      logger.info(`API Series disponible en: /api/series`);
    });
  })
  .catch((err) => {
    logger.error('No se pudo arrancar el servidor:', err.message);
    process.exit(1);
  });

// ─── Apagado Correcto (Graceful Shutdown) ─────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido: cerrando servidor...');
  process.exit(0);
});
process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
