const $=id=>document.getElementById(id);
const file=$('file'),drop=$('drop'),choose=$('choose'),editor=$('editor'),canvas=$('canvas'),cropOverlay=$('cropOverlay'),ctx=canvas.getContext('2d');
const accordion=$('controlsAccordion'),applyBtn=$('applyChangesBottom'),downloadBtn=$('download'),panel=document.querySelector('.panel');

let original=null,image=null,crop=null,baseName='image',dragging=false,start={};
const neutralFilters=()=>({filter:'none',blur:0,brightness:100,contrast:100,grayscale:0,hue:0,invert:0,opacity:100,saturation:100,sepia:0,shadow:0,rotation:0,flipH:false,flipV:false});
const filterKeys=['filter','blur','brightness','contrast','grayscale','hue','invert','opacity','saturation','sepia','shadow','rotation','flipH','flipV'];
let committed={w:0,h:0,format:'image/jpeg',quality:82,...neutralFilters()};
let pending={...committed};
let dirty=false;
// When filters are committed, this is the image immediately before the committed filter stack.
let filterBase=null;

function filterState(source=pending){const s={};filterKeys.forEach(k=>s[k]=source[k]);return s}
function hasActiveFilters(s=pending){return s.filter!=='none'||s.blur!==0||s.brightness!==100||s.contrast!==100||s.grayscale!==0||s.hue!==0||s.invert!==0||s.opacity!==100||s.saturation!==100||s.sepia!==0||s.shadow!==0}
function cloneState(s){return {...s}}

function syncControls(){
  $('w').value=pending.w;$('h').value=pending.h;
  $('blur').value=pending.blur;$('blurv').textContent=pending.blur+'px';
  $('brightness').value=pending.brightness;$('bv').textContent=pending.brightness+'%';
  $('contrast').value=pending.contrast;$('cv').textContent=pending.contrast+'%';
  $('grayscale').value=pending.grayscale;$('grayv').textContent=pending.grayscale+'%';
  $('hue').value=pending.hue;$('huev').textContent=pending.hue+'°';
  $('invert').value=pending.invert;$('invertv').textContent=pending.invert+'%';
  $('opacity').value=pending.opacity;$('opacityv').textContent=pending.opacity+'%';
  $('saturation').value=pending.saturation;$('sv').textContent=pending.saturation+'%';
  $('sepia').value=pending.sepia;$('sepiav').textContent=pending.sepia+'%';
  $('shadow').value=pending.shadow;$('shadowv').textContent=pending.shadow+'px';
  $('aspect').value='free';$('format').value=pending.format;$('quality').value=pending.quality;
  $('rotation').value=String(pending.rotation||0);$('flipH').checked=!!pending.flipH;$('flipV').checked=!!pending.flipV;
  $('qv').textContent=pending.format==='image/png'?'N/A':pending.quality+'%';$('quality').disabled=pending.format==='image/png';
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===pending.filter));
}
function setDirty(value=true){
  dirty=value;applyBtn.disabled=!dirty;downloadBtn.disabled=dirty;
  if(dirty){$('estimate').textContent='Apply Changes to update output size';$('estimate').classList.remove('warning')}
  else scheduleEstimate();
}

function loadFile(f){
  if(!f.type.startsWith('image/')) return alert('Please choose an image file.');
  baseName=f.name.replace(/\.[^.]+$/,'')||'image';
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
    original=im;image=im;filterBase=im;crop=null;
    committed={w:im.naturalWidth,h:im.naturalHeight,format:'image/jpeg',quality:82,...neutralFilters()};
    pending=cloneState(committed);syncControls();setDirty(false);editor.hidden=false;drop.hidden=true;
    setTimeout(()=>{
      if(!panel)return;
      const header=document.querySelector('header');
      const headerHeight=header ? header.getBoundingClientRect().height : 0;
      const target=Math.max(0, panel.getBoundingClientRect().top + window.scrollY - headerHeight - 12);
      window.scrollTo({top:target,behavior:'smooth'});
    },180);
    canvas.style.position='relative';canvas.style.visibility='visible';drawCommitted();
  };im.src=r.result};r.readAsDataURL(f);
}
choose.onclick=()=>file.click();
drop.onclick=e=>{if(e.target===drop||e.target.tagName==='P'||e.target.tagName==='STRONG'||e.target.classList.contains('converter-drop'))file.click()};
['dragenter','dragover'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.add('drag')}));
['dragleave','drop'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.remove('drag')}));
drop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)loadFile(f)});file.addEventListener('change',e=>{if(e.target.files[0])loadFile(e.target.files[0])});

function discardUnappliedChanges(){
  pending=cloneState(committed);
  crop=null;
  syncControls();
  setDirty(false);
  drawCommitted();
}

function openSection(target,card){
  // Moving to another tool intentionally discards everything not yet applied.
  if(dirty) discardUnappliedChanges();
  document.querySelectorAll('.editor-feature[data-open-section]').forEach(tab=>tab.classList.toggle('active',tab===card));
  document.querySelectorAll('.accordion-item').forEach(item=>{
    const selected=item.dataset.section===target;
    item.classList.toggle('open',selected);
    item.querySelector('.accordion-trigger')?.setAttribute('aria-expanded',String(selected));
  });
}
document.querySelectorAll('.accordion-trigger').forEach(trigger=>trigger.addEventListener('click',()=>openSection(trigger.parentElement.dataset.section,document.querySelector(`[data-open-section="${trigger.parentElement.dataset.section}"]`))));
document.querySelectorAll('[data-open-section]').forEach(card=>card.addEventListener('click',()=>openSection(card.dataset.openSection,card)));

$('reset').onclick=()=>{
  if(!original)return;
  image=original;filterBase=original;crop=null;
  committed={w:original.naturalWidth,h:original.naturalHeight,format:'image/jpeg',quality:82,...neutralFilters()};
  pending=cloneState(committed);syncControls();setDirty(false);drawCommitted();
};
$('clear').onclick=()=>{editor.hidden=true;drop.hidden=false;file.value='';original=null;image=null;crop=null;filterBase=null;dirty=false;applyBtn.disabled=true;downloadBtn.disabled=false;canvas.style.position='absolute';canvas.style.visibility='hidden';cropOverlay.style.display='none';$('estimate').textContent='No image selected';$('estimate').classList.add('warning')};

['w','h'].forEach(id=>$(id).addEventListener('input',e=>{
  if(!image)return;const value=Math.max(1,+e.target.value||1);pending[id]=value;
  if($('lock').checked){const ratio=committed.w/Math.max(committed.h,1);if(id==='w'){pending.h=Math.max(1,Math.round(value/ratio));$('h').value=pending.h}else{pending.w=Math.max(1,Math.round(value*ratio));$('w').value=pending.w}}
  setDirty(true);drawPendingPreview();
}));

const sliders={blur:['blurv','px'],brightness:['bv','%'],contrast:['cv','%'],grayscale:['grayv','%'],hue:['huev','°'],invert:['invertv','%'],opacity:['opacityv','%'],saturation:['sv','%'],sepia:['sepiav','%'],shadow:['shadowv','px']};
Object.keys(sliders).forEach(id=>$(id).addEventListener('input',()=>{
  pending[id]=+$(id).value;
  const out=$(sliders[id][0]);out.textContent=pending[id]+sliders[id][1];
  setDirty(true);drawPendingPreview();
}));
$('aspect').onchange=()=>{crop=null;drawCropOverlay()};

function filterString(s){
  let f=`blur(${s.blur}px) brightness(${s.brightness}%) contrast(${s.contrast}%) grayscale(${s.grayscale}%) hue-rotate(${s.hue}deg) invert(${s.invert}%) opacity(${s.opacity}%) saturate(${s.saturation}%) sepia(${s.sepia}%)`;
  if(s.shadow>0)f+=` drop-shadow(${s.shadow}px ${s.shadow}px ${Math.max(1,s.shadow/2)}px rgba(0,0,0,.35))`;
  return f;
}
function getFilterSource(){return hasActiveFilters(committed) && filterBase ? filterBase : image}
function renderToCanvas(sourceImage,state,useCrop=false){
  const source=document.createElement('canvas');
  source.width=sourceImage.naturalWidth;source.height=sourceImage.naturalHeight;
  source.getContext('2d').drawImage(sourceImage,0,0,source.width,source.height);
  let working=source;
  if(useCrop&&crop&&crop.w>=2&&crop.h>=2){
    const out=document.createElement('canvas');out.width=Math.max(1,Math.round(crop.w));out.height=Math.max(1,Math.round(crop.h));
    out.getContext('2d').drawImage(working,crop.x,crop.y,crop.w,crop.h,0,0,out.width,out.height);working=out;
  }
  const rotation=((+state.rotation||0)%360+360)%360;
  const rotated=document.createElement('canvas');
  if(rotation===90||rotation===270){rotated.width=working.height;rotated.height=working.width}else{rotated.width=working.width;rotated.height=working.height}
  const rctx=rotated.getContext('2d');
  rctx.save();
  rctx.translate(rotated.width/2,rotated.height/2);
  rctx.rotate(rotation*Math.PI/180);
  rctx.scale(state.flipH?-1:1,state.flipV?-1:1);
  rctx.drawImage(working,-working.width/2,-working.height/2);
  rctx.restore();
  working=rotated;
  const resizeChanged=state.w!==committed.w||state.h!==committed.h;
  let targetW=resizeChanged?state.w:working.width,targetH=resizeChanged?state.h:working.height;
  if((rotation===90||rotation===270)&&!resizeChanged){targetW=working.width;targetH=working.height}
  const out=document.createElement('canvas');out.width=Math.max(1,Math.round(targetW));out.height=Math.max(1,Math.round(targetH));
  const octx=out.getContext('2d');octx.filter=filterString(state);octx.drawImage(working,0,0,out.width,out.height);octx.filter='none';return out;
}
function drawCommitted(){
  if(!image)return;
  canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.style.position='relative';canvas.style.visibility='visible';ctx.filter='none';ctx.globalAlpha=1;ctx.drawImage(image,0,0,canvas.width,canvas.height);drawCropOverlay();
}
function drawPendingPreview(){
  if(!image||!dirty)return;
  const source=getFilterSource();
  const out=renderToCanvas(source,pending,false);
  canvas.width=out.width;canvas.height=out.height;canvas.style.position='relative';canvas.style.visibility='visible';ctx.filter='none';ctx.globalAlpha=1;ctx.drawImage(out,0,0);drawCropOverlay();
}
function getCanvasPoint(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width)),y:Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height))}}
function drawCropOverlay(){if(!crop){cropOverlay.style.display='none';return}const cr=canvas.getBoundingClientRect(),pr=canvas.parentElement.getBoundingClientRect(),sx=cr.width/Math.max(canvas.width,1),sy=cr.height/Math.max(canvas.height,1);cropOverlay.style.display='block';cropOverlay.style.left=(cr.left-pr.left+crop.x*sx)+'px';cropOverlay.style.top=(cr.top-pr.top+crop.y*sy)+'px';cropOverlay.style.width=(crop.w*sx)+'px';cropOverlay.style.height=(crop.h*sy)+'px'}
canvas.addEventListener('pointerdown',e=>{if(!image)return;start=getCanvasPoint(e);crop={x:start.x,y:start.y,w:0,h:0};dragging=true;setDirty(true);canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const p=getCanvasPoint(e),a=$('aspect').value;let left=Math.min(start.x,p.x),top=Math.min(start.y,p.y),width=Math.abs(p.x-start.x),height=Math.abs(p.y-start.y);if(a!=='free'){const ratio=+a;if(width>0)height=width/ratio;else if(height>0)width=height*ratio;if(p.x<start.x)left=start.x-width;if(p.y<start.y)top=start.y-height}width=Math.min(width,canvas.width);height=Math.min(height,canvas.height);left=Math.max(0,Math.min(left,canvas.width-width));top=Math.max(0,Math.min(top,canvas.height-height));if(a!=='free'){const ratio=+a;if(width/Math.max(height,1)>ratio)width=height*ratio;else height=width/ratio;left=Math.max(0,Math.min(left,canvas.width-width));top=Math.max(0,Math.min(top,canvas.height-height))}crop={x:left,y:top,w:width,h:height};drawCropOverlay()});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);

function createProcessedCanvas(){
  const source=getFilterSource();
  return renderToCanvas(source,pending,true);
}

applyBtn.onclick=()=>{
  if(!dirty||!image)return;
  applyBtn.disabled=true;
  const hadFilters=hasActiveFilters(pending);
  const nonFilterChanged=pending.w!==committed.w||pending.h!==committed.h||!!crop;
  const source=getFilterSource();
  const out=createProcessedCanvas(),data=out.toDataURL('image/png'),im=new Image();
  im.onload=()=>{
    image=im;
    committed={w:im.naturalWidth,h:im.naturalHeight,format:pending.format,quality:pending.quality,...filterState(pending)};
    if(hadFilters){
      if(nonFilterChanged){
        // Keep a new base representing the committed image before its filter stack.
        const baseState={...pending,...neutralFilters()};
        const base=renderToCanvas(source,baseState,true);
        const bimg=new Image();
        bimg.onload=()=>{filterBase=bimg;finishApply()};
        bimg.src=base.toDataURL('image/png');
        return;
      }
      // Filter-only changes are always rebuilt from the same pre-filter image.
      filterBase=source;
    }else{
      filterBase=image;
    }
    finishApply();
  };
  im.src=data;
};
function finishApply(){
  crop=null;pending=cloneState(committed);syncControls();dirty=false;applyBtn.disabled=true;downloadBtn.disabled=false;drawCommitted();scheduleEstimate();
}

['rotation'].forEach(id=>$(id).addEventListener('change',()=>{pending.rotation=+$(id).value;setDirty(true);drawPendingPreview()}));
['flipH','flipV'].forEach(id=>$(id).addEventListener('change',()=>{pending[id]=$(id).checked;setDirty(true);drawPendingPreview()}));

$('format').onchange=()=>{pending.format=$('format').value;$('quality').disabled=pending.format==='image/png';$('qv').textContent=pending.format==='image/png'?'N/A':pending.quality+'%';setDirty(true)};
$('quality').oninput=()=>{pending.quality=+$('quality').value;$('qv').textContent=pending.quality+'%';setDirty(true)};
$('download').onclick=()=>{if(!image||dirty)return;const type=committed.format,q=committed.quality/100;canvas.toBlob(blob=>{if(!blob)return;$('estimate').textContent='Output: '+formatBytes(blob.size);const ext=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=baseName+'-edited.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)},type,type==='image/png'?undefined:q)};
let estimateTimer=0;function scheduleEstimate(){clearTimeout(estimateTimer);if(!image){$('estimate').textContent='No image selected';$('estimate').classList.add('warning');return}if(dirty){$('estimate').textContent='Apply Changes to update output size';$('estimate').classList.remove('warning');return}$('estimate').textContent='Calculating output size…';estimateTimer=setTimeout(updateEstimate,120)}
function updateEstimate(){if(!image||dirty)return;const type=committed.format,q=committed.quality/100;canvas.toBlob(blob=>{if(!blob||dirty)return;$('estimate').classList.remove('warning');$('estimate').textContent='Estimated output: '+formatBytes(blob.size)},type,type==='image/png'?undefined:q)}
function formatBytes(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB'}


