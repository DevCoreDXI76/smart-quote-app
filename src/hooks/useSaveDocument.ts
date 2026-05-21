/**
 * @file hooks/useSaveDocument.ts
 * @description 견적 문서 Supabase 저장 상태·RPC 호출
 */

"use client";

import { useCallback, useState } from "react";

import { saveDocumentWithProducts } from "@/lib/supabase/saveDocument";
import type { QuoteItem } from "@/types";

export interface SaveDocumentInput {
  title: string;
  isPublic: boolean;
  items: QuoteItem[];
  documentId?: string | null;
}

export interface UseSaveDocumentResult {
  isSaving: boolean;
  error: string | null;
  clearError: () => void;
  saveDocument: (input: SaveDocumentInput) => Promise<string>;
}

/**
 * 문서 저장 RPC를 호출하고 로딩·에러 상태를 관리합니다.
 */
export function useSaveDocument(): UseSaveDocumentResult {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const saveDocument = useCallback(async (input: SaveDocumentInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const id = await saveDocumentWithProducts(input);
      return id;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "문서 저장 중 오류가 발생했습니다.";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { isSaving, error, clearError, saveDocument };
}
