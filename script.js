const canvas = document.getElementById('posterCanvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const addImageBtn = document.getElementById('addImageBtn');
const textInput = document.getElementById('textInput');
const fontSelect = document.getElementById('fontSelect');
const colorPicker = document.getElementById('colorPicker');
const fontSize = document.getElementById('fontSize');
const addTextBtn = document.getElementById('addTextBtn');
const qrInput = document.getElementById('qrInput');
const generateQRBtn = document.getElementById('generateQRBtn');
const emojiPicker = document.getElementById('emojiPicker');
const downloadBtn = document.getElementById('downloadBtn');
const canvasWidth = document.getElementById('canvasWidth');
const canvasHeight = document.getElementById('canvasHeight');
const resizeCanvas = document.getElementById('resizeCanvas');

let elements = [];
let selectedElement = null;
let isDragging = false;
let isResizing = false;
let startX, startY;
let resizeHandle = '';

let scale = 1;
const minScale = 0.1;
const maxScale = 5;

const scaleIndicator = document.createElement('div');
scaleIndicator.className = 'scale-indicator';
document.querySelector('.canvas-container').appendChild(scaleIndicator);

const resizeIndicator = document.createElement('div');
resizeIndicator.className = 'resize-indicator';
document.querySelector('.canvas-container').appendChild(resizeIndicator);

const canvasWrapper = document.querySelector('.canvas-wrapper');

function updateScaleIndicator() {
	scaleIndicator.textContent = `缩放: ${(scale * 100).toFixed(0)}%`;
	updateElementSelection();
}

function isSmallScreen() {
	return window.innerWidth < 768;
}

// 鼠标滚轮缩放
canvas.addEventListener('wheel', (e) => {
	if (isSmallScreen()) return;
	e.preventDefault();
	const rect = canvas.getBoundingClientRect();
	const mouseX = (e.clientX - rect.left - canvasOffsetX) / scale;
	const mouseY = (e.clientY - rect.top - canvasOffsetY) / scale;
	const delta = e.deltaY > 0 ? -0.1 : 0.1;
	scale = Math.min(maxScale, Math.max(minScale, scale + delta));
	canvasOffsetX -= mouseX * delta * scale;
	canvasOffsetY -= mouseY * delta * scale;
	canvasWrapper.style.transform = `translate(${canvasOffsetX}px, ${canvasOffsetY}px) scale(${scale})`;
	updateScaleIndicator();
	selectedElement = null; // 取消选中元素
	drawCanvas();
});

// 调整画布大小
resizeCanvas.addEventListener('click', () => {
	canvas.width = Number.parseInt(canvasWidth.value);
	canvas.height = Number.parseInt(canvasHeight.value);
	updateCanvasSizeInputs();
	selectedElement = null; // 取消选中元素
	drawCanvas();
});

// 更新输入框中的画布大小
function updateCanvasSizeInputs() {
	canvasWidth.value = canvas.width;
	canvasHeight.value = canvas.height;
}

function updateElementSelection() {
	if (selectedElement) {
		const rect = canvas.getBoundingClientRect();
		const x = selectedElement.x * scale + canvasOffsetX + rect.left;
		const y = selectedElement.y * scale + canvasOffsetY + rect.top;
		const width = selectedElement.width * scale;
		const height = selectedElement.height * scale;

		const handleSize = 10;
		if (selectedElement.type === 'image' || selectedElement.type === 'qr') {
			if (x + width - handleSize <= rect.right && y + height - handleSize <= rect.bottom) {
				isResizing = true;
				resizeHandle = 'se';
				canvas.style.cursor = 'se-resize'; // 修改鼠标状态
			} else {
				isDragging = true;
				startX = (x - selectedElement.x * scale) / scale; // 根据缩放比例调整起始位置
				startY = (y - selectedElement.y * scale) / scale; // 根据缩放比例调整起始位置
				canvas.style.cursor = 'move'; // 修改鼠标状态
			}
		} else {
			isDragging = true;
			startX = (x - selectedElement.x * scale) / scale; // 根据缩放比例调整起始位置
			startY = (y - selectedElement.y * scale) / scale; // 根据缩放比例调整起始位置
			canvas.style.cursor = 'move'; // 修改鼠标状态
		}
	}
}

let isFirstImageUpload = true;

// 图片上传
imageUpload.addEventListener('change', (e) => {
	const file = e.target.files[0];
	if (!file.type.startsWith('image/')) {
		alert('请上传图片文件');
		return;
	}
	const reader = new FileReader();
	reader.onload = (event) => {
		const img = new Image();
		img.onload = () => {
			if (isFirstImageUpload) {
				canvas.width = img.width; // 设置画布宽度为图片宽度
				canvas.height = img.height; // 设置画布高度为图片高度
				document.getElementById('canvasWidth').value = img.width;
				document.getElementById('canvasHeight').value = img.height;
				isFirstImageUpload = false;
				elements.unshift({ type: 'background', content: img, x: 0, y: -1, width: img.width, height: img.height }); // 将第一张图片作为背景
			}
			drawCanvas();
		};
		img.src = event.target.result;
	};
	reader.readAsDataURL(file);
});

// 添加图片到画布
addImageBtn.addEventListener('click', () => {
	if (imageUpload.files[0]) {
		const file = imageUpload.files[0];
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				addElement('image', img);
			};
			img.src = event.target.result;
		};
		reader.readAsDataURL(file);
	}
});

// 添加文本
addTextBtn.addEventListener('click', () => {
	const text = textInput.value;
	const font = fontSelect.value;
	const color = colorPicker.value;
	const size = fontSize.value;
	addElement('text', { text, font, color, size });
});

// 生成二维码
generateQRBtn.addEventListener('click', () => {
	const qrContent = qrInput.value;
	const qr = qrcode(0, 'L'); // qrcode function assumed to be available globally or imported.
	qr.addData(qrContent);
	qr.make();
	const qrImage = new Image();
	qrImage.onload = () => {
		addElement('qr', qrImage, qrImage.width, qrImage.height);
	};
	qrImage.src = qr.createDataURL(4, 0);
});

// 添加表情
emojiPicker.addEventListener('click', (e) => {
	if (e.target.classList.contains('emoji')) {
		const emoji = e.target.dataset.emoji;
		addElement('emoji', emoji);
	}
});

document.getElementById('toggleEmoji').addEventListener('click', function () {
	const emojiPicker = document.getElementById('emojiPicker');
	if (emojiPicker.classList.contains('expanded')) {
		emojiPicker.classList.remove('expanded');
		this.textContent = '展开更多表情';
	} else {
		emojiPicker.classList.add('expanded');
		this.textContent = '收起表情';
	}
});

// 下载海报
downloadBtn.addEventListener('click', () => {
	const link = document.createElement('a');
	link.download = 'poster.png';
	link.href = canvas.toDataURL();
	link.click();
});

// 添加删除按钮
function addDeleteButton(element) {
	// 移除所有删除按钮
	document.querySelectorAll('.delete-btn').forEach((btn) => btn.remove());

	if (element === selectedElement) {
		const deleteBtn = document.createElement('button');
		deleteBtn.className = 'delete-btn';
		deleteBtn.innerHTML = 'X';
		deleteBtn.onclick = () => {
			elements = elements.filter((el) => el !== element);
			selectedElement = null;
			deleteBtn.remove(); // 删除元素时同时删除 delete-btn
			drawCanvas();
		};
		document.querySelector('.canvas-wrapper').appendChild(deleteBtn);
		positionDeleteButton(element, deleteBtn);
	}
}

// 定位删除按钮
function positionDeleteButton(element, deleteBtn) {
	deleteBtn.style.left = `${element.x + element.width - 10}px`;
	deleteBtn.style.top = `${element.y - 10}px`;
}

// 添加元素
function addElement(type, content, width = 200, height = 200, x = 50, y = 50) {
	const element = {
		type,
		content,
		x,
		y,
		width: type === 'image' || type === 'qr' ? width : type === 'text' ? ctx.measureText(content.text).width : 30,
		height: type === 'image' || type === 'qr' ? height : type === 'text' ? parseInt(content.size) : 30,
	};
	elements.push(element);
	drawCanvas();
}

// 绘制画布
function drawCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
	elements.forEach((element) => {
		if (element.type === 'background') {
			ctx.drawImage(element.content, element.x, element.y, element.width, element.height);
		} else {
			if (element.type === 'image' || element.type === 'qr') {
				ctx.drawImage(element.content, element.x, element.y, element.width, element.height);
			} else if (element.type === 'text') {
				ctx.font = `${element.content.size}px ${element.content.font}`;
				ctx.fillStyle = element.content.color;
				ctx.fillText(element.content.text, element.x, element.y + element.height);
				element.width = ctx.measureText(element.content.text).width; // 更新文本宽度
			} else if (element.type === 'emoji') {
				ctx.font = '30px Arial';
				ctx.fillText(element.content, element.x, element.y + element.height);
				element.width = ctx.measureText(element.content).width; // 更新表情宽度
			}

			if (element === selectedElement) {
				ctx.strokeStyle = '#007bff';
				ctx.lineWidth = 2;
				ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);

				if (element.type === 'image' || element.type === 'qr') {
					// 绘制调整大小的手柄
					drawResizeHandles(element);
				}

				// 添加删除按钮
				addDeleteButton(element);
			}
		}
	});

	// 如果没有选中任何元素，移除所有删除按钮
	if (!selectedElement || selectedElement.type === 'background') {
		document.querySelectorAll('.delete-btn').forEach((btn) => btn.remove());
	}
}

// 绘制调整大小的手柄
function drawResizeHandles(element) {
	const handleSize = 10;
	const scaleAdjustedHandleSize = handleSize / scale; // 根据缩放比例调整手柄大小
	const handle = {
		x: element.x + element.width - scaleAdjustedHandleSize / 2,
		y: element.y + element.height - scaleAdjustedHandleSize / 2,
	};

	ctx.fillStyle = '#007bff';
	ctx.fillRect(handle.x, handle.y, scaleAdjustedHandleSize, scaleAdjustedHandleSize);

	// 显示调整大小的宽高指示器
	if (isResizing) {
		resizeIndicator.style.left = `${handle.x + scaleAdjustedHandleSize + 5}px`;
		resizeIndicator.style.top = `${handle.y + scaleAdjustedHandleSize + 5}px`;
		resizeIndicator.textContent = `宽: ${element.width.toFixed(0)} 高: ${element.height.toFixed(0)}`;
		resizeIndicator.style.display = 'block';
	} else {
		resizeIndicator.style.display = 'none';
	}
}

let isCanvasDragging = false;
let canvasStartX, canvasStartY;
let canvasOffsetX = 0,
	canvasOffsetY = 0;

// 鼠标事件
canvas.addEventListener('mousedown', (e) => {
	if (isSmallScreen()) return;
	startDragging(e);
});
canvas.addEventListener('mousemove', (e) => {
	if (isSmallScreen()) return;
	drag(e);
});
canvas.addEventListener('mouseup', (e) => {
	if (isSmallScreen()) return;
	stopDragging(e);
});
canvas.addEventListener('touchstart', (e) => {
	if (isSmallScreen()) return;
	startDragging(e);
});
canvas.addEventListener('touchmove', (e) => {
	if (isSmallScreen()) return;
	drag(e);
});
canvas.addEventListener('touchend', (e) => {
	if (isSmallScreen()) return;
	stopDragging(e);
});

function startDragging(e) {
	e.preventDefault();
	const rect = canvas.getBoundingClientRect();
	const x = (e.clientX || e.touches[0].clientX) - rect.left;
	const y = (e.clientY || e.touches[0].clientY) - rect.top;

	// 考虑画布偏移和缩放
	const adjustedX = (x - canvasOffsetX) / scale;
	const adjustedY = (y - canvasOffsetY) / scale;

	// 从上到下遍历元素，确保可以选中在图片上方的元素
	const previouslySelectedElement = selectedElement;
	selectedElement = elements
		.slice()
		.reverse()
		.find((el) => adjustedX >= el.x && adjustedX <= el.x + el.width && adjustedY >= el.y && adjustedY <= el.y + el.height);

	if (selectedElement && selectedElement.type !== 'background') {
		// 检查是否点击了调整大小的手柄
		const handleSize = 10; // 增加手柄大小以提高灵敏度
		if (selectedElement.type === 'image' || selectedElement.type === 'qr') {
			if (
				adjustedX >= selectedElement.x + selectedElement.width - handleSize &&
				adjustedY >= selectedElement.y + selectedElement.height - handleSize
			) {
				isResizing = true;
				resizeHandle = 'se';
				canvas.style.cursor = 'se-resize'; // 修改鼠标状态
			} else {
				isDragging = true;
				startX = adjustedX - selectedElement.x; // 根据缩放比例调整起始位置
				startY = adjustedY - selectedElement.y; // 根据缩放比例调整起始位置
				canvas.style.cursor = 'move'; // 修改鼠标状态
			}
		} else {
			isDragging = true;
			startX = adjustedX - selectedElement.x; // 根据缩放比例调整起始位置
			startY = adjustedY - selectedElement.y; // 根据缩放比例调整起始位置
			canvas.style.cursor = 'move'; // 修改鼠标状态
		}
	} else {
		selectedElement = null;
		isCanvasDragging = true;
		canvasStartX = e.clientX || e.touches[0].clientX;
		canvasStartY = e.clientY || e.touches[0].clientY;
		canvas.style.cursor = 'move'; // 修改鼠标状态
	}

	if (previouslySelectedElement !== selectedElement) {
		drawCanvas();
	}
}

canvas.addEventListener('mousemove', (e) => {
	const rect = canvas.getBoundingClientRect();
	const x = (e.clientX || e.touches[0].clientX) - rect.left;
	const y = (e.clientY || e.touches[0].clientY) - rect.top;

	// 考虑画布偏移和缩放
	const adjustedX = (x - canvasOffsetX) / scale;
	const adjustedY = (y - canvasOffsetY) / scale;

	const handleSize = 10;
	const hoveredElement = elements
		.slice()
		.reverse()
		.find((el) => adjustedX >= el.x && adjustedX <= el.x + el.width && adjustedY >= el.y && adjustedY <= el.y + el.height);

	if (hoveredElement) {
		if (hoveredElement.type === 'image' || hoveredElement.type === 'qr') {
			if (adjustedX >= hoveredElement.x + hoveredElement.width - handleSize && adjustedY >= hoveredElement.y + hoveredElement.height - handleSize) {
				canvas.style.cursor = 'se-resize'; // 修改鼠标状态
			} else {
				canvas.style.cursor = 'move'; // 修改鼠标状态
			}
		} else {
			canvas.style.cursor = 'move'; // 修改鼠标状态
		}
	} else {
		canvas.style.cursor = 'default'; // 修改鼠标状态
	}
});

canvas.addEventListener('dblclick', (e) => {
	const rect = canvas.getBoundingClientRect();
	const x = (e.clientX || e.touches[0].clientX) - rect.left;
	const y = (e.clientY || e.touches[0].clientY) - rect.top;

	const adjustedX = (x - canvasOffsetX) / scale;
	const adjustedY = (y - canvasOffsetY) / scale;

	const clickedElement = elements
		.slice()
		.reverse()
		.find((el) => el.type === 'text' && adjustedX >= el.x && adjustedX <= el.x + el.width && adjustedY >= el.y && adjustedY <= el.y + el.height);

	if (clickedElement) {
		const newText = prompt('修改文本内容:', clickedElement.content.text);
		if (newText !== null) {
			clickedElement.content.text = newText;
			drawCanvas();
		}
	}
});

function drag(e) {
	e.preventDefault();
	if (isCanvasDragging && (!selectedElement || selectedElement.type === 'background')) {
		const dx = (e.clientX || e.touches[0].clientX) - canvasStartX;
		const dy = (e.clientY || e.touches[0].clientY) - canvasStartY;
		canvasOffsetX += dx;
		canvasOffsetY += dy;
		canvasWrapper.style.transform = `translate(${canvasOffsetX}px, ${canvasOffsetY}px) scale(${scale})`;
		canvasStartX = e.clientX || e.touches[0].clientX;
		canvasStartY = e.clientY || e.touches[0].clientY;
		selectedElement = null; // 取消选中元素
		drawCanvas();
		return;
	}

	if (!selectedElement || (!isDragging && !isResizing)) return;

	const rect = canvas.getBoundingClientRect();
	const x = (e.clientX || e.touches[0].clientX) - rect.left;
	const y = (e.clientY || e.touches[0].clientY) - rect.top;

	// 考虑画布偏移和缩放
	const adjustedX = (x - canvasOffsetX) / scale;
	const adjustedY = (y - canvasOffsetY) / scale;

	if (isDragging && !isResizing) {
		selectedElement.x = Math.min(Math.max(0, adjustedX - startX), canvas.width - selectedElement.width);
		selectedElement.y = Math.min(Math.max(0, adjustedY - startY), canvas.height - selectedElement.height);
	} else if (isResizing) {
		if (resizeHandle === 'se') {
			const newWidth = Math.max(30, Math.min(adjustedX - selectedElement.x, canvas.width - selectedElement.x));
			const newHeight = Math.max(30, Math.min(adjustedY - selectedElement.y, canvas.height - selectedElement.y));
			selectedElement.width = newWidth;
			selectedElement.height = newHeight;
		}
	}

	drawCanvas();
}

function stopDragging() {
	isDragging = false;
	isResizing = false;
	if (isCanvasDragging) {
		const dx = (event.clientX || event.touches[0].clientX) - canvasStartX;
		const dy = (event.clientY || event.touches[0].clientY) - canvasStartY;
		canvasOffsetX += dx;
		canvasOffsetY += dy;
		isCanvasDragging = false;
	}
	canvas.style.cursor = 'default'; // 重置鼠标状态
	resizeIndicator.style.display = 'none'; // 隐藏宽高指示器
}

// 初始化画布
drawCanvas();
updateCanvasSizeInputs();
updateScaleIndicator();

document.getElementById('currentYear').textContent = new Date().getFullYear();
