const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const movieController = require('../controllers/movieController');
const { asyncHandler } = require('../middleware');

// Rate limit general para rutas públicas
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // no limitar healthcheck
});

router.use(publicLimiter);

router.get('/',                  asyncHandler(movieController.listMovies));
router.get('/watch/movie/:id',   asyncHandler(movieController.showWatchMovie));
router.get('/watch/series/:id',  asyncHandler(movieController.showWatchSeries));
router.get('/watch/:id',         asyncHandler(movieController.legacyWatchRedirect));

// Healthcheck para monitoreo
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

module.exports = router;
