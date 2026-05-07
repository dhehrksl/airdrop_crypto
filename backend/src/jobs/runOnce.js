require('dotenv').config();
const { connectDB } = require('../config/db');
const { runCrawl } = require('./crawler');
const logger = require('../utils/logger');

(async () => {
  try {
    await connectDB();
    const stats = await runCrawl();
    logger.info({ stats }, '1회 크롤링 완료');
    process.exit(0);
  } catch (err) {
    logger.error({ err: err.message }, '실패');
    process.exit(1);
  }
})();
