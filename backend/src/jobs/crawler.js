const { collectFromTelegram } = require('../services/telegramCollector');
const { collectFromUrls } = require('../services/webCollector');
const { runPipeline } = require('../services/pipelineService');
const mockSamples = require('../data/mockSamples');
const logger = require('../utils/logger');

function parseList(s) {
  return String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

async function collectAll() {
  if (process.env.USE_MOCK === 'true') {
    logger.info({ count: mockSamples.length }, 'Mock 모드 — 샘플 데이터 사용');
    return mockSamples;
  }

  const channels = parseList(process.env.TELEGRAM_CHANNELS);
  const urls = parseList(process.env.WEB_SOURCES);

  const [tg, web] = await Promise.all([collectFromTelegram(channels), collectFromUrls(urls)]);
  const all = [...tg, ...web];
  if (all.length === 0) {
    logger.warn('수집 결과 0건 — Mock 폴백');
    return mockSamples;
  }
  return all.slice(0, 50);
}

async function runCrawl() {
  const items = await collectAll();
  return runPipeline(items);
}

module.exports = { runCrawl };
