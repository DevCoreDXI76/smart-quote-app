/**
 * @file components/quote/QuoteItemList.tsx
 * @description 추가된 견적 품목 목록 표시
 */

"use client";

import Image from "next/image";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { formatKRW } from "@/lib/format/currency";
import type { QuoteItem } from "@/types";

export interface QuoteItemListProps {
  items: QuoteItem[];
  /** 품목별 금액 (items와 동일 순서) */
  lineTotals: number[];
  /** 품목 삭제 */
  onRemove: (id: string) => void;
}

/**
 * 견적 품목 목록
 */
export function QuoteItemList({ items, lineTotals, onRemove }: QuoteItemListProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-600 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          품목을 추가해 주세요.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        품목 목록 ({items.length})
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {item.imageUrl ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {item.imageUrls.length > 1 ? (
                  <span className="absolute bottom-0 right-0 rounded-tl bg-zinc-900/80 px-1 text-[10px] text-white">
                    +{item.imageUrls.length - 1}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800">
                No img
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {item.productName}
              </p>
              {item.manufacturer ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {item.manufacturer}
                </p>
              ) : null}
              {item.modelName ? (
                <Badge asSpan variant="outline" className="mt-1 text-[10px]">
                  모델명: {item.modelName}
                </Badge>
              ) : null}
              {item.majorFeatures.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.majorFeatures.slice(0, 3).map((f) => (
                    <Badge key={f} asSpan variant="default" className="text-[10px]">
                      {f}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {item.detailedSpec ? (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {item.detailedSpec}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {formatKRW(item.unitPrice)} × {item.quantity}
              </p>
            </div>

            <div className="flex flex-col items-end justify-between gap-2">
              <p className="whitespace-nowrap text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {formatKRW(lineTotals[index] ?? 0)}
              </p>
              <Button
                type="button"
                variant="danger"
                className="h-8 px-3 text-xs"
                onClick={() => onRemove(item.id)}
              >
                삭제
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
