/**
 * @file components/quote/AiProductFields.tsx
 * @description AI로 채워지는 제조사·모델명·스펙·대표 이미지 URL 필드
 */

"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import type { QuoteItem } from "@/types";

export interface AiProductFieldsProps {
  draft: Pick<
    QuoteItem,
    "manufacturer" | "modelName" | "detailedSpec" | "imageUrl"
  >;
  isLoading: boolean;
  isEditable: boolean;
  hasAiFilledData: boolean;
  onToggleEditable: () => void;
  onFieldChange: <
    K extends "manufacturer" | "modelName" | "detailedSpec" | "imageUrl",
  >(
    key: K,
    value: QuoteItem[K],
  ) => void;
  /** 그리드에서 선택한 이미지 개수 (안내용) */
  selectedImageCount?: number;
}

/**
 * AI 자동완성 대상 필드 (제조사, 모델명, 상세 스펙, 대표 이미지 URL)
 */
export function AiProductFields({
  draft,
  isLoading,
  isEditable,
  hasAiFilledData,
  onToggleEditable,
  onFieldChange,
  selectedImageCount = 0,
}: AiProductFieldsProps) {
  const isLocked = !isEditable;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isLoading
            ? "AI가 제조사·모델명·스펙·이미지를 검색하고 있습니다..."
            : hasAiFilledData
              ? `AI로 채워진 정보입니다. 이미지 ${selectedImageCount}장 선택됨. 필요 시 수동 수정하세요.`
              : "제품명 입력 후 [AI 검색 및 스펙 완성]을 눌러 주세요."}
        </p>
        {hasAiFilledData ? (
          <Button
            type="button"
            variant="secondary"
            className="h-8 shrink-0 px-3 text-xs"
            onClick={onToggleEditable}
            disabled={isLoading}
          >
            {isEditable ? "AI 자동완성 잠금" : "수동 수정"}
          </Button>
        ) : null}
      </div>

      <Input
        label="제조사"
        name="manufacturer"
        value={draft.manufacturer}
        onChange={(e) => onFieldChange("manufacturer", e.target.value)}
        placeholder={isLoading ? "검색 중..." : "AI 검색 후 자동 입력"}
        readOnly={isLocked}
        isLoading={isLoading}
      />

      <Input
        label="모델명 (공식 모델코드)"
        name="modelName"
        value={draft.modelName}
        onChange={(e) => onFieldChange("modelName", e.target.value)}
        placeholder={isLoading ? "검색 중..." : "예: A3090, MQKP3KH/A"}
        readOnly={isLocked}
        isLoading={isLoading}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="detailedSpec">상세 스펙</Label>
        <textarea
          id="detailedSpec"
          name="detailedSpec"
          rows={3}
          value={draft.detailedSpec}
          onChange={(e) => onFieldChange("detailedSpec", e.target.value)}
          placeholder={isLoading ? "검색 중..." : "AI 검색 후 자동 입력"}
          readOnly={isLocked}
          aria-busy={isLoading}
          className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-700 ${
            isLocked
              ? "cursor-not-allowed bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400"
              : ""
          } ${isLoading ? "animate-pulse" : ""}`}
        />
      </div>

      {isEditable ? (
        <Input
          label="대표 이미지 URL (수동)"
          name="imageUrl"
          type="url"
          value={draft.imageUrl}
          onChange={(e) => onFieldChange("imageUrl", e.target.value)}
          placeholder="https://..."
        />
      ) : null}
    </div>
  );
}
