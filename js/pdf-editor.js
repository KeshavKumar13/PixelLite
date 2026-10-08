(async function(){
  const {PDFDocument,StandardFonts,rgb,degrees}=PDFLib;
  const input=document.querySelector('#pdf-input'),zone=document.querySelector('#drop-zone'),list=document.querySelector('#pdf-list'),thumbs=document.querySelector('#thumbs'),status=document.querySelector('#status');
  const selectedLabel=document.querySelector('#selected-page-label');
  let files=[],sources=[],pages=[],selectedPage=-1;
  const setStatus=(t,c='')=>{status.textContent=t;status.className='status '+c};
  const esc=s=>s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function updateToolbar(){
    const has=selectedPage>=0&&selectedPage<pages.length;
    selectedLabel.textContent=has?`Page ${selectedPage+1} selected`:'Select a page below';
    ['#page-up','#page-down','#page-rotate','#page-text','#page-icon','#page-delete'].forEach(sel=>{const b=document.querySelector(sel);if(b)b.disabled=!has});
  }
  function renderFiles(){list.innerHTML=files.map(f=>`<div class="file-row"><span class="file-name">${esc(f.name)}</span><span class="file-meta">${pdfFormatBytes(f.size)}</span></div>`).join('')}
  pdfBindDrop(zone,input,async fs=>{const added=fs.filter(pdfIsPdf);if(!added.length)return;files=added;await buildWorkspace()});
  async function buildWorkspace(){
    try{
      sources=[];pages=[];selectedPage=-1;
      if(!files.length){renderFiles();thumbs.innerHTML='';updateToolbar();setStatus('');return}
      setStatus('Reading PDF pages…');
      for(let fi=0;fi<files.length;fi++){
        const doc=await PDFDocument.load(await files[fi].arrayBuffer(),{ignoreEncryption:true});
        sources.push(doc);doc.getPages().forEach((_,pi)=>pages.push({fi,pi,rotation:0,annotations:[]}));
      }
      renderFiles();
      if(pages.length)selectedPage=0;
      await renderThumbs();
      setStatus(pages.length+' page(s) ready. Uploading another PDF replaces the previous one.','ok');
    }catch(e){console.error(e);files=[];sources=[];pages=[];selectedPage=-1;renderFiles();thumbs.innerHTML='';updateToolbar();setStatus('Could not open this PDF. Password protected or unusual PDFs may not work.','error')}
  }
  async function renderThumbs(){
    thumbs.innerHTML='';
    for(let i=0;i<pages.length;i++){
      const p=pages[i],box=document.createElement('div');
      box.className='page-thumb'+(i===selectedPage?' selected':'');
      box.innerHTML=`<canvas></canvas><div class="page-number">Page ${i+1}${i===selectedPage?' · Selected':''}</div>`;
      thumbs.appendChild(box);
      box.onclick=()=>{selectedPage=i;renderThumbSelection();updateToolbar()};
      await drawPdfThumb(files[p.fi],p.pi,box.querySelector('canvas'),p.rotation);
    }
    updateToolbar();
  }
  function renderThumbSelection(){document.querySelectorAll('.page-thumb').forEach((box,i)=>{box.classList.toggle('selected',i===selectedPage);const n=box.querySelector('.page-number');if(n)n.textContent=`Page ${i+1}${i===selectedPage?' · Selected':''}`})}
  async function drawPdfThumb(file,pageIndex,canvas,rot){const data=new Uint8Array(await file.arrayBuffer()),doc=await pdfjsLib.getDocument({data}).promise,page=await doc.getPage(pageIndex+1),base=page.getViewport({scale:1}),scale=Math.min(1.4,180/base.width),view=page.getViewport({scale,rotation:rot});canvas.width=view.width;canvas.height=view.height;await page.render({canvasContext:canvas.getContext('2d'),viewport:view,background:'white'}).promise}
  async function redrawSelected(){if(selectedPage<0)return;const box=thumbs.children[selectedPage],item=pages[selectedPage];if(box)await drawPdfThumb(files[item.fi],item.pi,box.querySelector('canvas'),item.rotation);renderThumbSelection();updateToolbar()}
  function requireSelection(){if(selectedPage<0||!pages[selectedPage]){setStatus('Select a page first.','error');return false}return true}
  function moveSelected(d){if(!requireSelection())return;const j=selectedPage+d;if(j<0||j>=pages.length)return;[pages[selectedPage],pages[j]]=[pages[j],pages[selectedPage]];selectedPage=j;renderThumbs()}
  function addAnnotation(type){if(!requireSelection())return;const val=type==='text'?prompt('Enter the text to add to this page:','PixelLite'):prompt('Enter a simple icon or symbol:','★');if(!val)return;pages[selectedPage].annotations.push({type,text:val});setStatus('Added '+(type==='text'?'text':'icon')+' to Page '+(selectedPage+1)+'.','ok')}
  document.querySelector('#page-up').onclick=()=>moveSelected(-1);
  document.querySelector('#page-down').onclick=()=>moveSelected(1);
  document.querySelector('#page-rotate').onclick=async()=>{if(!requireSelection())return;pages[selectedPage].rotation=(pages[selectedPage].rotation+90)%360;await redrawSelected();setStatus('Rotated Page '+(selectedPage+1)+'.','ok')};
  document.querySelector('#page-text').onclick=()=>addAnnotation('text');
  document.querySelector('#page-icon').onclick=()=>addAnnotation('icon');
  document.querySelector('#page-delete').onclick=()=>{if(!requireSelection())return;const deleted=selectedPage+1;pages.splice(selectedPage,1);if(!pages.length){selectedPage=-1;thumbs.innerHTML=''}else{selectedPage=Math.min(selectedPage,pages.length-1);renderThumbs()}setStatus('Removed Page '+deleted+'.','ok');updateToolbar()};
  document.querySelector('#save').onclick=async()=>{
    if(!pages.length)return setStatus('Add a PDF first.','error');
    try{
      setStatus('Building edited PDF…');const outDoc=await PDFDocument.create(),font=await outDoc.embedFont(StandardFonts.Helvetica),bold=await outDoc.embedFont(StandardFonts.HelveticaBold);
      for(const item of pages){const src=sources[item.fi],[pg]=await outDoc.copyPages(src,[item.pi]);pg.setRotation(degrees((pg.getRotation().angle+item.rotation)%360));outDoc.addPage(pg);const w=pg.getWidth(),h=pg.getHeight();let y=h-40;for(const a of item.annotations){if(a.type==='text'){pg.drawText(a.text,{x:36,y,size:18,font:bold,color:rgb(.12,.13,.18)})}else{pg.drawText(a.text,{x:36,y,size:24,font,color:rgb(.31,.27,.8)})}y-=34}}
      const footer=(document.querySelector('#footer-text').value||'').trim();if(footer)outDoc.getPages().forEach((pg,i)=>{pg.drawText(footer,{x:28,y:18,size:9,font,color:rgb(.35,.38,.45),opacity:.8});pg.drawText(String(i+1),{x:pg.getWidth()-32,y:18,size:9,font,color:rgb(.35,.38,.45),opacity:.8})});
      const out=await outDoc.save({useObjectStreams:true,addDefaultPage:false});pdfDownload(new Blob([out],{type:'application/pdf'}),'pixellite-edited.pdf');setStatus('Edited PDF downloaded. '+pdfFormatBytes(out.length),'ok')
    }catch(e){console.error(e);setStatus('Could not save the edited PDF.','error')}
  };
  updateToolbar();
})();
