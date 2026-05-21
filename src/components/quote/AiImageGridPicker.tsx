/**
 * @file components/quote/AiImageGridPicker.tsx
 * @description AI 검색 이미지 후보 그리드 — 최대 3장 선택
 */

"use client";

import Image from "next/image";

import { MAX_SELECTABLE_IMAGES } from "@/lib/ai/constants";

export interface AiImageGridPickerProps {
  /** AI가 반환한 후보 이미지 URL (예: 10개) */
  imageUrls: string[];
  /** 현재 선택된 URL 목록 */
  selectedUrls: string[];
  /** 이미지 클릭 시 토글, false면 3개 초과 */
  onToggle: (url: string) => boolean;
  maxSelection?: number;
  disabled?: boolean;
}

/**
 * 이미지 썸네일 그리드 + 다중 선택 UI
 */
export function AiImageGridPicker({
  imageUrls,
  selectedUrls,
  onToggle,
  maxSelection = MAX_SELECTABLE_IMAGES,
  disabled = false,
}: AiImageGridPickerProps) {
  if (imageUrls.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          제품 이미지 선택
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          선택 {selectedUrls.length} / {maxSelection}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {imageUrls.map((url, index) => {
          const isSelected = selectedUrls.includes(url);
          return (
            <li key={`${url}-${index}`}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(url)}
                className={`relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-zinc-900 ring-2 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100"
                    : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                aria-pressed={isSelected}
                aria-label={`이미지 ${index + 1} ${isSelected ? "선택됨" : "선택"}`}
              >
                <Image
                  src={url}
                  alt={`후보 이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="120px"
                />
                {isSelected ? (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        견적·사양서에 포함할 이미지를 최대 {maxSelection}장까지 선택하세요.
      </p>
    </section>
  );
}
