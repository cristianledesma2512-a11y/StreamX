const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    serverName: { type: String, required: true, trim: true, maxlength: 80 },
    url:        { type: String, required: true, trim: true, maxlength: 2000 },
    quality:    { type: String, enum: ['SD', 'HD', 'FHD', '4K', ''], default: '' },
    language:   { type: String, default: 'Latino' },
  },
  { _id: false }
);

const episodeSchema = new mongoose.Schema(
  {
    number:    { type: Number, required: true },
    title:     { type: String, default: '', trim: true, maxlength: 300 },
    overview:  { type: String, default: '' },
    airDate:   { type: String, default: '' },
    duration:  { type: Number, default: 0 },
    stillPath: { type: String, default: '' },
    links:     { type: [linkSchema], default: [] },
  },
  { _id: true }
);

const seasonSchema = new mongoose.Schema(
  {
    number:     { type: Number, required: true },
    title:      { type: String, default: '', trim: true, maxlength: 200 },
    overview:   { type: String, default: '' },
    airDate:    { type: String, default: '' },
    posterPath: { type: String, default: '' },
    episodes:   { type: [episodeSchema], default: [] },
  },
  { _id: true }
);

const seriesSchema = new mongoose.Schema(
  {
    tmdbId:       { type: Number, required: true, unique: true, index: true },
    title:        { type: String, required: true, trim: true, maxlength: 500 },
    overview:     { type: String, default: '' },
    posterPath:   { type: String, default: '' },
    backdropPath: { type: String, default: '' },
    firstAirDate: { type: String, default: '' },
    genres:       { type: [String], default: [] },
    totalSeasons: { type: Number, default: 0 },
    seasons:      { type: [seasonSchema], default: [] },
    viewCount:    { type: Number, default: 0, index: true },
    lastViewedAt: { type: Date },
    featured:     { type: Boolean, default: false },
    active:       { type: Boolean, default: true, index: true },
    vimeusEnabled: { type: Boolean, default: true },  // usar Vimeus como servidor auto
  },
  { timestamps: true }
);

seriesSchema.index({ title: 'text', overview: 'text' });
seriesSchema.index({ active: 1, createdAt: -1 });

module.exports = mongoose.model('Series', seriesSchema);
