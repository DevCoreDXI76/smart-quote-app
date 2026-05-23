/**
 * @file components/quote/QuoteItemForm.tsx
 * @description 견적 품목 입력 폼 — 제품명 + AI 후보 선택·이미지·가격
 *
 * AI 호출: useAiProductSearch
 * 선택 상태: useAiProductSelection
 */

"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Toast } from "@/components/common/Toast";
import { useAiProductSearch } from "@/hooks/useAiProductSearch";
import { useAiProductSelection } from "@/hooks/useAiProductSelection";
import { mapCandidateToQuoteDraft } from "@/lib/quote/mapCandidateToQuoteDraft";
import { createEmptyQuoteItem } from "@/lib/quote/quoteItemFactory";
import type { AiProductCandidate } from "@/types/aiSearch";
import type { QuoteItem } from "@/types";

import { AiImageGridPicker } from "./AiImageGridPicker";
import { AiPriceAnalysisPanel } from "./AiPriceAnalysisPanel";
import { AiProductFields } from "./AiProductFields";
import { MajorFeaturesList } from "./MajorFeaturesList";
import { ProductCandidatePicker } from "./ProductCandidatePicker";

export interface QuoteItemFormProps {
  onAdd: (item: QuoteItem) => void;
}

interface FormErrors {
  productName?: string;
  quantity?: string;
  unitPrice?: string;
}

/**
 * 견적 품목 입력 폼 (AI 후보 선택 + 이미지·가격 선택)
 */
export function QuoteItemForm({ onAdd }: QuoteItemFormProps) {
  const [draft, setDraft] = useState<QuoteItem>(() => createEmptyQuoteItem());
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAiFieldsEditable, setIsAiFieldsEditable] = useState(false);
  const [hasAiFilledData, setHasAiFilledData] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { search, isLoading, error: aiError, result, reset: resetAi } =
    useAiProductSearch();

  const {
    selectedCandidateId,
    selectedCandidate,
    selectedImageUrls,
    selectedPriceAmount,
    selectCandidate,
    toggleImage,
    clearSelection,
    syncFromSearchResult,
    setSelectedPriceAmount,
  } = useAiProductSelection();

  const updateField = <K extends keyof QuoteItem>(key: K, value: QuoteItem[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      if (key === "productName") delete next.productName;
      if (key === "quantity") delete next.quantity;
      if (key === "unitPrice") delete next.unitPrice;
      return next;
    });
  };

  const applyCandidateToDraft = (candidate: AiProductCandidate) => {
    const mapped = mapCandidateToQuoteDraft(candidate);
    setDraft((prev) => ({
      ...prev,
      ...mapped,
    }));
  };

  const handleAiSearch = async () => {
    if (isLoading) return;

    const data = await search(draft.productName);
    if (!data) return;

    const first = syncFromSearchResult(data);
    if (first) {
      applyCandidateToDraft(first);
    }
    setHasAiFilledData(true);
    setIsAiFieldsEditable(false);
  };

  const handleSelectCandidate = (candidate: AiProductCandidate) => {
    selectCandidate(candidate);
    applyCandidateToDraft(candidate);
  };

  const handleToggleImage = (url: string) => {
    const ok = toggleImage(url);
    if (!ok) {
      setToastMessage("이미지는 최대 3개까지 선택할 수 있습니다.");
    }
    return ok;
  };

  const handleSelectPrice = (amount: number) => {
    setSelectedPriceAmount(amount);
    updateField("unitPrice", amount);
  };

  const handleToggleEditable = () => {
    setIsAiFieldsEditable((prev) => !prev);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!draft.productName.trim()) {
      next.productName = "제품명을 입력해 주세요.";
    }
    if (draft.quantity < 1) {
      next.quantity = "수량은 1 이상이어야 합니다.";
    }
    if (draft.unitPrice < 0) {
      next.unitPrice = "단가는 0원 이상이어야 합니다.";
    }
    return next;
  };

  const resetForm = () => {
    setDraft(createEmptyQuoteItem());
    setErrors({});
    setIsAiFieldsEditable(false);
    setHasAiFilledData(false);
    clearSelection();
    resetAi();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onAdd({
      ...draft,
      id: crypto.randomUUID(),
      productName: draft.productName.trim(),
      modelName: draft.modelName.trim(),
      manufacturer: draft.manufacturer.trim(),
      detailedSpec: draft.detailedSpec.trim(),
      imageUrl: (selectedImageUrls[0] ?? draft.imageUrl).trim(),
      imageUrls: [...selectedImageUrls],
      majorFeatures: [...draft.majorFeatures],
      quantity: Math.floor(draft.quantity),
      unitPrice: Math.round(draft.unitPrice),
    });
    resetForm();
  };

  const canAiSearch = draft.productName.trim().length > 0 && !isLoading;
  const activeCandidate = selectedCandidate;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        품목 추가
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              label="제품명 (또는 모델명) *"
              name="productName"
              value={draft.productName}
              onChange={(e) => updateField("productName", e.target.value)}
              placeholder="예: iPhone 15"
              error={errors.productName}
              disabled={isLoading}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full shrink-0 sm:w-auto"
            onClick={handleAiSearch}
            disabled={!canAiSearch}
            isLoading={isLoading}
            loadingLabel="AI가 스펙 검색 중..."
          >
            AI 검색 및 스펙 완성
          </Button>
        </div>

        {aiError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {aiError}
          </p>
        ) : null}

        {result?.candidates?.length ? (
          <ProductCandidatePicker
            candidates={result.candidates}
            selectedId={selectedCandidateId}
            onSelect={handleSelectCandidate}
            disabled={isLoading}
          />
        ) : null}

        <AiProductFields
          draft={{
            manufacturer: draft.manufacturer,
            modelName: draft.modelName,
            detailedSpec: draft.detailedSpec,
            imageUrl: draft.imageUrl,
          }}
          isLoading={isLoading}
          isEditable={isAiFieldsEditable}
          hasAiFilledData={hasAiFilledData}
          onToggleEditable={handleToggleEditable}
          onFieldChange={updateField}
          selectedImageCount={selectedImageUrls.length}
        />

        {activeCandidate ? (
          <>
            <MajorFeaturesList features={activeCandidate.majorFeatures} />
            <AiImageGridPicker
              imageUrls={activeCandidate.imageUrls}
              selectedUrls={selectedImageUrls}
              onToggle={handleToggleImage}
              disabled={isLoading}
            />
            <AiPriceAnalysisPanel
              priceTrend={activeCandidate.priceTrend}
              priceSources={activeCandidate.priceSources}
              onSelectPrice={handleSelectPrice}
              selectedAmount={selectedPriceAmount}
              currencyConversion={activeCandidate.currencyConversion}
              originalPriceInUsd={activeCandidate.originalPriceInUsd}
            />
          </>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="수량 *"
            name="quantity"
            type="number"
            min={1}
            value={draft.quantity}
            onChange={(e) => updateField("quantity", Number(e.target.value) || 0)}
            error={errors.quantity}
          />
          <Input
            label="단가 (원) *"
            name="unitPrice"
            type="number"
            min={0}
            step={1}
            value={draft.unitPrice}
            onChange={(e) => {
              updateField("unitPrice", Number(e.target.value) || 0);
              setSelectedPriceAmount(null);
            }}
            error={errors.unitPrice}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary">
            품목 추가
          </Button>
        </div>
      </form>

      {toastMessage ? (
        <Toast
          message={toastMessage}
          variant="warning"
          onClose={() => setToastMessage(null)}
        />
      ) : null}
    </section>
  );
}
