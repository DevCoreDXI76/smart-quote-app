/**
 * @file lib/supabase/fetchDocument.ts
 * @description 문서·품목 조회
 */

import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  formatAuthorLabel,
  rowsToDocumentMaster,
  type DbDocumentRow,
  type DbProductRow,
  type DocumentListItem,
} from "@/lib/supabase/mapDocument";
import type { DocumentMaster } from "@/types";

/**
 * 문서 1건과 품목을 조회해 DocumentMaster로 반환합니다.
 */
export async function fetchDocumentById(
  documentId: string,
): Promise<DocumentMaster | null> {
  const supabase = getSupabaseClient();

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, user_id, title, is_public, created_at, updated_at")
    .eq("id", documentId)
    .maybeSingle();

  if (docError) throw new Error(docError.message);
  if (!doc) return null;

  const { data: products, error: prodError } = await supabase
    .from("products")
    .select(
      "id, document_id, product_name, model_name, manufacturer, detailed_spec, image_url, image_urls, major_features, quantity, unit_price, sort_order",
    )
    .eq("document_id", documentId)
    .order("sort_order", { ascending: true });

  if (prodError) throw new Error(prodError.message);

  return rowsToDocumentMaster(
    doc as DbDocumentRow,
    (products ?? []) as DbProductRow[],
  );
}

/**
 * 로그인 사용자의 문서 목록(품목 수 포함)을 조회합니다.
 */
export async function fetchMyDocuments(
  userId: string,
): Promise<DocumentListItem[]> {
  const supabase = getSupabaseClient();

  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, user_id, title, is_public, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!docs?.length) return [];

  const ids = docs.map((d) => d.id);
  const { data: productCounts, error: countError } = await supabase
    .from("products")
    .select("document_id")
    .in("document_id", ids);

  if (countError) throw new Error(countError.message);

  const countMap = new Map<string, number>();
  for (const row of productCounts ?? []) {
    const id = row.document_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  return docs.map((d) => ({
    id: d.id,
    userId: d.user_id,
    title: d.title,
    isPublic: d.is_public,
    createdAt: d.created_at,
    itemCount: countMap.get(d.id) ?? 0,
  }));
}

/**
 * 공개(is_public) 문서 목록을 조회합니다 (게시판).
 */
export async function fetchPublicDocuments(
  searchQuery?: string,
): Promise<DocumentListItem[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("documents")
    .select("id, user_id, title, is_public, created_at, users(email, display_name)")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (searchQuery?.trim()) {
    query = query.ilike("title", `%${searchQuery.trim()}%`);
  }

  const { data: docs, error } = await query;
  if (error) throw new Error(error.message);
  if (!docs?.length) return [];

  const ids = docs.map((d) => d.id);
  const { data: productCounts, error: countError } = await supabase
    .from("products")
    .select("document_id")
    .in("document_id", ids);

  if (countError) throw new Error(countError.message);

  const countMap = new Map<string, number>();
  for (const row of productCounts ?? []) {
    const id = row.document_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  return docs.map((d) => {
    const user = d.users as
      | { email?: string; display_name?: string }
      | { email?: string; display_name?: string }[]
      | null;
    const profile = Array.isArray(user) ? user[0] : user;

    return {
      id: d.id,
      userId: d.user_id,
      title: d.title,
      isPublic: d.is_public,
      createdAt: d.created_at,
      itemCount: countMap.get(d.id) ?? 0,
      authorLabel: formatAuthorLabel(profile?.email, profile?.display_name),
    };
  });
}
