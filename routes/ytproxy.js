/**
 * ytproxy.js — StreamX / TECNOCOM
 * ─────────────────────────────────────────────────────────────────────────────
 * Sirve una página HTML mínima que contiene el iframe de YouTube.
 * El navegador carga esta página DESDE TU SERVIDOR (Render),
 * por lo que YouTube ve como origen al dominio de Render/streamx.com.ar
 * y no al navegador del usuario → resuelve Error 153 y bloqueos por ISP.
 *
 * ENDPOINTS:
 *   GET /api/ytproxy?channel=UCxxxx          → stream en vivo por channel ID
 *   GET /api/ytproxy?v=VIDEO_ID              → video/stream por video ID
 *   GET /api/ytproxy?url=URL_COMPLETA        → cualquier URL de YouTube (auto-detecta)
 *
 * INTEGRAR EN server.js / app.js:
 *   const ytproxy = require('./routes/ytproxy');
 *   app.use('/api', ytproxy);
 */

const express = require('express');
const router  = express.Router();

// ── Parsear cualquier URL de YouTube y extraer sus parámetros ─────────────
function parsearYoutubeUrl(url) {
    if (!url) return null;

    // live_stream?channel=UCxxx
    let m = url.match(/live_stream\?.*channel=([^&\s]+)/);
    if (m) return { tipo: 'channel', id: m[1] };

    // embed/VIDEO_ID
    m = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (m) return { tipo: 'video', id: m[1] };

    // watch?v=VIDEO_ID
    m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m) return { tipo: 'video', id: m[1] };

    // youtu.be/VIDEO_ID
    m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m) return { tipo: 'video', id: m[1] };

    // Canal por URL: youtube.com/channel/UCxxx o youtube.com/@handle/live
    m = url.match(/youtube\.com\/channel\/([^/?&\s]+)/);
    if (m) return { tipo: 'channel', id: m[1] };

    return null;
}

// ── Construir URL de embed nocookie ───────────────────────────────────────
function construirEmbedUrl(parsed) {
    if (!parsed) return null;
    const params = 'autoplay=1&rel=0&modestbranding=1&controls=1';
    if (parsed.tipo === 'channel') {
        return `https://www.youtube-nocookie.com/embed/live_stream?channel=${parsed.id}&${params}`;
    }
    return `https://www.youtube-nocookie.com/embed/${parsed.id}?${params}`;
}

// ── Ruta principal ─────────────────────────────────────────────────────────
router.get('/ytproxy', (req, res) => {
    const { channel, v, url } = req.query;

    let parsed = null;

    // Detectar qué parámetro se usó
    if (channel) {
        parsed = { tipo: 'channel', id: channel };
    } else if (v) {
        parsed = { tipo: 'video', id: v };
    } else if (url) {
        parsed = parsearYoutubeUrl(decodeURIComponent(url));
    }

    if (!parsed) {
        return res.status(400).send('Parámetro inválido. Usar: ?channel=UCxxx, ?v=VIDEO_ID o ?url=URL');
    }

    const embedUrl = construirEmbedUrl(parsed);
    if (!embedUrl) {
        return res.status(400).send('No se pudo construir URL de embed');
    }

    // Página HTML mínima — el navegador la carga desde TU dominio (Render)
    // YouTube ve el origen como streamx.com.ar, no como el ISP del usuario
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;background:#000;overflow:hidden}
  iframe{width:100%;height:100%;border:none;display:block}
</style>
</head>
<body>
<iframe
  src="${embedUrl}"
  frameborder="0"
  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
  allowfullscreen
></iframe>
</body>
</html>`;

    // Headers importantes:
    // - X-Frame-Options: ALLOWALL → permite que TU app embeba esta página
    // - NO poner X-Frame-Options restrictivo, sino el proxy no funciona
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    // Cache corto: 5 minutos (los stream IDs no cambian frecuente)
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(html);
});

module.exports = router;
