/**
 * @file lib/llmService.ts
 * @description LLM(OpenAI / Anthropic)을 이용한 제품 검색 결과 정제
 *
 * 흐름: SearchBundle → refineProductSearch → AiProductSearchResult
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import type { AiSearchEnvStatus } from "@/lib/ai/env";
import {
  buildProductSearchSystemPrompt,
  buildProductSearchUserPrompt,
} from "@/lib/ai/productSearchPrompt";
import { parseAndValidateProductSearchResult } from "@/lib/ai/validateProductSearchResult";
import type { UsdKrwExchangeRate } from "@/lib/currency/fetchUsdToKrwRate";
import type { SearchBundle } from "@/lib/searchService";
import type { AiProductSearchResult } from "@/types/aiSearch";

/**
 * OpenAI Chat Completions로 JSON 생성
 */
async function refineWithOpenAI(
  bundle: SearchBundle,
  env: AiSearchEnvStatus,
  exchange: UsdKrwExchangeRate,
  signal?: AbortSignal,
): Promise<string> {
  const client = new OpenAI({ apiKey: env.llmApiKey });

  const completion = await client.chat.completions.create(
    {
      model: env.llmModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildProductSearchSystemPrompt() },
        {
          role: "user",
          content: buildProductSearchUserPrompt(bundle, exchange),
        },
      ],
      temperature: 0.2,
    },
    { signal },
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 응답이 비어 있습니다.");
  }
  return content;
}

/**
 * Anthropic Messages API로 JSON 생성
 */
async function refineWithAnthropic(
  bundle: SearchBundle,
  env: AiSearchEnvStatus,
  exchange: UsdKrwExchangeRate,
  signal?: AbortSignal,
): Promise<string> {
  const client = new Anthropic({ apiKey: env.llmApiKey });

  const message = await client.messages.create(
    {
      model: env.llmModel,
      max_tokens: 4096,
      system: buildProductSearchSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildProductSearchUserPrompt(bundle, exchange),
        },
      ],
      temperature: 0.2,
    },
    { signal },
  );

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Anthropic 응답 형식이 올바르지 않습니다.");
  }
  return block.text;
}

/**
 * 검색 원시 데이터를 LLM으로 정제해 AiProductSearchResult를 반환합니다.
 * @param bundle - Serper 검색 결과
 * @param env - API 키·모델·provider
 * @param exchange - USD→KRW 환율 (LLM·후처리에 사용)
 * @param signal - AbortSignal
 */
export async function refineProductSearch(
  bundle: SearchBundle,
  env: AiSearchEnvStatus,
  exchange: UsdKrwExchangeRate,
  signal?: AbortSignal,
): Promise<AiProductSearchResult> {
  const rawText =
    env.provider === "anthropic"
      ? await refineWithAnthropic(bundle, env, exchange, signal)
      : await refineWithOpenAI(bundle, env, exchange, signal);

  return parseAndValidateProductSearchResult(rawText, exchange);
}
