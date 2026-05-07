const axios = require('axios');
const logger = require('./logger');

async function sendAlert(message, level = 'error') {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) {
    logger.warn({ level, message }, '[ALERT] webhook 미설정 — 콘솔 출력만');
    return;
  }
  try {
    await axios.post(url, { text: `[${level.toUpperCase()}] ${message}` }, { timeout: 5000 });
  } catch (err) {
    logger.error({ err: err.message }, 'webhook 발송 실패');
  }
}

module.exports = { sendAlert };
