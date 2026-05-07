const cron = require('node-cron');
const Airdrop = require('../models/Airdrop');
const PushToken = require('../models/PushToken');
const NotificationLog = require('../models/NotificationLog');
const { sendPush } = require('../services/pushService');
const logger = require('../utils/logger');

async function notifyHighTrust() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const candidates = await Airdrop.find({
    trust_score: { $gte: 95 },
    created_at: { $gte: since },
  }).lean();

  for (const a of candidates) {
    const exists = await NotificationLog.findOne({ airdrop_id: a._id, kind: 'high_trust' });
    if (exists) continue;

    const tokens = await PushToken.find({
      enabled: true,
      min_trust_score: { $lte: a.trust_score },
      $or: [{ categories: { $size: 0 } }, { categories: a.category }],
    }).lean();

    if (tokens.length === 0) continue;

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: '초고수익 예상 에어드랍',
      body: `${a.title} (신뢰도 ${a.trust_score})`,
      data: { airdropId: String(a._id), kind: 'high_trust' },
    }));
    const result = await sendPush(messages);
    await NotificationLog.create({ airdrop_id: a._id, kind: 'high_trust', sent_count: result.sent });
    logger.info({ id: a._id, sent: result.sent, errors: result.errors }, '고신뢰도 푸시 발송');
  }
}

async function notifyDeadline() {
  const now = Date.now();
  const in24h = new Date(now + 24 * 60 * 60 * 1000);
  const after = new Date(now);

  const candidates = await Airdrop.find({
    end_date: { $gte: after, $lte: in24h },
  }).lean();

  for (const a of candidates) {
    const exists = await NotificationLog.findOne({ airdrop_id: a._id, kind: 'deadline' });
    if (exists) continue;

    const tokens = await PushToken.find({
      enabled: true,
      notify_deadline: true,
      min_trust_score: { $lte: a.trust_score },
      $or: [{ categories: { $size: 0 } }, { categories: a.category }],
    }).lean();

    if (tokens.length === 0) continue;

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: '마감 1일 전',
      body: a.title,
      data: { airdropId: String(a._id), kind: 'deadline' },
    }));
    const result = await sendPush(messages);
    await NotificationLog.create({ airdrop_id: a._id, kind: 'deadline', sent_count: result.sent });
    logger.info({ id: a._id, sent: result.sent }, '마감 임박 푸시 발송');
  }
}

let task;
function start() {
  if (task) return;
  task = cron.schedule(process.env.PUSH_CRON || '*/15 * * * *', async () => {
    try {
      await notifyHighTrust();
      await notifyDeadline();
    } catch (err) {
      logger.error({ err: err.message }, '푸시 알림 잡 실패');
    }
  });
  logger.info('푸시 알림 스케줄러 등록');
}

module.exports = { start, notifyHighTrust, notifyDeadline };
