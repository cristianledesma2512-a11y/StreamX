const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  number:    Number,
  title:     { type: String, default: '' },
  streamUrl: { type: String, default: '' },
  duration:  Number,
  thumbnail: { type: String, default: '' },
  airDate:   Date,
});

const SeasonSchema = new mongoose.Schema({
  number:   Number,
  title:    { type: String, default: '' },
  episodes: [EpisodeSchema],
});

const MovieSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  slug:        { type: String, unique: true, lowercase: true },
  type:        { type: String, enum: ['movie', 'series', 'anime'], default: 'movie' },
  description: { type: String, default: '' },
  poster:      { type: String, default: '' },
  backdrop:    { type: String, default: '' },
  trailer:     { type: String, default: '' },
  year:        Number,
  duration:    Number,
  rating:      { type: Number, default: 0, min: 0, max: 10 },
  genres:      [String],
  language:    { type: String, default: 'Español' },
  quality:     { type: String, enum: ['SD', 'HD', 'FHD', '4K'], default: 'HD' },
  country:     { type: String, default: '' },
  cast:        [String],
  director:    { type: String, default: '' },
  // Película: URL directa
  streamUrl:   { type: String, default: '' },
  // Series: temporadas
  seasons:     [SeasonSchema],
  // Metadata externa
  tmdbId:      { type: String, default: '' },
  externalUrl: { type: String, default: '' },
  source:      { type: String, default: 'manual' },
  views:       { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
  featured:    { type: Boolean, default: false },
}, { timestamps: true });

MovieSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }
  next();
});

MovieSchema.index({ title: 'text', description: 'text' });
MovieSchema.index({ type: 1, active: 1 });
MovieSchema.index({ genres: 1 });
MovieSchema.index({ featured: -1, views: -1 });

module.exports = mongoose.model('Movie', MovieSchema);
