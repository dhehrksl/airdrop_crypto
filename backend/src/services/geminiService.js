const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `너는 가상화폐 에어드랍 정보 분석가다. 입력된 원문 텍스트를 분석하여 아래 JSON 스키마에 맞는 결과를 반환하라.

스키마:
{
  "title": string,             // 프로젝트명을 포함한 에어드랍 제목 (한국어)
  "description": string,       // 참여 방법 3줄 요약 (한국어, 줄바꿈 \\n 포함)
  "official_link": string,     // 공식 URL (없으면 빈 문자열)
  "end_date": string|null,     // ISO 8601 날짜 (없으면 null)
  "reward": string,            // 보상 규모 요약 (예: "토큰 500개", "총 $50,000 풀")
  "category": string,          // L2 | DeFi | NFT | Bounty | Testnet | Meme | Other 중 1개
  "tags": string[],            // 검색용 키워드 (예: ["zksync","layer2","ethereum"])
  "trust_score": number,       // 0~100 신뢰도 점수
  "scam_reasons": string[]     // 스캠 의심 근거 (없으면 빈 배열)
}

스캠 점수 산정 가이드 (점수 대폭 하향):
- 지갑 개인키(Private Key), 시드 문구 요구 → 0~10점
- 사전 입금/송금/가스비 명목 ETH 요구 → 0~20점
- 비공식 단축 URL(bit.ly, tinyurl 등) → -30점
- 자동 잔액 조회 사칭 사이트 → -40점
- 공식 도메인/검증된 출처 → +20점

반드시 위 JSON 스키마만 반환하라. 마크다운, 설명, 코드블록 금지.`;

let _client;
function getClient() {
  if (_client) return _client;
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY 미설정');
  _client = new GoogleGenerativeAI(key);
  return _client;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }
  return null;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error('Gemini timeout'), { code: 'TIMEOUT' })), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

async function analyzeAirdrop(rawText, { timeoutMs = 15000 } = {}) {
  if (process.env.USE_MOCK === 'true' || !process.env.GEMINI_API_KEY) {
    return mockAnalyze(rawText);
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const model = getClient().getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });

  const result = await withTimeout(model.generateContent(rawText), timeoutMs);
  const text = result?.response?.text?.() || '';
  const parsed = tryParseJson(text);
  if (!parsed) {
    logger.warn({ snippet: text.slice(0, 200) }, 'Gemini JSON 파싱 실패 — drop');
    return null;
  }

  return validate(parsed);
}

function validate(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const score = Number(obj.trust_score);
  if (!Number.isFinite(score)) return null;
  if (!obj.title || typeof obj.title !== 'string') return null;
  if (!obj.official_link || typeof obj.official_link !== 'string') return null;
  const allowed = ['L2', 'DeFi', 'NFT', 'Bounty', 'Testnet', 'Meme', 'Other'];
  const category = allowed.includes(obj.category) ? obj.category : 'Other';
  const tags = Array.isArray(obj.tags) ? obj.tags.slice(0, 8).map((t) => String(t).slice(0, 32)) : [];
  return {
    title: String(obj.title).slice(0, 200),
    description: String(obj.description || '').slice(0, 1000),
    official_link: String(obj.official_link),
    end_date: obj.end_date ? new Date(obj.end_date) : null,
    reward: String(obj.reward || '').slice(0, 200),
    category,
    tags,
    trust_score: Math.max(0, Math.min(100, Math.round(score))),
    scam_reasons: Array.isArray(obj.scam_reasons) ? obj.scam_reasons : [],
  };
}

function mockAnalyze(rawText) {
  const lower = (rawText || '').toLowerCase();
  let score = 85;
  const reasons = [];
  if (/private key|seed phrase|개인키|시드/.test(lower)) {
    score = 5;
    reasons.push('개인키/시드 요구');
  }
  if (/deposit|gas fee|입금|선입금/.test(lower)) {
    score = Math.min(score, 15);
    reasons.push('사전 입금 요구');
  }
  if (/bit\.ly|tinyurl|shorturl/.test(lower)) {
    score -= 30;
    reasons.push('비공식 단축 URL');
  }

  let category = 'Other';
  const tags = [];
  if (/zksync|starknet|linea|scroll|blast|manta|layer2|l2/i.test(rawText)) {
    category = 'L2';
    tags.push('layer2');
  } else if (/nft/i.test(rawText)) category = 'NFT';
  else if (/bounty|task|gleam|galxe/i.test(rawText)) category = 'Bounty';
  else if (/testnet|faucet/i.test(rawText)) category = 'Testnet';
  else if (/usde|ethena|defi|swap|stake|lp/i.test(rawText)) category = 'DeFi';
  else if (/meme|doge|pepe/i.test(rawText)) category = 'Meme';

  const m = rawText.match(/zksync|starknet|linea|scroll|blast|manta|layerzero|wormhole|ethena/gi);
  if (m) tags.push(...new Set(m.map((s) => s.toLowerCase())));

  const titleMatch = rawText.match(/^([^\n]{1,80})/);
  const linkMatch = rawText.match(/https?:\/\/[^\s)]+/);
  const dateMatch = rawText.match(/(\d{4}-\d{2}-\d{2})/);
  return validate({
    title: titleMatch ? titleMatch[1].trim() : '에어드랍',
    description: rawText.split(/\n+/).slice(0, 3).join('\n').slice(0, 300) || '참여 방법 미상',
    official_link: linkMatch ? linkMatch[0] : 'https://example.com',
    end_date: dateMatch ? dateMatch[1] : null,
    reward: '미상',
    category,
    tags,
    trust_score: Math.max(0, score),
    scam_reasons: reasons,
  });
}

module.exports = { analyzeAirdrop, mockAnalyze };
