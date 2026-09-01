(function () {
  'use strict';

  var MM_TO_PX = 300 / 25.4;
  var SIZES = {
    '1inch': { w: 25, h: 35 },
    '2inch': { w: 35, h: 49 },
    small2inch: { w: 35, h: 45 },
    passport: { w: 33, h: 48 },
    visa_us: { w: 51, h: 51 },
  };

  var dropzone = document.getElementById('dropzone');
  var fileInput = document.getElementById('fileInput');
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var sizeSelect = document.getElementById('sizeSelect');
  var zoomInput = document.getElementById('zoomInput');
  var btnExport = document.getElementById('btnExport');
  var btnReset = document.getElementById('btnReset');

  var img = new Image();
  var loaded = false;
  var offset = { x: 0, y: 0 };
  var zoom = 1;
  var dragging = false;
  var dragStart = null;

  var DISPLAY_MAX = 420;

  function targetPx() {
    var mm = SIZES[sizeSelect.value];
    return { w: Math.round(mm.w * MM_TO_PX), h: Math.round(mm.h * MM_TO_PX) };
  }

  function setCanvasDisplaySize() {
    var t = targetPx();
    var ratio = t.w / t.h;
    var w, h;
    if (ratio >= 1) { w = DISPLAY_MAX; h = Math.round(DISPLAY_MAX / ratio); }
    else { h = DISPLAY_MAX; w = Math.round(DISPLAY_MAX * ratio); }
    canvas.width = w;
    canvas.height = h;
  }

  function baseScale() {
    return Math.max(canvas.width / img.width, canvas.height / img.height);
  }

  function clampOffset() {
    var s = baseScale() * zoom;
    var dw = img.width * s, dh = img.height * s;
    var maxOffX = Math.max(0, (dw - canvas.width) / 2);
    var maxOffY = Math.max(0, (dh - canvas.height) / 2);
    offset.x = Math.max(-maxOffX, Math.min(maxOffX, offset.x));
    offset.y = Math.max(-maxOffY, Math.min(maxOffY, offset.y));
  }

  function render() {
    if (!loaded) return;
    clampOffset();
    var s = baseScale() * zoom;
    var dw = img.width * s, dh = img.height * s;
    var dx = canvas.width / 2 - dw / 2 + offset.x;
    var dy = canvas.height / 2 - dh / 2 + offset.y;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  }

  function loadFile(file) {
    if (!file || file.type.indexOf('image/') !== 0) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      img.onload = function () {
        loaded = true;
        offset = { x: 0, y: 0 };
        zoom = 1;
        zoomInput.value = 1;
        setCanvasDisplaySize();
        render();
        stage.classList.add('show');
        dropzone.style.display = 'none';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  dropzone.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function (e) { loadFile(e.target.files[0]); });
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); });
  dropzone.addEventListener('drop', function (e) { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });

  canvas.addEventListener('mousedown', function (e) {
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, offX: offset.x, offY: offset.y };
  });
  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    offset.x = dragStart.offX + (e.clientX - dragStart.x);
    offset.y = dragStart.offY + (e.clientY - dragStart.y);
    render();
  });
  window.addEventListener('mouseup', function () { dragging = false; });

  zoomInput.addEventListener('input', function () {
    zoom = parseFloat(zoomInput.value);
    render();
  });
  sizeSelect.addEventListener('change', function () {
    setCanvasDisplaySize();
    offset = { x: 0, y: 0 };
    render();
  });
  btnReset.addEventListener('click', function () {
    loaded = false;
    stage.classList.remove('show');
    dropzone.style.display = '';
    fileInput.value = '';
  });

  btnExport.addEventListener('click', function () {
    if (!loaded) return;
    var t = targetPx();
    var out = document.createElement('canvas');
    out.width = t.w;
    out.height = t.h;
    var octx = out.getContext('2d');
    var displayToTarget = t.w / canvas.width;
    var s = baseScale() * zoom * displayToTarget;
    var dw = img.width * s, dh = img.height * s;
    var dx = out.width / 2 - dw / 2 + offset.x * displayToTarget;
    var dy = out.height / 2 - dh / 2 + offset.y * displayToTarget;
    octx.drawImage(img, dx, dy, dw, dh);
    out.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'id-photo-' + sizeSelect.value + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  });

  setCanvasDisplaySize();
})();
