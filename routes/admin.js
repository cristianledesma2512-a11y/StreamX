const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const authController  = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const { requireAdmin, requireSuper, asyncHandler } = require('../middleware');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,
  message: 'Demasiados intentos. Esperá 15 minutos.', standardHeaders: true, legacyHeaders: false });

// Auth
router.get('/login',  authController.getLogin);
router.post('/login', loginLimiter, asyncHandler(authController.postLogin));
router.post('/logout', authController.postLogout);

router.use(requireAdmin);

// Dashboard
router.get('/', asyncHandler(adminController.getDashboard));
router.post('/flush-cache', asyncHandler(adminController.postFlushCache));
router.get('/tmdb-search',  asyncHandler(adminController.getTmdbSearch));

// Movies
router.get('/movies',                          asyncHandler(adminController.getMovies));
router.post('/movies/import',                  asyncHandler(adminController.postImportMovie));
router.get('/movies/:id/edit',                 asyncHandler(adminController.getMovieEdit));
router.post('/movies/:id/update',              asyncHandler(adminController.postMovieUpdate));
router.post('/movies/:id/links',               asyncHandler(adminController.postMovieAddLink));
router.post('/movies/:id/links/:index/remove', asyncHandler(adminController.postMovieRemoveLink));
router.post('/movies/:id/delete',              asyncHandler(adminController.postMovieDelete));

// Series
router.get('/series',          asyncHandler(adminController.getSeriesList));
router.post('/series/import',  asyncHandler(adminController.postImportSeries));
router.get('/series/:id/edit', asyncHandler(adminController.getSeriesEdit));
router.post('/series/:id/update', asyncHandler(adminController.postSeriesUpdate));
router.post('/series/:id/delete', asyncHandler(adminController.postSeriesDelete));

// Episodios — agregar / quitar links
router.post('/series/:id/seasons/:seasonId/episodes/:episodeId/links',
  asyncHandler(adminController.postEpisodeAddLink));
router.post('/series/:id/seasons/:seasonId/episodes/:episodeId/links/:linkIndex/remove',
  asyncHandler(adminController.postEpisodeRemoveLink));

// Admins
router.get('/admins',             requireSuper, asyncHandler(adminController.getAdmins));
router.post('/admins',            requireSuper, asyncHandler(adminController.postAdminCreate));
router.post('/admins/:id/delete', requireSuper, asyncHandler(adminController.postAdminDelete));

module.exports = router;
