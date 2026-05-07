const express = require('express');
const Airdrop = require('../models/Airdrop');
const PushToken = require('../models/PushToken');
const NotificationLog = require('../models/NotificationLog');

const router = express.Router();

router.use((req, res, next) => {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return res.status(503).json({ error: 'admin_not_configured' });
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.query.token;
  if (token !== expected) return res.status(401).json({ error: 'unauthorized' });
  next();
});

// GET /api/admin/stats
router.get('/stats', async (_req, res, next) => {
  try {
    const total = await Airdrop.countDocuments();
    const active = await Airdrop.countDocuments({ end_date: { $gte: new Date() } });
    const tokens = await PushToken.countDocuments({ enabled: true });

    const buckets = await Airdrop.aggregate([
      {
        $bucket: {
          groupBy: '$trust_score',
          boundaries: [0, 50, 70, 80, 90, 95, 101],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const byCategory = await Airdrop.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgScore: { $avg: '$trust_score' } } },
      { $sort: { count: -1 } },
    ]);

    const recent = await Airdrop.find().sort({ created_at: -1 }).limit(10).select('title trust_score category created_at').lean();

    const last7 = await Airdrop.aggregate([
      { $match: { created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$trust_score' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const notifs = await NotificationLog.aggregate([
      { $group: { _id: '$kind', count: { $sum: 1 }, totalSent: { $sum: '$sent_count' } } },
    ]);

    res.json({
      summary: { total, active, push_subscribers: tokens },
      trust_buckets: buckets,
      by_category: byCategory,
      last7,
      notifications: notifs,
      recent,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/airdrops?page=1
router.get('/airdrops', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const items = await Airdrop.find().sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean();
    const total = await Airdrop.estimatedDocumentCount();
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
