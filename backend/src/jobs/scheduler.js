const cron = require('node-cron');
const { runCrawl } = require('./crawler');
const logger = require('../utils/logger');

let task;

function start() {
  const expr = process.env.CRAWL_CRON || '0 * * * *';
  if (task) return;
  task = cron.schedule(expr, async () => {
    logger.info({ cron: expr }, '크롤링 잡 시작');
    try {
      const stats = await runCrawl();
      logger.info({ stats }, '크롤링 완료');
    } catch (err) {
      logger.error({ err: err.message }, '크롤링 잡 실패');
    }
  });
  logger.info({ cron: expr }, '크롤링 스케줄러 등록');
}

module.exports = { start };
