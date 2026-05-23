/**
 * @file lib/ai/validateProductSearchResult.ts
 * @description LLM JSON 응답 검증·정규화 (zod) 및 USD→KRW 환산 후처리
 */

import { z } from "zod";

import { TARGET_IMAGE_COUNT } from "@/lib/ai/constants";
import {
  convertUsdToKrw,
  convertUsdTrendToKrw,
  formatUsdRange,
} from "@/lib/currency/convertUsdPrices";
import type { UsdKrwExchangeRate } from "@/lib/currency/fetchUsdToKrwRate";
import type {
  AiCurrencyConversion,
  AiPriceSource,
  AiProductCandidate,
  AiProductSearchResult,
  AiUsdPriceSnapshot,
} from "@/types/aiSearch";

const priceTrendSchema = z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
  avg: z.number().int().nonnegative(),
});

const usdSnapshotSchema = z.object({
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
  avg: z.number().nonnegative().optional(),
  display: z.string().optional(),
});

const currencyConversionSchema = z.object({
  wasConvertedFromUsd: z.boolean(),
  exchangeRateUsed: z.number().positive(),
  source: z.enum(["api", "fallback"]).optional(),
});

const priceSourceSchema = z.object({
  siteName: z.string().min(1),
  url: z.string().url(),
  price: z.number().int().nonnegative(),
  originalPriceInUsd: z.number().nonnegative().optional(),
});

const candidateSchema = z.object({
  candidateId: z.string().min(1).optional(),
  productName: z.string().min(1),
  modelName: z.string().min(1),
  subOption: z.string().min(1),
  manufacturer: z.string().min(1),
  specifications: z.string(),
  majorFeatures: z.array(z.string()),
  imageUrls: z.array(z.string().url()).max(TARGET_IMAGE_COUNT),
  imageUrl: z.string().optional(),
  priceTrend: priceTrendSchema,
  priceSources: z.array(priceSourceSchema),
  currencyConversion: currencyConversionSchema.optional(),
  originalPriceInUsd: usdSnapshotSchema.optional(),
});

const rawResultSchema = z.object({
  candidates: z.array(candidateSchema).min(3).max(5),
});

type RawCandidate = z.infer<typeof candidateSchema>;

/**
 * priceSources React key / 중복 제거용 식별자
 */
function priceSourceDedupeKey(source: { siteName: string; url: string }): string {
  const url = source.url.trim().replace(/\/$/, "");
  return `${source.siteName.trim()}-${url}`;
}

/**
 * LLM이 반환한 동일 출처(siteName+url) 중복을 제거합니다 (첫 항목 유지).
 */
function deduplicatePriceSources(sources: AiPriceSource[]): AiPriceSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = priceSourceDedupeKey(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 가격 트렌드 min <= avg <= max 보정
 */
function normalizePriceTrend(trend: {
  min: number;
  max: number;
  avg: number;
}): { min: number; max: number; avg: number } {
  const prices = [trend.min, trend.max, trend.avg].filter((p) => p > 0);
  if (prices.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }
  const min = Math.min(...prices, trend.min);
  const max = Math.max(...prices, trend.max);
  let avg = trend.avg;
  if (avg < min) avg = min;
  if (avg > max) avg = max;
  if (avg === 0) avg = Math.round((min + max) / 2);
  return { min, max, avg };
}

function hasUsdSnapshot(snapshot?: AiUsdPriceSnapshot): boolean {
  if (!snapshot) return false;
  return (
    (snapshot.min != null && snapshot.min > 0) ||
    (snapshot.max != null && snapshot.max > 0) ||
    (snapshot.avg != null && snapshot.avg > 0)
  );
}

/**
 * 후보 1건에 USD→KRW 환산 후처리를 적용합니다.
 */
function normalizeCandidate(
  raw: RawCandidate,
  index: number,
  exchange: UsdKrwExchangeRate,
): AiProductCandidate {
  const llmConversion = raw.currencyConversion;
  const usdSnapshot = raw.originalPriceInUsd;
  const wasConverted =
    llmConversion?.wasConvertedFromUsd === true || hasUsdSnapshot(usdSnapshot);

  let priceTrend = raw.priceTrend;
  let priceSources = raw.priceSources;
  let currencyConversion: AiCurrencyConversion | undefined;
  let originalPriceInUsd: AiUsdPriceSnapshot | undefined;

  if (!wasConverted) {
    priceTrend = normalizePriceTrend(raw.priceTrend);
    priceSources = raw.priceSources;
    currencyConversion = {
      wasConvertedFromUsd: false,
      exchangeRateUsed: exchange.rate,
      source: exchange.source,
    };
  } else {
    const rate = exchange.rate;
    if (hasUsdSnapshot(usdSnapshot)) {
      priceTrend = convertUsdTrendToKrw(
        {
          min: usdSnapshot?.min,
          max: usdSnapshot?.max,
          avg: usdSnapshot?.avg,
        },
        rate,
      );
    }
    priceSources = raw.priceSources.map((source) => {
      if (source.originalPriceInUsd != null && source.originalPriceInUsd > 0) {
        return {
          ...source,
          price: convertUsdToKrw(source.originalPriceInUsd, rate),
        };
      }
      return source;
    });
    originalPriceInUsd = usdSnapshot
      ? {
          ...usdSnapshot,
          display:
            usdSnapshot.display?.trim() ||
            formatUsdRange(usdSnapshot) ||
            undefined,
        }
      : undefined;
    priceTrend = normalizePriceTrend(priceTrend);
    currencyConversion = {
      wasConvertedFromUsd: true,
      exchangeRateUsed: rate,
      source: exchange.source,
    };
  }

  const imageUrls = raw.imageUrls.slice(0, TARGET_IMAGE_COUNT);
  const imageUrl = imageUrls[0] ?? raw.imageUrl ?? "";

  return {
    candidateId: raw.candidateId?.trim() || `cand-${index + 1}`,
    productName: raw.productName.trim(),
    modelName: raw.modelName.trim(),
    subOption: raw.subOption.trim(),
    manufacturer: raw.manufacturer.trim(),
    specifications: raw.specifications.trim(),
    majorFeatures: raw.majorFeatures.map((f) => f.trim()).filter(Boolean),
    imageUrls,
    imageUrl,
    priceTrend,
    priceSources: deduplicatePriceSources(priceSources),
    currencyConversion,
    originalPriceInUsd,
  };
}

/**
 * 첫 후보 필드를 AiProductSearchResult 미러 필드로 복사합니다.
 */
function mirrorFromCandidate(
  candidate: AiProductCandidate,
): Omit<AiProductSearchResult, "candidates"> {
  return {
    manufacturer: candidate.manufacturer,
    specifications: candidate.specifications,
    majorFeatures: candidate.majorFeatures,
    imageUrl: candidate.imageUrl,
    imageUrls: candidate.imageUrls,
    priceTrend: candidate.priceTrend,
    priceSources: candidate.priceSources,
    currencyConversion: candidate.currencyConversion,
    originalPriceInUsd: candidate.originalPriceInUsd,
  };
}

/**
 * LLM이 반환한 문자열(JSON)을 파싱·검증합니다.
 * @param rawText - LLM 응답 본문
 * @param exchange - 적용할 USD→KRW 환율
 */
export function parseAndValidateProductSearchResult(
  rawText: string,
  exchange: UsdKrwExchangeRate,
): AiProductSearchResult {
  let jsonText = rawText.trim();

  const codeBlock = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    jsonText = codeBlock[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("LLM 응답 JSON 파싱에 실패했습니다.");
  }

  let validated: z.infer<typeof rawResultSchema>;
  try {
    validated = rawResultSchema.parse(parsed);
  } catch (zodErr) {
    if (zodErr instanceof z.ZodError) {
      const needsCandidates = zodErr.issues.some((i) =>
        i.path.join(".").startsWith("candidates"),
      );
      throw new Error(
        needsCandidates
          ? "AI가 후보 3~5건 형식으로 응답하지 못했습니다. 검색어를 조금 더 구체적으로 입력한 뒤 다시 시도해 주세요."
          : "AI 응답 데이터 검증에 실패했습니다. 다시 검색해 주세요.",
      );
    }
    throw zodErr;
  }
  const candidates = validated.candidates.map((raw, index) =>
    normalizeCandidate(raw, index, exchange),
  );

  return {
    candidates,
    ...mirrorFromCandidate(candidates[0]),
  };
}

/**
 * 선택된 후보 기준으로 AiProductSearchResult 미러 필드를 갱신합니다.
 */
export function mirrorSearchResultFromCandidate(
  result: AiProductSearchResult,
  candidate: AiProductCandidate,
): AiProductSearchResult {
  return {
    candidates: result.candidates,
    ...mirrorFromCandidate(candidate),
  };
}
