require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Series = require('../models/Series');
const { fetchMovieByTmdbId, fetchSeriesByTmdbId } = require('../services/tmdbService');

// Conexión a tu MongoDB local (Chubut)
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/streamx';

async function bulkImport(ids, type = 'movie') {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🚀 Conectado a MongoDB para importación masiva...');

    for (const id of ids) {
      try {
        console.log(`--- Procesando ${type} ID: ${id} ---`);
        
        if (type === 'movie') {
          const data = await fetchMovieByTmdbId(id);
          await Movie.findOneAndUpdate({ tmdbId: id }, data, { upsert: true, new: true });
        } else {
          const data = await fetchSeriesByTmdbId(id);
          await Series.findOneAndUpdate({ tmdbId: id }, data, { upsert: true, new: true });
        }
        
        console.log(`✅ ${id} importado/actualizado correctamente.`);
      } catch (err) {
        console.error(`❌ Error con ID ${id}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error('Error fatal:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🏁 Proceso finalizado y desconectado.');
  }
}

// --- CONFIGURACIÓN DE CARGA ---
const peliculasAImportar = [1290821, 550, 27205, 157336]; // Agrega aquí todos los IDs que quieras
// bulkImport(peliculasAImportar, 'movie'); 

// Si quieres importar series, descomenta la línea de abajo y comenta la de arriba
// const seriesAImportar = [1399, 63174, 71446]; 
// bulkImport(seriesAImportar, 'series');