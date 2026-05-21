/**
 * @file lib/currency/constants.ts
 * @description USD→KRW 환율 관련 상수
 */

/** 환율 API 실패 시 기본 환율 (1 USD = N KRW) */
export const DEFAULT_USD_KRW_FALLBACK_RATE = 1400;

/** in-memory 환율 캐시 TTL (1시간) */
export const EXCHANGE_RATE_CACHE_TTL_MS = 3_600_000;

/** open.er-api.com USD 기준 최신 환율 엔드포인트 */
export const USD_KRW_API_URL =
  "https://open.er-api.com/v6/latest/USD";

/** 환율 API 단독 타임아웃 (ms) */
export const EXCHANGE_RATE_FETCH_TIMEOUT_MS = 5_000;
