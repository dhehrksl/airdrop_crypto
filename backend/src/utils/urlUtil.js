const axios = require('axios');
const { withExponentialBackoff } = require('./backoff');
const logger = require('./logger');

/**
 * 주어진 URL이 유효하고 접근 가능한지 HEAD 요청을 통해 확인합니다.
 * @param {string} url - 확인할 URL.
 * @returns {Promise<boolean>} URL이 접근 가능하면 true, 그렇지 않으면 false.
 */
async function verifyUrl(url) {
  if (!url || url.trim() === '') {
    return false;
  }
  try {
    await withExponentialBackoff(async () => {
      await axios.head(url, {
        timeout: 5000, // 5초 타임아웃
        maxRedirects: 5, // 최대 5번 리다이렉트 허용
        headers: { 'User-Agent': 'Mozilla/5.0 AirdropCryptoBot/1.0' },
        validateStatus: (status) => status >= 200 && status < 400, // 2xx 또는 3xx 상태 코드만 성공으로 간주
      });
    }, { retries: 2, baseMs: 1000 }); // 최대 2번 재시도, 기본 1초 간격으로 지수 백오프
    return true;
  } catch (error) {
    logger.warn({ url, error: error.message }, 'URL 검증 실패: 링크에 접근할 수 없습니다.');
    return false;
  }
}

module.exports = { verifyUrl };