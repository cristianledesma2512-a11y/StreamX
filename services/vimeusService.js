const axios = require('axios');

// Cargamos variables de entorno
const BASE = 'https://vimeus.com';
const API_KEY = (process.env.VIMEUS_API_KEY || '').trim();

const client = axios.create({
    baseURL: BASE,
    timeout: 15000,
    headers: {
        'Accept': 'application/json',
        'X-API-Key': API_KEY,
        'User-Agent': 'TECNOCOM-StreamX/1.0'
    }
});

async function apiRequest(path, params = {}) {
    if (!API_KEY) throw new Error('VIMEUS_API_KEY no definida en .env');
    
    try {
        const response = await client.get(path, { params });
        
        // Verificamos si la API reporta error interno
        if (response.data.error) {
            throw new Error(response.data.message || 'Error en Vimeus API');
        }
        
        // Retornamos el objeto "data" que contiene "result" y "pages"
        return response.data.data; 
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        throw new Error(`[Vimeus API] ${msg}`);
    }
}

module.exports = {
    listMovies: (page = 1) => apiRequest('/api/listing/movies', { page }),
    listSeries: (page = 1) => apiRequest('/api/listing/series', { page })
};