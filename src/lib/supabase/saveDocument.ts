/**
 * @file lib/supabase/saveDocument.ts
 * @description 문서+품목 트랜잭션 저장 (RPC)
 */

import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  isMissingModelNameColumnError,
  quoteItemsToDbPayload,
} from "@/lib/supabase/mapDocument";
import type { QuoteItem } from "@/types";

export interface SaveDocumentParams {
  title: string;
  isPublic: boolean;
  items: QuoteItem[];
  /** 수정 저장 시 기존 문서 ID */
  documentId?: string | null;
}

/**
 * save_document_with_products RPC를 호출해 문서와 품목을 한 번에 저장합니다.
 * @returns 저장된 문서 UUID
 */
export async function saveDocumentWithProducts(
  params: SaveDocumentParams,
): Promise<string> {
  const supabase = getSupabaseClient();
  const payload = quoteItemsToDbPayload(params.items);

  const { data, error } = await supabase.rpc("save_document_with_products", {
    p_title: params.title,
    p_is_public: params.isPublic,
    p_products: payload,
    p_document_id: params.documentId ?? null,
  });

  if (error) {
    if (isMissingModelNameColumnError(error)) {
      throw new Error(
        "DB에 products.model_name 컬럼이 없습니다. Supabase SQL Editor에서 supabase-migrations/001_add_model_name.sql 을 실행한 뒤 save_document_with_products RPC를 갱신해 주세요. (임시로 image_urls 메타에 모델명이 저장될 수 있습니다.)",
      );
    }
    throw new Error(error.message || "문서 저장에 실패했습니다.");
  }

  if (!data) {
    throw new Error("저장된 문서 ID를 받지 못했습니다.");
  }

  return String(data);
}
