const axios = require('axios');
const logger = require('../utils/logger');

const BASE       = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

function getApiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY no está definida en .env');
  return key;
}

const tmdbClient = axios.create({ baseURL: BASE, timeout: 10000 });

tmdbClient.interceptors.response.use(null, async (error) => {
  const config = error.config;
  config._retries = (config._retries || 0) + 1;
  if (config._retries <= 3 && (!error.response || error.response.status >= 500)) {
    await new Promise((r) => setTimeout(r, 1000 * config._retries));
    logger.warn(`TMDB retry ${config._retries} para ${config.url}`);
    return tmdbClient(config);
  }
  return Promise.reject(error);
});

function tmdbImg(path, size = 'w500') {
  return path ? `${IMAGE_BASE}/${size}${path}` : '';
}

async function fetchMovieByTmdbId(tmdbId) {
  const id = Number(tmdbId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('ID de TMDB inválido');
  const { data } = await tmdbClient.get(`/movie/${id}`, {
    params: { api_key: getApiKey(), language: 'es-ES' },
    validateStatus: (s) => s < 500,
  });
  if (data.status_code) {
    const err = new Error(data.status_message || 'Error TMDB');
    err.status = data.status_code === 34 ? 404 : 502;
    throw err;
  }
  return {
    tmdbId: id,
    title:        data.title || '',
    overview:     data.overview || '',
    posterPath:   tmdbImg(data.poster_path, 'w500'),
    backdropPath: tmdbImg(data.backdrop_path, 'w1280'),
    releaseDate:  data.release_date || '',
    genres:       (data.genres || []).map((g) => g.name),
  };
}

async function fetchSeriesByTmdbId(tmdbId) {
  const id = Number(tmdbId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('ID de TMDB inválido');

  const { data } = await tmdbClient.get(`/tv/${id}`, {
    params: { api_key: getApiKey(), language: 'es-ES' },
    validateStatus: (s) => s < 500,
  });

  if (data.status_code) {
    const err = new Error(data.status_message || 'Error TMDB');
    err.status = data.status_code === 34 ? 404 : 502;
    throw err;
  }

  const totalSeasons = data.number_of_seasons || 0;

  // Importar cada temporada con sus episodios (en paralelo, max 5 a la vez)
  const seasonNumbers = Array.from({ length: totalSeasons }, (_, i) => i + 1);
  const seasons = [];

  for (let i = 0; i < seasonNumbers.length; i += 5) {
    const chunk = seasonNumbers.slice(i, i + 5);
    const results = await Promise.all(chunk.map((n) => fetchSeasonDetail(id, n)));
    seasons.push(...results.filter(Boolean));
  }

  return {
    tmdbId:       id,
    title:        data.name || data.original_name || '',
    overview:     data.overview || '',
    posterPath:   tmdbImg(data.poster_path, 'w500'),
    backdropPath: tmdbImg(data.backdrop_path, 'w1280'),
    firstAirDate: data.first_air_date || '',
    genres:       (data.genres || []).map((g) => g.name),
    totalSeasons,
    seasons,
  };
}

async function fetchSeasonDetail(seriesId, seasonNumber) {
  try {
    const { data } = await tmdbClient.get(`/tv/${seriesId}/season/${seasonNumber}`, {
      params: { api_key: getApiKey(), language: 'es-ES' },
      validateStatus: (s) => s < 500,
    });
    if (!data || data.status_code) return null;

    const episodes = (data.episodes || []).map((ep) => ({
      number:    ep.episode_number,
      title:     ep.name || `Episodio ${ep.episode_number}`,
      overview:  ep.overview || '',
      airDate:   ep.air_date || '',
      duration:  ep.runtime || 0,
      stillPath: tmdbImg(ep.still_path, 'w300'),
      links:     [],
    }));

    return {
      number:     seasonNumber,
      title:      data.name || `Temporada ${seasonNumber}`,
      overview:   data.overview || '',
      airDate:    data.air_date || '',
      posterPath: tmdbImg(data.poster_path, 'w342'),
      episodes,
    };
  } catch (e) {
    logger.warn(`No se pudo obtener temporada ${seasonNumber} de serie ${seriesId}: ${e.message}`);
    return null;
  }
}

async function searchTmdb(query, type = 'multi') {
  const { data } = await tmdbClient.get(`/search/${type}`, {
    params: { api_key: getApiKey(), language: 'es-ES', query, page: 1 },
  });
  return (data.results || []).slice(0, 10).map((r) => ({
    tmdbId:      r.id,
    title:       r.title || r.name || '',
    mediaType:   r.media_type || type,
    releaseDate: r.release_date || r.first_air_date || '',
    posterPath:  tmdbImg(r.poster_path, 'w185'),
    overview:    (r.overview || '').slice(0, 150),
  }));
}

module.exports = { fetchMovieByTmdbId, fetchSeriesByTmdbId, searchTmdb, IMAGE_BASE };
