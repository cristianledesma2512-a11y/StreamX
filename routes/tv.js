const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Ruta principal de la sección de TV
router.get('/', (req, res) => {
    try {
        // 1. Localizamos el archivo channels.json en la carpeta public
        const channelsPath = path.join(__dirname, '../public/channels.json');
        
        // 2. Leemos el archivo
        const channelsData = fs.readFileSync(channelsPath, 'utf8');
        
        // 3. Convertimos el texto a un objeto de JavaScript (Array)
        const channels = JSON.parse(channelsData);

        // 4. Obtenemos los parámetros de búsqueda y categoría de la URL
        // Ejemplo: /tv?type=Deportes o /tv?q=telefe
        const activeType = req.query.type || '';
        const searchQuery = req.query.q ? req.query.q.toLowerCase().trim() : '';

        // 5. Aplicamos los filtros
        let filteredChannels = channels;

        // Filtro por Categoría
        if (activeType) {
            filteredChannels = filteredChannels.filter(channel => 
                channel.category === activeType
            );
        }

        // Filtro por Buscador (Nombre del canal)
        if (searchQuery) {
            filteredChannels = filteredChannels.filter(channel => 
                channel.name.toLowerCase().includes(searchQuery)
            );
        }

        // 6. Renderizamos la vista 'tv.ejs' pasando los datos necesarios
        res.render('tv', {
            channels: filteredChannels,
            activeType: activeType,
            searchQuery: req.query.q || '',
            user: req.user || null // Por si tenés sistema de login
        });

    } catch (error) {
        console.error("❌ Error en routes/tv.js:", error);
        
        // En caso de error (archivo no encontrado o JSON mal formado)
        // enviamos la página con una lista vacía para que no se rompa el sitio
        res.render('tv', { 
            channels: [], 
            activeType: '', 
            searchQuery: '', 
            user: req.user || null 
        });
    }
});

module.exports = router;