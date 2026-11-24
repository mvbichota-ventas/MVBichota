-- MV Bichota: carga inicial del catálogo desde data/products.json
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- No elimina ni modifica productos existentes; omite legacy_id ya cargados.
-- Requiere las 6 categorías existentes con los slugs originales.

begin;

create temporary table mvb_seed_products on commit drop as
select *
from jsonb_to_recordset($seed$[{"id":"arroz","name":"Arroz","description":"Arroz de alta calidad, ideal para acompañar cualquier plato.","category":"alimentos","price":2.5,"unit":"paquete","image":"https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop","stock":100,"active":true,"featured":true,"allowInCombo":true,"comboOrder":1,"featuredOrder":1},{"id":"frijoles-negros","name":"Frijoles Negros","description":"Frijoles negros frescos, perfectos para guisos y ensaladas.","category":"alimentos","price":3,"unit":"paquete","image":"https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&h=300&fit=crop","stock":80,"active":true,"featured":false,"allowInCombo":true,"comboOrder":2,"featuredOrder":0},{"id":"frijoles-cabrioles","name":"Frijoles Cabrioles","description":"Frijoles cabrioles de excelente calidad.","category":"alimentos","price":3.5,"unit":"libra","image":"https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&h=300&fit=crop","stock":60,"active":true,"featured":false,"allowInCombo":true,"comboOrder":3,"featuredOrder":0},{"id":"espaguetis","name":"Espaguetis","description":"Espaguetis italianos de grano duro.","category":"alimentos","price":1.8,"unit":"paquete","image":"https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&h=300&fit=crop","stock":120,"active":true,"featured":false,"allowInCombo":true,"comboOrder":4,"featuredOrder":0},{"id":"pollo","name":"Pollo","description":"Pollo fresco, listo para cocinar.","category":"alimentos","price":8.5,"unit":"caja","image":"https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=300&h=300&fit=crop","stock":50,"active":true,"featured":true,"allowInCombo":true,"comboOrder":5,"featuredOrder":2},{"id":"salchichas","name":"Salchichas","description":"Salchichas de primera calidad.","category":"alimentos","price":4.5,"unit":"paquete","image":"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=300&fit=crop","stock":70,"active":true,"featured":false,"allowInCombo":true,"comboOrder":6,"featuredOrder":0},{"id":"higado-pollo","name":"Hígado de Pollo","description":"Hígado de pollo fresco y nutritivo.","category":"alimentos","price":3.25,"unit":"paquete","image":"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop","stock":40,"active":true,"featured":false,"allowInCombo":true,"comboOrder":7,"featuredOrder":0},{"id":"picadillo-pollo","name":"Picadillo de Pollo","description":"Picadillo de pollo preparado para cocinar.","category":"alimentos","price":5,"unit":"caja","image":"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop","stock":45,"active":true,"featured":false,"allowInCombo":true,"comboOrder":8,"featuredOrder":0},{"id":"picadillo-original","name":"Picadillo de Pollo Original","description":"Picadillo de pollo original en tubo.","category":"alimentos","price":4.75,"unit":"tubo","image":"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop","stock":35,"active":true,"featured":false,"allowInCombo":true,"comboOrder":9,"featuredOrder":0},{"id":"mortadella","name":"Mortadella de Pollo Original","description":"Mortadella de pollo en tubo, ideal para sándwiches.","category":"alimentos","price":4.5,"unit":"tubo","image":"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=300&fit=crop","stock":55,"active":true,"featured":false,"allowInCombo":true,"comboOrder":10,"featuredOrder":0},{"id":"azucar","name":"Azúcar","description":"Azúcar blanca de caña.","category":"alimentos","price":2.8,"unit":"libra","image":"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop","stock":150,"active":true,"featured":false,"allowInCombo":true,"comboOrder":11,"featuredOrder":0},{"id":"aceite","name":"Aceite","description":"Aceite vegetal refinado.","category":"alimentos","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop","stock":90,"active":true,"featured":false,"allowInCombo":true,"comboOrder":12,"featuredOrder":0},{"id":"huevos","name":"Huevos","description":"Huevos frescos de gallina.","category":"alimentos","price":4,"unit":"docena","image":"https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop","stock":200,"active":true,"featured":true,"allowInCombo":true,"comboOrder":13,"featuredOrder":3},{"id":"cerdo","name":"Cerdo","description":"Carne de cerdo fresca.","category":"alimentos","price":9.5,"unit":"libra","image":"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&h=300&fit=crop","stock":40,"active":true,"featured":true,"allowInCombo":true,"comboOrder":14,"featuredOrder":4},{"id":"pasta-tomate","name":"Pasta de Tomate","description":"Pasta de tomate concentrada.","category":"alimentos","price":1.25,"unit":"unidad","image":"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop","stock":100,"active":true,"featured":false,"allowInCombo":true,"comboOrder":15,"featuredOrder":0},{"id":"leche-condensada","name":"Leche Condensada","description":"Leche condensada dulce.","category":"alimentos","price":2.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop","stock":80,"active":true,"featured":false,"allowInCombo":true,"comboOrder":16,"featuredOrder":0},{"id":"leche-polvo","name":"Leche en Polvo","description":"Leche en polvo entera.","category":"alimentos","price":6.5,"unit":"libra","image":"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop","stock":60,"active":true,"featured":false,"allowInCombo":true,"comboOrder":17,"featuredOrder":0},{"id":"mayonesa","name":"Mayonesa","description":"Mayonesa cremosa y sabrosa.","category":"alimentos","price":3.25,"unit":"unidad","image":"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop","stock":70,"active":true,"featured":false,"allowInCombo":true,"comboOrder":18,"featuredOrder":0},{"id":"vinagre","name":"Vinagre","description":"Vinagre blanco destilado.","category":"alimentos","price":1.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop","stock":90,"active":true,"featured":false,"allowInCombo":true,"comboOrder":19,"featuredOrder":0},{"id":"gelatina","name":"Gelatina","description":"Gelatina de various sabores.","category":"alimentos","price":1,"unit":"unidad","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":120,"active":true,"featured":false,"allowInCombo":true,"comboOrder":20,"featuredOrder":0},{"id":"maicena","name":"Maicena","description":"Maicena para espesar preparaciones.","category":"alimentos","price":1.75,"unit":"unidad","image":"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop","stock":85,"active":true,"featured":false,"allowInCombo":true,"comboOrder":21,"featuredOrder":0},{"id":"sazon","name":"Sazón","description":"Sazonador para mejorar tus platos.","category":"alimentos","price":1.25,"unit":"unidad","image":"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop","stock":150,"active":true,"featured":false,"allowInCombo":true,"comboOrder":22,"featuredOrder":0},{"id":"queso-blanco","name":"Queso Blanco","description":"Queso blanco fresco.","category":"alimentos","price":5.5,"unit":"libra","image":"https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&h=300&fit=crop","stock":45,"active":true,"featured":false,"allowInCombo":true,"comboOrder":23,"featuredOrder":0},{"id":"jabon-bano","name":"Jabones de Baño","description":"Jabón para baño de various aromas.","category":"aseo","price":1.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300&h=300&fit=crop","stock":100,"active":true,"featured":false,"allowInCombo":true,"comboOrder":1,"featuredOrder":0},{"id":"jabon-lavar","name":"Jabones de Lavar","description":"Jabón para lavar ropa.","category":"aseo","price":2,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":80,"active":true,"featured":false,"allowInCombo":true,"comboOrder":2,"featuredOrder":0},{"id":"detergente","name":"Detergente","description":"Detergente en polvo o líquido.","category":"aseo","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":90,"active":true,"featured":false,"allowInCombo":true,"comboOrder":3,"featuredOrder":0},{"id":"pasta-dental","name":"Pasta Dental","description":"Pasta dental para dientes sanos.","category":"aseo","price":2.75,"unit":"unidad","image":"https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop","stock":110,"active":true,"featured":false,"allowInCombo":true,"comboOrder":4,"featuredOrder":0},{"id":"champu-crema","name":"Juegos de Champú y Crema","description":"Set de champú y crema para el cabello.","category":"aseo","price":8.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":40,"active":true,"featured":false,"allowInCombo":true,"comboOrder":5,"featuredOrder":0},{"id":"papel-sanitario","name":"Papel Sanitario","description":"Rollo de papel sanitario.","category":"aseo","price":1.25,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":200,"active":true,"featured":false,"allowInCombo":true,"comboOrder":6,"featuredOrder":0},{"id":"desodorante","name":"Desodorante","description":"Desodorante personal.","category":"aseo","price":3,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":75,"active":true,"featured":false,"allowInCombo":true,"comboOrder":7,"featuredOrder":0},{"id":"crema-piel","name":"Crema de la Piel","description":"Crema hidratante para la piel.","category":"aseo","price":4.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":55,"active":true,"featured":false,"allowInCombo":true,"comboOrder":8,"featuredOrder":0},{"id":"colonias","name":"Colonias","description":"Colonias de various aromas.","category":"aseo","price":6,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":45,"active":true,"featured":false,"allowInCombo":true,"comboOrder":9,"featuredOrder":0},{"id":"perfumes","name":"Perfumes","description":"Perfumes de alta calidad.","category":"aseo","price":12,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":30,"active":true,"featured":false,"allowInCombo":false,"comboOrder":10,"featuredOrder":0},{"id":"talco-corporal","name":"Talco Corporal","description":"Talco para el cuerpo.","category":"aseo","price":2.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":65,"active":true,"featured":false,"allowInCombo":true,"comboOrder":11,"featuredOrder":0},{"id":"diarias","name":"Diarias","description":"Toallas higiénicas diarias.","category":"aseo","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":85,"active":true,"featured":false,"allowInCombo":true,"comboOrder":12,"featuredOrder":0},{"id":"galletas-soda","name":"Galletas de Soda","description":"Galletas de soda crujientes.","category":"confituras","price":1.5,"unit":"paquete","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":100,"active":true,"featured":false,"allowInCombo":true,"comboOrder":1,"featuredOrder":0},{"id":"caramelos","name":"Caramelos","description":"Caramelos de various sabores.","category":"confituras","price":2,"unit":"paquete","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":120,"active":true,"featured":false,"allowInCombo":true,"comboOrder":2,"featuredOrder":0},{"id":"galletas-dulce","name":"Galletas de Dulce","description":"Galletas dulces artesanales.","category":"confituras","price":2.5,"unit":"paquete","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":80,"active":true,"featured":true,"allowInCombo":true,"comboOrder":3,"featuredOrder":5},{"id":"chupa-chupa","name":"Chupa Chupa","description":"Chupa chupa de various colores.","category":"confituras","price":1.75,"unit":"paquete","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":150,"active":true,"featured":false,"allowInCombo":true,"comboOrder":4,"featuredOrder":0},{"id":"refrescos-nectar","name":"Refrescos Néctar","description":"Refrescos de various sabores.","category":"bebidas","price":1.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop","stock":200,"active":true,"featured":false,"allowInCombo":true,"comboOrder":1,"featuredOrder":0},{"id":"refrescos","name":"Refrescos","description":"Refrescos gaseosos.","category":"bebidas","price":1.75,"unit":"unidad","image":"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop","stock":180,"active":true,"featured":false,"allowInCombo":true,"comboOrder":2,"featuredOrder":0},{"id":"malta","name":"Malta","description":"Malta sin alcohol.","category":"bebidas","price":2,"unit":"unidad","image":"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop","stock":150,"active":true,"featured":false,"allowInCombo":true,"comboOrder":3,"featuredOrder":0},{"id":"cervezas","name":"Cervezas","description":"Cervezas artesanales e importadas.","category":"bebidas","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop","stock":100,"active":true,"featured":false,"allowInCombo":false,"comboOrder":4,"featuredOrder":0},{"id":"ensalada-fria","name":"Ensalada Fría Básica","description":"Ensalada fría preparada.","category":"bufet","price":15,"unit":"cubeta","image":"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop","stock":20,"active":true,"featured":false,"allowInCombo":true,"comboOrder":1,"featuredOrder":0},{"id":"helado","name":"Helado","description":"Helado de various sabores.","category":"bufet","price":12,"unit":"cubeta","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":25,"active":true,"featured":true,"allowInCombo":true,"comboOrder":2,"featuredOrder":6},{"id":"panetelas","name":"Panetelas","description":"Panetelas de various tamaños.","category":"bufet","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":50,"active":true,"featured":false,"allowInCombo":true,"comboOrder":3,"featuredOrder":0},{"id":"marquesitas","name":"Marquesitas","description":"Marquesitas crujientes.","category":"bufet","price":2.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":60,"active":true,"featured":false,"allowInCombo":true,"comboOrder":4,"featuredOrder":0},{"id":"tres-leches","name":"Dulce Tres Leches","description":"Postre tres leches tradicional.","category":"bufet","price":4.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":35,"active":true,"featured":true,"allowInCombo":true,"comboOrder":5,"featuredOrder":7},{"id":"olla-presion","name":"Olla de Presión 5 Litros","description":"Olla de presión de acero inoxidable.","category":"electrodomesticos","price":35,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":15,"active":true,"featured":false,"allowInCombo":false,"comboOrder":1,"featuredOrder":0},{"id":"ventilador","name":"Ventilador Recargable F6","description":"Ventilador portátil recargable.","category":"electrodomesticos","price":28,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":20,"active":true,"featured":true,"allowInCombo":false,"comboOrder":2,"featuredOrder":8},{"id":"turbinas","name":"Turbinas","description":"Turbinas de various potencias.","category":"electrodomesticos","price":45,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":10,"active":true,"featured":false,"allowInCombo":false,"comboOrder":3,"featuredOrder":0},{"id":"alarma","name":"Alarma para Paneles","description":"Sistema de alarma para paneles solares.","category":"electrodomesticos","price":22,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":18,"active":true,"featured":false,"allowInCombo":false,"comboOrder":4,"featuredOrder":0},{"id":"tv","name":"TV","description":"Televisor LED de última generación.","category":"electrodomesticos","price":150,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":8,"active":true,"featured":false,"allowInCombo":false,"comboOrder":5,"featuredOrder":0}]$seed$::jsonb) as x(
  id text,
  name text,
  description text,
  category text,
  price numeric,
  unit text,
  image text,
  stock integer,
  active boolean,
  featured boolean,
  allowInCombo boolean,
  comboOrder integer,
  featuredOrder integer
);

do $$
declare
  source_count integer;
  missing_categories text;
begin
  select count(*) into source_count from mvb_seed_products;
  if source_count <> 53 then
    raise exception 'Carga cancelada: se esperaban 53 productos y llegaron %.', source_count;
  end if;

  select string_agg(distinct s.category, ', ')
    into missing_categories
  from mvb_seed_products s
  left join public.categories c on c.slug = s.category
  where c.id is null;

  if missing_categories is not null then
    raise exception 'Carga cancelada. No existen estas categorías por slug: %', missing_categories;
  end if;

  if exists (
    select 1 from mvb_seed_products group by id having count(*) > 1
  ) then
    raise exception 'Carga cancelada: hay legacy_id duplicados en el archivo fuente.';
  end if;
end $$;

insert into public.products (
  name, slug, description, price, image_url, images, category_id,
  stock, active, featured, sort_order, legacy_id, unit,
  allow_in_combo, combo_order, featured_order
)
select
  s.name,
  s.id,
  s.description,
  s.price,
  nullif(s.image, ''),
  case when nullif(s.image, '') is null then '[]'::jsonb
       else jsonb_build_array(s.image) end,
  c.id,
  s.stock,
  s.active,
  s.featured,
  s.comboOrder,
  s.id,
  s.unit,
  s.allowInCombo,
  s.comboOrder,
  s.featuredOrder
from mvb_seed_products s
join public.categories c on c.slug = s.category
where not exists (
  select 1
  from public.products existing
  where existing.legacy_id = s.id
);

commit;

-- Verificación posterior: deben aparecer 53 productos activos en total
-- si la tabla estaba vacía antes de ejecutar este script.
select
  count(*) as productos_total,
  count(*) filter (where active = true) as productos_activos,
  count(*) filter (where category_id is null) as sin_categoria
from public.products;

select
  c.name as categoria,
  c.slug,
  count(p.id) as productos,
  count(p.id) filter (where p.active = true) as activos
from public.categories c
left join public.products p on p.category_id = c.id
group by c.id, c.name, c.slug, c.sort_order
order by c.sort_order;
