const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const SYSTEM = `너는 가상화폐 에어드랍 안전성 분석 어시스턴트다. 사용자가 특정 에어드랍에 대해 질문하면, 제공된 컨텍스트(원문 + 신뢰도 점수 + 스캠 사유)를 기반으로 한국어로 간결하게(3~5줄) 답하라.
- 추측 금지. 컨텍스트에 없는 정보는 "공식 자료 확인 필요"라고 명시.
- 개인키/시드 요청, 사전 입금 요구가 있다면 단호하게 위험 경고.
- 절대로 사용자에게 지갑 연결을 권하거나 코드 실행을 시키지 마라.`;

let _client;
function getClient() {
  if (_client) return _client;
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY 미설정');
  _client = new GoogleGenerativeAI(key);
  return _client;
}

async function ask({ airdrop, question }) {
  if (process.env.USE_MOCK === 'true' || !process.env.GEMINI_API_KEY) {
    return mockAnswer(airdrop, question);
  }
  const model = getClient().getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    systemInstruction: SYSTEM,
    generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
  });

  const context = `[프로젝트] ${airdrop.title}
[신뢰도] ${airdrop.trust_score}
[카테고리] ${airdrop.category || 'Other'}
[참여 방법] ${airdrop.description}
[보상] ${airdrop.reward || '미상'}
[공식 링크] ${airdrop.official_link}
[원문] ${(airdrop.raw_text || '').slice(0, 1500)}

[사용자 질문] ${question}`;

  try {
    const r = await model.generateContent(context);
    return r.response.text().trim().slice(0, 1200);
  } catch (err) {
    logger.error({ err: err.message }, 'AI 챗 실패');
    return mockAnswer(airdrop, question);
  }
}

function mockAnswer(airdrop, question) {
  const score = airdrop.trust_score;
  const verdict = score >= 90 ? '비교적 안전' : score >= 80 ? '보통' : '주의 필요';
  const lines = [
    `[Mock 응답] ${airdrop.title}는 신뢰도 ${score}점으로 ${verdict}한 수준입니다.`,
    `질문: "${(question || '').slice(0, 80)}"`,
    `참여 방법 요약: ${(airdrop.description || '').split('\n')[0]}`,
    score < 80 ? '⚠ 임계치 미달 — 권장하지 않습니다.' : '공식 링크에서 직접 자격을 확인하세요.',
  ];
  return lines.filter(Boolean).join('\n');
}

module.exports = { ask };
