const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const Movie    = require('../models/Movie');
const Series   = require('../models/Series');
const PageView = require('../models/PageView');
const AdminUser = require('../models/AdminUser');
const { fetchMovieByTmdbId, fetchSeriesByTmdbId, searchTmdb } = require('../services/tmdbService');
const cache  = require('../utils/cache');
const logger = require('../utils/logger');

// ─── Dashboard ────────────────────────────────────────────────────────────────
function startOfLocalDay() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

async function getDashboard(req, res) {
  try {
    const today = startOfLocalDay();
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);

    const [totalPageViews, viewsToday, movieCount, seriesCount, adminCount,
           topMovies, topSeries, viewsByDay] = await Promise.all([
      PageView.countDocuments(),
      PageView.countDocuments({ createdAt: { $gte: today } }),
      Movie.countDocuments(),
      Series.countDocuments(),
      AdminUser.countDocuments(),
      Movie.find().sort({ viewCount: -1 }).limit(5).select('title viewCount').lean(),
      Series.find().sort({ viewCount: -1 }).limit(5).select('title viewCount').lean(),
      PageView.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const [movieViews, seriesViews] = await Promise.all([
      Movie.aggregate([{ $group: { _id: null, s: { $sum: '$viewCount' } } }]),
      Series.aggregate([{ $group: { _id: null, s: { $sum: '$viewCount' } } }]),
    ]);

    return res.render('admin/dashboard', {
      stats: { totalPageViews, viewsToday, movieCount, seriesCount, adminCount,
               totalViewsDenorm: (movieViews[0]?.s || 0) + (seriesViews[0]?.s || 0) },
      topMovies, topSeries, viewsByDay,
      msg: req.query.msg || null,
    });
  } catch (e) {
    logger.error('Dashboard error:', e);
    return res.status(500).render('admin/error', { message: e.message });
  }
}

// ─── Movies ──────────────────────────────────────────────────────────────────
async function getMovies(req, res) {
  const search = req.query.q || '';
  const filter = search ? { $text: { $search: search } } : {};
  const movies = await Movie.find(filter).sort({ createdAt: -1 }).lean();
  return res.render('admin/movies', { movies, error: req.query.error || null, msg: req.query.msg || null, search });
}

async function postImportMovie(req, res) {
  try {
    const payload = await fetchMovieByTmdbId(req.body.tmdbId);
    const movie = await Movie.findOneAndUpdate(
      { tmdbId: payload.tmdbId },
      { $set: { title: payload.title, overview: payload.overview, posterPath: payload.posterPath,
                backdropPath: payload.backdropPath, releaseDate: payload.releaseDate, genres: payload.genres } },
      { new: true, upsert: true, runValidators: true }
    );
    cache.flush();
    logger.info(`Importó película: ${payload.title} (TMDB ${payload.tmdbId})`);
    return res.redirect(`/admin/movies/${movie._id}/edit?msg=Película+importada`);
  } catch (e) {
    return res.redirect(`/admin/movies?error=${encodeURIComponent(e.message)}`);
  }
}

async function getMovieEdit(req, res) {
  const movie = await Movie.findById(req.params.id).lean();
  if (!movie) return res.status(404).render('admin/error', { message: 'No encontrada' });
  return res.render('admin/movie-edit', { movie, error: null, msg: req.query.msg || null });
}

async function postMovieUpdate(req, res) {
  try {
    await Movie.findByIdAndUpdate(req.params.id, { $set: {
      title: String(req.body.title || '').trim(), overview: String(req.body.overview || ''),
      posterPath: String(req.body.posterPath || '').trim(), backdropPath: String(req.body.backdropPath || '').trim(),
      releaseDate: String(req.body.releaseDate || '').trim(),
      featured: req.body.featured === 'on', active: req.body.active !== 'off', vimeusEnabled: req.body.vimeusEnabled !== 'off',
    }});
    cache.flush();
    return res.redirect(`/admin/movies/${req.params.id}/edit?msg=Guardado`);
  } catch (e) {
    const movie = await Movie.findById(req.params.id).lean();
    return res.status(400).render('admin/movie-edit', { movie, error: e.message, msg: null });
  }
}

async function postMovieAddLink(req, res) {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).render('admin/error', { message: 'No encontrada' });
  movie.links.push({ serverName: String(req.body.serverName || '').trim(), url: String(req.body.url || '').trim(),
                     quality: req.body.quality || '', language: String(req.body.language || 'Latino').trim() });
  await movie.save(); cache.invalidatePrefix('catalog:');
  return res.redirect(`/admin/movies/${req.params.id}/edit?msg=Enlace+añadido`);
}

async function postMovieRemoveLink(req, res) {
  const idx = Number(req.params.index);
  const movie = await Movie.findById(req.params.id);
  if (!movie || !Number.isFinite(idx) || idx < 0 || idx >= movie.links.length)
    return res.redirect(`/admin/movies/${req.params.id}/edit`);
  movie.links.splice(idx, 1); await movie.save(); cache.invalidatePrefix('catalog:');
  return res.redirect(`/admin/movies/${req.params.id}/edit?msg=Enlace+eliminado`);
}

async function postMovieDelete(req, res) {
  const m = await Movie.findByIdAndDelete(req.params.id);
  if (m) await PageView.deleteMany({ contentType: 'movie', contentId: new mongoose.Types.ObjectId(req.params.id) });
  cache.flush();
  return res.redirect('/admin/movies?msg=Película+eliminada');
}

// ─── Series ──────────────────────────────────────────────────────────────────
async function getSeriesList(req, res) {
  const search = req.query.q || '';
  const filter = search ? { $text: { $search: search } } : {};
  const list = await Series.find(filter).sort({ createdAt: -1 }).lean();
  return res.render('admin/series-list', { series: list, error: req.query.error || null, msg: req.query.msg || null, search });
}

async function postImportSeries(req, res) {
  try {
    const payload = await fetchSeriesByTmdbId(req.body.tmdbId);
    // Preservar links existentes al re-importar
    const existing = await Series.findOne({ tmdbId: payload.tmdbId }).lean();
    let mergedSeasons = payload.seasons;
    if (existing && existing.seasons && existing.seasons.length > 0) {
      // Mantener los links que ya había cargados en episodios existentes
      mergedSeasons = payload.seasons.map((newSeason) => {
        const oldSeason = existing.seasons.find((s) => s.number === newSeason.number);
        if (!oldSeason) return newSeason;
        return {
          ...newSeason,
          episodes: newSeason.episodes.map((newEp) => {
            const oldEp = oldSeason.episodes.find((e) => e.number === newEp.number);
            return oldEp ? { ...newEp, links: oldEp.links || [] } : newEp;
          }),
        };
      });
    }

    const s = await Series.findOneAndUpdate(
      { tmdbId: payload.tmdbId },
      { $set: { title: payload.title, overview: payload.overview, posterPath: payload.posterPath,
                backdropPath: payload.backdropPath, firstAirDate: payload.firstAirDate,
                genres: payload.genres, totalSeasons: payload.totalSeasons, seasons: mergedSeasons } },
      { new: true, upsert: true, runValidators: true }
    );
    cache.flush();
    logger.info(`Importó serie: ${payload.title} (${payload.totalSeasons} temporadas, TMDB ${payload.tmdbId})`);
    return res.redirect(`/admin/series/${s._id}/edit?msg=Serie+importada+con+${payload.totalSeasons}+temporadas`);
  } catch (e) {
    logger.error('Error importando serie:', e);
    return res.redirect(`/admin/series?error=${encodeURIComponent(e.message)}`);
  }
}

async function getSeriesEdit(req, res) {
  const s = await Series.findById(req.params.id).lean();
  if (!s) return res.status(404).render('admin/error', { message: 'No encontrada' });
  return res.render('admin/series-edit', { series: s, error: null, msg: req.query.msg || null });
}

async function postSeriesUpdate(req, res) {
  try {
    await Series.findByIdAndUpdate(req.params.id, { $set: {
      title: String(req.body.title || '').trim(), overview: String(req.body.overview || ''),
      posterPath: String(req.body.posterPath || '').trim(), backdropPath: String(req.body.backdropPath || '').trim(),
      firstAirDate: String(req.body.firstAirDate || '').trim(),
      featured: req.body.featured === 'on', active: req.body.active !== 'off', vimeusEnabled: req.body.vimeusEnabled !== 'off',
    }});
    cache.flush();
    return res.redirect(`/admin/series/${req.params.id}/edit?msg=Guardado`);
  } catch (e) {
    const s = await Series.findById(req.params.id).lean();
    return res.status(400).render('admin/series-edit', { series: s, error: e.message, msg: null });
  }
}

async function postSeriesDelete(req, res) {
  const s = await Series.findByIdAndDelete(req.params.id);
  if (s) await PageView.deleteMany({ contentType: 'series', contentId: new mongoose.Types.ObjectId(req.params.id) });
  cache.flush();
  return res.redirect('/admin/series?msg=Serie+eliminada');
}

// ─── Episodios: agregar / quitar links ────────────────────────────────────────

async function postEpisodeAddLink(req, res) {
  // params: seriesId, seasonId, episodeId
  const s = await Series.findById(req.params.id);
  if (!s) return res.status(404).render('admin/error', { message: 'Serie no encontrada' });

  const season = s.seasons.id(req.params.seasonId);
  if (!season) return res.status(404).render('admin/error', { message: 'Temporada no encontrada' });

  const episode = season.episodes.id(req.params.episodeId);
  if (!episode) return res.status(404).render('admin/error', { message: 'Episodio no encontrado' });

  episode.links.push({
    serverName: String(req.body.serverName || '').trim(),
    url:        String(req.body.url || '').trim(),
    quality:    req.body.quality || '',
    language:   String(req.body.language || 'Latino').trim(),
  });

  await s.save();
  cache.invalidatePrefix('catalog:');
  return res.redirect(`/admin/series/${req.params.id}/edit?season=${season.number}&msg=Enlace+añadido`);
}

async function postEpisodeRemoveLink(req, res) {
  const s = await Series.findById(req.params.id);
  if (!s) return res.status(404).render('admin/error', { message: 'Serie no encontrada' });

  const season = s.seasons.id(req.params.seasonId);
  if (!season) return res.redirect(`/admin/series/${req.params.id}/edit`);

  const episode = season.episodes.id(req.params.episodeId);
  if (!episode) return res.redirect(`/admin/series/${req.params.id}/edit`);

  const idx = Number(req.params.linkIndex);
  if (Number.isFinite(idx) && idx >= 0 && idx < episode.links.length) {
    episode.links.splice(idx, 1);
    await s.save();
    cache.invalidatePrefix('catalog:');
  }
  return res.redirect(`/admin/series/${req.params.id}/edit?season=${season.number}&msg=Enlace+eliminado`);
}

// ─── Admins ──────────────────────────────────────────────────────────────────
async function getAdmins(req, res) {
  const admins = await AdminUser.find().sort({ createdAt: 1 }).select('username role createdAt lastLoginAt loginCount').lean();
  return res.render('admin/admins', { admins, error: req.query.error || null, msg: req.query.msg || null });
}

async function postAdminCreate(req, res) {
  const { username, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(String(password), 12);
    await AdminUser.create({ username: String(username).trim().toLowerCase(), passwordHash: hash, role: role === 'super' ? 'super' : 'admin' });
    return res.redirect('/admin/admins?msg=Usuario+creado');
  } catch (e) {
    return res.redirect(`/admin/admins?error=${encodeURIComponent(e.message)}`);
  }
}

async function postAdminDelete(req, res) {
  if (req.params.id === req.session.adminId)
    return res.redirect('/admin/admins?error=No+puedes+borrarte+a+ti+mismo');
  await AdminUser.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/admins?msg=Usuario+eliminado');
}

async function getTmdbSearch(req, res) {
  try {
    const q = String(req.query.q || '').trim();
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    if (q.length < 2) return res.json([]);
    const results = await searchTmdb(q, type);
    return res.json(results);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}

async function postFlushCache(req, res) {
  cache.flush();
  return res.redirect('/admin?msg=Cache+limpiado');
}

module.exports = {
  getDashboard,
  getMovies, postImportMovie, getMovieEdit, postMovieUpdate, postMovieAddLink, postMovieRemoveLink, postMovieDelete,
  getSeriesList, postImportSeries, getSeriesEdit, postSeriesUpdate, postSeriesDelete,
  postEpisodeAddLink, postEpisodeRemoveLink,
  getAdmins, postAdminCreate, postAdminDelete,
  getTmdbSearch, postFlushCache,
};
