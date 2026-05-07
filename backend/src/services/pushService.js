const { Expo } = require('expo-server-sdk');
const logger = require('../utils/logger');

const expo = new Expo();

async function sendPush(messages) {
  const valid = messages.filter((m) => Expo.isExpoPushToken(m.to));
  if (valid.length === 0) return { sent: 0, errors: 0 };

  const chunks = expo.chunkPushNotifications(valid);
  let sent = 0;
  let errors = 0;
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      sent += tickets.filter((t) => t.status === 'ok').length;
      errors += tickets.filter((t) => t.status === 'error').length;
    } catch (err) {
      logger.error({ err: err.message }, '푸시 발송 실패');
      errors += chunk.length;
    }
  }
  return { sent, errors };
}

module.exports = { sendPush, isExpoPushToken: Expo.isExpoPushToken };
