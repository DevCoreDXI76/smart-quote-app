/**
 * @file lib/supabase/fetchProductsBatch.ts
 * @description 여러 문서의 품목을 한 번에 조회 (대시보드 합계용)
 */

import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  dbProductToQuoteItem,
  type DbProductRow,
} from "@/lib/supabase/mapDocument";
import { calculateQuoteTotals } from "@/lib/calculations/quoteTotals";
import type { QuoteItem } from "@/types";

/**
 * document_id별 품목 배열 맵
 */
export async function fetchProductsGroupedByDocument(
  documentIds: string[],
): Promise<Map<string, QuoteItem[]>> {
  const map = new Map<string, QuoteItem[]>();
  if (!documentIds.length) return map;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, document_id, product_name, model_name, manufacturer, detailed_spec, image_url, image_urls, major_features, quantity, unit_price, sort_order",
    )
    .in("document_id", documentIds)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as DbProductRow[]) {
    const list = map.get(row.document_id) ?? [];
    list.push(dbProductToQuoteItem(row));
    map.set(row.document_id, list);
  }

  return map;
}

/**
 * 문서 ID별 총 합계금액(부가세 포함) 계산
 */
export async function fetchDocumentTotalAmounts(
  documentIds: string[],
): Promise<Map<string, number>> {
  const grouped = await fetchProductsGroupedByDocument(documentIds);
  const totals = new Map<string, number>();

  for (const [docId, items] of grouped) {
    totals.set(docId, calculateQuoteTotals(items).totalAmount);
  }

  for (const id of documentIds) {
    if (!totals.has(id)) totals.set(id, 0);
  }

  return totals;
}
