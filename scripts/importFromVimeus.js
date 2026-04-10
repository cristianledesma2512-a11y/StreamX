require('dotenv').config();
const mongoose = require('mongoose');
const vimeus = require('../services/vimeusService');
const Movie = require('../models/Movie'); 

const type = process.argv[2] || 'movies';
const targetPage = parseInt(process.argv[3]) || 1;

async function run() {
    console.log(`🚀 [TECNOCOM] INICIANDO IMPORTACIÓN DE ${type.toUpperCase()}...`);

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("info: MongoDB conectado correctamente.");

        const data = (type === 'series') 
            ? await vimeus.listSeries(targetPage) 
            : await vimeus.listMovies(targetPage);

        const items = data.result || [];
        const totalPages = data.pages || 1;

        console.log(`info: Página ${targetPage}/${totalPages} - Encontrados ${items.length} items.`);

        let nuevos = 0;
        let actualizados = 0;

        for (const item of items) {
            // Adaptamos los datos de Vimeus a TU esquema (movieSchema)
            const movieData = {
                tmdbId: item.tmdb_id, // Mapeamos de tmdb_id (API) a tmdbId (Tu Schema)
                title: item.title,
                // Creamos el objeto de link según tu linkSchema
                $addToSet: { 
                    links: {
                        serverName: 'Vimeus',
                        url: item.embed_url,
                        quality: item.quality.includes('4K') ? '4K' : (item.quality.includes('HD') ? 'FHD' : 'SD'),
                        language: 'Latino'
                    }
                },
                active: true,
                vimeusEnabled: true
            };

            const res = await Movie.updateOne(
                { tmdbId: item.tmdb_id }, // Buscamos por tu campo tmdbId
                { 
                    $set: { 
                        title: movieData.title,
                        active: movieData.active,
                        vimeusEnabled: movieData.vimeusEnabled
                    },
                    $addToSet: movieData.$addToSet // Esto evita duplicar el link si ya existe
                },
                { upsert: true }
            );

            if (res.upsertedCount > 0) nuevos++;
            else actualizados++;
        }

        console.log(`\n✅ [TECNOCOM] Resumen: ${nuevos} nuevos, ${actualizados} actualizados.`);
        
    } catch (error) {
        console.error(`\n❌ [TECNOCOM ERROR]: ${error.message}`);
    } finally {
        await mongoose.disconnect();
        console.log("info: Conexión cerrada.");
        process.exit(0);
    }
}

run();