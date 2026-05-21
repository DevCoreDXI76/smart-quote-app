/**
 * @file app/api/ai-search/route.ts
 * @description AI 제품 정보 실시간 검색 API
 *
 * Serper(구글 이미지·웹) → LLM(OpenAI/Claude) 파이프라인으로
 * 제품 스펙·이미지·가격을 수집합니다. Mock 데이터는 사용하지 않습니다.
 *
 * 필요 환경 변수: SERPER_API_KEY, AI_PROVIDER, OPENAI_API_KEY 또는 ANTHROPIC_API_KEY
 */

import { NextResponse } from "next/server";

import { assertAiSearchEnv } from "@/lib/ai/env";
import { sanitizeApiErrorMessage } from "@/lib/ai/sanitizeApiError";
import { fetchUsdToKrwRate } from "@/lib/currency/fetchUsdToKrwRate";
import { refineProductSearch } from "@/lib/llmService";
import { runProductSearch } from "@/lib/searchService";
import type {
  AiProductSearchErrorResponse,
  AiProductSearchRequest,
} from "@/types/aiSearch";

/** Vercel 등 서버리스 환경에서 LLM·검색 대기 시간 확보 */
export const maxDuration = 60;

/**
 * POST /api/ai-search
 * Body: { productName: string }
 */
export async function POST(request: Request) {
  let body: AiProductSearchRequest;

  try {
    body = (await request.json()) as AiProductSearchRequest;
  } catch {
    const errorBody: AiProductSearchErrorResponse = {
      error: "요청 형식이 올바르지 않습니다.",
    };
    return NextResponse.json(errorBody, { status: 400 });
  }

  const productName = body.productName?.trim() ?? "";

  if (!productName) {
    const errorBody: AiProductSearchErrorResponse = {
      error: "제품명을 입력해 주세요.",
    };
    return NextResponse.json(errorBody, { status: 400 });
  }

  let env;
  try {
    env = assertAiSearchEnv();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "API 키 설정을 확인해 주세요.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.timeoutMs);

  try {
    const [bundle, exchange] = await Promise.all([
      runProductSearch(productName, env.serperApiKey, controller.signal),
      fetchUsdToKrwRate(controller.signal),
    ]);

    const result = await refineProductSearch(
      bundle,
      env,
      exchange,
      controller.signal,
    );

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "검색 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요." },
        { status: 504 },
      );
    }

    const message = sanitizeApiErrorMessage(err);

    const isSerper =
      message.includes("Serper") || message.toLowerCase().includes("serper");
    const isAuth =
      message.includes("API 키") || message.includes("401");
    const status = isSerper ? 502 : isAuth ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  } finally {
    clearTimeout(timeout);
  }
}
