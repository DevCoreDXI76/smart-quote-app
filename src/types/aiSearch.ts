/**
 * @file types/aiSearch.ts
 * @description AI 제품 검색 API 요청·응답 타입
 *
 * Serper + LLM 검색 API 응답 타입 (UI·훅·Route 공통).
 * API의 specifications 필드는 UI의 detailedSpec(상세 스펙)에 매핑됩니다.
 */

/** AI 제품 검색 API 요청 본문 */
export interface AiProductSearchRequest {
  /** 검색할 제품명 또는 모델명 */
  productName: string;
}

/** USD→KRW 환율 적용 메타 (외산 제품 가격 환산 시) */
export interface AiCurrencyConversion {
  /** 달러 가격을 원화로 환산했는지 여부 */
  wasConvertedFromUsd: boolean;
  /** 적용된 환율 (1 USD = N KRW) */
  exchangeRateUsed: number;
  /** 환율 출처: 실시간 API 또는 예비(Fallback) */
  source: "api" | "fallback";
}

/** 조사된 원래 달러 가격 스냅샷 */
export interface AiUsdPriceSnapshot {
  min?: number;
  max?: number;
  avg?: number;
  /** UI 표시용 예: "$1,299 ~ $1,499" */
  display?: string;
}

/** 소비자 가격 트렌드 (최저·최고·평균, 원화 정수) */
export interface AiPriceTrend {
  /** 최저가 (원) */
  min: number;
  /** 최고가 (원) */
  max: number;
  /** 평균가 (원) */
  avg: number;
}

/** 가격 조사 출처 1건 */
export interface AiPriceSource {
  /** 쇼핑몰·사이트명 */
  siteName: string;
  /** 상품 페이지 URL */
  url: string;
  /** 해당 사이트 표시 가격 (원화 정수) */
  price: number;
  /** 원래 달러 가격 (USD, 환산 전) */
  originalPriceInUsd?: number;
}

/**
 * 동일 제품 라인업 내 세부 옵션별 후보 1건
 * (용량·등급·모델코드 단위로 구분)
 */
export interface AiProductCandidate {
  /** 후보 고유 ID (UI 선택 키) */
  candidateId: string;
  /** 제품 기본명 (예: iPhone 15) */
  productName: string;
  /** 제조사 공식 모델명/모델코드 (예: A3090) */
  modelName: string;
  /** 세부 옵션 (예: 128GB, Pro 256GB) */
  subOption: string;
  /** 제조사 */
  manufacturer: string;
  /** 상세 스펙·주요 기능 (폼 detailedSpec에 매핑) */
  specifications: string;
  /** AI가 추출한 주요 기능 목록 */
  majorFeatures: string[];
  /** 대표 이미지 URL */
  imageUrl: string;
  /** 제품 이미지 URL 목록 */
  imageUrls: string[];
  /** 소비자 가격 트렌드 (원화) */
  priceTrend: AiPriceTrend;
  /** 가격 조사 출처 목록 */
  priceSources: AiPriceSource[];
  /** 환율 환산 메타 (USD 출처일 때) */
  currencyConversion?: AiCurrencyConversion;
  /** 조사된 원래 달러 가격 범위 */
  originalPriceInUsd?: AiUsdPriceSnapshot;
}

/** AI 제품 검색 API 응답 (Mock / 실제 API 공통) */
export interface AiProductSearchResult {
  /** 동일 라인업 내 세부 옵션별 후보 (3~5건) */
  candidates: AiProductCandidate[];
  /** 선택/첫 후보 미러 — 제조사 */
  manufacturer: string;
  /** 선택/첫 후보 미러 — 상세 스펙 */
  specifications: string;
  /** 선택/첫 후보 미러 — 주요 기능 */
  majorFeatures: string[];
  /** 선택/첫 후보 미러 — 대표 이미지 */
  imageUrl: string;
  /** 선택/첫 후보 미러 — 이미지 목록 */
  imageUrls: string[];
  /** 선택/첫 후보 미러 — 가격 트렌드 */
  priceTrend: AiPriceTrend;
  /** 선택/첫 후보 미러 — 가격 출처 */
  priceSources: AiPriceSource[];
  /** 선택/첫 후보 미러 — 환율 메타 */
  currencyConversion?: AiCurrencyConversion;
  /** 선택/첫 후보 미러 — USD 가격 */
  originalPriceInUsd?: AiUsdPriceSnapshot;
}

/** API 오류 응답 */
export interface AiProductSearchErrorResponse {
  error: string;
}
