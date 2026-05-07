const express = require('express');
const Airdrop = require('../models/Airdrop');

const router = express.Router();

// GET /api/airdrops?sort=latest|deadline&page=1&limit=20&minScore=80&category=L2&q=text
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const minScore = Math.max(0, Number(req.query.minScore) || 0);
    const sortKey = req.query.sort === 'deadline' ? 'deadline' : 'latest';
    const category = typeof req.query.category === 'string' && req.query.category !== 'all' ? req.query.category : null;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const filter = { trust_score: { $gte: minScore } };
    if (sortKey === 'deadline') filter.end_date = { $ne: null, $gte: new Date() };
    if (category) filter.category = category;

    let cursor;
    if (q) {
      filter.$text = { $search: q };
      cursor = Airdrop.find(filter, { score: { $meta: 'textScore' } }).sort({
        score: { $meta: 'textScore' },
        ...(sortKey === 'deadline' ? { end_date: 1 } : { created_at: -1 }),
      });
    } else {
      cursor = Airdrop.find(filter).sort(sortKey === 'deadline' ? { end_date: 1 } : { created_at: -1 });
    }

    const [items, total] = await Promise.all([
      cursor
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Airdrop.countDocuments(filter),
    ]);

    res.json({ items, page, limit, total, hasMore: page * limit < total });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'invalid_id' });
    }
    const item = await Airdrop.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'not_found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/airdrops/by-ids — 즐겨찾기/완료 목록 일괄 조회
router.post('/by-ids', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((x) => /^[0-9a-fA-F]{24}$/.test(x)) : [];
    if (ids.length === 0) return res.json({ items: [] });
    const items = await Airdrop.find({ _id: { $in: ids } }).lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
