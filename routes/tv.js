const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const { asyncHandler } = require('../middleware');

router.get('/', asyncHandler(async (req, res) => {
    // Ruta al JSON de canales
    const channelsPath = path.join(__dirname, '..', 'public', 'channels.json');
    let channels = [];
    
    if (fs.existsSync(channelsPath)) {
        channels = JSON.parse(fs.readFileSync(channelsPath, 'utf-8'));
    }

    // Filtros y Búsqueda
    const searchQuery = (req.query.q || '').toLowerCase();
    const activeType = req.query.type || ''; // Usamos 'type' para categorías
    
    let filtered = channels;

    if (activeType) {
        filtered = filtered.filter(c => c.category === activeType);
    }
    if (searchQuery) {
        filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery));
    }

    // Paginación simple (opcional, aquí enviamos todo para no complicar)
    res.render('tv', { 
        channels: filtered, 
        activeType, 
        searchQuery,
        pagination: { page: 1, totalPages: 1 } // Estructura para que no de error el EJS
    });
}));

module.exports = router;