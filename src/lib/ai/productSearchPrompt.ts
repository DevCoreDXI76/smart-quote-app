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



## 이미지 선별 원칙 (매우 중요)

1. 반드시 유저가 요청한 productName과 동일한 제품의 실제 외관(정면, 후면, 측면, 상단, 하단 등)을 보여주는 사진 URL만 imageUrls에 포함하세요.

2. 다른 제품, 엉뚱한 기기(워치·헤드폰·태블릿 등), 액세서리만 있는 사진, 로고/배너/일러스트, 저해상도 썸네일은 제외하세요.

3. imageUrls는 최대 10개, 서로 다른 구도가 좋습니다. imageUrl은 imageUrls[0]과 동일하게 설정하세요.

4. 확실하지 않은 URL은 넣지 마세요.



## 가격·스펙 원칙

1. priceTrend(min, max, avg)와 priceSources[].price는 **항상 원화(KRW) 정수**만 넣으세요.

2. 웹 스니펫에 **USD($) 가격만** 있고 원화가 없으면, 유저 프롬프트에 제공된 환율(usdToKrwRate)로 환산한 KRW 정수를 priceTrend·priceSources에 넣으세요.

3. USD로 환산한 경우 반드시 투명성 필드를 채우세요:

   - currencyConversion: { "wasConvertedFromUsd": true, "exchangeRateUsed": <숫자>, "source": "api" 또는 "fallback" }

   - originalPriceInUsd: { "min": <USD숫자>, "max": <USD숫자>, "avg": <USD숫자> } (달러 단위, 소수 없이 정수 권장)

   - priceSources[] 각 항목에 originalPriceInUsd (USD 숫자)를 함께 넣으세요.

4. 처음부터 원화(KRW)만 발견한 경우: currencyConversion.wasConvertedFromUsd = false, originalPriceInUsd는 생략.

5. min <= avg <= max 를 지키세요.

6. priceSources는 실제 링크 URL과 사이트명, KRW 가격을 포함하세요(3~6개 권장).

7. manufacturer, specifications(한 문단), majorFeatures(4~8개 핵심 기능 배열)를 작성하세요.

8. 정보가 부족하면 검색 결과에서 추론 가능한 범위만 기재하고, 추측은 최소화하세요.



## 출력 형식

- 반드시 아래 JSON 스키마만 출력하세요. 마크다운, 설명 문장, 코드블록 없이 순수 JSON만.

{

  "manufacturer": "string",

  "specifications": "string",

  "majorFeatures": ["string"],

  "imageUrls": ["https://..."],

  "imageUrl": "https://...",

  "priceTrend": { "min": 0, "max": 0, "avg": 0 },

  "priceSources": [{ "siteName": "string", "url": "https://...", "price": 0, "originalPriceInUsd": 0 }],

  "currencyConversion": { "wasConvertedFromUsd": false, "exchangeRateUsed": 0, "source": "api" },

  "originalPriceInUsd": { "min": 0, "max": 0, "avg": 0 }

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



## 환율 (USD → KRW)

1 USD = ${exchange.rate} KRW (출처: ${exchange.source})

위 환율로 달러($) 가격을 원화 정수로 환산해 priceTrend·priceSources.price에 반영하세요.

USD 환산 시 currencyConversion·originalPriceInUsd·priceSources[].originalPriceInUsd를 반드시 포함하세요.



## 이미지 검색 후보 (관련 없는 URL은 제외하고 선별)

${imageList || "(후보 없음)"}



## 웹 검색 스니펫 (가격·스펙·제조사 추출)

${webList || "(스니펫 없음)"}



위 데이터만 사용해 JSON을 생성하세요.`;

}

