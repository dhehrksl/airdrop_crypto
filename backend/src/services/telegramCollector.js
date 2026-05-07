const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

let bot;
function getBot() {
  if (bot) return bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  bot = new TelegramBot(token, { polling: false });
  return bot;
}

// 텔레그램 Bot API는 채널 히스토리 직접 조회를 지원하지 않으므로
// 실제 운영시 봇이 채널 admin으로 추가되거나 MTProto(GramJS) 사용 필요.
// 여기서는 scaffold만 제공하고, Bot API의 forwardMessage 등은 운영자가 셋업한 뒤 사용한다.
async function collectFromTelegram(channels = []) {
  const b = getBot();
  if (!b) {
    logger.warn('TELEGRAM_BOT_TOKEN 미설정 — 텔레그램 수집 스킵');
    return [];
  }
  // NOTE: 실제 채널 메시지 수집은 MTProto(GramJS) 라이브러리로 구현 필요.
  // 이 함수는 운영시 그 어댑터를 갈아끼울 수 있도록 인터페이스만 제공.
  logger.info({ channels }, '텔레그램 수집 시도 (실 구현은 MTProto 어댑터 필요)');
  return [];
}

module.exports = { collectFromTelegram };
