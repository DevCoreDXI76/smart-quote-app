/**
 * @file components/quote/QuoteTotalsSummary.tsx
 * @description 공급가액·부가세·총 합계 표시 (useQuoteCalculations 연동)
 */

"use client";

import { useQuoteCalculations } from "@/hooks/useQuoteCalculations";
import { formatKRW } from "@/lib/format/currency";
import type { QuoteItem } from "@/types";

export interface QuoteTotalsSummaryProps {
  items: QuoteItem[];
}

interface SummaryRowProps {
  label: string;
  value: number;
  emphasized?: boolean;
}

function SummaryRow({ label, value, emphasized }: SummaryRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${emphasized ? "border-t border-zinc-200 pt-3 dark:border-zinc-600" : ""}`}
    >
      <span
        className={
          emphasized
            ? "text-base font-semibold text-zinc-900 dark:text-zinc-50"
            : "text-sm text-zinc-600 dark:text-zinc-400"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasized
            ? "text-lg font-bold text-zinc-900 dark:text-zinc-50"
            : "text-sm font-medium text-zinc-900 dark:text-zinc-100"
        }
      >
        {formatKRW(value)}
      </span>
    </div>
  );
}

/**
 * 견적 합계 요약 카드
 */
export function QuoteTotalsSummary({ items }: QuoteTotalsSummaryProps) {
  const { supplyAmount, vatAmount, totalAmount } = useQuoteCalculations(items);

  return (
    <section
      className="sticky bottom-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-700 dark:bg-zinc-900"
      aria-label="견적 합계"
    >
      <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        합계
      </h2>
      <SummaryRow label="공급가액" value={supplyAmount} />
      <SummaryRow label="부가세 (10%)" value={vatAmount} />
      <SummaryRow label="총 합계금액" value={totalAmount} emphasized />
    </section>
  );
}
