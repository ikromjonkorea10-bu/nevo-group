-- =====================================================================
-- NEVO GROUP — prays-list importi uchun products jadvaliga ustunlar
-- (scripts/import-catalog.js). Barcha narxlar so'mda, shuning uchun
-- alohida currency ustuni yo'q; manba_narx/manba_valyuta — praysdagi
-- asl narx (ma'lumot uchun, hisob-kitobda ishlatilmaydi).
-- =====================================================================

alter table public.products
  add column if not exists group_name    text check (group_name is null or length(group_name) <= 300),
  add column if not exists size          text check (size is null or length(size) <= 100),
  add column if not exists size_label    text check (size_label is null or length(size_label) <= 60),
  -- "В/кар" — qutidagi soni. Praysda "30/20", "140м" kabi qiymatlar ham bor.
  add column if not exists pack_qty      text check (pack_qty is null or length(pack_qty) <= 40),
  add column if not exists supplier      text check (supplier is null or length(supplier) <= 200),
  add column if not exists price_date    date,
  add column if not exists manba_narx    numeric(16, 4) check (manba_narx is null or manba_narx >= 0),
  add column if not exists manba_valyuta text check (manba_valyuta is null or manba_valyuta ~ '^[A-Z]{3}$');

create index if not exists products_brand_idx on public.products (brand);
