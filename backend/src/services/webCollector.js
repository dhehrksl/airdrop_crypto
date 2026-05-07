const axios = require('axios');
const cheerio = require('cheerio');
const { withExponentialBackoff } = require('../utils/backoff');
const logger = require('../utils/logger');

async function fetchHtml(url) {
  return withExponentialBackoff(
    async () => {
      const res = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 AirdropCryptoBot/1.0' },
        validateStatus: (s) => s < 500,
      });
      if (res.status >= 400) {
        const err = new Error(`HTTP ${res.status}`);
        err.response = { status: res.status };
        throw err;
      }
      return res.data;
    },
    { retries: 4, baseMs: 2000 }
  );
}

async function collectFromUrl(url) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const items = [];
    $('article, .post, .airdrop-item').each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (text.length > 80 && text.length < 2000) items.push({ source: `Web - ${new URL(url).host}`, raw: text });
    });
    if (items.length === 0) {
      logger.warn({ url }, '셀렉터 매칭 결과 없음 — DOM 구조 변경 가능성');
    }
    return items.slice(0, 50);
  } catch (err) {
    logger.error({ url, err: err.message }, '웹 수집 실패');
    return [];
  }
}

async function collectFromUrls(urls = []) {
  const all = [];
  for (const u of urls) {
    if (!u) continue;
    const batch = await collectFromUrl(u.trim());
    all.push(...batch);
  }
  return all;
}

module.exports = { collectFromUrl, collectFromUrls };
