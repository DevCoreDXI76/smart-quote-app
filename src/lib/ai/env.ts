/**
 * @file lib/ai/env.ts
 * @description AI 검색 API 환경 변수 읽기·검증
 */

export type AiProvider = "openai" | "anthropic";

/**
 * AI_PROVIDER 값을 정규화합니다.
 */
export function getAiProvider(): AiProvider {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (raw === "anthropic") return "anthropic";
  return "openai";
}

export interface AiSearchEnvStatus {
  serperApiKey: string;
  provider: AiProvider;
  llmApiKey: string;
  llmModel: string;
  timeoutMs: number;
}

/**
 * Serper + 선택된 LLM 키가 모두 설정되었는지 확인합니다.
 * @throws Error 키가 없으면 한글 메시지와 함께 throw (Route에서 503 변환)
 */
export function assertAiSearchEnv(): AiSearchEnvStatus {
  const serperApiKey = process.env.SERPER_API_KEY?.trim() ?? "";
  if (!serperApiKey) {
    throw new Error(
      "SERPER_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해 주세요.",
    );
  }

  const provider = getAiProvider();
  let llmApiKey = "";
  let llmModel = "";

  if (provider === "anthropic") {
    llmApiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
    llmModel =
      process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-20241022";
    if (!llmApiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY가 설정되지 않았습니다. AI_PROVIDER=anthropic 일 때 필수입니다.",
      );
    }
  } else {
    llmApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
    llmModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    if (!llmApiKey) {
      throw new Error(
        "OPENAI_API_KEY가 설정되지 않았습니다. AI_PROVIDER=openai 일 때 필수입니다.",
      );
    }
    if (!llmApiKey.startsWith("sk-")) {
      throw new Error(
        "OPENAI_API_KEY 형식이 올바르지 않습니다(OpenAI 키는 sk-로 시작). " +
          "Windows·macOS 시스템/사용자 환경 변수에 등록된 OPENAI_API_KEY가 .env.local보다 우선 적용됩니다. " +
          "시스템 환경 변수의 OPENAI_API_KEY를 삭제하거나 올바른 OpenAI 키로 바꾼 뒤, 터미널과 npm run dev를 다시 시작해 주세요.",
      );
    }
  }

  /** 후보 3~5건 JSON 생성은 25초보다 오래 걸릴 수 있어 기본 90초 */
  const timeoutMs = Number(process.env.AI_SEARCH_TIMEOUT_MS) || 90_000;

  return {
    serperApiKey,
    provider,
    llmApiKey,
    llmModel,
    timeoutMs,
  };
}
