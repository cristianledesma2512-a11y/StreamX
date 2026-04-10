require('dotenv').config();
const mongoose = require('mongoose');
const tmdbService = require('../services/tmdbService');
const Movie = require('../models/Movie');

async function run() {
    console.log("🚀 [TECNOCOM] INICIANDO REPARACIÓN MASIVA DE IMÁGENES...");

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Buscamos ABSOLUTAMENTE TODO lo que no tenga posterPath
        const pendientes = await Movie.find({ 
            $or: [
                { posterPath: "" }, 
                { posterPath: { $exists: false } },
                { backdropPath: "" }
            ] 
        });

        console.log(`\n📢 Se encontraron ${pendientes.length} títulos sin imágenes.`);
        console.log("Esto puede demorar unos minutos, pero los vamos a dejar impecables.\n");

        let completados = 0;
        let errores = 0;

        for (const movie of pendientes) {
            try {
                // Determinamos si es peli o serie
                let info;
                if (movie.type === 'serie') {
                    info = await tmdbService.fetchSeriesByTmdbId(movie.tmdbId);
                } else {
                    info = await tmdbService.fetchMovieByTmdbId(movie.tmdbId);
                }

                await Movie.updateOne(
                    { _id: movie._id },
                    {
                        $set: {
                            overview: info.overview || movie.overview,
                            posterPath: info.posterPath,
                            backdropPath: info.backdropPath,
                            releaseDate: info.releaseDate || info.firstAirDate,
                            genres: info.genres
                        }
                    }
                );
                
                completados++;
                process.stdout.write(`\r✅ Procesados: ${completados} | Errores: ${errores} | Faltan: ${pendientes.length - (completados + errores)} `);
                
            } catch (err) {
                errores++;
                // Si falla TMDB por límite de velocidad, esperamos un segundo
                if (err.message.includes('429')) {
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }

        console.log(`\n\n✨ [TECNOCOM] PROCESO TERMINADO.`);
        console.log(`📊 Resumen: ${completados} imágenes cargadas, ${errores} fallidas.`);

    } catch (error) {
        console.error("\n❌ Error crítico:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();