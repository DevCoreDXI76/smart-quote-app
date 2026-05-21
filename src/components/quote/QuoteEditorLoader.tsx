/**
 * @file components/quote/QuoteEditorLoader.tsx
 * @description useSearchParams Suspense 경계용 래퍼
 */

"use client";

import { Suspense } from "react";

import { QuoteEditor } from "./QuoteEditor";

export function QuoteEditorLoader() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-zinc-500">견적 편집기 로딩 중...</p>
      }
    >
      <QuoteEditor />
    </Suspense>
  );
}
