/**
 * @file lib/quote/mapCandidateToQuoteDraft.ts
 * @description AI 후보 → 견적 품목 draft 필드 매핑
 */

import type { AiProductCandidate } from "@/types/aiSearch";
import type { QuoteItem } from "@/types";

/**
 * 선택한 AI 후보를 견적 품목 draft 필드로 변환합니다.
 */
export function mapCandidateToQuoteDraft(
  candidate: AiProductCandidate,
): Pick<
  QuoteItem,
  | "productName"
  | "modelName"
  | "manufacturer"
  | "detailedSpec"
  | "majorFeatures"
> {
  const optionSuffix = candidate.subOption.trim()
    ? ` (${candidate.subOption.trim()})`
    : "";

  return {
    productName: `${candidate.productName.trim()}${optionSuffix}`,
    modelName: candidate.modelName.trim(),
    manufacturer: candidate.manufacturer.trim(),
    detailedSpec: candidate.specifications.trim(),
    majorFeatures: [...candidate.majorFeatures],
  };
}
