require('dotenv').config();
const mongoose = require('mongoose');
const vimeus = require('../services/vimeusService');
const tmdbService = require('../services/tmdbService');
const Movie = require('../models/Movie');

const delay = (ms) => new Promise(res => setTimeout(res, ms));
const VIEW_KEY = 'mLdTHLWhqUzZmFUlH_bAZdnQH9VY1F1eDybgVDgGZSA';

async function processItem(item, tipo) {
    // Buscamos si ya existe por tmdbId
    const exists = await Movie.findOne({ tmdbId: item.tmdb_id });
    if (exists) return false;

    try {
        let info;
        // Tanto series como anime usan la lógica de temporadas de TMDB
        if (tipo === 'series' || tipo === 'anime') {
            info = await tmdbService.fetchSeriesByTmdbId(item.tmdb_id);
        } else {
            info = await tmdbService.fetchMovieByTmdbId(item.tmdb_id);
        }

        // Mapeamos los links según el tipo
        if (tipo === 'anime' && info.seasons) {
            // Para Anime, construimos el link de episodio dinámicamente
            info.seasons.forEach(season => {
                season.episodes.forEach(episode => {
                    episode.links = [{
                        serverName: 'Vimeus Anime',
                        url: `https://vimeus.com/e/anime?tmdb=${item.tmdb_id}&se=${season.number}&ep=${episode.number}&view_key=${VIEW_KEY}`,
                        quality: 'FHD',
                        language: 'Latino/Sub'
                    }];
                });
            });
        } else if (tipo === 'series' && info.seasons) {
            // Para Series normales, podrías dejar los links vacíos o mapear un default
            // Generalmente aquí usarías el endpoint de series de Vimeus si lo tienes
            console.log(`   ℹ️ Configurando serie: ${item.title}`);
        }

        await Movie.create({
            tmdbId: item.tmdb_id,
            title: item.title,
            overview: info.overview,
            posterPath: info.posterPath,
            backdropPath: info.backdropPath,
            releaseDate: info.releaseDate || info.firstAirDate,
            genres: info.genres,
            // AQUÍ EL TRUCO: Si es anime, lo guardamos como 'serie' para el frontend
            type: (tipo === 'anime' || tipo === 'series') ? 'serie' : 'movie',
            active: true,
            vimeusEnabled: true,
            links: tipo === 'movie' ? [{
                serverName: 'Vimeus',
                url: item.embed_url,
                quality: item.quality.includes('4K') ? '4K' : 'FHD',
                language: 'Latino'
            }] : [], 
            seasons: info.seasons || []
        });
        return true;
    } catch (e) {
        console.log(`   ⚠️ Error procesando ${item.title}: ${e.message}`);
        return false;
    }
}

async function run() {
    console.log("🚀 [TECNOCOM] INICIANDO CRAWLER TOTAL (PELIS, SERIES Y ANIME)...");
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Definimos los tipos a buscar en la API de Vimeus
        const tipos = ['series', 'anime','movies'];
        
        for (const tipo of tipos) {
            let page = 1;
            let totalPages = 1;

            console.log(`\n--- Iniciando carga de ${tipo.toUpperCase()} ---`);

            do {
                try {
                    let data;
                    if (tipo === 'movies') data = await vimeus.listMovies(page);
                    else if (tipo === 'series') data = await vimeus.listSeries(page);
                    else data = await vimeus.listAnime ? await vimeus.listAnime(page) : await vimeus.listSeries(page);

                    totalPages = data.pages || 1;
                    const items = data.result || [];

                    console.log(`\n📦 ${tipo.toUpperCase()} - Pág ${page}/${totalPages} (${items.length} items)`);

                    for (const item of items) {
                        const success = await processItem(item, tipo);
                        if (success) console.log(`   ✅ Guardado: ${item.title}`);
                    }

                    if (page < totalPages) {
                        console.log(`\n⏳ Pausa de 60 segundos (TECNOCOM Anti-Block)...`);
                        await delay(60000);
                    }
                    page++;

                } catch (err) {
                    console.error(`❌ Error en pág ${page}: ${err.message}`);
                    page++; // Saltamos a la siguiente si hay error
                }
            } while (page <= totalPages);
        }

        console.log(`\n✨ [TECNOCOM] PROCESO FINALIZADO EXITOSAMENTE.`);

    } catch (error) {
        console.error("❌ Error Crítico:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();