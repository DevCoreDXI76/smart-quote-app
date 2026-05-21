# Smart Quote App

제품 정보를 입력하면 AI 기반으로 스펙을 찾아 **견적서**와 **구매사양서**를 생성하는 웹 서비스입니다.  
비즈니스 로직은 UI와 분리된 모듈 구조로 설계되어, 유지보수와 기능 확장이 쉽습니다.

## 기술 스택

| 구분 | 기술 | 비고 |
|------|------|------|
| Framework | Next.js 14+ (App Router) | TypeScript 적용 |
| Styling | Tailwind CSS | 공통·도메인 컴포넌트 UI |
| Database & Auth | Supabase | 이메일 로그인, 문서·품목 저장, 공개 게시판 |
| 배포 | Vercel | 타겟 환경 |

## 로컬 실행

```bash
# 의존성 설치 (최초 1회)
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

```bash
# 프로덕션 빌드
npm run build

# 린트
npm run lint
```

## 폴더 구조

```
smart-quote-app/
├── public/                      # 정적 파일 (이미지, 아이콘 등)
├── src/
│   ├── app/                     # App Router 페이지·레이아웃
│   ├── components/
│   │   ├── common/              # 재사용 공통 UI (Button, Input 등)
│   │   ├── quote/               # 견적서 도메인 UI
│   │   └── spec/                # 구매사양서 도메인 UI
│   ├── app/api/ai-search/       # AI 제품 검색 API (Serper + LLM)
│   ├── hooks/                   # 커스텀 훅 (UI와 분리된 상태·계산·AI 검색)
│   ├── lib/                     # 순수 함수·외부 연동 (AI, Supabase 등)
│   │   ├── ai/                  # AI API 클라이언트
│   │   └── calculations/        # 금액 계산 등 비즈니스 로직
│   └── types/                   # 전역 TypeScript 타입
├── README.md
├── package.json
└── tsconfig.json
```

## 폴더 역할

| 경로 | 역할 |
|------|------|
| `src/app/` | URL 라우트, 페이지 레이아웃, 전역 스타일 진입점 |
| `src/components/common/` | 프로젝트 전역에서 재사용하는 UI 컴포넌트 |
| `src/components/quote/` | 견적서 작성·표시 전용 컴포넌트 |
| `src/components/spec/` | 구매사양서 작성·표시 전용 컴포넌트 |
| `src/hooks/` | React 커스텀 훅 — 컴포넌트에서 호출하는 계산·상태 로직 |
| `src/lib/` | 프레임워크에 의존하지 않는 순수 함수·API 클라이언트 |
| `src/lib/calculations/` | 금액·세금 등 도메인 계산 (테스트·재사용 용이) |
| `src/types/` | `QuoteItem`, `DocumentMaster` 등 공통 데이터 타입 |

## 핵심 타입 (`src/types/index.ts`)

| 타입 | 설명 | 주요 필드 |
|------|------|-----------|
| `QuoteItem` | 견적·구매사양서 품목 1행 | `id`, `productName`, `manufacturer`, `detailedSpec`, `imageUrl`, `quantity`, `unitPrice` |
| `DocumentMaster` | 문서 마스터 (견적/구매사양 공통) | `id`, `userId`, `title`, `isPublic`, `createdAt`, `items` |

## 핵심 훅·라이브러리

| 모듈 | 설명 |
|------|------|
| `useQuoteCalculations` (`src/hooks/`) | 품목 배열 → 공급가액, 부가세(10%), 총 합계 실시간 계산 (`useMemo`) |
| `useAiProductSearch` (`src/hooks/`) | 제품명 AI 검색 상태·`search()` / `reset()` — UI → 훅 → `fetchProductSearch` |
| `useAiProductSelection` (`src/hooks/`) | 이미지 최대 3장 선택·가격 선택 상태 |
| `calculateQuoteTotals` (`src/lib/calculations/quoteTotals.ts`) | 위 계산의 순수 함수 구현 (원 단위 정수, 반올림으로 오차 방지) |
| `fetchProductSearch` (`src/lib/ai/`) | `POST /api/ai-search` 호출 |

### AI 제품 검색 (Serper + LLM)

실시간 웹·이미지 검색 후 LLM이 스펙·가격·이미지 URL을 정제합니다. **Mock 데이터는 사용하지 않습니다.**

#### 환경 변수 설정

1. 프로젝트 루트에 [`.env.example`](.env.example)를 복사해 `.env.local` 생성
2. 아래 키를 입력한 뒤 **개발 서버 재시작** (`npm run dev`)

| 변수 | 필수 | 설명 |
|------|------|------|
| `SERPER_API_KEY` | O | [Serper](https://serper.dev) — 구글 이미지·웹 검색 |
| `AI_PROVIDER` | O | `openai` 또는 `anthropic` |
| `OPENAI_API_KEY` | OpenAI 사용 시 | [OpenAI API Keys](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | 선택 | 기본 `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Claude 사용 시 | [Anthropic Console](https://console.anthropic.com/) |
| `ANTHROPIC_MODEL` | 선택 | 기본 `claude-3-5-haiku-20241022` |
| `AI_SEARCH_TIMEOUT_MS` | 선택 | 기본 `25000` (ms) |
| `USD_KRW_FALLBACK_RATE` | 선택 | 환율 API 실패 시 1 USD당 KRW (기본 `1400`) |

키가 없으면 API는 **503**과 한글 안내 메시지를 반환합니다.

**`.env.local`과 시스템 환경 변수가 다를 때:** Next.js는 이미 OS에 설정된 `OPENAI_API_KEY`를 `.env.local`로 덮어쓰지 않습니다. `.env.local`에 `sk-` 키가 있는데도 Google 형식(`AIzaSy…`) 키로 인증되면, Windows **시스템 속성 → 환경 변수**에서 사용자/시스템의 `OPENAI_API_KEY`를 삭제한 뒤 터미널과 `npm run dev`를 다시 시작하세요.

#### API·UI

- **API:** `POST /api/ai-search` — Body: `{ "productName": "iPhone 15" }`
- **응답:** `majorFeatures`, `imageUrls`(최대 10), `priceTrend`, `priceSources` 등
- **UI:** 이미지 최대 3장 선택, Min/Max/Avg 클릭 시 단가 반영
- **비용:** Serper·LLM 호출마다 과금될 수 있으니 테스트 시 호출 횟수에 유의하세요.

#### 외산 제품 USD → KRW 환율 자동 변환

- Serper 검색과 병렬로 [open.er-api.com](https://open.er-api.com)에서 USD→KRW 환율 조회 (API 키 불필요)
- LLM이 달러($) 가격만 발견하면 환율로 원화 정수를 산출하고, `currencyConversion`·`originalPriceInUsd` 메타를 응답
- 서버에서 `originalPriceInUsd` 기준 KRW를 재계산해 LLM 산술 오차 보정
- UI: **「현지 달러($) 가격 조사됨 · 환율 N원/USD 적용」** 배지 및 조사 달러 가격 표시

### 문서 PDF 출력 (@react-pdf/renderer)

HTML 캡처 방식 대신 PDF 전용 렌더러인 `@react-pdf/renderer`로 **견적서/구매사양서**를 생성합니다. 글자 겹침 없이 고품질 PDF를 보장합니다.

| 모듈 | 역할 |
|------|------|
| `scripts/download-fonts.mjs` | `public/fonts`로 Noto Sans KR(OTF) 다운로드 |
| `lib/pdf/fonts.ts` | `Font.register`로 한글 폰트 등록 |
| `components/quote/PdfQuoteDocument.tsx` | 견적서 PDF 문서 |
| `components/spec/PdfPurchaseSpecDocument.tsx` | 구매사양서 PDF 문서 |
| `hooks/useReactPdfExport.ts` | `pdf().toBlob()` 생성 후 즉시 다운로드 |
| `components/document/DocumentPreviewModal.tsx` | `PDFViewer` 미리보기 + 다운로드 |
| `components/document/DocumentExportBar.tsx` | 보기·다운로드 버튼 4종 |

#### 폰트 준비

```bash
npm run download-fonts
```

**화면 사용법**

1. 품목을 1건 이상 **품목 추가**로 등록합니다.
2. 화면 하단 **문서 출력**에서 **견적서 보기** / **구매사양서 보기**로 미리보기 모달을 엽니다.
3. 모달 **PDF 다운로드** 또는 **견적서 다운로드** / **구매사양서 다운로드**로 즉시 저장합니다.
4. 파일명 예: `견적서_20260520.pdf` (A4 세로)

**참고:** 외부 이미지 URL은 CORS 정책에 따라 PDF에 빈 칸으로 나올 수 있습니다.

### 금액 계산 규칙

- 품목별 금액: `단가 × 수량` (원 단위 반올림)
- 공급가액: 품목별 금액 합계
- 부가세: `공급가액 × 10%` (원 단위 반올림)
- 총 합계: 공급가액 + 부가세

## 아키텍처 원칙

1. **모듈화** — 비즈니스 로직은 `lib/`, 상태·연동은 `hooks/`, UI는 `components/`
2. **컴포넌트 분리** — `common` / `quote` / `spec` 도메인별 디렉터리
3. **문서화** — 각 소스 파일 상단 한글 주석 + JSDoc

## 현재 구현 상태

- [x] Next.js + TypeScript + Tailwind 초기 세팅
- [x] 핵심 타입 (`QuoteItem`, `DocumentMaster`)
- [x] 견적 금액 계산 훅·라이브러리
- [x] 견적서 품목 입력·목록·합계 UI
- [x] AI 제품 검색 Mock API 및 자동완성 UI
- [x] AI 이미지 다중 선택(최대 3)·가격 비교 UI
- [x] Serper + LLM 실시간 제품 검색 API
- [x] USD→KRW 실시간 환율 적용 (외산 제품 가격 원화 환산)
- [x] 견적서·구매사양서 PDF 출력 전면 교체 (@react-pdf/renderer, 한글 폰트 포함)
- [x] Supabase DB·Auth 연동 (문서 저장, 마이페이지, 공유 게시판)

## Supabase 설정 (최초 1회)

1. [Supabase](https://supabase.com)에서 새 프로젝트를 만듭니다.
2. 대시보드 **SQL Editor** → **New query** → 루트의 [`supabase-schema.sql`](supabase-schema.sql) 파일 내용을 **전체 복사·붙여넣기** → **Run** 실행합니다.
3. **Authentication → Providers → Email** 에서 Email 로그인을 활성화합니다. (이메일 확인이 켜져 있으면 가입 후 메일 인증이 필요합니다.)
4. **Project Settings → API** 에서 **Project URL** 과 **anon public** 키를 복사합니다.
5. 프로젝트 루트 `.env.local` 에 추가합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

6. `npm run dev` 로 앱을 실행합니다.

### 화면에서 테스트하는 순서

| 단계 | URL | 확인 내용 |
|------|-----|-----------|
| 1 | `/signup` | 회원가입 후 로그인 |
| 2 | `/` | 품목 추가 → 제목·공개 여부 → **견적서 저장하기** |
| 3 | `/dashboard` | 저장 목록, **불러오기**, 2건 선택 후 **비교하기** |
| 4 | `/shared` | 공개 문서 검색·**보기** (미리보기·PDF) |
| 5 | 로그아웃 후 `/` | 저장 버튼 → 로그인 모달 표시 |

## 다음 단계 로드맵

1. **배포** — Vercel 연결 및 환경 변수(SERPER, LLM, Supabase) 설정
2. **문서 삭제** — 대시보드에서 문서 삭제 API

## 라이선스

Private project.
