/**
 * vimeusService.js
 * Integración con Vimeus — player embeds + import masivo de catálogo.
 *
 * VIEW_KEY: genera URLs de iframe para el player (frontend)
 * API_KEY:  consulta el catálogo de Vimeus (backend, import masivo)
 */
const axios  = require('axios');
const logger = require('../utils/logger');

const BASE         = 'https://vimeus.com';
const VIEW_KEY     = process.env.VIMEUS_VIEW_KEY || '';
const API_KEY      = process.env.VIMEUS_API_KEY  || '';
const ENABLED      = process.env.VIMEUS_ENABLED !== 'false';

// ─── Cliente HTTP con retry ────────────────────────────────────────────────────
const client = axios.create({ baseURL: BASE, timeout: 10000,
  headers: { 'X-API-Key': API_KEY, 'Accept': 'application/json' } });

client.interceptors.response.use(null, async (err) => {
  const cfg = err.config;
  cfg._retries = (cfg._retries || 0) + 1;
  if (cfg._retries <= 3 && (!err.response || err.response.status >= 500)) {
    await new Promise((r) => setTimeout(r, 1000 * cfg._retries));
    return client(cfg);
  }
  return Promise.reject(err);
});

// ─── Nivel 1: Generar URLs de embed para el player ────────────────────────────

/**
 * Genera la URL del iframe de Vimeus para una PELÍCULA.
 * @param {number} tmdbId
 * @returns {string|null}
 */
function movieEmbedUrl(tmdbId) {
  if (!ENABLED || !VIEW_KEY || !tmdbId) return null;
  return `${BASE}/e/movie?tmdb=${tmdbId}&view_key=${VIEW_KEY}`;
}

/**
 * Genera la URL del iframe de Vimeus para una SERIE (episodio específico).
 * @param {number} tmdbId
 * @param {number} season  — número de temporada
 * @param {number} episode — número de episodio
 * @returns {string|null}
 */
function seriesEmbedUrl(tmdbId, season, episode) {
  if (!ENABLED || !VIEW_KEY || !tmdbId) return null;
  if (season && episode) {
    return `${BASE}/e/serie?tmdb=${tmdbId}&se=${season}&ep=${episode}&view_key=${VIEW_KEY}`;
  }
  return `${BASE}/e/serie?tmdb=${tmdbId}&view_key=${VIEW_KEY}`;
}

/**
 * Genera la URL del iframe de Vimeus para un ANIME.
 * @param {number} tmdbId
 * @param {number} [season]
 * @param {number} [episode]
 * @returns {string|null}
 */
function animeEmbedUrl(tmdbId, season, episode) {
  if (!ENABLED || !VIEW_KEY || !tmdbId) return null;
  if (season && episode) {
    return `${BASE}/e/anime?tmdb=${tmdbId}&se=${season}&ep=${episode}&view_key=${VIEW_KEY}`;
  }
  return `${BASE}/e/anime?tmdb=${tmdbId}&view_key=${VIEW_KEY}`;
}

// ─── Nivel 2: Import masivo desde Vimeus API ──────────────────────────────────

/**
 * Obtiene todas las páginas de un endpoint de listing.
 * @param {string} path — '/api/listing/movies' | '/api/listing/series' | '/api/listing/animes'
 * @param {Function} [onPage] — callback opcional por página: (items, page, total) => void
 * @returns {Promise<Array>}
 */
async function fetchAllPages(path, onPage = null) {
  if (!API_KEY) throw new Error('VIMEUS_API_KEY no está definida en .env');

  let page = 1;
  let totalPages = 1;
  const allItems = [];

  do {
    const { data } = await client.get(path, { params: { page } });
    if (data.error) throw new Error(data.message || 'Error en Vimeus API');

    const payload = data.data;
    // La key del array varía según endpoint
    const items = payload.movies || payload.series || payload.animes || payload.episodes || [];

    allItems.push(...items);
    totalPages = payload.pagination?.total_pages || 1;

    if (onPage) onPage(items, page, totalPages);
    logger.debug(`Vimeus ${path} — página ${page}/${totalPages} (${items.length} items)`);

    page++;
  } while (page <= totalPages);

  return allItems;
}

async function listMovies(page = 1) {
  const { data } = await client.get('/api/listing/movies', { params: { page } });
  if (data.error) throw new Error(data.message);
  return data.data;
}

async function listSeries(page = 1) {
  const { data } = await client.get('/api/listing/series', { params: { page } });
  if (data.error) throw new Error(data.message);
  return data.data;
}

async function listEpisodes(tmdbId = null, season = null, page = 1) {
  const params = { page };
  if (tmdbId) params.tmdb_id = tmdbId;
  if (season) params.season = season;
  const { data } = await client.get('/api/listing/episodes', { params });
  if (data.error) throw new Error(data.message);
  return data.data;
}

module.exports = {
  ENABLED,
  movieEmbedUrl,
  seriesEmbedUrl,
  animeEmbedUrl,
  fetchAllPages,
  listMovies,
  listSeries,
  listEpisodes,
};
