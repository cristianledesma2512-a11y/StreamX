const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectDB(retries = 0) {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está definida en .env');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB conectado: ${uri.replace(/:\/\/[^@]+@/, '://**:**@')}`);
  } catch (err) {
    if (retries < MAX_RETRIES) {
      logger.warn(`MongoDB: error al conectar (intento ${retries + 1}/${MAX_RETRIES}). Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(retries + 1);
    }
    throw err;
  }
}

mongoose.connection.on('disconnected', () => logger.warn('MongoDB desconectado'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconectado'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));

module.exports = { connectDB };
