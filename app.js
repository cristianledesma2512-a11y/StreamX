const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const movieController = require('../controllers/movieController');
const tvRoutes = require('./tv');
const { asyncHandler } = require('../middleware');

const Movie = require('../models/Movie');
const Series = require('../models/Series');

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

router.use(publicLimiter);

// ─── RUTAS PARA LA WEB (Renderizan EJS) ────────────────────────────────────────
// Estas rutas funcionan cuando entras a streamx.com.ar/
router.get('/', asyncHandler(movieController.listMovies));
router.get('/watch/movie/:id', asyncHandler(movieController.showWatchMovie));
router.get('/watch/series/:id', asyncHandler(movieController.showWatchSeries));
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

router.use('/tv', tvRoutes);

// ─── ENDPOINTS PARA LA APP (Devuelven JSON) ────────────────────────────────────
// Estas rutas funcionan cuando la App pide streamx.com.ar/api/...

router.get('/movies', async (req, res) => {
  try {
    const items = await Movie.find({ active: true }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(mapToAndroid(items, 'movie'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/series', async (req, res) => {
  try {
    const items = await Series.find({ active: true }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(mapToAndroid(items, 'series'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/series/:id/details', async (req, res) => {
  try {
    const serie = await Series.findById(req.params.id).lean();
    if (!serie) return res.status(404).json({ error: "Serie no encontrada" });
    res.json(serie);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/search', async (req, res) => {
  const q = req.query.q || "";
  try {
    const movies = await Movie.find({ title: { $regex: q, $options: 'i' }, active: true }).limit(10).lean();
    const series = await Series.find({ title: { $regex: q, $options: 'i' }, active: true }).limit(10).lean();
    res.json([...mapToAndroid(movies, 'movie'), ...mapToAndroid(series, 'series')]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── FUNCIÓN DE MAPEO (Metadatos para Android) ─────────────────────────────────
function mapToAndroid(items, type) {
  return items.map(item => {
    let streamingUrl = "";
    let quality = "HD";
    let language = "Latino";
    let releaseYear = "";

    const rawDate = item.releaseDate || item.firstAirDate || "";
    releaseYear = rawDate ? new Date(rawDate).getFullYear().toString() : "";

    if (type === 'series') {
      const firstLink = item.seasons?.[0]?.episodes?.[0]?.links?.[0];
      streamingUrl = firstLink?.url || "";
      quality = firstLink?.quality || "HD";
      language = firstLink?.language || "Latino";
    } else {
      const movieLink = item.links?.[0];
      streamingUrl = movieLink?.url || "";
      quality = movieLink?.quality || "HD";
      language = movieLink?.language || "Latino";
    }

    return {
      _id: item._id,
      tmdbId: item.tmdbId,
      title: item.title,
      overview: item.overview,
      year: releaseYear,
      genres: item.genres || [],
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
      kind: type,
      quality: quality,
      language: language,
      viewCount: item.viewCount || 0,
      totalSeasons: item.totalSeasons || item.seasons?.length || 0,
      totalEpisodes: item.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0,
      streamingUrl: streamingUrl
    };
  });
}

module.exports = router;
