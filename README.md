# Airdrop Crypto — AI 자동화 에어드랍 큐레이션 플랫폼

기획서(`기획서.md`) 기반의 풀스택 구현체.
- **백엔드:** Node.js + Express + MongoDB + Gemini 1.5 Flash 파이프라인
- **모바일:** Expo(React Native) 안드로이드 타겟
- **관리자:** Vite + React + Recharts 웹 대시보드
- **기본 모드:** `USE_MOCK=true` (외부 호출 없이 샘플 데이터로 전체 파이프라인 검증)

---

## 폴더 구조

```
airdrop_crypto/
├── 기획서.md
├── README.md
├── backend/                       # Express + Mongoose + Gemini + 푸시 + AI 챗 + 관리자 API
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js              # 부팅 + Sentry + 스케줄러 + 푸시 잡
│       ├── config/db.js
│       ├── models/                # Airdrop / Source / PushToken / NotificationLog
│       ├── routes/
│       │   ├── airdrops.js        # 검색/카테고리 필터, by-ids
│       │   ├── push.js            # 푸시 토큰 등록/해제
│       │   ├── ai.js              # POST /api/ai/ask
│       │   └── admin.js           # /api/admin/stats, /airdrops (Bearer ADMIN_TOKEN)
│       ├── services/
│       │   ├── geminiService.js   # category/tags 포함 JSON 강제
│       │   ├── aiChatService.js   # 챗 컨텍스트 응답
│       │   ├── pushService.js     # expo-server-sdk
│       │   ├── webCollector.js / telegramCollector.js / pipelineService.js / hashUtil.js
│       ├── jobs/
│       │   ├── scheduler.js       # 1시간 크롤링
│       │   ├── notificationJob.js # 15분 주기 푸시 (95+ / D-1)
│       │   ├── crawler.js / runOnce.js / seed.js
│       ├── data/mockSamples.js
│       └── utils/                 # logger, alert, backoff, sentry
├── frontend/                      # Expo 모바일 앱
│   ├── App.tsx                    # Home / Detail / Browser / MyPage / Settings
│   ├── app.json                   # expo-notifications plugin, AdMob/Sentry/EAS extra
│   └── src/
│       ├── screens/
│       │   ├── HomeScreen.tsx     # 검색 + 카테고리 칩 + 마이/설정 진입
│       │   ├── DetailScreen.tsx   # 공유, 즐겨찾기, AskAI, 참여 완료 마킹
│       │   ├── BrowserScreen.tsx  # 인앱 WebView (404 토스트)
│       │   ├── MyPageScreen.tsx   # 즐겨찾기 / 완료 탭
│       │   └── SettingsScreen.tsx # 푸시 임계치/카테고리/마감 알림
│       ├── components/            # AirdropCard, NativeAdCard, BannerAd, CategoryChips, SearchBar, BookmarkButton, AskAI, Toast, EmptyState, TrustBadge
│       ├── hooks/                 # useAirdrops, useBookmarks, useParticipation, usePushSettings
│       ├── api/                   # client, airdrops, push, ai
│       ├── utils/                 # cache, format, sentry
│       └── theme/colors.ts
└── admin/                         # 관리자 대시보드 (Vite + React + Recharts)
    ├── package.json
    ├── index.html
    └── src/                       # main, App(로그인), Dashboard(통계 차트), api
```

---

## 빠른 시작 (Mock 모드)

### 1) MongoDB 준비
- 로컬: `mongod` 또는 `docker run -d -p 27017:27017 mongo:7`
- 또는 MongoDB Atlas 무료 티어

### 2) 백엔드

```bash
cd backend
copy .env.example .env          # macOS/Linux: cp
# .env에서 MONGO_URI 정도만 환경에 맞게 수정 (USE_MOCK=true 그대로 두면 외부 호출 없음)
# 관리자 대시보드를 쓰려면 ADMIN_TOKEN을 임의값으로 변경
npm install
npm run seed                    # 10건 시딩
npm run dev                     # http://localhost:4000
```

엔드포인트:
- `GET /health`
- `GET /api/airdrops?sort=latest&category=L2&q=zksync&page=1&limit=20`
- `GET /api/airdrops/:id`
- `POST /api/airdrops/by-ids` `{ "ids": ["..."] }`
- `POST /api/push/register` `{ "token": "ExponentPushToken[...]", "min_trust_score": 95, ... }`
- `POST /api/ai/ask` `{ "airdropId": "...", "question": "이 에어드랍 안전한가요?" }`
- `GET /api/admin/stats` (Header `Authorization: Bearer <ADMIN_TOKEN>`)

### 3) 모바일 앱

```bash
cd frontend
npm install
npm run android
```

> 안드로이드 에뮬레이터에서 호스트 PC localhost는 `10.0.2.2`. 실기기는 PC LAN IP로 `app.json` → `extra.API_BASE_URL` 수정.

### 4) 관리자 대시보드

```bash
cd admin
copy .env.example .env          # 필요시 VITE_API_BASE_URL 변경
npm install
npm run dev                     # http://localhost:5173
```

브라우저에서 `ADMIN_TOKEN` 입력 → 대시보드 진입. 30초마다 자동 갱신.

---

## 새로 추가된 기능 (2차)

| 기능 | 위치 |
| :--- | :--- |
| 푸시 알림 (95+ / D-1) | `backend/src/jobs/notificationJob.js`, `frontend/src/screens/SettingsScreen.tsx` |
| 즐겨찾기 + 참여 완료 | `frontend/src/hooks/useBookmarks.ts`, `useParticipation.ts`, `MyPageScreen.tsx` |
| 카테고리/태그 + 검색 | `Airdrop.category/tags`, `airdrops.js` `?category=&q=`, `CategoryChips.tsx`, `SearchBar.tsx` |
| 공유 (RN Share) | `DetailScreen.tsx` headerRight |
| AI 챗 ("안전한가요?") | `backend/src/routes/ai.js`, `frontend/src/components/AskAI.tsx` |
| 관리자 대시보드 | `admin/` (Recharts) |
| Sentry 모니터링 | `backend/src/utils/sentry.js`, `frontend/src/utils/sentry.ts` (DSN 미설정시 자동 비활성화) |

---

## 운영 모드 전환 체크리스트

### Gemini API 활성화
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 키 발급
2. `backend/.env`:
   ```
   USE_MOCK=false
   GEMINI_API_KEY=AIzaSy...
   ```
3. AI 챗(`/api/ai/ask`)도 같은 키 자동 사용

### 텔레그램 채널 수집
- Bot API는 채널 히스토리 조회 미지원 → 운영시 [GramJS](https://gram.js.org/) (MTProto) 어댑터로 `telegramCollector.js` 교체
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNELS=@AirdropDetective,@AirdropCryptoOfficial` 설정

### 웹 크롤링
- `WEB_SOURCES=https://airdrops.io/latest,...` (쉼표 구분)
- 사이트별 셀렉터는 `webCollector.js`에서 조정

### AdMob (안드로이드)
1. `npm install react-native-google-mobile-ads`
2. `app.json` → `plugins`에 `react-native-google-mobile-ads` 추가, `android.appId` 입력
3. 컴포넌트 교체:
   - `BannerAd.tsx` → `<BannerAd unitId={...} size={BannerAdSize.ADAPTIVE_BANNER} />`
   - `NativeAdCard.tsx` → `NativeAd.createForAdRequest(...)`
   - `DetailScreen.tsx` `handleUnlock` → `RewardedAd.createForAdRequest(...)`
4. 현재 `app.json.extra.ADMOB_*`는 Google 공식 **테스트 광고 ID**

### 푸시 알림
1. 백엔드는 즉시 동작 (Mock + 실제 Gemini 모두 연동)
2. 앱:
   - **Expo Go**에서는 알림 권한/토큰까지는 동작하지만 일부 채널 기능 제한
   - **EAS Build** 권장. `app.json.extra.EAS_PROJECT_ID`에 EAS 프로젝트 ID 입력
3. 사용자가 앱에서 `설정` → `알림 받기` 켜면 자동으로 토큰이 백엔드에 등록됨

### Sentry
- `backend/.env`: `SENTRY_DSN=https://...@sentry.io/...`
- `frontend/app.json` → `extra.SENTRY_DSN`에 DSN 입력
- DSN 비워두면 둘 다 자동으로 비활성화 (no-op)

### 관리자 토큰
- `backend/.env`의 `ADMIN_TOKEN`을 강한 랜덤 값으로 교체 (예: `openssl rand -hex 32`)
- 대시보드 로그인 시 동일 값 입력
- 운영시 `/api/admin/*`은 백엔드 앞단(Nginx 등)에서 IP allowlist 추가 권장

---

## 기획서 매핑 (구현 위치)

| 기획서 항목 | 구현 위치 |
| :--- | :--- |
| 1시간 크롤링 스케줄러 | `backend/src/jobs/scheduler.js` |
| SHA-256 중복 방지 | `services/hashUtil.js` + Airdrop `source_hash` unique |
| Gemini JSON 강제 | `geminiService.js` `responseMimeType: 'application/json'` |
| 스캠 필터링 | SYSTEM_PROMPT + mockAnalyze |
| 신뢰도 임계치 80 | `pipelineService.js` `TRUST_SCORE_THRESHOLD` |
| 홈 피드 무한스크롤 + 정렬 | `HomeScreen.tsx` + `useAirdrops.ts` |
| 상세 3줄 요약 | `description` 필드 |
| 푸시 ('초고수익' / 'D-1') | `notificationJob.js` |
| 인앱 브라우저 | `BrowserScreen.tsx` |
| DOM 변경 감지 / Rate Limit | `webCollector.js` + `utils/backoff.js` |
| Gemini 15초 타임아웃 / JSON 복구 | `geminiService.js` |
| 필수 데이터 누락 drop | `pipelineService.js` |
| 중복 충돌 upsert | E11000 → `$addToSet` |
| 오프라인 캐싱 | `utils/cache.ts` + `useAirdrops` |
| 10초 무한 로딩 방어 | `useAirdrops.ts` |
| 외부 링크 404 토스트 | `BrowserScreen.tsx` + Detail `Linking.canOpenURL` |
| 하단 배너 / 7개당 네이티브 / 95+ 보상형 | `BannerAd.tsx`, `HomeScreen` `NATIVE_AD_INTERVAL`, `DetailScreen` `REWARDED_THRESHOLD` |

---

## 알려진 제약

- 텔레그램 채널 메시지 수집: Bot API 한계 → MTProto 어댑터 필요
- 실제 AdMob SDK: EAS Build / dev-client 필수
- 푸시 알림: Expo Go에서는 일부 제한 → EAS Build 권장
