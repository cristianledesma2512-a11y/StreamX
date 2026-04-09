#!/usr/bin/env node
/**
 * scripts/importFromVimeus.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Import masivo desde la API de Vimeus hacia MongoDB local.
 * Usa upsert por tmdbId — no duplica, actualiza si ya existe.
 *
 * Uso:
 *   node scripts/importFromVimeus.js            → importa movies + series
 *   node scripts/importFromVimeus.js movies      → solo películas
 *   node scripts/importFromVimeus.js series      → solo series
 *   node scripts/importFromVimeus.js movies 2    → películas desde página 2
 *
 * Variables necesarias en .env:
 *   VIMEUS_API_KEY, VIMEUS_VIEW_KEY, MONGODB_URI, TMDB_API_KEY
 */
require('dotenv').config();

const { connectDB } = require('../config/db');
const Movie   = require('../models/Movie');
const Series  = require('../models/Series');
const logger  = require('../utils/logger');
const vimeus  = require('../services/vimeusService');
const { fetchMovieByTmdbId, fetchSeriesByTmdbId } = require('../services/tmdbService');

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/original';
const DELAY_MS   = 1000; // pausa entre requests TMDB para no exceder rate limit

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Importar películas ───────────────────────────────────────────────────────
async function importMovies(startPage = 1) {
  logger.info('=== Importando PELÍCULAS desde Vimeus ===');
  let page = startPage;
  let totalPages = 1;
  let imported = 0, skipped = 0, errors = 0;

  do {
    const result = await vimeus.listMovies(page);
    const movies = result.movies || [];
    totalPages   = result.pagination?.total_pages || 1;

    logger.info(`Películas — página ${page}/${totalPages} (${movies.length} items)`);

    for (const item of movies) {
      if (!item.tmdb_id) { skipped++; continue; }
      try {
        // Verificar si ya existe en nuestra BD
        const exists = await Movie.findOne({ tmdbId: item.tmdb_id }).select('_id title').lean();
        if (exists) {
          logger.debug(`  Ya existe: ${exists.title} (tmdb ${item.tmdb_id})`);
          skipped++;
          continue;
        }

        // Obtener metadatos completos desde TMDB
        await sleep(DELAY_MS);
        const tmdbData = await fetchMovieByTmdbId(item.tmdb_id);

        await Movie.findOneAndUpdate(
          { tmdbId: tmdbData.tmdbId },
          { $set: {
            title:        tmdbData.title,
            overview:     tmdbData.overview,
            posterPath:   tmdbData.posterPath,
            backdropPath: tmdbData.backdropPath,
            releaseDate:  tmdbData.releaseDate,
            genres:       tmdbData.genres,
            vimeusEnabled: true,
            active:       true,
          }},
          { upsert: true, runValidators: true }
        );

        logger.info(`  ✅ ${tmdbData.title} (tmdb ${tmdbData.tmdbId})`);
        imported++;
      } catch (e) {
        logger.warn(`  ❌ tmdb ${item.tmdb_id}: ${e.message}`);
        errors++;
      }
    }

    page++;
  } while (page <= totalPages);

  logger.info(`Películas: ${imported} importadas, ${skipped} ya existían, ${errors} errores`);
  return { imported, skipped, errors };
}

// ─── Importar series ──────────────────────────────────────────────────────────
async function importSeries(startPage = 1) {
  logger.info('=== Importando SERIES desde Vimeus ===');
  let page = startPage;
  let totalPages = 1;
  let imported = 0, skipped = 0, errors = 0;

  do {
    const result = await vimeus.listSeries(page);
    const series = result.series || [];
    totalPages   = result.pagination?.total_pages || 1;

    logger.info(`Series — página ${page}/${totalPages} (${series.length} items)`);

    for (const item of series) {
      if (!item.tmdb_id) { skipped++; continue; }
      try {
        const exists = await Series.findOne({ tmdbId: item.tmdb_id }).select('_id title').lean();
        if (exists) {
          logger.debug(`  Ya existe: ${exists.title} (tmdb ${item.tmdb_id})`);
          skipped++;
          continue;
        }

        await sleep(DELAY_MS);
        const tmdbData = await fetchSeriesByTmdbId(item.tmdb_id);

        await Series.findOneAndUpdate(
          { tmdbId: tmdbData.tmdbId },
          { $set: {
            title:        tmdbData.title,
            overview:     tmdbData.overview,
            posterPath:   tmdbData.posterPath,
            backdropPath: tmdbData.backdropPath,
            firstAirDate: tmdbData.firstAirDate,
            genres:       tmdbData.genres,
            totalSeasons: tmdbData.totalSeasons,
            seasons:      tmdbData.seasons,
            vimeusEnabled: true,
            active:       true,
          }},
          { upsert: true, runValidators: true }
        );

        logger.info(`  ✅ ${tmdbData.title} (${tmdbData.totalSeasons} temp., tmdb ${tmdbData.tmdbId})`);
        imported++;
      } catch (e) {
        logger.warn(`  ❌ tmdb ${item.tmdb_id}: ${e.message}`);
        errors++;
      }
    }

    page++;
  } while (page <= totalPages);

  logger.info(`Series: ${imported} importadas, ${skipped} ya existían, ${errors} errores`);
  return { imported, skipped, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const mode      = process.argv[2] || 'all';   // movies | series | all
  const startPage = parseInt(process.argv[3]) || 1;

  if (!process.env.VIMEUS_API_KEY) {
    console.error('❌ Falta VIMEUS_API_KEY en .env');
    process.exit(1);
  }
  if (!process.env.TMDB_API_KEY) {
    console.error('❌ Falta TMDB_API_KEY en .env');
    process.exit(1);
  }

  try {
    await connectDB();
    const start = Date.now();

    if (mode === 'movies' || mode === 'all') await importMovies(startPage);
    if (mode === 'series' || mode === 'all') await importSeries(startPage);

    const secs = ((Date.now() - start) / 1000).toFixed(1);
    logger.info(`\n✅ Import completado en ${secs}s`);
    process.exit(0);
  } catch (err) {
    logger.error('Error fatal en import:', err.message);
    process.exit(1);
  }
})();
