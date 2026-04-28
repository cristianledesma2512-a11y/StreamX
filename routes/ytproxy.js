const express = require('express');
const router  = express.Router();

function parsearYoutubeUrl(url) {
    if (!url) return null;
    let m = url.match(/live_stream\?.*channel=([^&\s]+)/);
    if (m) return { tipo: 'channel', id: m[1] };
    m = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (m) return { tipo: 'video', id: m[1] };
    m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m) return { tipo: 'video', id: m[1] };
    m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m) return { tipo: 'video', id: m[1] };
    m = url.match(/youtube\.com\/channel\/([^/?&\s]+)/);
    if (m) return { tipo: 'channel', id: m[1] };
    return null;
}

function construirEmbedUrl(parsed) {
    if (!parsed) return null;
    const params = 'autoplay=1&rel=0&modestbranding=1&controls=1';
    if (parsed.tipo === 'channel') {
        return `https://www.youtube-nocookie.com/embed/live_stream?channel=${parsed.id}&${params}`;
    }
    return `https://www.youtube-nocookie.com/embed/${parsed.id}?${params}`;
}

// Cambiamos '/ytproxy' por '/' para que sea la ruta base del middleware
router.get('/', (req, res) => {
    // Capturamos los parámetros de la URL
    const channelId = req.query.channel; // Cambié 'channel' por 'channelId' para evitar conflictos
    const videoId = req.query.v;
    const directUrl = req.query.url;

    let parsed = null;

    if (channelId) {
        parsed = { tipo: 'channel', id: channelId };
    } else if (videoId) {
        parsed = { tipo: 'video', id: videoId };
    } else if (directUrl) {
        parsed = parsearYoutubeUrl(decodeURIComponent(directUrl));
    }

    // Si nada de lo anterior existe, devolvemos error 400 (Bad Request) en vez de 500
    if (!parsed) {
        return res.status(400).send('Error: No se proporcionó un ID de video o canal válido.');
    }

    const embedUrl = construirEmbedUrl(parsed);
    
    // Generamos el HTML (El resto del código sigue igual)
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>*{margin:0;padding:0}html,body,iframe{width:100%;height:100%;background:#000;border:none;overflow:hidden}</style>
    </head><body><iframe src="${embedUrl}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.send(html);
});

module.exports = router;
