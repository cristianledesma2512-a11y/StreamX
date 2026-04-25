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

// --- RUTAS WEB (Vistas EJS) ---
router.get('/', asyncHandler(movieController.listMovies));
router.get('/watch/movie/:id', asyncHandler(movieController.showWatchMovie));
router.get('/watch/series/:id', asyncHandler(movieController.showWatchSeries));
router.get('/watch/:id', asyncHandler(movieController.legacyWatchRedirect));
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

router.use('/tv', tvRoutes);

// --- ENDPOINTS PARA LA APP ANDROID TV (StreamX) ---
// Como en app.js pusimos app.use('/api', publicRoutes), aquí NO escribimos /api

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

// FUNCIÓN DE MAPEO (Calcula temporadas y capítulos)
// --- FUNCIÓN DE MAPEO EXTENDIDA ---
function mapToAndroid(items, type) {
  return items.map(item => {
    let streamingUrl = "";
    let quality = "";
    let language = "";
    let releaseYear = "";
    let sCount = 0;
    let eCount = 0;

    // Extraer Año de estreno
    const dateStr = item.releaseDate || item.firstAirDate || "";
    releaseYear = dateStr ? dateStr.split('-')[0] : "";

    if (type === 'series' || type === 'anime') {
      sCount = item.totalSeasons || item.seasons?.length || 0;
      eCount = item.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0;
      
      // Datos del primer episodio
      const firstEp = item.seasons?.[0]?.episodes?.[0];
      const firstLink = firstEp?.links?.[0];
      streamingUrl = firstLink?.url || "";
      quality = firstLink?.quality || "";
      language = firstLink?.language || "";
    } else {
      // Datos de película
      const mainLink = item.links?.[0];
      streamingUrl = mainLink?.url || "";
      quality = mainLink?.quality || "";
      language = mainLink?.language || "";
    }

    return {
      _id: item._id,
      tmdbId: item.tmdbId || "",
      title: item.title,
      overview: item.overview || "",
      posterPath: item.posterPath || "",
      backdropPath: item.backdropPath || "",
      kind: type,
      year: releaseYear,
      genres: item.genres || [], // Array de géneros ["Acción", "Drama"]
      quality: quality,          // "FHD", "4K"
      language: language,        // "Latino", "Sub"
      streamingUrl: streamingUrl,
      totalSeasons: sCount,
      totalEpisodes: eCount,
      viewCount: item.viewCount || 0
    };
  });
}

module.exports = router;
