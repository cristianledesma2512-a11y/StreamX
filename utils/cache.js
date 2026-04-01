/**
 * Cache en memoria simple — ideal para localhost.
 * En la nube se puede reemplazar con Redis (mismo API).
 */
const logger = require('./logger');

const store = new Map();

const TTL = (Number(process.env.CACHE_TTL) || 60) * 1000; // ms

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlMs = TTL) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function del(key) {
  store.delete(key);
}

function flush() {
  store.clear();
  logger.debug('Cache flushed');
}

/** Invalida todas las claves que comiencen con un prefijo */
function invalidatePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

module.exports = { get, set, del, flush, invalidatePrefix };
