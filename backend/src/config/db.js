const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI 환경변수가 설정되지 않았습니다.');

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  logger.info('MongoDB 연결 성공');

  mongoose.connection.on('error', (err) => logger.error({ err: err.message }, 'MongoDB 에러'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB 연결 끊김'));
}

module.exports = { connectDB };
