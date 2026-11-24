/* Shared catalog source: Supabase first, JSON fallback. Public key only; RLS controls visibility. */
(function(){
'use strict';
async function fallback(){
 const r=await fetch('data/products.json');
 if(!r.ok)throw new Error('No se pudo leer el catálogo local');
 return r.json();
}
function mapCategory(c){
 return {id:c.slug||c.id,name:c.name,icon:c.icon||'shopping-bag',description:c.description||'',image:c.image_url||'',active:c.active!==false,allowInCombo:c.allow_in_combo!==false,sortOrder:Number(c.sort_order||0)};
}
function mapProduct(p,categoryById){
 const category=p.categories||p.category||categoryById.get(p.category_id)||{};
 const regular=Number(p.price||0), sale=p.sale_price==null?null:Number(p.sale_price);
 return {id:p.legacy_id||p.slug||p.id,dbId:p.id,slug:p.slug||'',name:p.name,description:p.description||'',price:sale!==null?sale:regular,originalPrice:sale!==null&&sale<regular?regular:null,oldPrice:sale!==null&&sale<regular?regular:null,unit:p.unit||'unidad',category:category.slug||'',categoryId:p.category_id||null,image:p.image_url||(Array.isArray(p.images)?p.images[0]:null)||'',images:Array.isArray(p.images)?p.images:[],stock:Number(p.stock||0),active:p.active!==false,featured:p.featured===true,featuredOrder:Number(p.featured_order||0),comboOrder:Number(p.combo_order||p.sort_order||0),allowInCombo:p.allow_in_combo!==false};
}
async function load(){
 let local;try{local=await fallback()}catch(e){local={products:[],categories:[]}}
 try{
  if(!window.supabase||!window.MV_SUPABASE_URL||!window.MV_SUPABASE_KEY)throw new Error('Supabase no configurado');
  const client=window.supabase.createClient(window.MV_SUPABASE_URL,window.MV_SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const [pr,cr]=await Promise.all([client.from('products').select('*, categories(slug,name)').eq('active',true).order('sort_order'),client.from('categories').select('*').eq('active',true).order('sort_order')]);
  if(pr.error)throw pr.error;if(cr.error)throw cr.error;
  if(!pr.data||pr.data.length===0)throw new Error('Supabase no contiene productos; se usa el catálogo de respaldo');
  const categories=cr.data.map(mapCategory);
  const products=pr.data.map(mapProduct);
  if(products.some(p=>!p.category)){const localCats=local.categories||[];products.forEach(p=>{if(!p.category){const c=localCats.find(x=>x.id===p.categoryId);if(c)p.category=c.id}})}
  categories.forEach(c=>{c.count=products.filter(p=>p.category===c.id).length});
  return {...local,products,categories,source:'supabase'};
 }catch(error){
  console.warn('[MV Bichota] Catálogo de respaldo:',error.message);
  return {...local,products:(local.products||[]).filter(p=>p.active!==false),categories:(local.categories||[]).filter(c=>c.active!==false),source:'json'};
 }
}
window.MVStoreData={load};
})();