const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const MAX_RETRIES    = 5;
const RETRY_DELAY_MS = 5000;

async function connectDB(retries = 0) {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está definida en .env');

  try {
    await mongoose.connect(uri, {
      // ── Timeouts más generosos para Render (cold starts) ──────────────
      serverSelectionTimeoutMS: 15000,  // era 5000 — daba timeout en cold start
      socketTimeoutMS:          60000,  // era 45000
      connectTimeoutMS:         15000,
      // ── Pool de conexiones optimizado ─────────────────────────────────
      maxPoolSize:  10,   // máximo de conexiones simultáneas
      minPoolSize:   2,   // mantener 2 conexiones siempre vivas
      maxIdleTimeMS: 30000,
      // ── Heartbeat para detectar desconexiones rápido ──────────────────
      heartbeatFrequencyMS: 10000,
    });
    logger.info(`MongoDB conectado: ${uri.replace(/:\\/\\/[^@]+@/, '://**:**@')}`);
  } catch (err) {
    if (retries < MAX_RETRIES) {
      logger.warn(`MongoDB: error (intento ${retries + 1}/${MAX_RETRIES}). Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(retries + 1);
    }
    throw err;
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB desconectado — intentando reconectar...');
});
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconectado'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err.message));

module.exports = { connectDB };
