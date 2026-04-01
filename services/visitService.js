const crypto = require('crypto');
const PageView = require('../models/PageView');
const cache = require('../utils/cache');

function hashIp(ip = '') {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

async function recordContentView(contentType, Model, id, ip = '') {
  // Fire-and-forget para no bloquear la respuesta
  setImmediate(async () => {
    try {
      await Promise.all([
        Model.findByIdAndUpdate(id, {
          $inc: { viewCount: 1 },
          $set: { lastViewedAt: new Date() },
        }),
        PageView.create({ contentType, contentId: id, ip: hashIp(ip) }),
      ]);
      // Invalidar cache del catálogo tras nueva vista
      cache.invalidatePrefix('catalog:');
    } catch (_) { /* no matar la request por un fallo de stats */ }
  });
}

module.exports = { recordContentView };
