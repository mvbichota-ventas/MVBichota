-- MV Bichota: precio alternativo en CUP, sin tocar el precio existente.
-- Ejecutar manualmente en Supabase > SQL Editor después de revisar.
-- La columna price actual se conserva y continúa representando el precio USD.
-- Los productos existentes quedan con price_cup = NULL hasta que se informe su precio CUP.

alter table public.products
  add column if not exists price_cup numeric(12,2) null;

comment on column public.products.price_cup is
  'Precio alternativo en CUP introducido manualmente por producto; NULL significa que no se ha informado un precio CUP.';
