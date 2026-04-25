const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Series = require('../models/Series');

// --- ENDPOINTS PARA LA APP ANDROID TV (StreamX) ---

// 1. Películas con metadatos completos
router.get('/movies', async (req, res) => {
  try {
    const items = await Movie.find({ active: true }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(mapToAndroid(items, 'movie'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Series con metadatos completos
router.get('/series', async (req, res) => {
  try {
    const items = await Series.find({ active: true }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(mapToAndroid(items, 'series'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Detalles profundos (Para la pantalla de capítulos)
router.get('/series/:id/details', async (req, res) => {
  try {
    const serie = await Series.findById(req.params.id).lean();
    if (!serie) return res.status(404).json({ error: "Serie no encontrada" });
    
    // Aquí mandamos el objeto original de Mongo con TODO (incluyendo duration y stillPath de capítulos)
    res.json(serie);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- FUNCIÓN DE MAPEO PROFESIONAL ---
function mapToAndroid(items, type) {
  return items.map(item => {
    let streamingUrl = "";
    let quality = "HD";
    let language = "N/A";
    let releaseYear = "";
    let sCount = 0;
    let eCount = 0;

    // 1. Extraer el Año (releaseDate para películas, firstAirDate para series)
    const rawDate = item.releaseDate || item.firstAirDate || "";
    releaseYear = rawDate ? new Date(rawDate).getFullYear().toString() : "";

    // 2. Lógica por tipo
    if (type === 'series' || type === 'anime') {
      sCount = item.totalSeasons || item.seasons?.length || 0;
      eCount = item.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0;
      
      // Datos del primer capítulo disponible
      const firstLink = item.seasons?.[0]?.episodes?.[0]?.links?.[0];
      streamingUrl = firstLink?.url || "";
      quality = firstLink?.quality || "HD";
      language = firstLink?.language || "Latino";
    } else {
      // Películas
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
