const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    serverName: { type: String, required: true, trim: true, maxlength: 80 },
    url: { type: String, required: true, trim: true, maxlength: 2000 },
    quality: { type: String, enum: ['SD', 'HD', 'FHD', '4K', ''], default: '' },
    language: { type: String, default: 'Latino' },
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    tmdbId:       { type: Number, required: true, unique: true, index: true },
    title:        { type: String, required: true, trim: true, maxlength: 500 },
    overview:     { type: String, default: '' },
    posterPath:   { type: String, default: '' },
    backdropPath: { type: String, default: '' },
    releaseDate:  { type: String, default: '' },
    genres:       { type: [String], default: [] },
    links:        { type: [linkSchema], default: [] },
    viewCount:    { type: Number, default: 0, index: true },
    lastViewedAt: { type: Date },
    featured:     { type: Boolean, default: false },
    active:       { type: Boolean, default: true, index: true },
    vimeusEnabled: { type: Boolean, default: true },  // usar Vimeus como servidor auto
  },
  { timestamps: true }
);

// Índice de texto para búsqueda
movieSchema.index({ title: 'text', overview: 'text' });
// Índice compuesto para listado del catálogo
movieSchema.index({ active: 1, createdAt: -1 });

module.exports = mongoose.model('Movie', movieSchema);
