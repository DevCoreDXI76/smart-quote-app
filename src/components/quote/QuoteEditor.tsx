/**
 * @file components/quote/QuoteEditor.tsx
 * @description 견적서 작성 화면 컨테이너 (폼·목록·합계 조합)
 */

"use client";

import { useQuoteCalculations } from "@/hooks/useQuoteCalculations";
import { useQuoteItems } from "@/hooks/useQuoteItems";

import { DocumentExportBar } from "@/components/document/DocumentExportBar";

import { QuoteItemForm } from "./QuoteItemForm";
import { QuoteItemList } from "./QuoteItemList";
import { QuoteTotalsSummary } from "./QuoteTotalsSummary";

/**
 * 견적 품목 입력·목록·합계를 한 화면에 제공합니다.
 */
export function QuoteEditor() {
  const { items, addItem, removeItem } = useQuoteItems();
  const totals = useQuoteCalculations(items);
  const { lineTotals } = totals;

  return (
    <div className="flex flex-col gap-8">
      <QuoteItemForm onAdd={addItem} />
      <QuoteItemList items={items} lineTotals={lineTotals} onRemove={removeItem} />
      <QuoteTotalsSummary items={items} />
      <DocumentExportBar items={items} totals={totals} />
    </div>
  );
}
