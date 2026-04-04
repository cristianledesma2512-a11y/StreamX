const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const { asyncHandler } = require('../middleware');

// GET /tv — página principal de TV en vivo
router.get('/', asyncHandler(async (req, res) => {
  const channelsPath = path.join(__dirname, '..', 'public', 'channels.json');
  const channels = JSON.parse(fs.readFileSync(channelsPath, 'utf-8'));

  const categories = [...new Set(channels.map(c => c.category))].sort();
  const activeCategory = req.query.cat || '';
  const filtered = activeCategory
    ? channels.filter(c => c.category === activeCategory)
    : channels;

  return res.render('tv', { channels: filtered, allChannels: channels, categories, activeCategory });
}));

module.exports = router;
