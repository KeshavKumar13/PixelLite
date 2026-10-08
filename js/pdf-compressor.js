(async function(){
  const input=document.querySelector('#pdf-input'),zone=document.querySelector('#drop-zone'),status=document.querySelector('#status'),info=document.querySelector('#info');
  let file=null;
  const setStatus=(t,c='')=>{status.textContent=t;status.className='status '+c};
  pdfBindDrop(zone,input,fs=>{file=fs.find(pdfIsPdf)||null;if(file){info.textContent=file.name+' · '+pdfFormatBytes(file.size);setStatus('PDF selected. Choose your compression level and start.')}});
  document.querySelector('#compress').onclick=async()=>{
    if(!file)return setStatus('Select a PDF first.','error');
    try{
      const quality=Number(document.querySelector('#quality').value);
      setStatus('Opening PDF…');
      const data=new Uint8Array(await file.arrayBuffer());
      const pdf=await pdfjsLib.getDocument({data}).promise;
      const outDoc=await PDFLib.PDFDocument.create();
      const total=pdf.numPages;
      for(let n=1;n<=total;n++){
        setStatus('Compressing page '+n+' of '+total+'…');
        const page=await pdf.getPage(n);
        const base=page.getViewport({scale:1});
        const maxDimension=quality>=0.8?2200:quality>=0.6?1800:1400;
        const scale=Math.min(2.0,Math.max(.75,maxDimension/Math.max(base.width,base.height)));
        const view=page.getViewport({scale});
        const canvas=document.createElement('canvas');
        canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
        const ctx=canvas.getContext('2d',{alpha:false});
        ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
        await page.render({canvasContext:ctx,viewport:view,background:'white'}).promise;
        const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('JPEG encoding failed')),'image/jpeg',quality));
        const img=await outDoc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
        const outPage=outDoc.addPage([img.width,img.height]);
        outPage.drawImage(img,{x:0,y:0,width:img.width,height:img.height});
        canvas.width=1;canvas.height=1;
      }
      const out=await outDoc.save({useObjectStreams:true,addDefaultPage:false});
      const blob=new Blob([out],{type:'application/pdf'});
      pdfDownload(blob,'pixellite-compressed.pdf');
      const saving=file.size-blob.size;
      const pct=file.size?Math.max(0,100*(1-blob.size/file.size)):0;
      setStatus((saving>0?'Reduced by '+pdfFormatBytes(saving)+' ('+pct.toFixed(1)+'%). ':'The compressed copy is not smaller. ')+pdfFormatBytes(blob.size),'ok');
    }catch(e){console.error(e);setStatus('Could not compress this PDF in this browser. Some encrypted, malformed, or very large PDFs may still fail.','error')}
  };
})();
