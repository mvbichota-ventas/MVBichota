-- Product availability is independent from visibility (products.active).
-- Run manually in Supabase SQL Editor; this migration is non-destructive and preserves existing rows.
alter table public.products
  add column if not exists is_available boolean not null default true;

comment on column public.products.is_available is
  'Whether customers may purchase this product; independent of products.active visibility.';

-- Keep the current products RLS policies. `active` remains the visibility flag;
-- `is_available` is interpreted by the public storefront and never hides the row.
-- Storage writes/deletes are only for authenticated administrators. Public read is allowed
-- because product-images is configured as a public bucket.
drop policy if exists "Product images public read" on storage.objects;
create policy "Product images public read" on storage.objects
  for select to public using (bucket_id = 'product-images');

drop policy if exists "Product images admin upload" on storage.objects;
create policy "Product images admin upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Product images admin update" on storage.objects;
create policy "Product images admin update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Product images admin delete" on storage.objects;
create policy "Product images admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
