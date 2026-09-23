(() => {
  const drop = document.getElementById('converterDrop');
  const choose = document.getElementById('chooseBtn');
  const input = document.getElementById('fileInput');
  const workspace = document.getElementById('workspace');
  const preview = document.getElementById('preview');
  const fileInfo = document.getElementById('fileInfo');
  const format = document.getElementById('format');
  const quality = document.getElementById('quality');
  const qualityValue = document.getElementById('qualityValue');
  const qualityWrap = document.getElementById('qualityWrap');
  const estimatedSize = document.getElementById('estimatedSize');
  const result = document.getElementById('result');
  const download = document.getElementById('downloadBtn');

  let sourceFile = null;
  let sourceImage = null;

  const labels = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP'
  };

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B','KB','MB','GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, i)).toFixed(i ? 2 : 0)} ${units[i]}`;
  }

  function loadFile(file) {
    if (!file || !/^image\/(png|jpeg|webp)$/i.test(file.type)) {
      alert('Please choose a PNG, JPG or WEBP image.');
      return;
    }

    sourceFile = file;
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      sourceImage = img;
      preview.src = url;
      preview.alt = `Preview of ${file.name}`;
      fileInfo.textContent = `${file.name} • ${img.naturalWidth} × ${img.naturalHeight} • ${formatBytes(file.size)}`;
      workspace.style.display = 'grid';
      updateQualityVisibility();
      estimateOutputSize();
      result.textContent = `Ready to convert ${file.name}.`;
      URL.revokeObjectURL(url);

      // After upload, bring the top of the conversion controls into view,
      // matching the Editor's upload behavior. Keep the header visible.
      setTimeout(() => {
        const controls = document.querySelector('.converter-controls');
        if (!controls) return;
        const header = document.querySelector('header');
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const target = Math.max(0, controls.getBoundingClientRect().top + window.scrollY - headerHeight - 12);
        window.scrollTo({ top: target, behavior: 'smooth' });
      }, 180);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert('This image could not be loaded.');
    };

    img.src = url;
  }

  let estimateTimer = null;

  function estimateOutputSize() {
    if (!sourceImage || !estimatedSize) return;
    if (format.value === 'image/png') {
      estimatedSize.textContent = 'Estimated size: PNG size depends on the image.';
      return;
    }
    clearTimeout(estimateTimer);
    estimatedSize.textContent = 'Estimating size…';
    estimateTimer = setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = sourceImage.naturalWidth;
      canvas.height = sourceImage.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (format.value === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(sourceImage, 0, 0);
      canvas.toBlob(blob => {
        if (blob) estimatedSize.textContent = `Estimated size: ${formatBytes(blob.size)}`;
        else estimatedSize.textContent = 'Estimated size unavailable';
      }, format.value, Number(quality.value) / 100);
    }, 80);
  }

  function updateQualityVisibility() {
    const lossy = format.value === 'image/jpeg' || format.value === 'image/webp';
    qualityWrap.style.display = lossy ? 'block' : 'none';
    qualityValue.textContent = quality.value + '%';
    if (estimatedSize) estimatedSize.style.display = lossy ? 'block' : 'none';
  }

  choose.addEventListener('click', () => input.click());
  drop.addEventListener('click', (e) => {
    if (e.target !== choose) input.click();
  });

  input.addEventListener('change', () => {
    if (input.files && input.files[0]) loadFile(input.files[0]);
    input.value = '';
  });

  ['dragenter','dragover'].forEach(type => {
    drop.addEventListener(type, e => {
      e.preventDefault();
      drop.classList.add('drag');
    });
  });

  ['dragleave','drop'].forEach(type => {
    drop.addEventListener(type, e => {
      e.preventDefault();
      drop.classList.remove('drag');
    });
  });

  drop.addEventListener('drop', e => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  quality.addEventListener('input', () => {
    qualityValue.textContent = quality.value + '%';
    estimateOutputSize();
  });

  format.addEventListener('change', () => {
    updateQualityVisibility();
    estimateOutputSize();
    if (sourceFile) result.textContent = `Ready to convert to ${labels[format.value]}.`;
  });

  download.addEventListener('click', () => {
    if (!sourceImage || !sourceFile) return;

    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.naturalWidth;
    canvas.height = sourceImage.naturalHeight;
    const ctx = canvas.getContext('2d');

    // JPG has no alpha channel; use a white background to avoid black transparency.
    if (format.value === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(sourceImage, 0, 0);

    const qualityValueNum = Number(quality.value) / 100;
    canvas.toBlob(blob => {
      if (!blob) {
        alert('Conversion failed. Please try another image.');
        return;
      }

      const ext = labels[format.value].toLowerCase();
      const base = sourceFile.name.replace(/\.[^.]+$/, '') || 'pixellite-image';
      const filename = `${base}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      result.textContent = `Converted to ${labels[format.value]} • ${formatBytes(blob.size)} • downloaded as ${filename}`;
    }, format.value, qualityValueNum);
  });

  updateQualityVisibility();
})();
