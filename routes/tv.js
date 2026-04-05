const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const { asyncHandler } = require('../middleware');

// GET /tv — página principal de TV en vivo
router.get('/', asyncHandler(async (req, res) => {
    // 1. Ruta al archivo JSON
    const channelsPath = path.join(__dirname, '..', 'public', 'channels.json');
    let channels = [];
    
    // 2. Leer el JSON de forma segura
    if (fs.existsSync(channelsPath)) {
        try {
            const data = fs.readFileSync(channelsPath, 'utf-8');
            channels = JSON.parse(data);
        } catch (err) {
            console.error("Error al leer channels.json:", err);
        }
    }

    // 3. Obtener filtros de la URL (busqueda y categoría)
    const activeType = req.query.type || ''; 
    const searchQuery = (req.query.q || '').toLowerCase();
    
    let filtered = channels;

    // 4. Aplicar filtros si existen
    if (activeType) {
        filtered = filtered.filter(c => c.category === activeType);
    }
    if (searchQuery) {
        filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery));
    }

    // 5. Renderizar la vista 'tv' con los datos exactos que necesita
    return res.render('tv', { 
        channels: filtered, 
        activeType, 
        searchQuery,
        // Mandamos esto para que el diseño no se rompa si espera paginación
        pagination: { page: 1, totalPages: 1 } 
    });
}));

module.exports = router;