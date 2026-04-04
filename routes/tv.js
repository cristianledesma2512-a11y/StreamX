const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel'); // Ajusta el nombre de tu modelo si es distinto
const { asyncHandler } = require('../middleware');

router.get('/', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 18;
    const skip = (page - 1) * limit;
    
    const searchQuery = req.query.q || '';
    const activeType = req.query.type || '';

    // Construcción del filtro
    const query = {};
    if (activeType) query.category = activeType;
    if (searchQuery) {
        query.name = { $regex: searchQuery, $options: 'i' };
    }

    const [channels, totalChannels] = await Promise.all([
        Channel.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
        Channel.countDocuments(query)
    ]);

    res.render('tv', {
        channels,
        activeType,
        searchQuery,
        pagination: {
            page,
            totalPages: Math.ceil(totalChannels / limit)
        }
    });
}));

module.exports = router;