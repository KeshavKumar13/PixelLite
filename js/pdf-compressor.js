(async function(){
  const input=document.querySelector('#pdf-input'),zone=document.querySelector('#drop-zone'),status=document.querySelector('#status'),info=document.querySelector('#info'),qualityInput=document.querySelector('#quality'),qualityValue=document.querySelector('#quality-value');
  let file=null;
  const setStatus=(t,c='')=>{status.textContent=t;status.className='status '+c};
  const updateQuality=()=>{const q=Number(qualityInput.value);qualityValue.textContent=Math.round(q*100)+'%'};
  qualityInput.addEventListener('input',updateQuality);qualityInput.addEventListener('change',updateQuality);updateQuality();
  pdfBindDrop(zone,input,fs=>{file=fs.find(pdfIsPdf)||null;if(file){info.textContent=file.name+' · '+pdfFormatBytes(file.size);setStatus('PDF selected. Choose your compression level and start.')}});

  async function buildCompressed(data,quality,dimension){
    const pdf=await pdfjsLib.getDocument({data}).promise;
    const outDoc=await PDFLib.PDFDocument.create();
    for(let n=1;n<=pdf.numPages;n++){
      setStatus('Compressing page '+n+' of '+pdf.numPages+'…');
      const page=await pdf.getPage(n),base=page.getViewport({scale:1});
      const scale=Math.min(2.0,Math.max(.32,dimension/Math.max(base.width,base.height)));
      const view=page.getViewport({scale}),canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.ceil(view.width));canvas.height=Math.max(1,Math.ceil(view.height));
      const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
      await page.render({canvasContext:ctx,viewport:view,background:'white'}).promise;
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('JPEG encoding failed')),'image/jpeg',quality));
      const img=await outDoc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      const outPage=outDoc.addPage([img.width,img.height]);outPage.drawImage(img,{x:0,y:0,width:img.width,height:img.height});
      canvas.width=1;canvas.height=1;
    }
    const out=await outDoc.save({useObjectStreams:true,addDefaultPage:false});return new Blob([out],{type:'application/pdf'});
  }

  document.querySelector('#compress').onclick=async()=>{
    if(!file)return setStatus('Select a PDF first.','error');
    try{
      const requested=Number(qualityInput.value),data=new Uint8Array(await file.arrayBuffer());
      setStatus('Preparing compression…');
      // Keep the user's requested quality first. If the generated PDF is larger,
      // automatically try progressively smaller renders so a small PDF is not inflated.
      const attempts=[];
      for(let step=0;step<5;step++){
        const q=Math.max(.15,requested-step*.12);
        const dim=Math.max(520,Math.round((requested>=.8?1900:requested>=.6?1550:1200)-step*230));
        attempts.push([q,dim]);
      }
      let best=null;
      for(const [q,dim] of attempts){
        const candidate=await buildCompressed(data,q,dim);
        if(!best||candidate.size<best.size)best=candidate;
        if(candidate.size<file.size)break;
      }
      if(best.size>=file.size){
        setStatus('This PDF is already smaller than the browser-generated compressed copies ('+pdfFormatBytes(file.size)+'). No larger file was downloaded.','ok');
        return;
      }
      pdfDownload(best,'pixellite-compressed.pdf');
      const saving=file.size-best.size,pct=100*(1-best.size/file.size);
      setStatus('Reduced by '+pdfFormatBytes(saving)+' ('+pct.toFixed(1)+'%). New size: '+pdfFormatBytes(best.size),'ok');
    }catch(e){console.error(e);setStatus('Could not compress this PDF in this browser. Some encrypted, malformed, or very large PDFs may still fail.','error')}
  };
})();
