// =============================================
//   StreamX - Servidor Principal
// =============================================
require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const authRouter     = require('./routes/auth');
const channelsRouter = require('./routes/channels');
const moviesRouter   = require('./routes/movies');
const sportsRouter   = require('./routes/sports');

const app  = express();
const PORT = process.env.PORT || 3001;
const ytproxy = require('./routes/ytproxy');
app.use('/api', ytproxy);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Demasiadas peticiones.' } }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

app.use('/api/auth',     authRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/movies',   moviesRouter);
app.use('/api/sports',   sportsRouter);

app.get('/api/health', (req, res) => res.json({
  status: 'OK',
  uptime: process.uptime().toFixed(0) + 's',
  mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  timestamp: new Date().toISOString(),
}));

app.use('*', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Error interno' }); });

app.listen(PORT, () => {
  console.log(`🚀 StreamX API en http://localhost:${PORT}`);
  console.log(`📺 Entorno: ${process.env.NODE_ENV}`);
});
