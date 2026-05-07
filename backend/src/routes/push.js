const express = require('express');
const PushToken = require('../models/PushToken');
const { isExpoPushToken } = require('../services/pushService');

const router = express.Router();

// POST /api/push/register — 토큰 + 사용자 알림 설정 등록/갱신
router.post('/register', async (req, res, next) => {
  try {
    const { token, platform, min_trust_score, notify_deadline, categories } = req.body || {};
    if (!token || !isExpoPushToken(token)) {
      return res.status(400).json({ error: 'invalid_token' });
    }
    const update = {
      token,
      platform: ['ios', 'android', 'web'].includes(platform) ? platform : 'android',
      enabled: true,
      last_seen_at: new Date(),
    };
    if (typeof min_trust_score === 'number') update.min_trust_score = Math.max(0, Math.min(100, min_trust_score));
    if (typeof notify_deadline === 'boolean') update.notify_deadline = notify_deadline;
    if (Array.isArray(categories)) update.categories = categories.map(String).slice(0, 10);

    const doc = await PushToken.findOneAndUpdate({ token }, update, { upsert: true, new: true });
    res.json({ ok: true, id: doc._id });
  } catch (err) {
    next(err);
  }
});

// POST /api/push/unregister
router.post('/unregister', async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'missing_token' });
    await PushToken.updateOne({ token }, { enabled: false });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
