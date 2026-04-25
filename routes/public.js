const express = require('express');
const router = express.Router();

// Importamos el controlador para la WEB
const movieController = require('../controllers/movieController');
const { asyncHandler } = require('../middleware');
const tvRoutes = require('./tv');
// Importamos los modelos para la APP
const Movie = require('../models/Movie');
const Series = require('../models/Series');

// =============================================================================
// ─── RUTAS PARA LA WEB (Renderizan EJS/HTML) ─────────────────────────────────
// =============================================================================

// ESTA ES LA RUTA QUE TE FALTABA Y POR ESO DABA 404
router.get('/', asyncHandler(movieController.listMovies));

router.get('/watch/movie/:id', asyncHandler(movieController.showWatchMovie));
router.get('/watch/series/:id', asyncHandler(movieController.showWatchSeries));

// ESTA ES LA LÍNEA QUE FALTA PARA QUE LA WEB DE TV FUNCIONE:
router.use('/tv', tvRoutes);
// =============================================================================
// ─── ENDPOINTS PARA LA APP ANDROID (Devuelven JSON) ─────────────────────────
// =============================================================================

// 1. Películas para Android
router.get('/movies', async (req, res) => {
  try {
    const items = await Movie.find({ active: true }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(mapToAndroid(items, 'movie'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Series para Android
router.get('/series', async (req, res) => {
  try {
    const items = await Series.find({ active: true }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(mapToAndroid(items, 'series'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Detalles de Serie (Temporadas/Capítulos)
router.get('/series/:id/details', async (req, res) => {
  try {
    const serie = await Series.findById(req.params.id).lean();
    if (!serie) return res.status(404).json({ error: "Serie no encontrada" });
    res.json(serie);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// =============================================================================
// ─── FUNCIÓN DE MAPEO PROFESIONAL ────────────────────────────────────────────
// =============================================================================

function mapToAndroid(items, type) {
  return items.map(item => {
    let streamingUrl = "";
    let quality = "HD";
    let language = "N/A";
    let releaseYear = "";
    let sCount = 0;
    let eCount = 0;

    const rawDate = item.releaseDate || item.firstAirDate || "";
    releaseYear = rawDate ? new Date(rawDate).getFullYear().toString() : "";

    if (type === 'series' || type === 'anime') {
      sCount = item.totalSeasons || item.seasons?.length || 0;
      eCount = item.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0;
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
      totalSeasons: sCount,
      totalEpisodes: eCount,
      streamingUrl: streamingUrl
    };
  });
}

module.exports = router;
