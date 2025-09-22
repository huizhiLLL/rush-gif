// 全局变量
let canvas, ctx;
let currentImage = null;
let textContent = '';
let fontSize = 30;
let textX = 0;
let textY = 0;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// DOM 元素
const imageInput = document.getElementById('imageInput');
const uploadBtn = document.getElementById('uploadBtn');
const fileName = document.getElementById('fileName');
const textInput = document.getElementById('textInput');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const canvasContainer = document.getElementById('canvasContainer');
const previewCanvas = document.getElementById('previewCanvas');
const downloadBtn = document.getElementById('downloadBtn');

// 标签页元素
const presetTab = document.getElementById('presetTab');
const uploadTab = document.getElementById('uploadTab');
const presetImages = document.getElementById('presetImages');
const uploadImages = document.getElementById('uploadImages');

// 预设图片数据
const presetImageData = {
    rush: 'images/rush.jpg'
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    canvas = previewCanvas;
    ctx = canvas.getContext('2d');
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化画布
    initCanvas();
});

// 绑定事件监听器
function bindEventListeners() {
    // 标签页切换
    presetTab.addEventListener('click', () => switchTab('preset'));
    uploadTab.addEventListener('click', () => switchTab('upload'));
    
    // 预设图片选择
    const presetItems = document.querySelectorAll('.preset-item');
    presetItems.forEach(item => {
        item.addEventListener('click', () => handlePresetImageSelect(item));
    });
    
    // 图片上传
    uploadBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
    
    // 文字输入
    textInput.addEventListener('input', handleTextChange);
    fontSizeSlider.addEventListener('input', handleFontSizeChange);
    
    // 画布拖拽事件
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // 触摸事件（移动端）
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false, capture: true });
    
    // 下载按钮
    downloadBtn.addEventListener('click', downloadImage);
}

// 初始化画布
function initCanvas() {
    canvas.width = 300;
    canvas.height = 200;
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制提示文字
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('请先上传一张图片', canvas.width / 2, canvas.height / 2);
}

// 标签页切换
function switchTab(tab) {
    if (tab === 'preset') {
        presetTab.classList.add('active');
        uploadTab.classList.remove('active');
        presetImages.style.display = 'block';
        uploadImages.style.display = 'none';
    } else {
        uploadTab.classList.add('active');
        presetTab.classList.remove('active');
        presetImages.style.display = 'none';
        uploadImages.style.display = 'block';
    }
}

// 处理预设图片选择
function handlePresetImageSelect(item) {
    // 移除其他选中状态
    document.querySelectorAll('.preset-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 添加选中状态
    item.classList.add('selected');
    
    // 获取图片ID
    const imageId = item.getAttribute('data-image');
    const imagePath = presetImageData[imageId];
    
    if (imagePath) {
        // 加载预设图片
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            setupCanvas();
            updateCanvas();
            updateDownloadButton();
            
            // 清空文件名显示
            fileName.textContent = '';
        };
        img.src = imagePath;
    }
}

// 处理图片上传
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }
    
    // 显示文件名
    fileName.textContent = file.name;
    
    // 移除预设图片选中状态
    document.querySelectorAll('.preset-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 加载图片
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            setupCanvas();
            updateCanvas();
            updateDownloadButton();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 设置画布尺寸
function setupCanvas() {
    if (!currentImage) return;
    
    // 计算合适的画布尺寸（保持比例，最大宽度400px）
    const maxWidth = Math.min(400, window.innerWidth - 80);
    const aspectRatio = currentImage.width / currentImage.height;
    
    let canvasWidth, canvasHeight;
    
    if (currentImage.width > maxWidth) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
    } else {
        canvasWidth = currentImage.width;
        canvasHeight = currentImage.height;
    }
    
    // 确保画布不会太小
    if (canvasWidth < 200) {
        canvasWidth = 200;
        canvasHeight = 200 / aspectRatio;
    }
    if (canvasHeight < 150) {
        canvasHeight = 150;
        canvasWidth = 150 * aspectRatio;
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // 设置文字初始位置为画布中央
    textX = canvasWidth / 2;
    textY = canvasHeight / 2;
}

// 更新画布
function updateCanvas() {
    if (!currentImage) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制图片
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    
    // 绘制文字
    if (textContent.trim()) {
        drawText();
    }
}

// 绘制文字
function drawText() {
    ctx.save();
    
    // 设置文字样式
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 绘制文字描边（白色）
    ctx.strokeText(textContent, textX, textY);
    
    // 绘制文字填充（黑色）
    ctx.fillText(textContent, textX, textY);
    
    ctx.restore();
}

// 处理文字输入变化
function handleTextChange(event) {
    textContent = event.target.value;
    updateCanvas();
    updateDownloadButton();
}

// 处理字体大小变化
function handleFontSizeChange(event) {
    fontSize = parseInt(event.target.value);
    fontSizeValue.textContent = fontSize + 'px';
    updateCanvas();
}

// 鼠标事件处理
function handleMouseDown(event) {
    if (!currentImage || !textContent.trim()) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // 检查是否点击在文字区域内
    if (isPointInText(mouseX, mouseY)) {
        isDragging = true;
        dragOffset.x = mouseX - textX;
        dragOffset.y = mouseY - textY;
        canvas.style.cursor = 'move';
        canvas.classList.add('dragging');
    }
}

function handleMouseMove(event) {
    if (!isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    textX = mouseX - dragOffset.x;
    textY = mouseY - dragOffset.y;
    
    // 限制文字在画布范围内
    textX = Math.max(0, Math.min(canvas.width, textX));
    textY = Math.max(0, Math.min(canvas.height, textY));
    
    updateCanvas();
}

function handleMouseUp(event) {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'move';
        canvas.classList.remove('dragging');
    }
}

// 触摸事件处理
function handleTouchStart(event) {
    // 阻止默认行为，防止输入法弹出
    event.preventDefault();
    event.stopPropagation();
    
    if (!currentImage || !textContent.trim()) return;
    
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    if (isPointInText(touchX, touchY)) {
        isDragging = true;
        dragOffset.x = touchX - textX;
        dragOffset.y = touchY - textY;
        canvas.classList.add('dragging');
        
        // 阻止其他元素的触摸事件和焦点事件
        event.stopImmediatePropagation();
        
        // 确保输入框失去焦点，防止输入法弹出
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
    }
}

function handleTouchMove(event) {
    // 只有在拖拽时才阻止默认行为
    if (isDragging) {
        event.preventDefault();
        event.stopPropagation();
        
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        textX = touchX - dragOffset.x;
        textY = touchY - dragOffset.y;
        
        // 限制文字在画布范围内
        textX = Math.max(0, Math.min(canvas.width, textX));
        textY = Math.max(0, Math.min(canvas.height, textY));
        
        updateCanvas();
    }
}

function handleTouchEnd(event) {
    if (isDragging) {
        event.preventDefault();
        event.stopPropagation();
        
        isDragging = false;
        canvas.classList.remove('dragging');
    }
}

// 检查点是否在文字区域内
function isPointInText(x, y) {
    if (!textContent.trim()) return false;
    
    ctx.font = `${fontSize}px Arial`;
    const textWidth = ctx.measureText(textContent).width;
    const textHeight = fontSize;
    
    const textLeft = textX - textWidth / 2;
    const textRight = textX + textWidth / 2;
    const textTop = textY - textHeight / 2;
    const textBottom = textY + textHeight / 2;
    
    return x >= textLeft && x <= textRight && y >= textTop && y <= textBottom;
}

// 更新下载按钮状态
function updateDownloadButton() {
    const hasImage = currentImage !== null;
    const hasText = textContent.trim() !== '';
    
    downloadBtn.disabled = !(hasImage && hasText);
    
    if (hasImage && hasText) {
        downloadBtn.textContent = '下载图片';
    } else if (!hasImage) {
        downloadBtn.textContent = '请先上传图片';
    } else if (!hasText) {
        downloadBtn.textContent = '请输入文字';
    }
}

// 下载图片
function downloadImage() {
    if (!currentImage || !textContent.trim()) return;
    
    // 创建临时画布用于导出
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // 设置导出画布尺寸为原图尺寸
    exportCanvas.width = currentImage.width;
    exportCanvas.height = currentImage.height;
    
    // 绘制原图
    exportCtx.drawImage(currentImage, 0, 0);
    
    // 计算文字在新画布上的位置（按比例缩放）
    const scaleX = currentImage.width / canvas.width;
    const scaleY = currentImage.height / canvas.height;
    const exportTextX = textX * scaleX;
    const exportTextY = textY * scaleY;
    const exportFontSize = fontSize * Math.min(scaleX, scaleY);
    
    // 绘制文字
    exportCtx.save();
    exportCtx.font = `${exportFontSize}px Arial`;
    exportCtx.fillStyle = '#000';
    exportCtx.strokeStyle = '#fff';
    exportCtx.lineWidth = 2;
    exportCtx.textAlign = 'center';
    exportCtx.textBaseline = 'middle';
    
    // 绘制文字描边和填充
    exportCtx.strokeText(textContent, exportTextX, exportTextY);
    exportCtx.fillText(textContent, exportTextX, exportTextY);
    
    exportCtx.restore();
    
    // 生成下载链接
    const dataURL = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `图片文字_${new Date().getTime()}.png`;
    link.href = dataURL;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 窗口大小变化时重新调整画布
window.addEventListener('resize', function() {
    if (currentImage) {
        setupCanvas();
        updateCanvas();
    }
});
