(async function(){
  const input=document.querySelector('#pdf-input'),zone=document.querySelector('#drop-zone'),status=document.querySelector('#status'),info=document.querySelector('#info');
  let file=null;
  const setStatus=(t,c='')=>{status.textContent=t;status.className='status '+c};
  pdfBindDrop(zone,input,fs=>{file=fs.find(pdfIsPdf)||null;if(file){info.textContent=file.name+' · '+pdfFormatBytes(file.size);setStatus('PDF selected. Choose your compression level and start.')}});
  async function structureOptimize(bytes){
    try{
      const doc=await PDFLib.PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false});
      const out=await doc.save({useObjectStreams:true,addDefaultPage:false,objectsPerTick:50});
      return new Blob([out],{type:'application/pdf'});
    }catch(e){return null}
  }
  async function rasterCompress(bytes,quality){
    const pdf=await pdfjsLib.getDocument({data:bytes}).promise;
    const outDoc=await PDFLib.PDFDocument.create();
    for(let n=1;n<=pdf.numPages;n++){
      setStatus('Compressing page '+n+' of '+pdf.numPages+'…');
      const page=await pdf.getPage(n),base=page.getViewport({scale:1});
      const maxDimension=quality>=0.8?1800:quality>=0.6?1300:1000;
      const scale=Math.min(1.75,Math.max(.5,maxDimension/Math.max(base.width,base.height)));
      const view=page.getViewport({scale});
      const canvas=document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
      const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
      await page.render({canvasContext:ctx,viewport:view,background:'white'}).promise;
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('JPEG encoding failed')),'image/jpeg',quality));
      const img=await outDoc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      const pg=outDoc.addPage([base.width,base.height]);pg.drawImage(img,{x:0,y:0,width:base.width,height:base.height});
      canvas.width=1;canvas.height=1;
    }
    const out=await outDoc.save({useObjectStreams:true,addDefaultPage:false});
    return new Blob([out],{type:'application/pdf'});
  }
  document.querySelector('#compress').onclick=async()=>{
    if(!file)return setStatus('Select a PDF first.','error');
    try{
      const quality=Number(document.querySelector('#quality').value), bytes=new Uint8Array(await file.arrayBuffer());
      setStatus('Trying lossless PDF optimization…');
      let best=await structureOptimize(bytes);
      if(!best || best.size>=file.size){
        setStatus('Trying image compression…');
        const candidates=[quality,Math.max(.35,quality-.15),.35];
        for(const q of candidates){
          try{const candidate=await rasterCompress(bytes,q);if(candidate && (!best||candidate.size<best.size))best=candidate}catch(e){console.warn('Raster candidate failed',q,e)}
          if(best && best.size<file.size)break;
        }
      }
      if(!best || best.size>=file.size){
        setStatus('This PDF is already highly optimized. No smaller copy could be produced without making it larger.','error');
        return;
      }
      const saving=file.size-best.size,pct=100*saving/file.size;
      pdfDownload(best,'pixellite-compressed.pdf');
      setStatus('Compressed successfully. Reduced by '+pdfFormatBytes(saving)+' ('+pct.toFixed(1)+'%) · '+pdfFormatBytes(best.size),'ok');
    }catch(e){console.error(e);setStatus('Could not compress this PDF in this browser. Some encrypted, malformed, or very large PDFs may still fail.','error')}
  };
})();