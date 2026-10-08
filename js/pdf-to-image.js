(function(){
  let file=null;
  const zone=document.querySelector('#drop-zone'),input=document.querySelector('#pdf-input'),status=document.querySelector('#status'),results=document.querySelector('#results'),scale=document.querySelector('#scale'),scaleValue=document.querySelector('#scale-value');
  const setStatus=(t,c='')=>{status.textContent=t;status.className='status '+c};
  function syncScale(){scaleValue.textContent=scale.value+'×';}
  scale.addEventListener('input',syncScale);syncScale();
  pdfBindDrop(zone,input,fs=>{file=fs.find(pdfIsPdf)||null;results.innerHTML='';if(file)setStatus(file.name+' selected.')});
  document.querySelector('#clear').onclick=()=>{file=null;results.innerHTML='';input.value='';setStatus('')};
  document.querySelector('#convert').onclick=async()=>{
    if(!file)return setStatus('Select a PDF first.','error');
    try{
      results.innerHTML='';
      const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
      const scaleValueNum=+scale.value;
      for(let n=1;n<=pdf.numPages;n++){
        setStatus('Rendering page '+n+' of '+pdf.numPages+'…');
        const page=await pdf.getPage(n),view=page.getViewport({scale:scaleValueNum}),canvas=document.createElement('canvas');
        canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
        await page.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;
        const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image encoding failed')),'image/jpeg',.92));
        const box=document.createElement('div');box.className='page-thumb';
        const img=document.createElement('img');img.src=URL.createObjectURL(blob);img.alt='PDF page '+n+' preview';img.style.width='100%';img.style.borderRadius='7px';
        const meta=document.createElement('div');meta.className='page-number';meta.textContent='Page '+n+' · '+Math.round(view.width)+'×'+Math.round(view.height)+' px';
        const btn=document.createElement('button');btn.className='btn';btn.style.width='100%';btn.style.marginTop='8px';btn.textContent='Download image';btn.onclick=()=>pdfDownload(blob,(file.name.replace(/\.pdf$/i,'')||'pdf')+'-page-'+n+'.jpg');
        box.append(img,meta,btn);results.appendChild(box);
        canvas.width=1;canvas.height=1;
      }
      setStatus(pdf.numPages+' page(s) converted successfully. Download each image below.','ok');
    }catch(e){console.error(e);setStatus('Could not convert this PDF.','error')}
  };
})();
