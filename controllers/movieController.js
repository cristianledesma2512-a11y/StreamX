const Movie  = require('../models/Movie');
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
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = 24;
    const skip   = (page - 1) * limit;
    const genre  = req.query.genre || '';
    const search = req.query.q || '';
    const type   = req.query.type || ''; // 'movie' | 'series' | ''

    const cacheKey = `catalog:${page}:${genre}:${search}:${type}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.render('index', cached);

    const filter = { active: true };
    if (genre)  filter.genres = genre;
    if (search) filter.$text  = { $search: search };

    // Hero: el más visto entre movies y series (solo página 1 sin filtros)
    let heroItem = null;
    if (page === 1 && !genre && !search) {
      const [topMovie, topSerie] = await Promise.all([
        Movie.findOne({ active: true }).sort({ viewCount: -1 }).lean(),
        Series.findOne({ active: true }).sort({ viewCount: -1 }).lean(),
      ]);
      if (topMovie && topSerie) {
        heroItem = topMovie.viewCount >= topSerie.viewCount
          ? { ...topMovie, kind: 'movie' }
          : { ...topSerie, kind: 'series' };
      } else {
        heroItem = topMovie ? { ...topMovie, kind: 'movie' }
                 : topSerie ? { ...topSerie, kind: 'series' }
                 : null;
      }
    }

    const movieFilter  = { ...filter };
    const seriesFilter = { ...filter };

    const [movies, seriesList, totalMovies, totalSeries, allGenres] = await Promise.all([
      type === 'series'  ? [] : Movie.find(movieFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      type === 'movie'   ? [] : Series.find(seriesFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      type === 'series'  ? 0  : Movie.countDocuments(movieFilter),
      type === 'movie'   ? 0  : Series.countDocuments(seriesFilter),
      Movie.distinct('genres'),
    ]);

    const items = [
      ...movies.map((m) => ({ ...m, kind: 'movie' })),
      ...seriesList.map((s) => ({ ...s, kind: 'series' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalItems = totalMovies + totalSeries;
    const totalPages = Math.ceil(totalItems / limit);

    const payload = {
      heroItem,
      catalogItems: items,
      movies,
      error: null,
      pagination: { page, totalPages, totalItems, limit },
      genres: allGenres.filter(Boolean).sort(),
      activeGenre: genre,
      searchQuery: search,
      activeType: type,
    };

    if (!genre && !search && !type) cache.set(cacheKey, payload);

    return res.render('index', payload);
  } catch (e) {
    return res.status(500).render('index', {
      heroItem: null, catalogItems: [], movies: [], error: e.message,
      pagination: null, genres: [], activeGenre: '', searchQuery: '', activeType: '',
    });
  }
}

async function showWatchMovie(req, res) {
  try {
    const movie = await Movie.findOne({ _id: req.params.id, active: true }).lean();
    if (!movie) return res.status(404).render('error', { message: 'Película no encontrada', status: 404 });
    recordContentView('movie', Movie, req.params.id, req.ip);
    return res.render('watch', {
      query: req.query, content: movie, contentType: 'movie',
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
      query: req.query, content: s, contentType: 'series',
      dateLabel: s.firstAirDate ? `Primera emisión: ${s.firstAirDate}` : null,
      badge: 'Serie',
    });
  } catch (e) {
    return res.status(400).render('error', { message: 'ID inválido', status: 400 });
  }
}

module.exports = { legacyWatchRedirect, listMovies, showWatchMovie, showWatchSeries };
