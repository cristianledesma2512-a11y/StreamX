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
    const { channel, v, url } = req.query;
    let parsed = null;

    if (channel) { parsed = { tipo: 'channel', id: channel }; } 
    else if (v) { parsed = { tipo: 'video', id: v }; } 
    else if (url) { parsed = parsearYoutubeUrl(decodeURIComponent(url)); }

    if (!parsed) return res.status(400).send('Parámetro inválido.');

    const embedUrl = construirEmbedUrl(parsed);
    if (!embedUrl) return res.status(400).send('No se pudo construir URL.');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>*{margin:0;padding:0}html,body,iframe{width:100%;height:100%;background:#000;border:none;overflow:hidden}</style>
    </head><body><iframe src="${embedUrl}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.send(html);
});

module.exports = router;
