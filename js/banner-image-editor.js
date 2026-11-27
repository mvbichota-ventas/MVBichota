/* MV Bichota - editor de recorte para imágenes de banners */
(function(){
'use strict';
const MAX=8*1024*1024,types=['image/jpeg','image/png','image/webp'];
const ratios={free:NaN,original:null,'1:1':1,'4:3':4/3,'3:4':3/4,'16:9':16/9,'9:16':9/16,'3:2':3/2,'2:3':2/3};
let active=null,sourceUrl=null,sourceFile=null;
const $=(s,r=document)=>r.querySelector(s);
function toast(message,error=false){const el=$('#toast');if(!el)return;el.textContent=message;el.className='toast show'+(error?' error':'');}
function addControls(){
 const dialog=$('#editor'),fields=$('#editorFields'),input=$('input[name="image_file"]',fields);
 if(!dialog||dialog.dataset.type!=='banner'||!input||input.dataset.cropReady)return;
 input.dataset.cropReady='1';
 const block=input.closest('.field');
 const actions=document.createElement('div');actions.className='banner-crop-actions';
 actions.innerHTML='<button type="button" class="btn ghost" data-banner-crop>✂ Editar y recortar imagen</button><span class="hint" data-banner-crop-status>Selecciona una imagen para editarla antes de guardar.</span>';
 block.insertAdjacentElement('afterend',actions);
 const button=$('[data-banner-crop]',actions);
 const urlInput=$('input[name="image_url"]',fields);
 input.addEventListener('change',()=>{const f=input.files&&input.files[0];if(f&&(!types.includes(f.type)||f.size>MAX)){input.value='';toast('Usa JPG, PNG o WEBP de máximo 8 MB.',true);return;}});
 button.addEventListener('click',()=>openCropper(input,urlInput,actions));
}
function ensureModal(){
 let modal=$('#bannerCropModal');if(modal)return modal;
 modal=document.createElement('dialog');modal.id='bannerCropModal';modal.className='banner-crop-modal';
 modal.innerHTML='<div class="banner-crop-head"><div><h2>Editor de imagen del banner</h2><p>Recorta, cambia proporciones y ajusta la imagen antes de guardar.</p></div><button type="button" class="icon-close" data-close aria-label="Cerrar">×</button></div><div class="banner-crop-stage"><img alt="Imagen para recortar" data-crop-image></div><div class="banner-crop-tools"><label>Proporción<select data-ratio><option value="free">Libre · cualquier dimensión</option><option value="original">Original</option><option value="1:1">Cuadrado 1:1</option><option value="4:3">Horizontal 4:3</option><option value="3:4">Vertical 3:4</option><option value="16:9">Panorámica 16:9</option><option value="9:16">Vertical 9:16</option><option value="3:2">Horizontal 3:2</option><option value="2:3">Vertical 2:3</option></select></label><label>Zoom<input type="range" min="0" max="100" value="0" data-zoom></label><div class="banner-crop-rotate"><button type="button" class="btn ghost" data-rotate="-90">↶ Girar</button><button type="button" class="btn ghost" data-rotate="90">↷ Girar</button><button type="button" class="btn ghost" data-flip>⇋ Voltear</button></div></div><p class="hint">Arrastra la imagen para encuadrarla. Usa las esquinas para ajustar el área de recorte.</p><div class="editor-actions"><button type="button" class="btn ghost" data-cancel>Cancelar</button><button type="button" class="btn primary" data-apply>Aplicar recorte</button></div>';
 document.body.append(modal);
 modal.querySelector('[data-close]').onclick=()=>modal.close();
 modal.querySelector('[data-cancel]').onclick=()=>modal.close();
 modal.addEventListener('close',cleanup);
 modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
 return modal;
}
function cleanup(){if(active){active.destroy();active=null}if(sourceUrl){URL.revokeObjectURL(sourceUrl);sourceUrl=null}sourceFile=null}
async function openCropper(input,urlInput,actions){
 if(!window.Cropper){toast('No se pudo cargar el editor de imágenes. Recarga el administrador.',true);return}
 const file=input.files&&input.files[0];let blob=file||null;
 if(!blob&&urlInput.value.trim()){
  try{const response=await fetch(urlInput.value.trim(),{mode:'cors'});if(!response.ok)throw Error();blob=await response.blob();if(!types.includes(blob.type))throw Error()}
  catch(_){toast('No se pudo abrir la imagen actual para editarla. Descárgala y selecciónala como archivo.',true);return}
 }
 if(!blob){toast('Primero selecciona una imagen para el banner.',true);return}
 if(blob.size>MAX){toast('La imagen debe pesar 8 MB o menos.',true);return}
 const modal=ensureModal(),img=$('[data-crop-image]',modal),ratio=$('[data-ratio]',modal),zoom=$('[data-zoom]',modal);
 cleanup();sourceFile=file||new File([blob],'banner-image.'+(blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg'),{type:blob.type});
 sourceUrl=URL.createObjectURL(blob);
 img.onload=()=>{
  requestAnimationFrame(()=>{
   if(!modal.open)return;
   try{active=new Cropper(img,{viewMode:1,dragMode:'move',autoCropArea:.88,background:false,responsive:true,restore:false,guides:true,center:true,highlight:true,cropBoxMovable:true,cropBoxResizable:true,toggleDragModeOnDblclick:false,ready(){ratio.value='free';zoom.value='0'}});}
   catch(error){console.error('[MV Bichota] Could not initialize banner cropper',error);toast('No se pudo iniciar el recortador. Intenta seleccionar la imagen nuevamente.',true)}
  });
 };
 img.onerror=()=>{toast('No se pudo cargar la imagen seleccionada.',true)};
 modal.showModal();img.src=sourceUrl;
 ratio.onchange=()=>{if(!active)return;const v=ratio.value;active.setAspectRatio(v==='free'?NaN:v==='original'?img.naturalWidth/img.naturalHeight:ratios[v])};
 zoom.oninput=()=>{if(active)active.zoomTo(1+Number(zoom.value)/100)};
 modal.querySelectorAll('[data-rotate]').forEach(b=>b.onclick=()=>active&&active.rotate(Number(b.dataset.rotate)));
 modal.querySelector('[data-flip]').onclick=()=>{if(!active)return;const data=active.getData();active.scaleX(data.scaleX===-1?1:-1)};
 modal.querySelector('[data-apply]').onclick=()=>{
  if(!active)return;const apply=modal.querySelector('[data-apply]');apply.disabled=true;apply.textContent='Aplicando…';
  try{
   const canvas=active.getCroppedCanvas({maxWidth:6000,maxHeight:6000,imageSmoothingEnabled:true,imageSmoothingQuality:'high'});
   canvas.toBlob(blobOut=>{
    if(!blobOut){toast('No se pudo generar el recorte.',true);apply.disabled=false;apply.textContent='Aplicar recorte';return}
    const ext=blobOut.type==='image/png'?'png':blobOut.type==='image/webp'?'webp':'jpg';
    const cropped=new File([blobOut],'mv-bichota-banner-'+Date.now()+'.'+ext,{type:blobOut.type});
    if(cropped.size>MAX){toast('El recorte supera 8 MB. Reduce el tamaño de la imagen.',true);apply.disabled=false;apply.textContent='Aplicar recorte';return}
    const transfer=new DataTransfer();transfer.items.add(cropped);input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
    const status=$('[data-banner-crop-status]',actions);if(status)status.textContent='Imagen recortada y lista para guardar.';
    toast('Recorte aplicado. Pulsa «Guardar cambios» para subirlo.');modal.close();
    apply.disabled=false;apply.textContent='Aplicar recorte';
   },sourceFile.type||'image/jpeg',.94);
  }catch(error){console.error('[MV Bichota] Banner crop failed',error);toast('No se pudo aplicar el recorte.',true);apply.disabled=false;apply.textContent='Aplicar recorte'}
 };
}
document.addEventListener('DOMContentLoaded',()=>{
 const target=$('#editorFields');if(!target)return;
 new MutationObserver(addControls).observe(target,{childList:true,subtree:true});
 addControls();
});
})();