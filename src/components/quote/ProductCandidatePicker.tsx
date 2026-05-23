/**
 * @file components/quote/ProductCandidatePicker.tsx
 * @description AI 검색 후 동일 라인업 내 세부 옵션 후보 카드 선택 UI
 */

"use client";

import { Badge } from "@/components/common/Badge";
import { formatKRW } from "@/lib/format/currency";
import type { AiProductCandidate } from "@/types/aiSearch";

export interface ProductCandidatePickerProps {
  candidates: AiProductCandidate[];
  selectedId: string | null;
  onSelect: (candidate: AiProductCandidate) => void;
  disabled?: boolean;
}

/**
 * 3~5개 제품 후보를 카드 그리드로 표시하고 선택합니다.
 */
export function ProductCandidatePicker({
  candidates,
  selectedId,
  onSelect,
  disabled = false,
}: ProductCandidatePickerProps) {
  if (candidates.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        세부 옵션 후보 ({candidates.length}건)
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        동일 제품 라인업 내 용량·등급별 후보입니다. 카드를 선택하면 견적 품목에
        반영됩니다.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {candidates.map((candidate) => {
          const isSelected = candidate.candidateId === selectedId;
          return (
            <li key={candidate.candidateId}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(candidate)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:ring-zinc-100"
                    : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
                }`}
              >
                <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {candidate.productName}
                </p>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge asSpan variant="primary">
                    모델명: {candidate.modelName}
                  </Badge>
                  <Badge asSpan variant="outline">
                    옵션: {candidate.subOption}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {candidate.manufacturer}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  평균 {formatKRW(candidate.priceTrend.avg)}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
