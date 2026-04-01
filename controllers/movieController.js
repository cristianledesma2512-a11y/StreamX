const Movie = require('../models/Movie');
const Series = require('../models/Series');
const { recordContentView } = require('../services/visitService');
const cache = require('../utils/cache');

async function legacyWatchRedirect(req, res) {
  try {
    const m = await Movie.exists({ _id: req.params.id });
    if (m) return res.redirect(301, `/watch/movie/${req.params.id}`);
  } catch { /* ignorar */ }
  return res.status(404).render('error', { message: 'Contenido no encontrado', status: 404 });
}

async function listMovies(req, res) {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const limit   = 20;
    const skip    = (page - 1) * limit;
    const genre   = req.query.genre || '';
    const search  = req.query.q || '';

    const cacheKey = `catalog:${page}:${genre}:${search}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.render('index', cached);

    const filter = { active: true };
    if (genre) filter.genres = genre;
    if (search) filter.$text = { $search: search };

    const [movies, seriesList, totalMovies, totalSeries, allGenres] = await Promise.all([
      Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Series.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Movie.countDocuments(filter),
      Series.countDocuments(filter),
      Movie.distinct('genres'),
    ]);

    const items = [
      ...movies.map((m) => ({ ...m, kind: 'movie' })),
      ...seriesList.map((s) => ({ ...s, kind: 'series' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalItems = totalMovies + totalSeries;
    const totalPages = Math.ceil(totalItems / limit);

    const payload = {
      catalogItems: items,
      movies,
      error: null,
      pagination: { page, totalPages, totalItems, limit },
      genres: allGenres.filter(Boolean).sort(),
      activeGenre: genre,
      searchQuery: search,
    };

    // Solo cachear si no hay filtros activos
    if (!genre && !search) cache.set(cacheKey, payload);

    return res.render('index', payload);
  } catch (e) {
    return res.status(500).render('index', {
      catalogItems: [], movies: [], error: e.message,
      pagination: null, genres: [], activeGenre: '', searchQuery: '',
    });
  }
}

async function showWatchMovie(req, res) {
  try {
    const movie = await Movie.findOne({ _id: req.params.id, active: true }).lean();
    if (!movie) return res.status(404).render('error', { message: 'Película no encontrada', status: 404 });

    recordContentView('movie', Movie, req.params.id, req.ip);

    return res.render('watch', {
      query: req.query,
      content: movie,
      contentType: 'movie',
      dateLabel: movie.releaseDate ? `Estreno: ${movie.releaseDate}` : null,
      badge: 'Película',
    });
  } catch (e) {
    return res.status(400).render('error', { message: 'ID inválido', status: 400 });
  }
}

async function showWatchSeries(req, res) {
  try {
    const s = await Series.findOne({ _id: req.params.id, active: true }).lean();
    if (!s) return res.status(404).render('error', { message: 'Serie no encontrada', status: 404 });

    recordContentView('series', Series, req.params.id, req.ip);

    return res.render('watch', {
      query: req.query,
      content: s,
      contentType: 'series',
      dateLabel: s.firstAirDate ? `Primera emisión: ${s.firstAirDate}` : null,
      badge: 'Serie',
    });
  } catch (e) {
    return res.status(400).render('error', { message: 'ID inválido', status: 400 });
  }
}

module.exports = { legacyWatchRedirect, listMovies, showWatchMovie, showWatchSeries };
