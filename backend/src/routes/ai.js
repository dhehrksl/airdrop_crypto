const express = require('express');
const Airdrop = require('../models/Airdrop');
const { ask } = require('../services/aiChatService');

const router = express.Router();

// POST /api/ai/ask  body: { airdropId, question }
router.post('/ask', async (req, res, next) => {
  try {
    const { airdropId, question } = req.body || {};
    if (!airdropId || !/^[0-9a-fA-F]{24}$/.test(airdropId)) {
      return res.status(400).json({ error: 'invalid_airdrop_id' });
    }
    const q = String(question || '').trim();
    if (q.length < 2 || q.length > 500) {
      return res.status(400).json({ error: 'invalid_question' });
    }
    const airdrop = await Airdrop.findById(airdropId).lean();
    if (!airdrop) return res.status(404).json({ error: 'not_found' });

    const answer = await ask({ airdrop, question: q });
    res.json({ answer });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
