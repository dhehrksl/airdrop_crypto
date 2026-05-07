require('dotenv').config();
const sentry = require('./utils/sentry');
sentry.init();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const airdropRoutes = require('./routes/airdrops');
const pushRoutes = require('./routes/push');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const scheduler = require('./jobs/scheduler');
const notificationJob = require('./jobs/notificationJob');
const logger = require('./utils/logger');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.get('/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/airdrops', airdropRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, _next) => {
  logger.error({ err: err.message, path: req.path }, 'unhandled error');
  sentry.captureException(err, { path: req.path });
  res.status(500).json({ error: 'internal_error' });
});

const port = Number(process.env.PORT || 4000);

(async () => {
  try {
    await connectDB();
    app.listen(port, () => logger.info(`Server listening on http://localhost:${port}`));
    scheduler.start();
    notificationJob.start();
  } catch (err) {
    logger.error({ err: err.message }, '서버 부팅 실패');
    sentry.captureException(err);
    process.exit(1);
  }
})();

process.on('unhandledRejection', (err) => {
  logger.error({ err: err?.message || err }, 'unhandledRejection');
  sentry.captureException(err);
});
