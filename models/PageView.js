const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema(
  {
    contentType: { type: String, enum: ['movie', 'series'], required: true, index: true },
    contentId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ip:          { type: String, default: '' },          // hasheada para privacidad
    createdAt:   { type: Date, default: Date.now, index: true },
  },
  { collection: 'pageviews' }
);

// TTL: auto-eliminar pageviews después de 90 días
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('PageView', pageViewSchema);
