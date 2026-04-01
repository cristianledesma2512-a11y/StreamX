const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, unique: true, lowercase: true },
  logo:        { type: String, default: '' },
  category:    { type: String, enum: ['deportes','entretenimiento','noticias','musica','infantil','series','peliculas'], default: 'entretenimiento' },
  streamUrl:   { type: String, required: true },
  quality:     { type: String, enum: ['SD','HD','FHD','4K'], default: 'HD' },
  language:    { type: String, default: 'Español' },
  country:     { type: String, default: 'AR' },
  isLive:      { type: Boolean, default: true },
  viewers:     { type: Number, default: 0 },
  currentShow: { type: String, default: '' },
  active:      { type: Boolean, default: true },
  // Para canales con tokens dinámicos (Pelota Libre, etc.)
  isDynamic:       { type: Boolean, default: false },
  sourceUrl:       { type: String, default: '' }, // URL de la página fuente
  tokenExpiresAt:  { type: Date },
}, { timestamps: true });

ChannelSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-').trim();
  }
  next();
});

module.exports = mongoose.model('Channel', ChannelSchema);
