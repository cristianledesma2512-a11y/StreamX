const express = require('express');
const Channel = require('../models/Channel');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/channels
router.get('/', async (req, res) => {
  try {
    const { category, country, search, page = 1, limit = 50 } = req.query;
    const filter = { active: true };
    if (category) filter.category = category;
    if (country)  filter.country  = country;
    if (search)   filter.name     = { $regex: search, $options: 'i' };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Channel.countDocuments(filter);
    const data  = await Channel.find(filter)
      .sort('-viewers -isLive').skip(skip).limit(parseInt(limit));

    res.json({ success: true, count: data.length, total, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/channels/:slug
router.get('/:slug', async (req, res) => {
  try {
    const item = await Channel.findOne({ slug: req.params.slug, active: true });
    if (!item) return res.status(404).json({ error: 'Canal no encontrado' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/channels
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const item = await Channel.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/channels/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const item = await Channel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/channels/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Channel.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
