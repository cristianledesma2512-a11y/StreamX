const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const movieController = require('../controllers/movieController');
const tvRoutes = require('./tv');
const { asyncHandler } = require('../middleware');

// Rate limit general para rutas públicas
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // no limitar healthcheck
});

router.use(publicLimiter);

router.get('/',                  asyncHandler(movieController.listMovies));
router.get('/watch/movie/:id',   asyncHandler(movieController.showWatchMovie));
router.get('/watch/series/:id',  asyncHandler(movieController.showWatchSeries));
router.get('/watch/:id',         asyncHandler(movieController.legacyWatchRedirect));

// Healthcheck para monitoreo
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
router.use('/tv', tvRoutes);
// --- ENDPOINTS PARA LA APP ANDROID TV (StreamX) ---
const Movie = require('../models/Movie');
const Series = require('../models/Series');

// 1. Obtener Películas
router.get('/api/movies', async (req, res) => {
  try {
    const items = await Movie.find({ active: true }).sort({ createdAt: -1 }).limit(30);
    res.json(mapToAndroid(items, 'movie'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Obtener Series
// --- ENDPOINT PARA LA APP ANDROID TV (StreamX) ---

router.get('/api/series/:id/details', async (req, res) => {
  try {
    const serie = await Series.findById(req.params.id).lean();
    if (!serie) return res.status(404).json({ error: "Serie no encontrada" });
    
    // Aquí mandamos el objeto COMPLETO (con seasons y episodes)
    res.json(serie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 3. Obtener Animes
router.get('/api/animes', async (req, res) => {
  try {
    const items = await Series.find({ kind: 'anime', active: true }).sort({ createdAt: -1 }).limit(30);
    res.json(mapToAndroid(items, 'anime'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Buscador
router.get('/api/search', async (req, res) => {
  const q = req.query.q;
  try {
    const movies = await Movie.find({ title: { $regex: q, $options: 'i' } }).limit(10);
    const series = await Series.find({ title: { $regex: q, $options: 'i' } }).limit(10);
    res.json([...mapToAndroid(movies, 'movie'), ...mapToAndroid(series, 'series')]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Función auxiliar para que el JSON sea EXACTAMENTE lo que Android espera
function mapToAndroid(items, type) {
  return items.map(item => ({
    _id: item._id,
    tmdbId: item.tmdbId || "",
    title: item.title,
    overview: item.overview || "",
    posterPath: item.posterPath || "",
    backdropPath: item.backdropPath || "",
    kind: type,
    streamingUrl: (item.links && item.links.length > 0) ? item.links[0].url : ""
  }));
}
module.exports = router;
