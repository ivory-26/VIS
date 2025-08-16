document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ script.js loaded and DOM ready.");

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const socket = io();

    let state = {
        tool: 'pen',
        color: '#000000',
        brushSize: 5,
        eraserSize: 20,
        fontFamily: 'Arial',
        fontSize: 16,
        drawing: false,
        scale: 1,
        history: [],
        redoStack: [],
        pan: { x: 0, y: 0, active: false, startX: 0, startY: 0 },
        currentShape: null,
        isTyping: false
    };

    const ui = {
        colorPicker: document.getElementById('colorPicker'),
        brushSizeSlider: document.getElementById('size-slider'),
        eraserSizeSlider: document.getElementById('eraserSize'),
        fontFamilySelect: document.getElementById('font-family-select'),
        fontSizeInput: document.getElementById('font-size-input'),
        userList: document.getElementById('userList'),
        chatMessages: document.getElementById('chatMessages'),
        chatForm: document.getElementById('chatForm'),
        chatInput: document.getElementById('chatInput'),
        sessionIdDisplay: document.getElementById('sessionIdDisplay'),
        sessionLink: document.getElementById('sessionLink'),
        imageUpload: document.getElementById('imageUpload')
    };

    const username = localStorage.getItem("username") || "Guest";
    const sessionId = window.location.hash.slice(1) || `session-${Date.now().toString(36)}`;
    window.location.hash = sessionId;

    function setupEventListeners() {
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mouseleave', onMouseUp);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);
        canvas.addEventListener('touchcancel', onTouchEnd);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('resize', resizeCanvas);

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (state.isTyping) return;
                state.tool = btn.id;
                document.querySelector('.tool-btn.active')?.classList.remove('active');
                btn.classList.add('active');
                canvas.style.cursor = state.tool === 'text' ? 'text' : 'crosshair';
            });
        });

        ui.colorPicker.addEventListener('input', e => state.color = e.target.value);
        ui.brushSizeSlider.addEventListener('input', e => state.brushSize = e.target.value);
        ui.eraserSizeSlider.addEventListener('input', e => state.eraserSize = e.target.value);
        ui.fontFamilySelect.addEventListener('change', e => state.fontFamily = e.target.value);
        ui.fontSizeInput.addEventListener('change', e => state.fontSize = parseInt(e.target.value, 10));

        document.getElementById('clear').addEventListener('click', () => socket.emit('clear-board'));
        document.getElementById('save').addEventListener('click', downloadCanvas);
        document.getElementById('uploadImageBtn').addEventListener('click', () => ui.imageUpload.click());
        ui.imageUpload.addEventListener('change', handleImageUpload);

        document.getElementById('zoomIn').addEventListener('click', () => zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => zoom(1 / 1.2));

        document.getElementById('lightTheme').addEventListener('click', () => document.body.className = 'light');
        document.getElementById('darkTheme').addEventListener('click', () => document.body.className = 'dark');
        document.getElementById('colorfulTheme').addEventListener('click', () => document.body.className = 'colorful');

        ui.chatForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = ui.chatInput.value.trim();
            if (msg) {
                socket.emit('chat-message', msg);
                ui.chatInput.value = '';
            }
        });
    }

    function setupSocketListeners() {
        socket.on('connect', () => {
            console.log("🟢 Connected to socket.io");
            socket.emit('join-session', { sessionId, username });
        });
        socket.on('drawing-history', (actions) => { state.history = actions; redrawCanvas(); });
        socket.on('drawing-action', (data) => {
            state.history.push(data);
            ctx.save();
            ctx.translate(state.pan.x, state.pan.y);
            ctx.scale(state.scale, state.scale);
            drawAction(data, ctx);
            ctx.restore();
        });
        socket.on('board-cleared', () => { state.history = []; state.redoStack = []; redrawCanvas(); });
        socket.on('user-list-update', (users) => { ui.userList.innerHTML = users.map(user => `<li>${user}</li>`).join(''); });
        socket.on('chat-message', ({ user, message }) => {
            ui.chatMessages.innerHTML += `<div><strong>${user}:</strong> ${message}</div>`;
            ui.chatMessages.scrollTop = ui.chatMessages.scrollHeight;
        });
    }

    function onMouseDown(e) {
        if (state.isTyping) return;
        if (e.button === 1 || e.ctrlKey) {
            state.pan.active = true;
            state.pan.startX = e.clientX - state.pan.x;
            state.pan.startY = e.clientY - state.pan.y;
            return;
        }
        const startPoint = getTransformedPoint(e.offsetX, e.offsetY);
        const size = state.tool === 'eraser' ? state.eraserSize : state.brushSize;
        const color = state.tool === 'eraser' ? getBackgroundColor() : state.color;
        if (state.tool === 'text') {
            createTextInput(e.offsetX, e.offsetY);
            return;
        }
        state.drawing = true;
        state.currentShape = {
            tool: state.tool, color, size,
            startX: startPoint.x, startY: startPoint.y,
            endX: startPoint.x, endY: startPoint.y,
            path: state.tool === 'pen' || state.tool === 'eraser' ? [startPoint] : undefined
        };
    }

    function onMouseMove(e) {
        if (state.pan.active) {
            state.pan.x = e.clientX - state.pan.startX;
            state.pan.y = e.clientY - state.pan.startY;
            redrawCanvas();
            return;
        }
        if (!state.drawing) return;
        const currentPoint = getTransformedPoint(e.offsetX, e.offsetY);
        if (state.tool === 'pen' || state.tool === 'eraser') {
            state.currentShape.path.push(currentPoint);
        } else {
            state.currentShape.endX = currentPoint.x;
            state.currentShape.endY = currentPoint.y;
        }
        redrawCanvas();
    }

    function onMouseUp() {
        if (state.pan.active) {
            state.pan.active = false;
            return;
        }
        if (!state.drawing) return;
        state.drawing = false;
        if (state.currentShape) {
            socket.emit('drawing-action', state.currentShape);
            state.history.push(state.currentShape);
            state.currentShape = null;
            state.redoStack = [];
            redrawCanvas();
        }
    }

    function onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 / 1.1 : 1.1;
        zoom(delta, e.offsetX, e.offsetY);
    }

    function onTouchStart(e) { e.preventDefault(); const touch = e.touches[0]; onMouseDown(normalizeTouchEvent(touch)); }
    function onTouchMove(e) { e.preventDefault(); const touch = e.touches[0]; onMouseMove(normalizeTouchEvent(touch)); }
    function onTouchEnd() { onMouseUp(); }
    function normalizeTouchEvent(touch) {
        const rect = canvas.getBoundingClientRect();
        return { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top, clientX: touch.clientX, clientY: touch.clientY, button: 0 };
    }

    function drawAction(data, context) {
        if (!data || !data.tool) return;
        context.strokeStyle = data.color || '#000000';
        context.fillStyle = data.color || '#000000';
        context.lineWidth = Math.max(0.5, (data.size || 5) / state.scale);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        switch (data.tool) {
            case 'pen': case 'eraser':
                if (!data.path || !Array.isArray(data.path) || data.path.length < 2) return;
                context.beginPath();
                context.moveTo(data.path[0].x, data.path[0].y);
                for (let i = 1; i < data.path.length; i++) {
                    if (data.path[i]) context.lineTo(data.path[i].x, data.path[i].y);
                }
                context.stroke();
                break;
            case 'rectangle':
                context.strokeRect(data.startX, data.startY, data.endX - data.startX, data.endY - data.startY);
                break;
            case 'circle': {
                const radius = Math.hypot(data.endX - data.startX, data.endY - data.startY) / 2;
                context.beginPath();
                context.arc(data.startX + (data.endX - data.startX) / 2, data.startY + (data.endY - data.startY) / 2, radius, 0, Math.PI * 2);
                context.stroke();
                break;
            }
            case 'line':
                context.beginPath();
                context.moveTo(data.startX, data.startY);
                context.lineTo(data.endX, data.endY);
                context.stroke();
                break;
            case 'triangle':
                context.beginPath();
                context.moveTo(data.startX + (data.endX - data.startX) / 2, data.startY);
                context.lineTo(data.startX, data.endY);
                context.lineTo(data.endX, data.endY);
                context.closePath();
                context.stroke();
                break;
            case 'arrow': {
                const headlen = 10 / state.scale;
                const dx = data.endX - data.startX, dy = data.endY - data.startY;
                const angle = Math.atan2(dy, dx);
                context.beginPath();
                context.moveTo(data.startX, data.startY);
                context.lineTo(data.endX, data.endY);
                context.lineTo(data.endX - headlen * Math.cos(angle - Math.PI / 6), data.endY - headlen * Math.sin(angle - Math.PI / 6));
                context.moveTo(data.endX, data.endY);
                context.lineTo(data.endX - headlen * Math.cos(angle + Math.PI / 6), data.endY - headlen * Math.sin(angle + Math.PI / 6));
                context.stroke();
                break;
            }
            case 'text':
                const fontSize = data.fontSize || 16;
                const fontFamily = data.fontFamily || 'Arial';
                context.font = `${fontSize / state.scale}px ${fontFamily}`;
                context.fillStyle = data.color;
                context.fillText(data.text, data.x, data.y);
                break;
            case 'image': {
                const img = new Image();
                img.onload = () => context.drawImage(img, data.x, data.y);
                img.src = data.src;
                break;
            }
        }
    }

    function redrawCanvas() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(state.pan.x, state.pan.y);
        ctx.scale(state.scale, state.scale);
        state.history.forEach(action => drawAction(action, ctx));
        if (state.drawing && state.currentShape) drawAction(state.currentShape, ctx);
        ctx.restore();
    }

    function downloadCanvas() {
        const link = document.createElement('a');
        link.download = `whiteboard-${sessionId}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const point = getTransformedPoint(50, 50);
            const action = { tool: 'image', src: event.target.result, x: point.x, y: point.y };
            socket.emit('drawing-action', action);
            state.history.push(action);
            redrawCanvas();
        };
        reader.readAsDataURL(file);
    }

    function zoom(factor, x, y) {
        const point = getTransformedPoint(x || canvas.width / 2, y || canvas.height / 2);
        state.scale *= factor;
        state.pan.x = (x || canvas.width / 2) - point.x * state.scale;
        state.pan.y = (y || canvas.height / 2) - point.y * state.scale;
        redrawCanvas();
    }

    function getTransformedPoint(x, y) {
        return { x: (x - state.pan.x) / state.scale, y: (y - state.pan.y) / state.scale };
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redrawCanvas();
    }

    function getBackgroundColor() {
        const theme = document.body.className;
        if (theme.includes('dark')) return '#343a40';
        if (theme.includes('colorful')) return '#fffacd';
        return '#ffffff';
    }

    function createTextInput(x, y) {
        if (state.isTyping) return;
        state.isTyping = true;
        const container = document.createElement('div');
        container.className = 'text-input-container';
        const textarea = document.createElement('textarea');
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
        textarea.style.color = state.color;
        textarea.style.fontFamily = state.fontFamily;
        textarea.style.fontSize = `${state.fontSize}px`;
        container.style.transform = `scale(${state.scale})`;
        container.style.transformOrigin = 'top left';
        container.appendChild(textarea);
        document.body.appendChild(container);
        setTimeout(() => textarea.focus(), 0);
        textarea.addEventListener('blur', finalize);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finalize(); }
        });
        function finalize() {
            const text = textarea.value.trim();
            if (text) {
                const point = getTransformedPoint(x, y);
                const action = {
                    tool: 'text', text, color: state.color,
                    fontSize: state.fontSize,
                    fontFamily: state.fontFamily,
                    x: point.x, y: point.y
                };
                socket.emit('drawing-action', action);
                state.history.push(action);
                redrawCanvas();
            }
            document.body.removeChild(container);
            state.isTyping = false;
        }
    }

    function init() {
        resizeCanvas();
        setupEventListeners();
        setupSocketListeners();
        if (ui.sessionLink) ui.sessionLink.textContent = window.location.href;
        if (ui.sessionIdDisplay) ui.sessionIdDisplay.textContent = sessionId;
    }

    // 👇 FIXED: Ensure init and toolbar toggle runs after DOM is ready
    init();

    const toolbarContainer = document.querySelector('.toolbar-container');
    const toolbarHandle = document.getElementById('toolbar-toggle-handle');

    if (toolbarContainer && toolbarHandle) {
        toolbarHandle.addEventListener('click', () => {
            toolbarContainer.classList.toggle('toolbar-visible');
        });
    }
});

// Logout and copy link functions
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert("Invite link copied to clipboard!");
    });
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
