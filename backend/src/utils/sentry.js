let Sentry = null;
let initialized = false;

function init() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;
  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
    initialized = true;
    return Sentry;
  } catch (err) {
    return null;
  }
}

function captureException(err, ctx) {
  if (!initialized || !Sentry) return;
  Sentry.captureException(err, ctx ? { extra: ctx } : undefined);
}

function getSentry() {
  return initialized ? Sentry : null;
}

module.exports = { init, captureException, getSentry };
