require('dotenv').config();
const { connectDB } = require('../config/db');
const { runPipeline } = require('../services/pipelineService');
const mockSamples = require('../data/mockSamples');
const logger = require('../utils/logger');

(async () => {
  try {
    await connectDB();
    const stats = await runPipeline(mockSamples);
    logger.info({ stats }, '시드 완료');
    process.exit(0);
  } catch (err) {
    logger.error({ err: err.message }, '시드 실패');
    process.exit(1);
  }
})();
