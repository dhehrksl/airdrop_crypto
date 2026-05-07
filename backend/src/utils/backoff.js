function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withExponentialBackoff(fn, { retries = 5, baseMs = 1000, maxMs = 30000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      const retriable = status === 429 || status === 503 || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';
      if (!retriable || attempt === retries - 1) throw err;
      const wait = Math.min(maxMs, baseMs * 2 ** attempt) + Math.floor(Math.random() * 250);
      await sleep(wait);
    }
  }
  throw lastErr;
}

module.exports = { sleep, withExponentialBackoff };
