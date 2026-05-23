-- =============================================================================
-- Smart Quote App — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에서 이 파일 전체를 실행하세요.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 확장 (UUID 생성)
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 2. 테이블
-- -----------------------------------------------------------------------------

/**
 * users: auth.users 와 1:1 프로필 (앱 표시용)
 */
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

/**
 * documents: 견적서·구매사양서 문서 마스터
 */
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null default '제목 없음',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_is_public_idx on public.documents (is_public) where is_public = true;

/**
 * products: 문서에 속한 품목 행
 */
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  product_name text not null default '',
  model_name text not null default '',
  manufacturer text not null default '',
  detailed_spec text not null default '',
  image_url text not null default '',
  image_urls jsonb not null default '[]'::jsonb,
  major_features jsonb not null default '[]'::jsonb,
  quantity integer not null default 1 check (quantity > 0),
  unit_price bigint not null default 0 check (unit_price >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists products_document_id_idx on public.products (document_id);

-- -----------------------------------------------------------------------------
-- 3. updated_at 자동 갱신
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. auth.users → public.users 프로필 자동 생성
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 5. RLS 활성화
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.products enable row level security;

-- users: 본인만 조회·수정
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (auth.uid() = id);

-- 공개 문서 작성자 프로필(게시판 작성자 표시용)
drop policy if exists users_select_public_authors on public.users;
create policy users_select_public_authors on public.users
  for select using (
    exists (
      select 1 from public.documents d
      where d.user_id = users.id and d.is_public = true
    )
  );

-- documents: 본인 CRUD + 공개 문서는 누구나 SELECT
drop policy if exists documents_select_own on public.documents;
create policy documents_select_own on public.documents
  for select using (auth.uid() = user_id);

drop policy if exists documents_select_public on public.documents;
create policy documents_select_public on public.documents
  for select using (is_public = true);

drop policy if exists documents_insert_own on public.documents;
create policy documents_insert_own on public.documents
  for insert with check (auth.uid() = user_id);

drop policy if exists documents_update_own on public.documents;
create policy documents_update_own on public.documents
  for update using (auth.uid() = user_id);

drop policy if exists documents_delete_own on public.documents;
create policy documents_delete_own on public.documents
  for delete using (auth.uid() = user_id);

-- products: 문서 소유자 또는 공개 문서의 품목 SELECT
drop policy if exists products_select_via_document on public.products;
create policy products_select_via_document on public.products
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and (d.user_id = auth.uid() or d.is_public = true)
    )
  );

drop policy if exists products_insert_own_document on public.products;
create policy products_insert_own_document on public.products
  for insert with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

drop policy if exists products_update_own_document on public.products;
create policy products_update_own_document on public.products
  for update using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

drop policy if exists products_delete_own_document on public.products;
create policy products_delete_own_document on public.products
  for delete using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 6. 트랜잭션 저장 RPC (문서 + 품목 일괄)
-- -----------------------------------------------------------------------------
/**
 * p_products JSON 배열 예시:
 * [
 *   {
 *     "product_name": "노트북",
 *     "model_name": "A3090",
 *     "manufacturer": "LG",
 *     "detailed_spec": "...",
 *     "image_url": "https://...",
 *     "image_urls": ["https://..."],
 *     "major_features": ["기능1"],
 *     "quantity": 1,
 *     "unit_price": 1000000,
 *     "sort_order": 0
 *   }
 * ]
 */
create or replace function public.save_document_with_products(
  p_title text,
  p_is_public boolean,
  p_products jsonb,
  p_document_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_doc_id uuid;
  v_product jsonb;
  v_idx integer := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  -- 프로필 없으면 생성 (트리거 누락 대비)
  insert into public.users (id, email, display_name)
  select v_user_id, u.email, split_part(u.email, '@', 1)
  from auth.users u
  where u.id = v_user_id
  on conflict (id) do nothing;

  if p_document_id is null then
    insert into public.documents (user_id, title, is_public)
    values (v_user_id, coalesce(nullif(trim(p_title), ''), '제목 없음'), coalesce(p_is_public, false))
    returning id into v_doc_id;
  else
    update public.documents
    set
      title = coalesce(nullif(trim(p_title), ''), '제목 없음'),
      is_public = coalesce(p_is_public, false),
      updated_at = now()
    where id = p_document_id and user_id = v_user_id
    returning id into v_doc_id;

    if v_doc_id is null then
      raise exception '문서를 찾을 수 없거나 수정 권한이 없습니다.';
    end if;

    delete from public.products where document_id = v_doc_id;
  end if;

  if p_products is not null and jsonb_typeof(p_products) = 'array' then
    for v_product in select * from jsonb_array_elements(p_products)
    loop
      insert into public.products (
        document_id,
        product_name,
        model_name,
        manufacturer,
        detailed_spec,
        image_url,
        image_urls,
        major_features,
        quantity,
        unit_price,
        sort_order
      )
      values (
        v_doc_id,
        coalesce(v_product->>'product_name', ''),
        coalesce(v_product->>'model_name', ''),
        coalesce(v_product->>'manufacturer', ''),
        coalesce(v_product->>'detailed_spec', ''),
        coalesce(v_product->>'image_url', ''),
        coalesce(v_product->'image_urls', '[]'::jsonb),
        coalesce(v_product->'major_features', '[]'::jsonb),
        greatest(1, coalesce((v_product->>'quantity')::integer, 1)),
        greatest(0, coalesce((v_product->>'unit_price')::bigint, 0)),
        coalesce((v_product->>'sort_order')::integer, v_idx)
      );
      v_idx := v_idx + 1;
    end loop;
  end if;

  return v_doc_id;
end;
$$;

grant execute on function public.save_document_with_products(text, boolean, jsonb, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. 관리자(Admin) 권한 — role, RLS, RPC
-- -----------------------------------------------------------------------------

/**
 * is_admin: 현재 JWT 사용자가 admin role인지 (RLS·RPC 공통)
 */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

/**
 * role 자동 승격 방지: 일반 사용자 UPDATE로 role 변경 불가
 */
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception '권한이 없습니다. role 변경은 admin_set_user_role RPC를 사용하세요.';
  end if;
  return new;
end;
$$;

drop trigger if exists users_prevent_role_escalation on public.users;
create trigger users_prevent_role_escalation
  before update of role on public.users
  for each row execute function public.prevent_role_self_escalation();

-- Admin: 전체 users SELECT
drop policy if exists users_select_admin on public.users;
create policy users_select_admin on public.users
  for select using (public.is_admin());

-- Admin: documents 전체 SELECT·DELETE
drop policy if exists documents_select_admin on public.documents;
create policy documents_select_admin on public.documents
  for select using (public.is_admin());

drop policy if exists documents_delete_admin on public.documents;
create policy documents_delete_admin on public.documents
  for delete using (public.is_admin());

-- Admin: products 전체 DELETE (유해 문서 정리용)
drop policy if exists products_delete_admin on public.products;
create policy products_delete_admin on public.products
  for delete using (public.is_admin());

/**
 * admin_list_users: 가입 유저 목록 (admin 전용)
 */
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  display_name text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  return query
  select u.id, u.email, u.display_name, u.role, u.created_at
  from public.users u
  order by u.created_at desc;
end;
$$;

/**
 * admin_set_user_role: 유저 role 변경 (admin 전용, 자기 admin 해제 방지)
 */
create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_role not in ('user', 'admin') then
    raise exception 'role은 user 또는 admin만 가능합니다.';
  end if;

  if p_user_id = auth.uid() and p_role = 'user' then
    raise exception '자신의 admin 권한은 해제할 수 없습니다.';
  end if;

  update public.users
  set role = p_role
  where id = p_user_id;

  if not found then
    raise exception '사용자를 찾을 수 없습니다.';
  end if;
end;
$$;

/**
 * admin_document_stats: 문서·유저 통계 (admin 전용)
 */
create or replace function public.admin_document_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_documents bigint;
  v_today_documents bigint;
  v_total_users bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  select count(*) into v_total_documents from public.documents;
  select count(*) into v_today_documents
  from public.documents
  where created_at >= date_trunc('day', now() at time zone 'Asia/Seoul');
  select count(*) into v_total_users from public.users;

  return json_build_object(
    'total_documents', v_total_documents,
    'today_documents', v_today_documents,
    'total_users', v_total_users
  );
end;
$$;

/**
 * admin_list_documents: 전체 문서 목록 (admin 전용)
 */
create or replace function public.admin_list_documents(p_limit integer default 100)
returns table (
  id uuid,
  title text,
  is_public boolean,
  created_at timestamptz,
  user_id uuid,
  user_email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  return query
  select
    d.id,
    d.title,
    d.is_public,
    d.created_at,
    d.user_id,
    u.email as user_email
  from public.documents d
  join public.users u on u.id = d.user_id
  order by d.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

/**
 * admin_delete_document: 문서 삭제 (admin 전용, products cascade)
 */
create or replace function public.admin_delete_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  delete from public.documents where id = p_document_id;

  if not found then
    raise exception '문서를 찾을 수 없습니다.';
  end if;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_document_stats() to authenticated;
grant execute on function public.admin_list_documents(integer) to authenticated;
grant execute on function public.admin_delete_document(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 기존 DB 마이그레이션 (이미 스키마를 실행한 경우 SQL Editor에서 1회 실행)
-- -----------------------------------------------------------------------------
-- alter table public.products add column if not exists model_name text not null default '';
-- (구 DB: 위 한 줄만 SQL Editor에서 1회 실행하면 model_name·저장 RPC와 완전히 동기화됩니다)
-- alter table public.users add column if not exists role text not null default 'user' check (role in ('user', 'admin'));
-- (위 7번 섹션 전체를 마이그레이션으로 실행)
