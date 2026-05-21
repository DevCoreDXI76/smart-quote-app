/**
 * @file lib/supabase/saveDocument.ts
 * @description 문서+품목 트랜잭션 저장 (RPC)
 */

import { getSupabaseClient } from "@/lib/supabaseClient";
import { quoteItemsToDbPayload } from "@/lib/supabase/mapDocument";
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
    throw new Error(error.message || "문서 저장에 실패했습니다.");
  }

  if (!data) {
    throw new Error("저장된 문서 ID를 받지 못했습니다.");
  }

  return String(data);
}
