/**
 * @file lib/currency/fetchUsdToKrwRate.ts
 * @description USD→KRW 실시간 환율 조회 (open.er-api.com) 및 Fallback
 */

import {
  DEFAULT_USD_KRW_FALLBACK_RATE,
  EXCHANGE_RATE_CACHE_TTL_MS,
  EXCHANGE_RATE_FETCH_TIMEOUT_MS,
  USD_KRW_API_URL,
} from "@/lib/currency/constants";

export type ExchangeRateSource = "api" | "fallback";

/** USD→KRW 환율 조회 결과 */
export interface UsdKrwExchangeRate {
  /** 1 USD당 KRW (정수 반올림) */
  rate: number;
  source: ExchangeRateSource;
  /** ISO 8601 조회 시각 */
  fetchedAt: string;
}

interface ErApiResponse {
  result?: string;
  rates?: { KRW?: number };
}

let cachedRate: UsdKrwExchangeRate | null = null;
let cachedAt = 0;

function getFallbackRate(): number {
  const env = process.env.USD_KRW_FALLBACK_RATE?.trim();
  const parsed = env ? Number(env) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed);
  }
  return DEFAULT_USD_KRW_FALLBACK_RATE;
}

function buildFallback(): UsdKrwExchangeRate {
  return {
    rate: getFallbackRate(),
    source: "fallback",
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * open.er-api.com에서 USD→KRW 환율을 가져옵니다.
 * 실패 시 환경 변수·기본 Fallback을 사용합니다.
 */
export async function fetchUsdToKrwRate(
  signal?: AbortSignal,
): Promise<UsdKrwExchangeRate> {
  const now = Date.now();
  if (cachedRate && now - cachedAt < EXCHANGE_RATE_CACHE_TTL_MS) {
    return cachedRate;
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    EXCHANGE_RATE_FETCH_TIMEOUT_MS,
  );

  const onAbort = () => timeoutController.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(USD_KRW_API_URL, {
      signal: timeoutController.signal,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return buildFallback();
    }

    const data = (await response.json()) as ErApiResponse;
    const krw = data.rates?.KRW;

    if (
      data.result !== "success" ||
      krw == null ||
      !Number.isFinite(krw) ||
      krw <= 0
    ) {
      return buildFallback();
    }

    const result: UsdKrwExchangeRate = {
      rate: Math.round(krw),
      source: "api",
      fetchedAt: new Date().toISOString(),
    };

    cachedRate = result;
    cachedAt = now;
    return result;
  } catch {
    return buildFallback();
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}
