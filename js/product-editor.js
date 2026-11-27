/* MV Bichota product editor integration. Keeps the existing admin controller and dialog. */
(function(){
'use strict';
const BUCKET='product-images',MAX_FILE=8*1024*1024,ALLOWED=new Set(['image/jpeg','image/png','image/webp']);
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sb,items=[],editing=null,dragged=-1,cupPriceSupported=null,selectedIndex=0;
function makeSlug(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
async function uniqueSlug(name,currentId){const base=makeSlug(name);if(!base)throw Error('El nombre no produce un identificador válido.');let candidate=base,n=2;while(true){let query=sb.from('products').select('id').eq('slug',candidate).limit(1);if(currentId)query=query.neq('id',currentId);const {data,error}=await query;if(error)throw error;if(!data?.length)return candidate;candidate=base+'-'+n++}}
function describeError(error){return [error?.message,error?.code&&'Código: '+error.code,error?.details&&'Detalles: '+error.details,error?.hint&&'Sugerencia: '+error.hint].filter(Boolean).join(' | ')||'Error desconocido de Supabase'}
function toast(text,error=false){const el=$('#toast');if(!el)return;el.textContent=text;el.className='toast show'+(error?' error':'');setTimeout(()=>el.className='toast',3600)}
function parseImages(p){let list=Array.isArray(p.images)?p.images:[];list=list.map(x=>typeof x==='string'?{url:x}:x).filter(x=>x&&x.url);if(p.image_url&&!list.some(x=>x.url===p.image_url))list.unshift({url:p.image_url});return list.map(x=>({url:x.url,file:null,removed:false}))}
function field(label,name,value='',type='text',extra=''){return `<label class="field ${extra}"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${type==='number'?'step="0.01"':''}></label>`}
window.MV_OPEN_PRODUCT_EDITOR=async function(product){editing=product||null;items=product?parseImages(product):[];selectedIndex=0;const [categoryResult,cupProbe]=await Promise.all([sb.from('categories').select('id,name').order('sort_order'),cupPriceSupported===null?sb.from('products').select('price_cup').limit(1):Promise.resolve({error:cupPriceSupported?null:new Error('price_cup todavía no está disponible')})]);const {data,error}=categoryResult;if(error)throw error;if(cupPriceSupported===null)cupPriceSupported=!cupProbe.error;const cats=data||[];const cupPriceField=cupPriceSupported?field('Precio CUP','price_cup',product?.price_cup??'','number'):'';$('#editorTitle').textContent=product?'Editar producto':'Nuevo producto';$('#editor').dataset.type='product';$('#editor').dataset.id=product?.id||'';
 const fields=$('#editorFields');fields.className='form-grid product-editor-grid';fields.innerHTML=`
 <section class="product-form-section image-section"><div class="section-title"><div><h3>Fotografías</h3><p>JPG, PNG o WEBP · Máximo 8 MB cada una</p></div><span class="image-count" id="imageCount"></span></div><div class="product-image-drop" id="productDrop" tabindex="0"><strong>Arrastra las fotos aquí</strong><span>o elige cámara, galería o archivos</span><div class="image-source-actions"><button type="button" class="btn ghost" data-pick="camera">Cámara</button><button type="button" class="btn ghost" data-pick="gallery">Galería</button><button type="button" class="btn ghost" data-pick="files">Desde computadora</button></div><input hidden id="imageInput" type="file" accept="image/jpeg,image/png,image/webp" multiple><input hidden id="cameraInput" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"></div><div class="image-preview-heading"><b>Vista previa</b><small>La primera fotografía será la portada del producto</small></div><div id="imagePreviewStage" class="image-preview-stage"><div class="image-preview-empty"><span>▧</span><b>Sin fotografías todavía</b><small>Agrega una imagen para ver la presentación</small></div></div><div id="imageProgress" class="image-progress" hidden><span></span></div><div class="image-gallery-heading"><b>Galería de fotografías</b><small>Selecciona, arrastra para ordenar o utiliza las herramientas</small></div><div id="imageGallery" class="product-image-gallery"></div></section>
 <section class="product-form-section"><h3>Información del producto</h3><div class="form-grid">${field('Nombre *','name',product?.name||'','text','full-field')}<label class="field full-field"><span>Descripción</span><textarea name="description">${esc(product?.description||'')}</textarea></label>${field('Precio *','price',product?.price??'','number')}${field('Precio promocional USD','sale_price',product?.sale_price??'','number')}${cupPriceField}<label class="field"><span>Categoría</span><select name="category_id"><option value="">Sin categoría</option>${cats.map(c=>`<option value="${esc(c.id)}" ${product?.category_id===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>${field('Unidad','unit',product?.unit||'unidad')}${field('Existencias','stock',product?.stock??0,'number')}${field('Orden','sort_order',product?.sort_order??0,'number')}${field('Orden de destacados','featured_order',product?.featured_order??0,'number')}</div></section>
 <section class="product-form-section"><h3>Disponibilidad y visibilidad</h3><div class="product-switches"><label class="product-switch"><input type="checkbox" name="is_available" ${product?.is_available!==false?'checked':''}><span><b>Disponible para comprar</b><small>La existencia cero también bloquea la compra.</small></span></label><label class="product-switch"><input type="checkbox" name="active" ${product?.active!==false?'checked':''}><span><b>Visible en la tienda</b><small>Independiente de la disponibilidad.</small></span></label></div><div class="form-grid">${field('Destacado','featured','','checkbox')}${field('Permitir en combos','allow_in_combo','','checkbox')}</div></section>`;
 const form=$('#editorForm');if(product){fields.querySelector('[name=featured]').checked=!!product.featured;fields.querySelector('[name=allow_in_combo]').checked=product.allow_in_combo!==false}else fields.querySelector('[name=allow_in_combo]').checked=true;
 form.querySelector('.editor-actions .primary').textContent='Guardar producto';wireGallery();renderGallery();$('#editor').showModal();};
function wireGallery(){const drop=$('#productDrop'),input=$('#imageInput'),camera=$('#cameraInput');$('#editorFields').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=> (b.dataset.pick==='camera'?camera:input).click());input.onchange=()=>{addFiles(input.files);input.value=''};camera.onchange=()=>{addFiles(camera.files);camera.value=''};['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('is-over')}));['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('is-over')}));drop.addEventListener('drop',e=>addFiles(e.dataTransfer.files));drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click()}})}
function addFiles(files){for(const file of Array.from(files||[])){if(!ALLOWED.has(file.type)){toast('Formato no admitido. Usa JPG, PNG o WEBP.',true);continue}if(file.size>MAX_FILE){toast('Cada imagen debe pesar 8 MB o menos.',true);continue}items.push({url:URL.createObjectURL(file),file,removed:false})}renderGallery()}
function renderGallery(){
 const box=$('#imageGallery'),stage=$('#imagePreviewStage');if(!box||!stage)return;
 const visible=items.filter(x=>!x.removed);
 if(selectedIndex>=visible.length)selectedIndex=Math.max(0,visible.length-1);
 $('#imageCount').textContent=`${visible.length} foto${visible.length===1?'':'s'}`;
 if(!visible.length){
  stage.innerHTML='<div class="image-preview-empty"><span>▧</span><b>Tu producto todavía no tiene fotografías</b><small>Agrega imágenes desde la cámara, galería o computadora</small></div>';
  box.innerHTML='';return;
 }
 const current=visible[selectedIndex]||visible[0];
 stage.innerHTML=`<img class="image-preview-main" src="${esc(current.url)}" alt="Vista previa de fotografía del producto"><div class="image-preview-overlay"><span class="image-main-badge">${selectedIndex===0?"★ Imagen principal":"Vista previa"}</span><span class="image-preview-index">${selectedIndex+1} de ${visible.length}</span></div>`;
 box.innerHTML=visible.map((x,i)=>`<article class="image-tile ${i===selectedIndex?'is-selected':''}" draggable="true" data-index="${i}"><button type="button" class="image-thumb-select" data-select-image="${i}" aria-label="Previsualizar fotografía ${i+1}"><img src="${esc(x.url)}" alt="Miniatura ${i+1}"></button><span class="image-tile-label">${i===0?'★ Principal':'Foto '+(i+1)}</span><div class="image-tile-actions"><button type="button" data-main="${i}" title="Usar como principal" aria-label="Usar como principal">★</button><button type="button" data-crop="${i}" title="Recortar" aria-label="Recortar">✂</button><button type="button" data-replace="${i}" title="Reemplazar" aria-label="Reemplazar">↻</button><button type="button" data-remove="${i}" title="Eliminar" aria-label="Eliminar">×</button></div></article>`).join('');
 box.querySelectorAll('[data-select-image]').forEach(b=>b.onclick=()=>{selectedIndex=Number(b.dataset.selectImage);renderGallery()});
 box.querySelectorAll('[data-main]').forEach(b=>b.onclick=()=>{const chosen=visible.splice(Number(b.dataset.main),1)[0];visible.unshift(chosen);items=visible;selectedIndex=0;renderGallery()});
 box.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const chosen=visible[Number(b.dataset.remove)];if(!confirm('¿Eliminar esta fotografía de la galería?'))return;if(chosen.file)URL.revokeObjectURL(chosen.url);items=items.filter(x=>x!==chosen);selectedIndex=Math.min(selectedIndex,Math.max(0,visible.length-2));renderGallery()});
 box.querySelectorAll('[data-replace]').forEach(b=>b.onclick=()=>{const idx=Number(b.dataset.replace),picker=document.createElement('input');picker.type='file';picker.accept='image/jpeg,image/png,image/webp';picker.onchange=()=>{const f=picker.files?.[0];if(!f)return;if(!ALLOWED.has(f.type)||f.size>MAX_FILE){toast('Imagen no válida o superior a 8 MB.',true);return}const old=visible[idx];if(old.file)URL.revokeObjectURL(old.url);old.file=f;old.url=URL.createObjectURL(f);selectedIndex=idx;renderGallery()};picker.click()});
 box.querySelectorAll('[data-crop]').forEach(b=>b.onclick=()=>cropImage(visible[Number(b.dataset.crop)]));
 box.querySelectorAll('.image-tile').forEach(tile=>{tile.ondragstart=()=>{dragged=Number(tile.dataset.index)};tile.ondragover=e=>{e.preventDefault();tile.classList.add('is-over')};tile.ondragleave=()=>tile.classList.remove('is-over');tile.ondrop=e=>{e.preventDefault();const to=Number(tile.dataset.index);tile.classList.remove('is-over');if(dragged<0||dragged===to)return;const [moved]=visible.splice(dragged,1);visible.splice(to,0,moved);items=visible;selectedIndex=to;dragged=-1;renderGallery()}});
}function cropImage(item){
 const dialog=document.createElement('dialog');
 dialog.className='crop-dialog crop-dialog-pro';
 dialog.innerHTML='<div class="crop-dialog-content"><div class="crop-heading"><div><h3>Recortar fotografía</h3><p>Selecciona el área que quieres conservar. Puedes moverla y cambiar su tamaño.</p></div><span class="crop-dimensions" data-crop-dimensions>—</span></div><div class="crop-stage"><canvas width="800" height="600" aria-label="Área interactiva para recortar la fotografía"></canvas><div class="crop-loading" data-crop-loading>Cargando fotografía…</div></div><div class="crop-toolbar"><label class="crop-ratio-label">Proporción <select data-crop-ratio><option value="free">Libre (cualquier dimensión)</option><option value="original">Original de la foto</option><option value="1:1">Cuadrado 1:1</option><option value="4:3">Horizontal 4:3</option><option value="3:4">Vertical 3:4</option><option value="16:9">Panorámica 16:9</option><option value="9:16">Vertical 9:16</option><option value="3:2">Horizontal 3:2</option><option value="2:3">Vertical 2:3</option></select></label><label class="crop-zoom-label">Tamaño del recorte <input data-crop-size type="range" min="20" max="100" value="82"></label></div><p class="crop-help">Arrastra dentro del marco para moverlo. Arrastra los bordes o las esquinas para cambiar el tamaño. En modo Libre puedes elegir cualquier proporción.</p><div class="editor-actions"><button type="button" class="btn ghost" data-crop-cancel>Cancelar</button><button type="button" class="btn primary" data-crop-apply>Aplicar recorte</button></div></div>';
 document.body.append(dialog);
 const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),img=new Image(),ratioSelect=dialog.querySelector('[data-crop-ratio]'),sizeControl=dialog.querySelector('[data-crop-size]'),cancel=dialog.querySelector('[data-crop-cancel]'),apply=dialog.querySelector('[data-crop-apply]'),loading=dialog.querySelector('[data-crop-loading]'),dimensions=dialog.querySelector('[data-crop-dimensions]');
 const W=canvas.width,H=canvas.height,MIN=28;
 let closed=false,drag=null,ratio='free',imageRect={x:0,y:0,w:W,h:H},crop={x:0,y:0,w:0,h:0};
 function ratioValue(value){
  if(value==='free')return null;
  if(value==='original')return img.naturalWidth/img.naturalHeight;
  const parts=value.split(':').map(Number);return parts[0]/parts[1];
 }
 function clampCrop(){
  crop.w=Math.max(MIN,Math.min(crop.w,imageRect.w));crop.h=Math.max(MIN,Math.min(crop.h,imageRect.h));
  crop.x=Math.max(imageRect.x,Math.min(crop.x,imageRect.x+imageRect.w-crop.w));
  crop.y=Math.max(imageRect.y,Math.min(crop.y,imageRect.y+imageRect.h-crop.h));
 }
 function initialCrop(){
  const r=ratioValue(ratio);let w=imageRect.w*.82,h=imageRect.h*.82;
  if(r){if(w/h>r)w=h*r;else h=w/r}
  crop={x:imageRect.x+(imageRect.w-w)/2,y:imageRect.y+(imageRect.h-h)/2,w,h};clampCrop();
 }
 function fitImage(){
  const scale=Math.min(W/img.naturalWidth,H/img.naturalHeight);
  const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
  imageRect={x:(W-w)/2,y:(H-h)/2,w,h};
 }
 function handles(){
  const {x,y,w,h}=crop,m=9;
  return [{id:'nw',x,y},{id:'n',x:x+w/2,y},{id:'ne',x:x+w,y},{id:'e',x:x+w,y:y+h/2},{id:'se',x:x+w,y:y+h},{id:'s',x:x+w/2,y:y+h},{id:'sw',x,y:y+h},{id:'w',x,y:y+h/2}].map(p=>({...p,r:m}));
 }
 function draw(){
  if(!img.naturalWidth||!img.naturalHeight)return;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#171317';ctx.fillRect(0,0,W,H);
  ctx.drawImage(img,imageRect.x,imageRect.y,imageRect.w,imageRect.h);
  ctx.save();ctx.fillStyle='rgba(10,8,12,.62)';ctx.beginPath();ctx.rect(0,0,W,H);ctx.rect(crop.x,crop.y,crop.w,crop.h);ctx.fill('evenodd');ctx.restore();
  ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([]);ctx.strokeRect(crop.x,crop.y,crop.w,crop.h);
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1;ctx.beginPath();
  for(let i=1;i<3;i++){ctx.moveTo(crop.x+crop.w*i/3,crop.y);ctx.lineTo(crop.x+crop.w*i/3,crop.y+crop.h);ctx.moveTo(crop.x,crop.y+crop.h*i/3);ctx.lineTo(crop.x+crop.w,crop.y+crop.h*i/3)}
  ctx.stroke();
  handles().forEach(p=>{ctx.beginPath();ctx.fillStyle='#fff';ctx.strokeStyle='#7b2737';ctx.lineWidth=2;ctx.roundRect(p.x-6,p.y-6,12,12,3);ctx.fill();ctx.stroke()});
  ctx.restore();
  const sx=img.naturalWidth/imageRect.w,sy=img.naturalHeight/imageRect.h;
  dimensions.textContent=Math.round(crop.w*sx)+' × '+Math.round(crop.h*sy)+' px';
 }
 function close(){if(closed)return;closed=true;if(dialog.open)dialog.close();dialog.remove()}
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
 function hit(p){
  for(const h of handles()){if(Math.abs(p.x-h.x)<15&&Math.abs(p.y-h.y)<15)return h.id}
  if(p.x>=crop.x&&p.x<=crop.x+crop.w&&p.y>=crop.y&&p.y<=crop.y+crop.h)return 'move';
  return null;
 }
 function resizeCrop(which,p){
  const old={...drag.crop},dx=p.x-drag.start.x,dy=p.y-drag.start.y;
  if(which==='move'){crop.x=Math.max(imageRect.x,Math.min(imageRect.x+imageRect.w-crop.w,old.x+dx));crop.y=Math.max(imageRect.y,Math.min(imageRect.y+imageRect.h-crop.h,old.y+dy));return}
  let left=old.x,top=old.y,right=old.x+old.w,bottom=old.y+old.h;
  if(which.includes('w'))left=Math.max(imageRect.x,Math.min(right-MIN,old.x+dx));
  if(which.includes('e'))right=Math.min(imageRect.x+imageRect.w,Math.max(left+MIN,old.x+old.w+dx));
  if(which.includes('n'))top=Math.max(imageRect.y,Math.min(bottom-MIN,old.y+dy));
  if(which.includes('s'))bottom=Math.min(imageRect.y+imageRect.h,Math.max(top+MIN,old.y+old.h+dy));
  const r=ratioValue(ratio);
  if(r){
   let w=right-left,h=bottom-top;
   if(which==='n'||which==='s')w=h*r;
   else if(which==='e'||which==='w')h=w/r;
   else if(w/h>r)h=w/r;else w=h*r;
   if(w>imageRect.x+imageRect.w-left){w=imageRect.x+imageRect.w-left;h=w/r}
   if(h>imageRect.y+imageRect.h-top){h=imageRect.y+imageRect.h-top;w=h*r}
   if(which.includes('w'))left=right-w;else right=left+w;
   if(which.includes('n'))top=bottom-h;else bottom=top+h;
   left=Math.max(imageRect.x,left);top=Math.max(imageRect.y,top);
  }
  crop={x:left,y:top,w:right-left,h:bottom-top};clampCrop();
 }
 img.onload=()=>{loading.hidden=true;fitImage();initialCrop();draw()};
 img.onerror=()=>{toast('No se pudo cargar la fotografía para recortarla.',true);close()};
 if(!item.url.startsWith('blob:')&&!item.url.startsWith('data:'))img.crossOrigin='anonymous';
 img.src=item.url;
 canvas.addEventListener('pointerdown',e=>{if(!img.naturalWidth)return;const p=point(e),which=hit(p);if(!which)return;drag={which,start:p,crop:{...crop}};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag){const p=point(e),h=hit(p);canvas.style.cursor=h==='move'?'move':h?({nw:'nwse-resize',se:'nwse-resize',ne:'nesw-resize',sw:'nesw-resize',n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize'}[h]):'crosshair';return}resizeCrop(drag.which,point(e));draw()});
 const stop=()=>{drag=null};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
 ratioSelect.addEventListener('change',()=>{ratio=ratioSelect.value;initialCrop();draw()});
 sizeControl.addEventListener('input',()=>{const oldCenter={x:crop.x+crop.w/2,y:crop.y+crop.h/2};const r=ratioValue(ratio),factor=Number(sizeControl.value)/82;let w=imageRect.w*.82*factor,h=imageRect.h*.82*factor;if(r){if(w/h>r)w=h*r;else h=w/r}crop={x:oldCenter.x-w/2,y:oldCenter.y-h/2,w,h};clampCrop();draw()});
 cancel.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close()});
 apply.addEventListener('click',async e=>{
  e.preventDefault();e.stopPropagation();if(apply.disabled)return;
  if(!img.complete||!img.naturalWidth){toast('Espera a que termine de cargar la fotografía.',true);return}
  apply.disabled=true;apply.textContent='Aplicando…';
  try{
   const scaleX=img.naturalWidth/imageRect.w,scaleY=img.naturalHeight/imageRect.h;
   const sx=Math.max(0,Math.round((crop.x-imageRect.x)*scaleX)),sy=Math.max(0,Math.round((crop.y-imageRect.y)*scaleY));
   const sw=Math.min(img.naturalWidth-sx,Math.round(crop.w*scaleX)),sh=Math.min(img.naturalHeight-sy,Math.round(crop.h*scaleY));
   if(sw<1||sh<1)throw new Error('El área seleccionada es demasiado pequeña.');
   const out=document.createElement('canvas');out.width=sw;out.height=sh;
   const outCtx=out.getContext('2d');outCtx.drawImage(img,sx,sy,sw,sh,0,0,sw,sh);
   const blob=await new Promise((resolve,reject)=>{try{out.toBlob(b=>b?resolve(b):reject(new Error('No se pudo generar el recorte.')),'image/jpeg',.94)}catch(error){reject(error)}});
   const file=new File([blob],'product-crop.jpg',{type:'image/jpeg'}),url=URL.createObjectURL(file);
   if(item.file&&item.url.startsWith('blob:'))URL.revokeObjectURL(item.url);
   item.file=file;item.url=url;renderGallery();close();toast('Recorte aplicado. Guarda los cambios del producto para conservarlo.');
  }catch(error){console.error('[MV Bichota] Crop failed',error);toast(error?.name==='SecurityError'?'No se pudo editar esta imagen por restricciones de origen. Vuelve a subirla e inténtalo otra vez.':(error?.message||'No se pudo aplicar el recorte.'),true)}
  finally{if(!closed){apply.disabled=false;apply.textContent='Aplicar recorte'}}
 });
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});dialog.addEventListener('click',e=>{if(e.target===dialog)close()});dialog.showModal();
}
function progress(value){const bar=$('#imageProgress');if(bar){bar.hidden=false;bar.firstElementChild.style.width=value+'%'}}
async function upload(item,productId,index){if(!item.file)return item.url;const ext=item.file.type==='image/png'?'png':item.file.type==='image/webp'?'webp':'jpg',path=`${productId}/${crypto.randomUUID()}-${index}.${ext}`,{error}=await sb.storage.from(BUCKET).upload(path,item.file,{contentType:item.file.type,cacheControl:'3600',upsert:false});if(error)throw error;return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl}
async function save(e){e.preventDefault();const form=e.target;if(form.dataset.saving==='1')return;form.dataset.saving='1';const submit=form.querySelector('[type=submit]');submit.disabled=true;let productId=editing?.id;try{const fd=new FormData(form),v=n=>fd.get(n),checked=n=>form.elements[n].checked,name=String(v('name')||'').trim(),price=Number(v('price'));if(!name||!Number.isFinite(price)||price<0)throw Error('Indica un nombre y un precio válido.');const sale=v('sale_price')===''?null:Number(v('sale_price'));if(sale!==null&&(!Number.isFinite(sale)||sale<0))throw Error('El precio promocional no es válido.');const slug=editing?.slug||await uniqueSlug(name,productId);const cupValue=v('price_cup')===''?null:Number(v('price_cup'));if(cupPriceSupported&&cupValue!==null&&(!Number.isFinite(cupValue)||cupValue<0))throw Error('El precio CUP debe ser un número válido.');const base={name,slug,description:String(v('description')||''),price,sale_price:sale,...(cupPriceSupported?{price_cup:cupValue}:{}),unit:v('unit')||'unidad',stock:Math.max(0,Number(v('stock')||0)),category_id:v('category_id')||null,active:checked('active'),is_available:checked('is_available'),featured:checked('featured'),allow_in_combo:checked('allow_in_combo'),sort_order:Number(v('sort_order')||0),featured_order:Number(v('featured_order')||0)};
 if(productId){const {error}=await sb.from('products').update(base).eq('id',productId);if(error)throw error}else{const {data,error}=await sb.from('products').insert(base).select('id').single();if(error)throw error;productId=data.id}const kept=items.filter(x=>!x.removed),urls=[];for(let i=0;i<kept.length;i++){progress(Math.round(i/Math.max(1,kept.length)*100));urls.push(await upload(kept[i],productId,i))}const {error}=await sb.from('products').update({image_url:urls[0]||null,images:urls}).eq('id',productId);if(error)throw error;progress(100);$('#editor').close();toast(editing?'Producto actualizado.':'Producto creado.');if(typeof window.MV_ADMIN_REFRESH==='function')await window.MV_ADMIN_REFRESH();}catch(err){console.error('[MV Bichota] Product save failed',{message:err?.message,code:err?.code,details:err?.details,hint:err?.hint,error:err});toast(describeError(err),true)}finally{form.dataset.saving='';submit.disabled=false;const bar=$('#imageProgress');if(bar)bar.hidden=true}}
document.addEventListener('DOMContentLoaded',()=>{if(!window.supabase||!window.MV_SUPABASE_URL||!window.MV_SUPABASE_KEY)return;try{sb=window.MV_SUPABASE_CLIENT||(typeof window.MV_getSupabaseClient==='function'?window.MV_getSupabaseClient():null)}catch(error){console.error(error)}if(!sb){console.error('[MV Bichota] Supabase client was not initialized');toast('No se pudo inicializar la conexión compartida con Supabase.',true);return;}const view=$('#view'),form=$('#editorForm');if(!view||!form)return;
 view.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const title=$('#viewTitle')?.textContent,isNew=b.id==='addNew'&&title==='Productos',isEdit=b.dataset.edit==='product';if(!isNew&&!isEdit)return;e.preventDefault();e.stopImmediatePropagation();try{let product=null;if(isEdit){const {data,error}=await sb.from('products').select('*').eq('id',b.dataset.id).single();if(error)throw error;product=data}await openProduct(product)}catch(err){console.error('[MV Bichota] Could not open product editor',err);toast(err.message||'No se pudo abrir el producto.',true)}},true);
 document.addEventListener('submit',e=>{if(e.target!==$('#editorForm')||$('#editor')?.dataset.type!=='product')return;e.preventDefault();e.stopImmediatePropagation();save(e)},true);
});
})();
