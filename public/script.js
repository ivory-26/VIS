const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.lineCap = "round";
ctx.lineJoin = "round";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.putImageData(img, 0, 0);
});

let drawing = false;
let currentTool = 'pen';
let startX, startY;
let history = [];
let redoStack = [];
let currentColor = '#000000';
let scale = 1;
const scaleStep = 0.1;
let textInput = document.getElementById('textInput');
let lastSaveTime = 0;
let eraserSize = 20; // Default eraser size

// Tool Buttons
['pen', 'eraser', 'rectangle', 'circle', 'line', 'triangle', 'arrow', 'text'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => currentTool = id);
});

// Eraser Size Slider
document.getElementById('eraserSize').addEventListener('input', e => {
  eraserSize = parseInt(e.target.value);
});

// Color Picker
document.getElementById('colorPicker').addEventListener('change', e => {
  currentColor = e.target.value;
});

// Undo/Redo/Clear/Save
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
document.getElementById('clear').addEventListener('click', () => {
  saveState();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
document.getElementById('save').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'whiteboard.png';
  link.href = canvas.toDataURL();
  link.click();
});

// Zoom
document.getElementById('zoomIn').addEventListener('click', () => zoomCanvas(1 + scaleStep));
document.getElementById('zoomOut').addEventListener('click', () => zoomCanvas(1 - scaleStep));
document.getElementById('resetZoom').addEventListener('click', () => zoomCanvas(1, true));

// Themes
['lightTheme', 'darkTheme', 'colorfulTheme'].forEach(theme => {
  document.getElementById(theme).addEventListener('click', () => {
    document.body.className = theme.replace('Theme', '');
  });
});

// Drawing Events
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', endDraw);

function getPos(e) {
  if (e.touches) e = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left),
    y: (e.clientY - rect.top)
  };
}

function startDraw(e) {
  e.preventDefault();
  const pos = getPos(e);
  startX = pos.x;
  startY = pos.y;
  drawing = true;
  lastSaveTime = Date.now();

  if (currentTool === 'text') {
    ctx.fillStyle = currentColor;
    ctx.fillText(textInput.value, startX, startY);
    saveState();
    drawing = false;
  } else if (currentTool === 'pen' || currentTool === 'eraser') {
    ctx.lineWidth = currentTool === 'pen' ? 2 : eraserSize;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
  }
}

function draw(e) {
  if (!drawing) return;
  const pos = getPos(e);
  const now = Date.now();

  if (currentTool === 'pen' || currentTool === 'eraser') {
    ctx.strokeStyle = currentTool === 'pen' ? currentColor : '#ffffff';
    ctx.lineWidth = currentTool === 'pen' ? 2 : eraserSize;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    if (now - lastSaveTime > 100) {
      saveState();
      lastSaveTime = now;
    }
  }
}

function endDraw(e) {
  if (!drawing) return;
  drawing = false;
  const pos = getPos(e);
  const w = pos.x - startX;
  const h = pos.y - startY;

  ctx.strokeStyle = currentColor;
  ctx.fillStyle = currentColor;

  if (currentTool === 'rectangle') ctx.strokeRect(startX, startY, w, h);
  if (currentTool === 'circle') {
    ctx.beginPath();
    ctx.ellipse(startX + w / 2, startY + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (currentTool === 'line') {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }
  if (currentTool === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(startX + w / 2, startY);
    ctx.lineTo(startX, startY + h);
    ctx.lineTo(startX + w, startY + h);
    ctx.closePath();
    ctx.stroke();
  }
  if (currentTool === 'arrow') drawArrow(ctx, startX, startY, pos.x, pos.y);

  saveState();
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
  const headlen = 10;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function saveState() {
  const data = canvas.toDataURL();
  if (history.length === 0 || history[history.length - 1] !== data) {
    history.push(data);
    if (history.length > 50) history.shift();
    redoStack = [];
  }
}

function undo() {
  if (history.length === 0) return;
  redoStack.push(canvas.toDataURL());
  const prev = history.pop();
  restoreFromDataURL(prev);
}

function redo() {
  if (redoStack.length === 0) return;
  history.push(canvas.toDataURL());
  const next = redoStack.pop();
  restoreFromDataURL(next);
}

function restoreFromDataURL(dataURL) {
  const img = new Image();
  img.onload = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset zoom
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = dataURL;
}

function zoomCanvas(factor, reset = false) {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (reset) {
    scale = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    scale *= factor;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(imgData, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tempCanvas, 0, 0);
}
['pen', 'eraser', 'rectangle', 'circle', 'line', 'triangle', 'arrow', 'text'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', () => {
      currentTool = id;
      document.querySelectorAll('.toolbar button').forEach(btn => btn.classList.remove('active'));
      el.classList.add('active');
    });
  }
});
