/**
 * @file lib/ai/fetchProductSearch.ts
 * @description AI 제품 검색 API 클라이언트 (순수 fetch, React 비의존)
 *
 * UI·훅은 이 함수만 호출합니다.
 * 흐름: useAiProductSearch → fetchProductSearch → POST /api/ai-search
 */

import type {
  AiProductSearchErrorResponse,
  AiProductSearchResult,
} from "@/types/aiSearch";

const AI_SEARCH_ENDPOINT = "/api/ai-search";

/**
 * 제품명으로 AI 제품 정보 검색을 요청합니다.
 * @param productName - 제품명 또는 모델명
 * @returns 제조사, 스펙, 이미지 URL
 * @throws API 오류 시 Error (message에 서버 error 필드 포함)
 */
export async function fetchProductSearch(
  productName: string,
): Promise<AiProductSearchResult> {
  const response = await fetch(AI_SEARCH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productName }),
  });

  if (!response.ok) {
    let message = "AI 검색에 실패했습니다.";
    try {
      const errorBody = (await response.json()) as AiProductSearchErrorResponse;
      if (errorBody.error) message = errorBody.error;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 유지
    }
    throw new Error(message);
  }

  return response.json() as Promise<AiProductSearchResult>;
}
