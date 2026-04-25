const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const movieController = require('../controllers/movieController');
const tvRoutes = require('./tv');
const { asyncHandler } = require('../middleware');

const Movie = require('../models/Movie');
const Series = require('../models/Series');

// Rate limit general para rutas públicas
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

// Healthcheck
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

router.use('/tv', tvRoutes);

// --- ENDPOINTS PARA LA APP ANDROID TV (StreamX) ---
// Nota: Si en app.js usas app.use('/api', router), estas rutas serán /api/movies, /api/series, etc.

// 1. Obtener Películas
router.get('/movies', async (req, res) => {
  try {
    const items = await Movie.find({ active: true }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(mapToAndroid(items, 'movie'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Obtener Series (Corregido: Sin filtro 'kind' que no existe en tu DB)
router.get('/series', async (req, res) => {
  try {
    const items = await Series.find({ active: true }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(mapToAndroid(items, 'series'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Detalle de Serie Específica (Para ver Temporadas y Capítulos)
router.get('/series/:id/details', async (req, res) => {
  try {
    const serie = await Series.findById(req.params.id).lean();
    if (!serie) return res.status(404).json({ error: "Serie no encontrada" });
    res.json(serie);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Obtener Animes
router.get('/animes', async (req, res) => {
  try {
    // Aquí sí se usa kind porque los animes suelen estar marcados así en tu sistema
    const items = await Series.find({ kind: 'anime', active: true }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(mapToAndroid(items, 'anime'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Buscador Global
router.get('/search', async (req, res) => {
  const q = req.query.q || "";
  try {
    const movies = await Movie.find({ title: { $regex: q, $options: 'i' }, active: true }).limit(10).lean();
    const series = await Series.find({ title: { $regex: q, $options: 'i' }, active: true }).limit(10).lean();
    res.json([
      ...mapToAndroid(movies, 'movie'), 
      ...mapToAndroid(series, 'series')
    ]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- FUNCIÓN AUXILIAR DE MAPEO ---
function mapToAndroid(items, type) {
  return items.map(item => {
    let streamingUrl = "";
    let seasonsCount = 0;
    let episodesCount = 0;

    if (type === 'series' || type === 'anime') {
      // Contar temporadas y capítulos totales para la interfaz de Android
      seasonsCount = item.seasons?.length || 0;
      episodesCount = item.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0;
      
      // Enviamos el link del Episodio 1 para el botón de reproducción rápida
      streamingUrl = item.seasons?.[0]?.episodes?.[0]?.links?.[0]?.url || "";
    } else {
      // Para películas, el link está en la raíz
      streamingUrl = (item.links && item.links.length > 0) ? item.links[0].url : "";
    }

    return {
      _id: item._id,
      tmdbId: item.tmdbId || "",
      title: item.title,
      overview: item.overview || "",
      posterPath: item.posterPath || "",
      backdropPath: item.backdropPath || "",
      kind: type,
      streamingUrl: streamingUrl,
      totalSeasons: seasonsCount,
      totalEpisodes: episodesCount
    };
  });
}

module.exports = router;
