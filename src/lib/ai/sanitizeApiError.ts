/**
 * @file lib/ai/sanitizeApiError.ts
 * @description 외부 API 오류 메시지를 사용자용 한글로 정리 (키 노출 방지)
 */

/**
 * OpenAI·Anthropic·Serper 오류를 화면에 안전하게 표시할 메시지로 변환합니다.
 */
export function sanitizeApiErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) {
    return "AI 검색 중 오류가 발생했습니다.";
  }

  const raw = err.message;

  if (
    raw.includes("401") &&
    (raw.includes("Incorrect API key") ||
      raw.includes("invalid_api_key") ||
      raw.includes("authentication"))
  ) {
    return (
      "OpenAI API 인증에 실패했습니다. .env.local에 sk- 키가 있어도, " +
      "Windows·macOS 시스템 환경 변수의 OPENAI_API_KEY가 우선 적용될 수 있습니다. " +
      "시스템 환경 변수를 확인·삭제한 뒤 터미널과 개발 서버를 재시작해 주세요."
    );
  }

  if (raw.includes("429") || raw.toLowerCase().includes("rate limit")) {
    return "API 호출 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (/aborted/i.test(raw)) {
    return "검색 요청이 중단되었습니다. 시간이 부족하면 AI_SEARCH_TIMEOUT_MS 값을 늘린 뒤 서버를 재시작해 주세요.";
  }

  if (raw.includes("ZodError") || raw.includes("candidates")) {
    return "AI 응답 형식이 올바르지 않습니다. 다시 검색해 주세요.";
  }

  if (raw.includes("Serper") || raw.toLowerCase().includes("serper")) {
    return `검색 API(Serper) 오류: SERPER_API_KEY를 확인해 주세요.`;
  }

  return raw
    .replace(/\bsk-[a-zA-Z0-9_-]{8,}\b/g, "sk-***")
    .replace(/\bAIza[a-zA-Z0-9_-]{8,}\b/gi, "***");
}
