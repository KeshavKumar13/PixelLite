const $=id=>document.getElementById(id);
const file=$('file'),drop=$('drop'),choose=$('choose'),editor=$('editor'),canvas=$('canvas'),cropOverlay=$('cropOverlay'),ctx=canvas.getContext('2d');
let original=null, image=null, crop=null, filter='none', baseName='image';

choose.onclick=()=>file.click(); drop.onclick=e=>{if(e.target===drop||e.target.tagName==='P'||e.target.tagName==='STRONG')file.click()};
['dragenter','dragover'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.add('drag')}));
['dragleave','drop'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.remove('drag')}));
drop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)loadFile(f)});
file.addEventListener('change',e=>{if(e.target.files[0])loadFile(e.target.files[0])});

function loadFile(f){
 if(!f.type.startsWith('image/')) return alert('Please choose an image file.');
 baseName=f.name.replace(/\.[^.]+$/,'')||'image';
 const r=new FileReader(); r.onload=()=>{const im=new Image();im.onload=()=>{original=im;image=im;resetAll(false);editor.hidden=false;drop.hidden=true;draw();scheduleEstimate()};im.src=r.result};r.readAsDataURL(f);
}
function resetAll(full=true){
 filter='none'; crop=null;
 $('w').value=image.naturalWidth; $('h').value=image.naturalHeight;
 $('brightness').value=100;$('contrast').value=100;$('saturation').value=100;
 $('aspect').value='free'; $('format').value='image/jpeg'; $('quality').value=82;
 document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter==='none'));
 if(full){draw();scheduleEstimate();}
}
document.querySelectorAll('.accordion-trigger').forEach(trigger=>trigger.addEventListener('click',()=>{
  const item=trigger.parentElement;
  const isOpen=item.classList.contains('open');
  document.querySelectorAll('.accordion-item.open').forEach(openItem=>{
    if(openItem!==item){
      openItem.classList.remove('open');
      openItem.querySelector('.accordion-trigger').setAttribute('aria-expanded','false');
    }
  });
  item.classList.toggle('open',!isOpen);
  trigger.setAttribute('aria-expanded',String(!isOpen));
}));

document.querySelectorAll('[data-open-section]').forEach(card=>card.addEventListener('click',()=>{
  const target=card.dataset.openSection;
  const item=document.querySelector('.accordion-item[data-section="'+target+'"]');
  if(!item)return;
  document.querySelectorAll('.accordion-item.open').forEach(openItem=>{
    if(openItem!==item){
      openItem.classList.remove('open');
      openItem.querySelector('.accordion-trigger').setAttribute('aria-expanded','false');
    }
  });
  item.classList.add('open');
  item.querySelector('.accordion-trigger').setAttribute('aria-expanded','true');
  const targetItem=item;
  if(targetItem){
    requestAnimationFrame(()=>{
      targetItem.scrollIntoView({behavior:'smooth',block:'start',inline:'nearest'});
      setTimeout(()=>{
        const rect=targetItem.getBoundingClientRect();
        if(rect.top < 78) window.scrollBy({top:rect.top-78,behavior:'smooth'});
      },350);
    });
  }
}));

$('reset').onclick=()=>{if(original){image=original;resetAll();}};
$('clear').onclick=()=>{
  editor.hidden=true;drop.hidden=false;file.value='';original=null;image=null;crop=null;dragging=false;
  canvas.style.position='absolute';canvas.style.visibility='hidden';cropOverlay.style.display='none';$('empty').hidden=false;
  $('estimate').textContent='No image selected';$('estimate').classList.add('warning');
  $('qv').textContent=$('quality').value+'%';
};

['w','h'].forEach(id=>$(id).addEventListener('input',e=>{
 if(!image)return;
 if($('lock').checked){const ratio=image.naturalWidth/image.naturalHeight;if(id==='w')$('h').value=Math.round(+e.target.value/ratio);else $('w').value=Math.round(+e.target.value*ratio)}
 draw();scheduleEstimate();
}));
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');draw();scheduleEstimate()});
['brightness','contrast','saturation'].forEach(id=>$(id).oninput=()=>{ $(id[0]+'v').textContent=$(id).value+'%';draw();scheduleEstimate()});
$('aspect').onchange=()=>{crop=null;draw()};

function cssFilter(){
 let f=`brightness(${$('brightness').value}%) contrast(${$('contrast').value}%) saturate(${$('saturation').value}%)`;
 if(filter==='grayscale')f+=' grayscale(100%)';
 if(filter==='sepia')f+=' sepia(75%)';
 if(filter==='warm')f+=' sepia(25%) saturate(135%)';
 if(filter==='cool')f+=' hue-rotate(165deg) saturate(115%)';
 if(filter==='vivid')f+=' saturate(170%) contrast(110%)';
 return f;
}
function draw(){
 if(!image)return;
 const w=Math.max(1,+$('w').value||image.naturalWidth),h=Math.max(1,+$('h').value||image.naturalHeight);
 canvas.width=w;canvas.height=h;canvas.style.position='relative';canvas.style.visibility='visible';ctx.filter=cssFilter();ctx.drawImage(image,0,0,w,h);ctx.filter='none';
 drawCropOverlay();
 $('empty').hidden=true;
}

function getCanvasPoint(e){
 const r=canvas.getBoundingClientRect();
 const x=Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width));
 const y=Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height));
 return {x,y};
}
function drawCropOverlay(){
 if(!crop){cropOverlay.style.display='none';return;}
 const cr=canvas.getBoundingClientRect();
 const pr=canvas.parentElement.getBoundingClientRect();
 const sx=cr.width/Math.max(canvas.width,1), sy=cr.height/Math.max(canvas.height,1);
 cropOverlay.style.display='block';
 cropOverlay.style.left=(cr.left-pr.left+crop.x*sx)+'px';
 cropOverlay.style.top=(cr.top-pr.top+crop.y*sy)+'px';
 cropOverlay.style.width=(crop.w*sx)+'px';
 cropOverlay.style.height=(crop.h*sy)+'px';
}
let dragging=false,start={};
canvas.addEventListener('pointerdown',e=>{
 if(!image)return;
 start=getCanvasPoint(e);
 crop={x:start.x,y:start.y,w:0,h:0};
 dragging=true;
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!dragging)return;
 const p=getCanvasPoint(e);
 const a=$('aspect').value;
 let left=Math.min(start.x,p.x),top=Math.min(start.y,p.y);
 let width=Math.abs(p.x-start.x),height=Math.abs(p.y-start.y);
 if(a!=='free'){
   const ratio=+a;
   if(width>0) height=width/ratio;
   else if(height>0) width=height*ratio;
   if(p.x<start.x) left=start.x-width;
   if(p.y<start.y) top=start.y-height;
 }
 width=Math.min(width,canvas.width);
 height=Math.min(height,canvas.height);
 left=Math.max(0,Math.min(left,canvas.width-width));
 top=Math.max(0,Math.min(top,canvas.height-height));
 if(a!=='free'){
   const ratio=+a;
   if(width/Math.max(height,1)>ratio) width=height*ratio;
   else height=width/ratio;
   left=Math.max(0,Math.min(left,canvas.width-width));
   top=Math.max(0,Math.min(top,canvas.height-height));
 }
 crop={x:left,y:top,w:width,h:height};
 draw();
});
function stopDragging(){dragging=false;}
canvas.addEventListener('pointerup',stopDragging);
canvas.addEventListener('pointercancel',stopDragging);
function scheduleEstimate(){
 estimateRequest++;
 clearTimeout(estimateTimer);
 if(!image){
   $('estimate').textContent='No image selected';
   $('estimate').classList.add('warning');
   return;
 }
 $('estimate').textContent='Calculating output size…';
 $('estimate').classList.remove('warning');
 estimateTimer=setTimeout(updateEstimate,120);
}
let estimateTimer=0,estimateRequest=0;
function updateEstimate(){
 if(!image){
   $('estimate').textContent='No image selected';
   $('estimate').classList.add('warning');
   return;
 }
 const type=$('format').value, q=+$('quality').value/100, request=++estimateRequest;
 canvas.toBlob(blob=>{
   if(!blob||request!==estimateRequest)return;
   $('estimate').classList.remove('warning');
   $('estimate').textContent='Estimated output: '+formatBytes(blob.size);
 },type,type==='image/png'?undefined:q);
}
$('applyCrop').onclick=()=>{
 if(!crop||crop.w<2||crop.h<2)return alert('Drag on the image first to select a crop area.');
 const selected={x:crop.x,y:crop.y,w:crop.w,h:crop.h};
 const temp=document.createElement('canvas');
 temp.width=Math.max(1,Math.round(selected.w));
 temp.height=Math.max(1,Math.round(selected.h));
 const tctx=temp.getContext('2d');
 // Crop the rendered image only. The crop rectangle is a separate DOM overlay, so it is never baked into the image.
 tctx.drawImage(canvas,selected.x,selected.y,selected.w,selected.h,0,0,temp.width,temp.height);
 crop=null;
 dragging=false;
 cropOverlay.style.display='none';
 const im=new Image();
 im.onload=()=>{
   image=im;
   $('w').value=im.width;
   $('h').value=im.height;
   draw();
   scheduleEstimate();
 };
 im.src=temp.toDataURL('image/png');
};
$('format').onchange=()=>{
 if($('format').value==='image/png'){$('quality').disabled=true;$('qv').textContent='N/A'}
 else{$('quality').disabled=false;$('qv').textContent=$('quality').value+'%'}
 scheduleEstimate();
};
$('quality').oninput=()=>{
 $('qv').textContent=$('quality').value+'%';
 scheduleEstimate();
};

$('download').onclick=()=>{
 if(!image){$('estimate').textContent='No image selected';$('estimate').classList.add('warning');return;}
 const type=$('format').value, q=+$('quality').value/100;
 canvas.toBlob(blob=>{
   if(!blob)return;
   $('estimate').textContent='Output: '+formatBytes(blob.size);
   const ext=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
   const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=baseName+'-edited.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 },type,type==='image/png'?undefined:q);
};
function formatBytes(n){return n<1024?(n+' B'):(n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB')}
