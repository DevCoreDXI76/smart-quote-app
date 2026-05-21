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



/**
 * priceSources React key / 중복 제거용 식별자
 */
function priceSourceDedupeKey(source: {
  siteName: string;
  url: string;
}): string {
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

const rawResultSchema = z.object({

  manufacturer: z.string(),

  specifications: z.string(),

  majorFeatures: z.array(z.string()),

  imageUrls: z.array(z.string().url()).max(TARGET_IMAGE_COUNT),

  imageUrl: z.string().optional(),

  priceTrend: priceTrendSchema,

  priceSources: z.array(priceSourceSchema),

  currencyConversion: currencyConversionSchema.optional(),

  originalPriceInUsd: usdSnapshotSchema.optional(),

});



type RawValidated = z.infer<typeof rawResultSchema>;



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

 * LLM 응답에 USD 메타가 있으면 서버에서 KRW를 재계산합니다.

 */

function applyExchangeRateNormalization(

  validated: RawValidated,

  exchange: UsdKrwExchangeRate,

): {

  priceTrend: { min: number; max: number; avg: number };

  priceSources: RawValidated["priceSources"];

  currencyConversion?: AiCurrencyConversion;

  originalPriceInUsd?: AiUsdPriceSnapshot;

} {

  const llmConversion = validated.currencyConversion;

  const usdSnapshot = validated.originalPriceInUsd;

  const wasConverted =

    llmConversion?.wasConvertedFromUsd === true || hasUsdSnapshot(usdSnapshot);



  if (!wasConverted) {

    return {

      priceTrend: normalizePriceTrend(validated.priceTrend),

      priceSources: validated.priceSources,

      currencyConversion: {

        wasConvertedFromUsd: false,

        exchangeRateUsed: exchange.rate,

        source: exchange.source,

      },

    };

  }



  const rate = exchange.rate;

  let priceTrend = validated.priceTrend;



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



  const priceSources = validated.priceSources.map((source) => {

    if (source.originalPriceInUsd != null && source.originalPriceInUsd > 0) {

      return {

        ...source,

        price: convertUsdToKrw(source.originalPriceInUsd, rate),

      };

    }

    return source;

  });



  const originalPriceInUsd: AiUsdPriceSnapshot | undefined = usdSnapshot

    ? {

        ...usdSnapshot,

        display:

          usdSnapshot.display?.trim() ||

          formatUsdRange(usdSnapshot) ||

          undefined,

      }

    : undefined;



  return {

    priceTrend: normalizePriceTrend(priceTrend),

    priceSources,

    currencyConversion: {

      wasConvertedFromUsd: true,

      exchangeRateUsed: rate,

      source: exchange.source,

    },

    originalPriceInUsd,

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



  const validated = rawResultSchema.parse(parsed);

  const imageUrls = validated.imageUrls.slice(0, TARGET_IMAGE_COUNT);

  const imageUrl = imageUrls[0] ?? validated.imageUrl ?? "";

  // #region agent log
  {
    const keys = validated.priceSources.map(
      (s) => `${s.siteName}-${s.url}`,
    );
    const duplicateKeys = keys.filter((k, i) => keys.indexOf(k) !== i);
    fetch("http://127.0.0.1:7550/ingest/f16fd58e-aa65-43e7-aa59-0ca343cd20e0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b0a6db",
      },
      body: JSON.stringify({
        sessionId: "b0a6db",
        hypothesisId: "A",
        location: "validateProductSearchResult.ts:llm-raw",
        message: "priceSources keys after LLM parse",
        data: {
          count: validated.priceSources.length,
          duplicateKeys: [...new Set(duplicateKeys)],
          keys,
        },
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }).catch(() => {});
  }
  // #endregion

  const normalized = applyExchangeRateNormalization(validated, exchange);

  // #region agent log
  {
    const keys = normalized.priceSources.map((s) => `${s.siteName}-${s.url}`);
    const duplicateKeys = keys.filter((k, i) => keys.indexOf(k) !== i);
    fetch("http://127.0.0.1:7550/ingest/f16fd58e-aa65-43e7-aa59-0ca343cd20e0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b0a6db",
      },
      body: JSON.stringify({
        sessionId: "b0a6db",
        hypothesisId: "B",
        location: "validateProductSearchResult.ts:after-normalize",
        message: "priceSources keys after exchange normalize",
        data: {
          count: normalized.priceSources.length,
          duplicateKeys: [...new Set(duplicateKeys)],
          keys,
        },
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }).catch(() => {});
  }
  // #endregion

  const priceSources = deduplicatePriceSources(normalized.priceSources);

  // #region agent log
  {
    const keys = priceSources.map((s) => `${s.siteName}-${s.url}`);
    const duplicateKeys = keys.filter((k, i) => keys.indexOf(k) !== i);
    fetch("http://127.0.0.1:7550/ingest/f16fd58e-aa65-43e7-aa59-0ca343cd20e0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b0a6db",
      },
      body: JSON.stringify({
        sessionId: "b0a6db",
        hypothesisId: "fix",
        location: "validateProductSearchResult.ts:after-dedupe",
        message: "priceSources after deduplication",
        data: {
          beforeCount: normalized.priceSources.length,
          afterCount: priceSources.length,
          duplicateKeys: [...new Set(duplicateKeys)],
          keys,
        },
        timestamp: Date.now(),
        runId: "post-fix",
      }),
    }).catch(() => {});
  }
  // #endregion

  return {

    manufacturer: validated.manufacturer.trim(),

    specifications: validated.specifications.trim(),

    majorFeatures: validated.majorFeatures.map((f) => f.trim()).filter(Boolean),

    imageUrls,

    imageUrl,

    priceTrend: normalized.priceTrend,

    priceSources,

    currencyConversion: normalized.currencyConversion,

    originalPriceInUsd: normalized.originalPriceInUsd,

  };

}

