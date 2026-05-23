-- =============================================================================
-- Smart Quote App — model_name 컬럼 마이그레이션 (1회 실행)
-- Supabase SQL Editor 에서 이 파일을 실행하세요.
-- =============================================================================

alter table public.products
  add column if not exists model_name text not null default '';

-- save_document_with_products RPC 가 model_name 을 저장하도록
-- 루트의 supabase-schema.sql 6번 섹션(저장 RPC) 전체를 다시 실행하는 것을 권장합니다.
