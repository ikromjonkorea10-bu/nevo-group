-- =====================================================================
-- NEVO GROUP — buyurtma berish RPC
--
-- public.place_order(...) orders + order_items ni BITTA tranzaksiyada
-- yozadi. Narx va mahsulot nomi frontend'dan olinmaydi — faqat
-- public.products jadvalidan. Xatolikda hech narsa yozilmaydi.
--
-- Xatoliklar: SQLSTATE P0001, message — foydalanuvchiga ko'rsatiladigan
-- o'zbekcha matn, hint — qaysi maydonga tegishli ekani:
--   customer_name | phone | address | comment | company_name |
--   order_type | items | out_of_stock
-- =====================================================================

create or replace function public.place_order(
  p_customer_name text,
  p_phone         text,
  p_address       text  default null,
  p_comment       text  default null,
  p_order_type    text  default 'retail',
  p_company_name  text  default null,
  p_items         jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name         text := btrim(coalesce(p_customer_name, ''));
  v_digits       text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_phone        text;
  v_address      text := nullif(btrim(coalesce(p_address, '')), '');
  v_comment      text := nullif(btrim(coalesce(p_comment, '')), '');
  v_company      text := nullif(btrim(coalesce(p_company_name, '')), '');
  v_type         text := coalesce(p_order_type, 'retail');
  v_items        jsonb := coalesce(p_items, '[]'::jsonb);
  v_elem         jsonb;
  v_req          jsonb;
  v_unavailable  text;
  v_order_id     bigint;
  v_total        bigint;
  v_created_at   timestamptz;
begin
  -- ---- Mijoz ma'lumotlari ------------------------------------------
  if v_name = '' then
    raise exception using message = 'Ismingizni kiriting', hint = 'customer_name';
  end if;
  if length(v_name) > 120 then
    raise exception using message = 'Ism juda uzun (120 belgigacha)', hint = 'customer_name';
  end if;

  if length(v_digits) = 9 then
    v_digits := '998' || v_digits;
  end if;
  if v_digits !~ '^998[0-9]{9}$' then
    raise exception using message = 'Telefon raqami +998 XX XXX XX XX formatida bo''lishi kerak', hint = 'phone';
  end if;
  v_phone := '+' || v_digits;

  if v_address is not null and length(v_address) > 500 then
    raise exception using message = 'Manzil juda uzun (500 belgigacha)', hint = 'address';
  end if;
  if v_comment is not null and length(v_comment) > 10000 then
    raise exception using message = 'Izoh juda uzun', hint = 'comment';
  end if;

  if v_type not in ('retail', 'bulk') then
    raise exception using message = 'Buyurtma turi noto''g''ri', hint = 'order_type';
  end if;
  if v_type = 'retail' then
    v_company := null;
  elsif v_company is not null and length(v_company) > 200 then
    raise exception using message = 'Kompaniya nomi juda uzun (200 belgigacha)', hint = 'company_name';
  end if;

  -- ---- Savat tarkibi ------------------------------------------------
  if jsonb_typeof(v_items) <> 'array' then
    raise exception using message = 'Savat ma''lumoti noto''g''ri', hint = 'items';
  end if;
  if jsonb_array_length(v_items) > 200 then
    raise exception using message = 'Bitta buyurtmada 200 tagacha pozitsiya bo''lishi mumkin', hint = 'items';
  end if;

  for v_elem in select value from jsonb_array_elements(v_items) loop
    if jsonb_typeof(v_elem) <> 'object'
       or coalesce(v_elem ->> 'product_id', '') !~ '^[0-9]{1,18}$'
       or coalesce(v_elem ->> 'quantity', '') !~ '^[0-9]{1,6}$'
       or (v_elem ->> 'quantity')::integer < 1
       or (v_elem ->> 'quantity')::integer > 100000 then
      raise exception using message = 'Savatdagi mahsulot miqdori noto''g''ri', hint = 'items';
    end if;
  end loop;

  if jsonb_array_length(v_items) = 0 then
    if v_type = 'retail' then
      raise exception using message = 'Savat bo''sh', hint = 'items';
    elsif v_comment is null then
      raise exception using message = 'Mahsulotlar ro''yxatini yozing yoki savatga mahsulot qo''shing', hint = 'items';
    end if;
  end if;

  -- Bir xil mahsulot bir necha marta kelsa — miqdorlar qo'shiladi
  select coalesce(jsonb_agg(jsonb_build_object('product_id', g.product_id, 'quantity', g.quantity)), '[]'::jsonb)
    into v_req
  from (
    select (e ->> 'product_id')::bigint as product_id,
           sum((e ->> 'quantity')::bigint) as quantity
    from jsonb_array_elements(v_items) e
    group by 1
  ) g;

  if exists (
    select 1 from jsonb_to_recordset(v_req) as r(product_id bigint, quantity bigint)
    where r.quantity > 100000
  ) then
    raise exception using message = 'Savatdagi mahsulot miqdori noto''g''ri', hint = 'items';
  end if;

  -- Narx tranzaksiya davomida o'zgarmasligi uchun qatorlar qulflanadi
  perform 1
  from public.products p
  join jsonb_to_recordset(v_req) as r(product_id bigint, quantity integer)
    on r.product_id = p.id
  for share of p;

  -- Mahsulotlar bazada bormi va omborda mavjudmi?
  select string_agg(coalesce(p.name_uz, '#' || r.product_id::text), ', ' order by r.product_id)
    into v_unavailable
  from jsonb_to_recordset(v_req) as r(product_id bigint, quantity integer)
  left join public.products p on p.id = r.product_id
  where p.id is null or not p.in_stock;

  if v_unavailable is not null then
    raise exception using
      message = 'Quyidagi mahsulotlar hozir mavjud emas: ' || v_unavailable,
      hint = 'out_of_stock';
  end if;

  -- ---- Yozish ---------------------------------------------------------
  select coalesce(sum(p.price * r.quantity), 0)
    into v_total
  from jsonb_to_recordset(v_req) as r(product_id bigint, quantity integer)
  join public.products p on p.id = r.product_id;

  insert into public.orders (customer_name, phone, address, comment,
                             total_amount, status, order_type, company_name)
  values (v_name, v_phone, v_address, v_comment,
          v_total, 'new', v_type, v_company)
  returning id, created_at into v_order_id, v_created_at;

  insert into public.order_items (order_id, product_id, product_name, price, quantity)
  select v_order_id, p.id, p.name_uz, p.price, r.quantity
  from jsonb_to_recordset(v_req) as r(product_id bigint, quantity integer)
  join public.products p on p.id = r.product_id
  order by r.product_id;

  return jsonb_build_object(
    'id', v_order_id,
    'total_amount', v_total,
    'created_at', v_created_at
  );
end;
$$;

revoke all on function public.place_order(text, text, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, text, text, jsonb) to anon, authenticated;
