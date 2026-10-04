-- Mahsulot rasmlari uchun Supabase Storage bucket.
-- Admin panel rasmni brauzerda siqib (WebP/JPEG, <=1200px, ~200 KB) shu yerga yuklaydi.
-- Bucket ochiq: saytdagi <img> rasmni to'g'ridan-to'g'ri public URL orqali oladi.
-- Yozish/o'chirish faqat adminlarga (public.is_admin()).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Ochiq bucket fayllari public URL orqali o'qiladi, shuning uchun anon uchun select
-- policy yo'q (u bo'lsa, istalgan kishi bucket ro'yxatini ko'ra oladi). Adminga
-- select kerak: Storage API yuklashda INSERT ... RETURNING ishlatadi.

create policy product_images_select_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

create policy product_images_insert_admin on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy product_images_update_admin on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy product_images_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
