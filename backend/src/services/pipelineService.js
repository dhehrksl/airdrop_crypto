const Airdrop = require('../models/Airdrop');
const { analyzeAirdrop } = require('./geminiService');
const { hashContent } = require('./hashUtil');
const { sendAlert } = require('../utils/alert');
const { verifyUrl } = require('../utils/urlUtil'); // 추가: URL 유효성 검증 유틸리티
const logger = require('../utils/logger');

async function processItem(item) {
  const sourceHash = hashContent(item.raw);
  const existing = await Airdrop.findOne({ source_hash: sourceHash }).lean();
  if (existing) {
    if (!existing.sources.includes(item.source)) {
      await Airdrop.updateOne({ _id: existing._id }, { $addToSet: { sources: item.source } });
    }
    return { status: 'duplicate', sourceHash };
  }

  let analyzed;
  try {
    analyzed = await analyzeAirdrop(item.raw);
  } catch (err) {
    if (err.code === 'TIMEOUT') {
      logger.warn('Gemini timeout — 큐 뒤로 이동');
      return { status: 'requeue', reason: 'timeout' };
    }
    logger.error({ err: err.message }, 'Gemini 호출 실패');
    return { status: 'error', reason: err.message };
  }

  if (!analyzed) {
    logger.warn('AI 분석 실패 — drop');
    return { status: 'dropped', reason: 'parse_fail' };
  }

  if (!analyzed.official_link || analyzed.official_link.trim() === '') {
    logger.warn({ title: analyzed.title }, '공식 링크 없음 — drop');
    return { status: 'dropped', reason: 'missing_link' };
  }

  // 추가: official_link의 접근성 확인
  const isLinkReachable = await verifyUrl(analyzed.official_link);
  if (!isLinkReachable) {
    logger.warn({ title: analyzed.title, link: analyzed.official_link }, '공식 링크 접근 불가 — drop');
    return { status: 'dropped', reason: 'unreachable_link' };
  }

  const threshold = Number(process.env.TRUST_SCORE_THRESHOLD || 80);
  if (analyzed.trust_score < threshold) {
    logger.info({ title: analyzed.title, score: analyzed.trust_score }, '신뢰도 임계치 미달 — drop');
    return { status: 'dropped', reason: 'low_trust', score: analyzed.trust_score };
  }

  try {
    await Airdrop.create({
      ...analyzed,
      source_hash: sourceHash,
      sources: [item.source],
      raw_text: item.raw.slice(0, 4000),
    });
    return { status: 'saved', score: analyzed.trust_score };
  } catch (err) {
    if (err.code === 11000) {
      await Airdrop.updateOne({ source_hash: sourceHash }, { $addToSet: { sources: item.source } });
      return { status: 'duplicate_race', sourceHash };
    }
    logger.error({ err: err.message }, 'DB 적재 실패');
    await sendAlert(`DB 적재 실패: ${err.message}`).catch(() => {});
    return { status: 'error', reason: err.message };
  }
}

async function runPipeline(items) {
  const stats = { total: items.length, saved: 0, duplicate: 0, dropped: 0, error: 0, requeue: 0 };
  for (const item of items) {
    const r = await processItem(item);
    if (r.status === 'saved') stats.saved++;
    else if (r.status.startsWith('duplicate')) stats.duplicate++;
    else if (r.status === 'dropped') stats.dropped++;
    else if (r.status === 'requeue') stats.requeue++;
    else stats.error++;
  }
  return stats;
}

module.exports = { processItem, runPipeline };
