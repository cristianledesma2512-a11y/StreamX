#!/usr/bin/env node
/**
 * scripts/importFromVimeus.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Import masivo desde la API de Vimeus hacia MongoDB.
 * Modificado por Gemini para TECNOCOM: Ahora fuerza la actualización de datos
 * incluso si el registro ya existe (evita duplicados por tmdbId).
 */
require('dotenv').config();

const { connectDB } = require('../config/db');
const Movie   = require('../models/Movie');
const Series  = require('../models/Series');
const logger  = require('../utils/logger');
const vimeus  = require('../services/vimeusService');
const { fetchMovieByTmdbId, fetchSeriesByTmdbId } = require('../services/tmdbService');

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/original';
const DELAY_MS   = 1000; // Pausa necesaria para no ser bloqueado por TMDB

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Importar películas ───────────────────────────────────────────────────────
async function importMovies(startPage = 1) {
  logger.info('=== 🎬 INICIANDO IMPORTACIÓN DE PELÍCULAS ===');
  let page = startPage;
  let totalPages = 1;
  let imported = 0, updated = 0, skipped = 0, errors = 0;

  do {
    const result = await vimeus.listMovies(page);
    const movies = result.movies || [];
    totalPages   = result.pagination?.total_pages || 1;

    logger.info(`Página ${page}/${totalPages} - Procesando ${movies.length} items...`);

    for (const item of movies) {
      if (!item.tmdb_id) { 
        skipped++; 
        continue; 
      }
      
      try {
        // TECNOCOM: Eliminamos el 'continue' para permitir que los datos se actualicen.
        // Se busca por tmdbId y se pisa con la info nueva.
        
        await sleep(DELAY_MS);
        const tmdbData = await fetchMovieByTmdbId(item.tmdb_id);

        const res = await Movie.findOneAndUpdate(
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
          { upsert: true, runValidators: true, rawResult: true }
        );

        if (res.lastErrorObject.updatedExisting) {
            logger.info(`  🔄 Actualizada: ${tmdbData.title}`);
            updated++;
        } else {
            logger.info(`  ✅ Nueva: ${tmdbData.title}`);
            imported++;
        }

      } catch (e) {
        logger.warn(`  ❌ Error en tmdb ${item.tmdb_id}: ${e.message}`);
        errors++;
      }
    }
    page++;
  } while (page <= totalPages);

  logger.info(`Resumen Películas: ${imported} nuevas, ${updated} actualizadas, ${errors} errores`);
}

// ─── Importar series ──────────────────────────────────────────────────────────
async function importSeries(startPage = 1) {
  logger.info('=== 📺 INICIANDO IMPORTACIÓN DE SERIES ===');
  let page = startPage;
  let totalPages = 1;
  let imported = 0, updated = 0, skipped = 0, errors = 0;

  do {
    const result = await vimeus.listSeries(page);
    const series = result.series || [];
    totalPages   = result.pagination?.total_pages || 1;

    logger.info(`Página ${page}/${totalPages} - Procesando ${series.length} items...`);

    for (const item of series) {
      if (!item.tmdb_id) { 
        skipped++; 
        continue; 
      }

      try {
        await sleep(DELAY_MS);
        const tmdbData = await fetchSeriesByTmdbId(item.tmdb_id);

        const res = await Series.findOneAndUpdate(
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
          { upsert: true, runValidators: true, rawResult: true }
        );

        if (res.lastErrorObject.updatedExisting) {
            logger.info(`  🔄 Actualizada: ${tmdbData.title}`);
            updated++;
        } else {
            logger.info(`  ✅ Nueva: ${tmdbData.title}`);
            imported++;
        }
      } catch (e) {
        logger.warn(`  ❌ Error en tmdb ${item.tmdb_id}: ${e.message}`);
        errors++;
      }
    }
    page++;
  } while (page <= totalPages);

  logger.info(`Resumen Series: ${imported} nuevas, ${updated} actualizadas, ${errors} errores`);
}

// ─── Main Execution ───────────────────────────────────────────────────────────
(async () => {
  console.log("🚀 [TECNOCOM] INICIANDO SCRIPT DE IMPORTACIÓN...");
  
  const mode = process.argv[2] || 'all'; 
  const startPage = parseInt(process.argv[3]) || 1;

  if (!process.env.VIMEUS_API_KEY) {
    console.error('❌ ERROR: Falta VIMEUS_API_KEY en las variables de entorno');
    process.exit(1);
  }
  
  if (!process.env.TMDB_API_KEY) {
    console.error('❌ ERROR: Falta TMDB_API_KEY en las variables de entorno');
    process.exit(1);
  }

  try {
    await connectDB();
    const startTime = Date.now();

    if (mode === 'movies' || mode === 'all') await importMovies(startPage);
    if (mode === 'series' || mode === 'all') await importSeries(startPage);

    const totalSecs = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info(`\n🚀 [TECNOCOM] Importación completada con éxito en ${totalSecs}s`);
    process.exit(0);
  } catch (err) {
    logger.error('💥 ERROR FATAL en el proceso de importación:', err.message);
    process.exit(1);
  }
})();