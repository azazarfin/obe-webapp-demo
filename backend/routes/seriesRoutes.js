const express = require('express');
const ClassInstance = require('../models/ClassInstance');
const Series = require('../models/Series');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

const DEFAULT_SERIES = ['2020', '2021', '2022', '2023', '2024'];

const ensureSeriesSeed = async () => {
  const existing = await Series.find().sort({ year: 1 });
  if (existing.length > 0) {
    return existing;
  }

  const [userSeries, classSeries] = await Promise.all([
    User.distinct('series', { series: { $ne: null } }),
    ClassInstance.distinct('series', { series: { $ne: null } })
  ]);

  const years = Array.from(new Set([
    ...DEFAULT_SERIES,
    ...userSeries.filter(Boolean).map(String),
    ...classSeries.filter(Boolean).map(String)
  ])).sort();

  if (years.length === 0) {
    return [];
  }

  await Series.insertMany(years.map((year) => ({ year })));
  return Series.find().sort({ year: 1 });
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const series = await ensureSeriesSeed();
    res.json(series);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching series' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN'), async (req, res) => {
  try {
    const year = String(req.body.year || '').trim();
    if (!/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: 'Series year must be a 4-digit year' });
    }

    const series = await Series.create({ year });
    res.status(201).json(series);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Series already exists' });
    }
    res.status(500).json({ error: 'Server error creating series' });
  }
});

router.delete('/:id', verifyToken, requireRole('CENTRAL_ADMIN'), async (req, res) => {
  try {
    const series = await Series.findByIdAndDelete(req.params.id);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    res.json({ message: 'Series deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting series' });
  }
});

module.exports = router;
