-- =====================================================================
-- NEVO GROUP — xavfsizlik: jadval huquqlari va Row Level Security
--
-- Qoidalar:
--   categories, products : anon/authenticated — faqat SELECT
--                          yozish — faqat admin (authenticated + admin_users)
--   orders, order_items  : anon — o'qish natijasi doim bo'sh, to'g'ridan-
--                          to'g'ri yozish YO'Q. Buyurtma faqat
--                          public.place_order() orqali
--                          yaratiladi (bitta tranzaksiya, narx serverdan).
--                          o'qish/o'zgartirish — faqat admin.
--   admin_users          : API orqali umuman ochiq emas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Admin tekshiruvi
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------
-- Jadval darajasidagi huquqlar (Supabase standart holatda anon va
-- authenticated rollariga hamma narsani beradi — shuni toraytiramiz).
-- ---------------------------------------------------------------------
revoke all on table public.categories, public.products,
                    public.orders, public.order_items,
                    public.admin_users
  from anon, authenticated;

grant select on table public.categories, public.products to anon;
grant select, insert, update, delete on table public.categories, public.products to authenticated;
grant select, update, delete on table public.orders, public.order_items to authenticated;
-- anon'ga SELECT huquqi beriladi, lekin anon uchun RLS siyosati YO'Q —
-- natijada anon so'rovi xatolik emas, doim bo'sh ro'yxat qaytaradi.
-- INSERT/UPDATE/DELETE huquqi umuman berilmaydi.
grant select on table public.orders, public.order_items to anon;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- RLS yoqish
-- ---------------------------------------------------------------------
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_users enable row level security;

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create policy categories_select_all on public.categories
  for select to anon, authenticated
  using (true);

create policy categories_insert_admin on public.categories
  for insert to authenticated
  with check ((select public.is_admin()));

create policy categories_update_admin on public.categories
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy categories_delete_admin on public.categories
  for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create policy products_select_all on public.products
  for select to anon, authenticated
  using (true);

create policy products_insert_admin on public.products
  for insert to authenticated
  with check ((select public.is_admin()));

create policy products_update_admin on public.products
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy products_delete_admin on public.products
  for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- orders — anon uchun hech qanday siyosat yo'q (= hammasi taqiqlangan)
-- ---------------------------------------------------------------------
create policy orders_select_admin on public.orders
  for select to authenticated
  using ((select public.is_admin()));

create policy orders_update_admin on public.orders
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy orders_delete_admin on public.orders
  for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------
create policy order_items_select_admin on public.order_items
  for select to authenticated
  using ((select public.is_admin()));

create policy order_items_update_admin on public.order_items
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy order_items_delete_admin on public.order_items
  for delete to authenticated
  using ((select public.is_admin()));

-- admin_users: siyosat yo'q — faqat is_admin() (security definer) o'qiydi.
