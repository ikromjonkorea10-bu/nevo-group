-- =====================================================================
-- NEVO GROUP — asosiy sxema: kategoriyalar, mahsulotlar, buyurtmalar
-- =====================================================================

-- ---------------------------------------------------------------------
-- updated_at ni avtomatik yangilovchi trigger funksiyasi
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table public.categories (
  id            bigint generated always as identity primary key,
  slug          text not null unique
                check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_uz       text not null
                check (length(btrim(name_uz)) between 1 and 200),
  short_desc_uz text check (short_desc_uz is null or length(short_desc_uz) <= 300),
  image_url     text check (image_url is null or image_url ~ '^(https?://|/[^/])'),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create table public.products (
  id             bigint generated always as identity primary key,
  category_id    bigint not null references public.categories (id) on delete restrict,
  slug           text not null unique
                 check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_uz        text not null
                 check (length(btrim(name_uz)) between 1 and 300),
  description_uz text check (description_uz is null or length(description_uz) <= 5000),
  price          bigint not null check (price >= 0),
  old_price      bigint check (old_price is null or old_price >= 0),
  image_url      text check (image_url is null or image_url ~ '^(https?://|/[^/])'),
  in_stock       boolean not null default true,
  featured       boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  -- Mavjud frontend ishlatadigan qo'shimcha maydonlar
  sku            text unique check (sku is null or length(sku) between 1 and 60),
  subcategory_uz text check (subcategory_uz is null or length(subcategory_uz) <= 200),
  brand          text check (brand is null or length(brand) <= 100),
  unit           text not null default '1 dona' check (length(unit) between 1 and 40),
  specs          jsonb not null default '{}'::jsonb check (jsonb_typeof(specs) = 'object'),
  budget         boolean not null default false,
  updated_at     timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_sort_idx on public.products (sort_order, id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
create table public.orders (
  id            bigint generated always as identity primary key,
  customer_name text not null
                check (length(btrim(customer_name)) between 1 and 120),
  phone         text not null check (phone ~ '^\+998[0-9]{9}$'),
  address       text check (address is null or length(address) <= 500),
  comment       text check (comment is null or length(comment) <= 10000),
  total_amount  bigint not null default 0 check (total_amount >= 0),
  status        text not null default 'new'
                check (status in ('new', 'confirmed', 'delivered', 'cancelled')),
  order_type    text not null default 'retail'
                check (order_type in ('retail', 'bulk')),
  company_name  text check (company_name is null or length(company_name) <= 200),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- order_items
-- product_name va price — buyurtma paytidagi nusxa (mahsulot keyin
-- o'zgarsa yoki o'chirilsa ham buyurtma tarixi saqlanadi).
-- ---------------------------------------------------------------------
create table public.order_items (
  id           bigint generated always as identity primary key,
  order_id     bigint not null references public.orders (id) on delete cascade,
  product_id   bigint references public.products (id) on delete set null,
  product_name text not null,
  price        bigint not null check (price >= 0),
  quantity     integer not null check (quantity between 1 and 100000)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------
-- admin_users — admin panelga kirish huquqi bor foydalanuvchilar.
-- Supabase Auth'da foydalanuvchi yaratilgach, shu jadvalga qo'lda
-- qo'shiladi (README'ga qarang).
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
