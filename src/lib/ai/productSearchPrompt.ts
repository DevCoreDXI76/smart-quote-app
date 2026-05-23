/**
 * @file lib/ai/productSearchPrompt.ts
 * @description LLM 제품 검색 정제용 시스템·유저 프롬프트
 */

import type { UsdKrwExchangeRate } from "@/lib/currency/fetchUsdToKrwRate";
import type { SearchBundle } from "@/lib/searchService";

/**
 * LLM 시스템 프롬프트 — JSON만 반환하도록 지시
 */
export function buildProductSearchSystemPrompt(): string {
  return `당신은 B2B 견적·구매사양서 작성을 돕는 제품 정보 분석 전문가입니다.
사용자가 요청한 제품명에 대해, 제공된 웹 검색·이미지 검색 결과만 근거로 정확한 JSON을 생성합니다.

## 후보 리스트 원칙 (매우 중요)

1. **다른 종류의 제품을 추천하지 마세요.** 사용자 productName과 **동일 제품군·라인업** 내에서만 후보를 만드세요.
   - 예: "iphone 15" → iPhone 15 / 15 Plus / 15 Pro 등 **같은 세대·계열**의 용량·등급·옵션별 분리만 허용
   - 무관한 타 제품군(갤럭시, iPad, 액세서리 등) 금지
2. **candidates 배열에 3~5개** 후보를 반드시 포함하세요. 각 후보는 **용량·스펙 등급·세부 옵션**으로 구분합니다.
3. 각 후보의 **modelName**(제조사 공식 모델코드/모델번호)과 **subOption**(용량·색상·등급 등)은 **빈 문자열 금지**. 웹 검색 근거로 채우세요.
   - modelName 예: A3090, MQKP3KH/A, XPS9530-1234
   - subOption 예: 128GB, 256GB, Pro 512GB, M3 16GB/512GB
4. candidateId는 후보마다 고유 문자열(예: "cand-1", "cand-2")을 부여하세요.

## 이미지 선별 원칙

1. 해당 후보 제품의 실제 외관 사진 URL만 imageUrls에 포함하세요.
2. imageUrls는 후보당 최대 10개. imageUrl은 imageUrls[0]과 동일.
3. 확실하지 않은 URL은 넣지 마세요.

## 가격·스펙 원칙 (후보별)

1. 각 후보의 priceTrend·priceSources[].price는 **원화(KRW) 정수**만.
2. USD($)만 있으면 유저 프롬프트 환율로 환산하고 currencyConversion·originalPriceInUsd·priceSources[].originalPriceInUsd 포함.
3. min <= avg <= max, priceSources 3~6개 권장.
4. specifications(한 문단), majorFeatures(4~8개)를 후보별로 작성.

## 출력 형식

- 순수 JSON만 출력 (마크다운·코드블록 없음).

{
  "candidates": [
    {
      "candidateId": "cand-1",
      "productName": "iPhone 15",
      "modelName": "A3090",
      "subOption": "128GB",
      "manufacturer": "Apple",
      "specifications": "string",
      "majorFeatures": ["string"],
      "imageUrls": ["https://..."],
      "imageUrl": "https://...",
      "priceTrend": { "min": 0, "max": 0, "avg": 0 },
      "priceSources": [{ "siteName": "string", "url": "https://...", "price": 0, "originalPriceInUsd": 0 }],
      "currencyConversion": { "wasConvertedFromUsd": false, "exchangeRateUsed": 0, "source": "api" },
      "originalPriceInUsd": { "min": 0, "max": 0, "avg": 0 }
    }
  ]
}`;
}

/**
 * LLM 유저 프롬프트 — 검색 원시 데이터 및 환율 포함
 */
export function buildProductSearchUserPrompt(
  bundle: SearchBundle,
  exchange: UsdKrwExchangeRate,
): string {
  const imageList = bundle.imageCandidates
    .slice(0, 40)
    .map(
      (item, i) =>
        `${i + 1}. URL: ${item.url}\n   title: ${item.title ?? ""}\n   source: ${item.source ?? ""}`,
    )
    .join("\n");

  const webList = bundle.webSnippets
    .slice(0, 15)
    .map(
      (item, i) =>
        `${i + 1}. [${item.title}](${item.link})\n   ${item.snippet}`,
    )
    .join("\n\n");

  return `## 요청 제품

productName: "${bundle.productName}"

위 검색어와 **동일 라인업** 내에서 용량·등급·옵션별로 **candidates 3~5개**를 생성하세요.
각 후보에 웹 검색 근거의 **공식 modelName(모델코드)** 를 반드시 포함하세요.

## 환율 (USD → KRW)

1 USD = ${exchange.rate} KRW (출처: ${exchange.source})
USD 가격은 위 환율로 원화 정수 환산 후 각 후보의 priceTrend·priceSources에 반영하세요.

## 이미지 검색 후보

${imageList || "(후보 없음)"}

## 웹 검색 스니펫 (가격·스펙·모델코드 추출)

${webList || "(스니펫 없음)"}

위 데이터만 사용해 candidates JSON을 생성하세요.`;
}
