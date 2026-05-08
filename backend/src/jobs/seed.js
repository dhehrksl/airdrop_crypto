require('dotenv').config();
const { connectDB } = require('../config/db');
const { runPipeline } = require('../services/pipelineService');
const mockSamples = require('../data/mockSamples');
const { runCrawl } = require('./crawler'); // crawler.js에서 runCrawl 함수 임포트
const logger = require('../utils/logger');

(async () => {
  try {
    if (!process.env.MONGO_URI) {
      logger.error('환경 변수 MONGO_URI가 설정되지 않았습니다. backend/.env 파일을 확인해주세요.');
      // 디버깅을 위해 현재 MONGO_URI 값도 함께 로깅합니다.
      logger.info(`DEBUG: process.env.MONGO_URI is currently: "${process.env.MONGO_URI}"`);
      process.exit(1);
    }

    await connectDB();

    // runCrawl 함수는 USE_MOCK 설정에 따라 mock 데이터를 사용하거나
    // WEB_SOURCES에서 실제 데이터를 수집하고, 내부적으로 runPipeline을 실행합니다.
    const stats = await runCrawl();
    logger.info({ stats }, '시드 완료');
    process.exit(0);
  } catch (err) {
    logger.error({ err: err.message }, '시드 실패');
    process.exit(1);
  }
})();
