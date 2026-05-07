const crypto = require('crypto');

function hashContent(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex').slice(0, 32);
}

module.exports = { hashContent };
