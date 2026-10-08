(function(){
  window.PDFLibReady=window.PDFLib;
  window.pdfFormatBytes=function(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB'};
  window.pdfDownload=function(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)};
  window.pdfFileArray=function(input){return Array.from(input.files||[])};
  window.pdfBindDrop=function(zone,input,callback){zone.addEventListener('click',()=>input.click());['dragenter','dragover'].forEach(e=>zone.addEventListener(e,x=>{x.preventDefault();zone.classList.add('drag')}));['dragleave','drop'].forEach(e=>zone.addEventListener(e,x=>{x.preventDefault();zone.classList.remove('drag')}));zone.addEventListener('drop',e=>callback(Array.from(e.dataTransfer.files||[])));input.addEventListener('change',()=>callback(Array.from(input.files||[])))};
  window.pdfIsPdf=f=>f&&f.type==='application/pdf'||/\.pdf$/i.test(f?.name||'');
  window.pdfIsImage=f=>f&&(/^image\/(jpeg|png|webp)$/i.test(f.type)||/\.(jpe?g|png|webp)$/i.test(f.name||''));
})();
