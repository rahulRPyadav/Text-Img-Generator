
/* =====================================================
   WHATSAPP DP + MULTI PHOTO COLLAGE EDITOR
   Canvas: 1080 x 1080
   Export: JPG 95%
   ===================================================== */

const $ = id => document.getElementById(id);

const canvas = $("imageCanvas");
const ctx = canvas.getContext("2d");

const DP_SIZE = 1080;
const MAX_TEXT_WIDTH = 900;

canvas.width = DP_SIZE;
canvas.height = DP_SIZE;


// =====================================================
// 1. GLOBAL STATE
// =====================================================

let photos = [];
let selectedPhotoIndex = 0;

let isDragging = false;
let activeDragTarget = null;

let pointerOffsetX = 0;
let pointerOffsetY = 0;

let lastPointer = { x: 0, y: 0 };

let cellRects = [];

let layoutCells = [];

let loaded = false;


// Each photo:
// {
//   img, name, zoom, panX, panY
// }


// =====================================================
// 2. ELEMENT REFERENCES
// =====================================================

const bgInput = $("bg-input");
const textInput = $("text-input");

const downloadBtn = $("download-btn");
const photoList = $("photo-list");

const imageName = $("image-name");
const photoCount = $("photo-count");
const previewStatus = $("preview-status");
const placeholderText = $("placeholder-text");

const collageLayout = $("collage-layout");
const gridGap = $("grid-gap");
const cornerRadius = $("corner-radius");
const gridColor = $("grid-color");
const gridBorder = $("grid-border");

const imageZoom = $("image-zoom");

const textSize = $("text-size");
const fontFamily = $("font-family");
const fontWeight = $("font-weight");
const textAlign = $("text-align");
const textColor = $("text-color");
const textOpacity = $("text-opacity");

const strokeWidth = $("stroke-width");
const strokeColor = $("stroke-color");

const shadowColor = $("shadow-color");
const shadowBlur = $("shadow-blur");
const shadowX = $("shadow-x");
const shadowY = $("shadow-y");

const letterSpacing = $("letter-spacing");
const lineHeight = $("line-height");

const dateFormat = $("date-format");
const timeFormat = $("time-format");
const showDate = $("show-date");
const dateColor = $("date-color");

const brightness = $("brightness");
const contrast = $("contrast");
const blur = $("blur");
const overlayOpacity = $("overlay-opacity");

const showSafeArea = $("show-safe-area");


// =====================================================
// 3. DEFAULT POSITIONS
// =====================================================

const defaultTextPosition = {
    x: 540,
    y: 440
};

const textPosition = {
    ...defaultTextPosition
};

const defaultDatePosition = {
    x: 540,
    y: 260
};

const datePosition = {
    ...defaultDatePosition
};


// =====================================================
// 4. RANGE LABELS
// =====================================================

const rangeLabels = {

    "grid-gap": "gap-value",
    "corner-radius": "radius-value",
    "grid-border": "border-value",
    "image-zoom": "zoom-value",

    "text-size": "size-value",
    "stroke-width": "stroke-value",

    "shadow-blur": "shadow-blur-value",
    "shadow-x": "shadow-x-value",
    "shadow-y": "shadow-y-value",

    "letter-spacing": "letter-value",
    "line-height": "line-value",
    "text-opacity": "opacity-value",

    "brightness": "brightness-value",
    "contrast": "contrast-value",
    "blur": "blur-value",
    "overlay-opacity": "overlay-value"

};

function updateLabels() {

    Object.entries(rangeLabels).forEach(([inputId, labelId]) => {

        const input = $(inputId);
        const label = $(labelId);

        if (!input || !label) return;

        let suffix = "px";

        if (inputId === "line-height") suffix = "";

        if (
            ["image-zoom", "text-opacity", "brightness",
             "contrast", "overlay-opacity"].includes(inputId)
        ) {
            suffix = "%";
        }

        label.textContent = input.value + suffix;

    });

}


// =====================================================
// 5. MULTIPLE IMAGE UPLOAD
// =====================================================

bgInput.addEventListener("change", function (event) {

    const files = Array.from(event.target.files);

    const validFiles = files.filter(file =>
        file.type.startsWith("image/")
    );

    if (!validFiles.length) {
        alert("Please select valid image files.");
        return;
    }

    const MAX_PHOTOS = 30;

    const availableSlots = MAX_PHOTOS - photos.length;

    if (availableSlots <= 0) {
        alert("Maximum 30 photos allowed.");
        bgInput.value = "";
        return;
    }

    if (validFiles.length > availableSlots) {
        alert(`Only ${availableSlots} more photos can be added.`);
    }

    const filesToLoad = validFiles.slice(0, availableSlots);

    let completed = 0;
    let added = 0;

    filesToLoad.forEach(file => {

        const reader = new FileReader();

        reader.onload = function (e) {

            const img = new Image();

            img.onload = function () {

                photos.push({

                    img: img,
                    name: file.name,
                    zoom: 1,
                    panX: 0,
                    panY: 0

                });

                added++;

                completed++;

                finishUpload();

            };

            img.onerror = function () {

                completed++;

                finishUpload();

            };

            img.src = e.target.result;

        };

        reader.onerror = function () {

            completed++;

            finishUpload();

        };

        reader.readAsDataURL(file);

    });

    function finishUpload() {

        if (completed !== filesToLoad.length) return;

        if (added > 0 && photos.length === added) {
            selectedPhotoIndex = 0;
        }

        loaded = photos.length > 0;

        refreshPhotoList();

        updateCanvas();

        updateSelectedPhotoControls();

        bgInput.value = "";

    }

});


// =====================================================
// 6. REFRESH PHOTO LIST
// =====================================================

function refreshPhotoList() {

    photoList.replaceChildren();

    photoCount.textContent = `${photos.length} Photos`;

    imageName.textContent = photos.length
        ? `${photos.length} images added`
        : "No images selected";

    if (!photos.length) {

        const empty = document.createElement("p");

        empty.className = "empty-photos";

        empty.textContent = "Your uploaded photos will appear here.";

        photoList.appendChild(empty);

        downloadBtn.disabled = true;

        previewStatus.textContent = "Add photos";

        placeholderText.style.display = "block";

        canvas.style.display = "none";

        return;

    }

    photos.forEach((photo, index) => {

        const item = document.createElement("div");

        item.className = "photo-item";

        if (index === selectedPhotoIndex) {
            item.classList.add("active");
        }

        const img = document.createElement("img");

        img.src = photo.img.src;

        img.alt = photo.name;

        const name = document.createElement("span");

        name.textContent = `${index + 1}. ${photo.name}`;

        item.append(img, name);

        item.addEventListener("click", function () {

            selectedPhotoIndex = index;

            refreshPhotoList();

            updateSelectedPhotoControls();

            updateCanvas();

        });

        photoList.appendChild(item);

    });

    downloadBtn.disabled = false;

    previewStatus.textContent = `${photos.length} Photos Loaded`;

    placeholderText.style.display = "none";

    canvas.style.display = "block";

}


// =====================================================
// 7. SELECTED PHOTO CONTROLS
// =====================================================

function updateSelectedPhotoControls() {

    const photo = photos[selectedPhotoIndex];

    if (!photo) return;

    imageZoom.value = Math.round(photo.zoom * 100);

    $("zoom-value").textContent = imageZoom.value + "%";

}


// =====================================================
// 8. REORDER PHOTOS
// =====================================================

$("move-left").addEventListener("click", function () {

    if (selectedPhotoIndex <= 0) return;

    const index = selectedPhotoIndex;

    [photos[index - 1], photos[index]] =
        [photos[index], photos[index - 1]];

    selectedPhotoIndex--;

    refreshPhotoList();

    updateCanvas();

});


$("move-right").addEventListener("click", function () {

    if (selectedPhotoIndex >= photos.length - 1) return;

    const index = selectedPhotoIndex;

    [photos[index + 1], photos[index]] =
        [photos[index], photos[index + 1]];

    selectedPhotoIndex++;

    refreshPhotoList();

    updateCanvas();

});


// =====================================================
// 9. REMOVE PHOTO
// =====================================================

$("remove-photo").addEventListener("click", function () {

    if (!photos.length) return;

    photos.splice(selectedPhotoIndex, 1);

    if (selectedPhotoIndex >= photos.length) {
        selectedPhotoIndex = Math.max(0, photos.length - 1);
    }

    refreshPhotoList();

    updateSelectedPhotoControls();

    updateCanvas();

});


// =====================================================
// 10. INDIVIDUAL PHOTO ZOOM
// =====================================================

imageZoom.addEventListener("input", function () {

    const photo = photos[selectedPhotoIndex];

    if (!photo) return;

    photo.zoom = Number(imageZoom.value) / 100;

    updateLabels();

    updateCanvas();

});


// =====================================================
// 11. RESET SELECTED PHOTO
// =====================================================

$("reset-photo").addEventListener("click", function () {

    const photo = photos[selectedPhotoIndex];

    if (!photo) return;

    photo.zoom = 1;
    photo.panX = 0;
    photo.panY = 0;

    updateSelectedPhotoControls();

    updateCanvas();

});


// =====================================================
// 12. GRID LAYOUT ENGINE
// =====================================================

function getLayoutCells() {

    const count = photos.length;

    if (!count) return [];

    const layout = collageLayout.value;

    const cells = [];

    // 2 COLUMN GRID

    if (layout === "grid2") {

        const cols = 2;

        const rows = Math.ceil(count / cols);

        for (let i = 0; i < count; i++) {

            cells.push({

                x: i % cols,
                y: Math.floor(i / cols),
                w: 1,
                h: 1,
                cols,
                rows

            });

        }

    }

    // 3 COLUMN GRID

    else if (layout === "grid3") {

        const cols = 3;

        const rows = Math.ceil(count / cols);

        for (let i = 0; i < count; i++) {

            cells.push({

                x: i % cols,
                y: Math.floor(i / cols),
                w: 1,
                h: 1,
                cols,
                rows

            });

        }

    }

    // 4 COLUMN GRID

    else if (layout === "grid4") {

        const cols = 4;

        const rows = Math.ceil(count / cols);

        for (let i = 0; i < count; i++) {

            cells.push({

                x: i % cols,
                y: Math.floor(i / cols),
                w: 1,
                h: 1,
                cols,
                rows

            });

        }

    }

    // VERTICAL 2 COLUMNS

    else if (layout === "columns2") {

        const cols = 2;

        const rows = Math.ceil(count / cols);

        for (let i = 0; i < count; i++) {

            cells.push({

                x: Math.floor(i / rows),
                y: i % rows,
                w: 1,
                h: 1,
                cols,
                rows

            });

        }

    }

    // VERTICAL 3 COLUMNS

    else if (layout === "columns3") {

        const cols = 3;

        const rows = Math.ceil(count / cols);

        for (let i = 0; i < count; i++) {

            cells.push({

                x: Math.floor(i / rows),
                y: i % rows,
                w: 1,
                h: 1,
                cols,
                rows

            });

        }

    }

    // MOSAIC

    else if (layout === "mosaic") {

        if (count === 1) {

            cells.push({
                x: 0, y: 0, w: 1, h: 1,
                cols: 1, rows: 1
            });

        }

        else {

            // First photo: large left panel
            cells.push({
                x: 0, y: 0, w: 2, h: 2,
                cols: 3, rows: 2
            });

            // Other photos: right and lower panels
            for (let i = 1; i < count; i++) {

                const rightColumnCount = count - 1;

                cells.push({

                    x: 2,
                    y: i - 1,
                    w: 1,
                    h: 1,
                    cols: 3,
                    rows: Math.max(2, rightColumnCount)

                });

            }

        }

    }

    return cells;

}


// =====================================================
// 13. CALCULATE CELL RECTANGLES
// =====================================================

function calculateCellRects() {

    const cells = getLayoutCells();

    const gap = Number(gridGap.value);

    const layout = collageLayout.value;

    const rects = [];

    if (!cells.length) return rects;

    cells.forEach(cell => {

        let x, y, width, height;

        if (layout === "mosaic" && photos.length > 1) {

            const availableWidth = DP_SIZE - gap * 2;

            const availableHeight = DP_SIZE - gap;

            const unitWidth = availableWidth / 3;

            const rows = Math.max(2, photos.length - 1);

            const unitHeight = availableHeight / rows;

            x = gap + cell.x * (unitWidth + gap / 3);

            y = gap + cell.y * (unitHeight + gap / 3);

            width = cell.w * unitWidth + (cell.w - 1) * gap / 2;

            height = cell.h * unitHeight + (cell.h - 1) * gap / 2;

            if (cell.x === 0) {
                width = unitWidth * 2 + gap / 3;
                height = DP_SIZE - gap * 2;
            }

        }

        else {

            const cols = cell.cols;

            const rows = cell.rows;

            const totalWidth = DP_SIZE - gap * (cols + 1);

            const totalHeight = DP_SIZE - gap * (rows + 1);

            const cellWidth = totalWidth / cols;

            const cellHeight = totalHeight / rows;

            x = gap + cell.x * (cellWidth + gap);

            y = gap + cell.y * (cellHeight + gap);

            width = cellWidth;

            height = cellHeight;

        }

        rects.push({

            x,
            y,
            width,
            height

        });

    });

    return rects;

}


// =====================================================
// 14. ROUNDED RECTANGLE
// =====================================================

function roundedRect(x, y, width, height, radius) {

    const r = Math.min(

        radius,

        width / 2,

        height / 2

    );

    ctx.beginPath();

    ctx.moveTo(x + r, y);

    ctx.lineTo(x + width - r, y);

    ctx.quadraticCurveTo(x + width, y, x + width, y + r);

    ctx.lineTo(x + width, y + height - r);

    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - r,
        y + height
    );

    ctx.lineTo(x + r, y + height);

    ctx.quadraticCurveTo(x, y + height, x, y + height - r);

    ctx.lineTo(x, y + r);

    ctx.quadraticCurveTo(x, y, x + r, y);

    ctx.closePath();

}


// =====================================================
// 15. DRAW INDIVIDUAL PHOTO
// =====================================================

function drawPhoto(photo, rect, index) {

    const { x, y, width, height } = rect;

    const gapRadius = Number(cornerRadius.value);

    const borderWidth = Number(gridBorder.value);

    const innerX = x + borderWidth;
    const innerY = y + borderWidth;

    const innerWidth = Math.max(1, width - borderWidth * 2);
    const innerHeight = Math.max(1, height - borderWidth * 2);

    // PHOTO BORDER / BACKGROUND

    ctx.save();

    ctx.fillStyle = gridColor.value;

    roundedRect(x, y, width, height, gapRadius);

    ctx.fill();

    // CLIP IMAGE

    roundedRect(
        innerX,
        innerY,
        innerWidth,
        innerHeight,
        Math.max(0, gapRadius - borderWidth)
    );

    ctx.clip();

    // IMAGE COVER

    const img = photo.img;

    const baseScale = Math.max(

        innerWidth / img.width,

        innerHeight / img.height

    );

    const scale = baseScale * photo.zoom;

    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;

    const drawX =
        innerX + (innerWidth - drawWidth) / 2 + photo.panX;

    const drawY =
        innerY + (innerHeight - drawHeight) / 2 + photo.panY;

    ctx.filter = `
        brightness(${brightness.value}%)
        contrast(${contrast.value}%)
        blur(${blur.value}px)
    `;

    ctx.drawImage(
        img,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );

    ctx.filter = "none";

    ctx.restore();

    // SELECTED PHOTO GUIDE (PREVIEW ONLY)

    if (index === selectedPhotoIndex) {

        ctx.save();

        ctx.strokeStyle = "#38bdf8";

        ctx.lineWidth = 4;

        ctx.setLineDash([10, 8]);

        roundedRect(
            x + 2,
            y + 2,
            width - 4,
            height - 4,
            gapRadius
        );

        ctx.stroke();

        ctx.restore();

    }

}


// =====================================================
// 16. DRAW COLLAGE
// =====================================================

function drawCollage() {

    // BACKGROUND

    ctx.fillStyle = gridColor.value;

    ctx.fillRect(0, 0, DP_SIZE, DP_SIZE);

    layoutCells = getLayoutCells();

    cellRects = calculateCellRects();

    photos.forEach((photo, index) => {

        const rect = cellRects[index];

        if (!rect) return;

        drawPhoto(photo, rect, index);

    });

    // BLACK OVERLAY

    const opacity = Number(overlayOpacity.value) / 100;

    if (opacity > 0) {

        ctx.save();

        ctx.fillStyle = `rgba(0,0,0,${opacity})`;

        ctx.fillRect(0, 0, DP_SIZE, DP_SIZE);

        ctx.restore();

    }

}


// =====================================================
// 17. TEXT WRAPPING
// =====================================================

function measureSpacedText(text, spacing) {

    const chars = Array.from(text);

    let width = 0;

    chars.forEach((character, index) => {

        width += ctx.measureText(character).width;

        if (index < chars.length - 1) width += spacing;

    });

    return width;

}


function wrapText(text, maxWidth, spacing) {

    const result = [];

    text.split("\n").forEach(paragraph => {

        if (!paragraph.trim()) {

            result.push("");

            return;

        }

        let line = "";

        paragraph.split(/\s+/).forEach(word => {

            const test = line ? `${line} ${word}` : word;

            if (measureSpacedText(test, spacing) > maxWidth && line) {

                result.push(line);

                line = word;

            } else {

                line = test;

            }

        });

        if (line) result.push(line);

    });

    return result;

}


// =====================================================
// 18. DRAW SPACED TEXT
// =====================================================

function drawSpacedText(text, x, y, spacing, alignment) {

    const chars = Array.from(text);

    const totalWidth = measureSpacedText(text, spacing);

    let startX = x;

    if (alignment === "center") startX -= totalWidth / 2;

    if (alignment === "right") startX -= totalWidth;

    chars.forEach(character => {

        ctx.fillText(character, startX, y);

        startX += ctx.measureText(character).width + spacing;

    });

}


// =====================================================
// 19. DRAW CUSTOM TEXT
// =====================================================

function drawCustomText() {

    const rawText = textInput.value || "YOUR TEXT\nHERE";

    const size = Number(textSize.value);

    const spacing = Number(letterSpacing.value);

    const lineHeightValue = Number(lineHeight.value);

    const alignment = textAlign.value;

    ctx.save();

    ctx.font = `${fontWeight.value} ${size}px "${fontFamily.value}", sans-serif`;

    ctx.globalAlpha = Number(textOpacity.value) / 100;

    ctx.fillStyle = textColor.value;

    ctx.strokeStyle = strokeColor.value;

    ctx.lineWidth = Number(strokeWidth.value);

    ctx.lineJoin = "round";

    ctx.shadowColor = shadowColor.value;

    ctx.shadowBlur = Number(shadowBlur.value);

    ctx.shadowOffsetX = Number(shadowX.value);

    ctx.shadowOffsetY = Number(shadowY.value);

    const lines = wrapText(rawText, MAX_TEXT_WIDTH, spacing);

    lines.forEach((line, index) => {

        const y = textPosition.y + index * size * lineHeightValue;

        const width = measureSpacedText(line, spacing);

        let startX = textPosition.x;

        if (alignment === "center") startX -= width / 2;

        if (alignment === "right") startX -= width;

        let cursorX = startX;

        Array.from(line).forEach(character => {

            if (Number(strokeWidth.value) > 0) {

                ctx.strokeText(character, cursorX, y);

            }

            ctx.fillText(character, cursorX, y);

            cursorX += ctx.measureText(character).width + spacing;

        });

    });

    ctx.restore();

}


// =====================================================
// 20. DATE AND TIME
// =====================================================

function getFormattedDate() {

    const now = new Date();

    const day = String(now.getDate()).padStart(2, "0");

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const year = now.getFullYear();

    const shortMonth = new Intl.DateTimeFormat("en-IN", {
        month: "short"
    }).format(now);

    const fullMonth = new Intl.DateTimeFormat("en-IN", {
        month: "long"
    }).format(now);

    const weekday = new Intl.DateTimeFormat("en-IN", {
        weekday: "long"
    }).format(now);

    switch (dateFormat.value) {

        case "DD/MM/YYYY":
            return `${day}/${month}/${year}`;

        case "MM/DD/YYYY":
            return `${month}/${day}/${year}`;

        case "YYYY-MM-DD":
            return `${year}-${month}-${day}`;

        case "DD MMMM YYYY":
            return `${day} ${fullMonth} ${year}`;

        case "dddd, DD MMM YYYY":
            return `${weekday}, ${day} ${shortMonth} ${year}`;

        default:
            return `${day} ${shortMonth} ${year}`;

    }

}


function getDateTimeText() {

    if (!showDate.checked) return "";

    const date = getFormattedDate();

    if (timeFormat.value === "none") {
        return date.toUpperCase();
    }

    const time = new Date().toLocaleTimeString("en-IN", {

        hour: "2-digit",
        minute: "2-digit",
        hour12: timeFormat.value === "12"

    });

    return `${date} • ${time}`.toUpperCase();

}


function drawDateTime() {

    const text = getDateTimeText();

    if (!text) return;

    ctx.save();

    ctx.font = "800 25px Montserrat, sans-serif";

    ctx.fillStyle = dateColor.value;

    ctx.textAlign = "center";

    ctx.textBaseline = "top";

    ctx.shadowColor = "#000000";

    ctx.shadowBlur = 8;

    ctx.fillText(text, datePosition.x, datePosition.y);

    ctx.restore();

}


// =====================================================
// 21. WHATSAPP SAFE AREA
// =====================================================

function drawSafeAreaGuide() {

    if (!showSafeArea.checked) return;

    ctx.save();

    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 3;

    ctx.setLineDash([12, 10]);

    ctx.beginPath();

    ctx.arc(540, 540, 430, 0, Math.PI * 2);

    ctx.stroke();

    ctx.restore();

}


// =====================================================
// 22. MAIN CANVAS RENDER
// =====================================================

function updateCanvas(includeGuide = true) {

    ctx.clearRect(0, 0, DP_SIZE, DP_SIZE);

    if (!photos.length) return;

    drawCollage();

    drawDateTime();

    drawCustomText();

    if (includeGuide) drawSafeAreaGuide();

}


// =====================================================
// 23. POINTER COORDINATES
// =====================================================

function getCanvasCoordinates(event) {

    const rect = canvas.getBoundingClientRect();

    return {

        x: (event.clientX - rect.left) * DP_SIZE / rect.width,

        y: (event.clientY - rect.top) * DP_SIZE / rect.height

    };

}


// =====================================================
// 24. FIND PHOTO UNDER POINTER
// =====================================================

function getPhotoAtPosition(x, y) {

    for (let i = cellRects.length - 1; i >= 0; i--) {

        const r = cellRects[i];

        if (

            x >= r.x &&
            x <= r.x + r.width &&
            y >= r.y &&
            y <= r.y + r.height

        ) {

            return i;

        }

    }

    return -1;

}


// =====================================================
// 25. TEXT HIT TEST
// =====================================================

function isInsideText(x, y) {

    const size = Number(textSize.value);

    const spacing = Number(letterSpacing.value);

    const lh = size * Number(lineHeight.value);

    ctx.save();

    ctx.font = `${fontWeight.value} ${size}px "${fontFamily.value}", sans-serif`;

    const lines = wrapText(
        textInput.value || "YOUR TEXT\nHERE",
        MAX_TEXT_WIDTH,
        spacing
    );

    const width = Math.max(
        20,
        ...lines.map(line => measureSpacedText(line, spacing))
    );

    ctx.restore();

    let left = textPosition.x;

    if (textAlign.value === "center") left -= width / 2;

    if (textAlign.value === "right") left -= width;

    return (

        x >= left - 20 &&
        x <= left + width + 20 &&
        y >= textPosition.y - 20 &&
        y <= textPosition.y + lines.length * lh + 20

    );

}


// =====================================================
// 26. DATE HIT TEST
// =====================================================

function isInsideDate(x, y) {

    if (!getDateTimeText()) return false;

    ctx.save();

    ctx.font = "800 25px Montserrat, sans-serif";

    const width = ctx.measureText(getDateTimeText()).width;

    ctx.restore();

    return (

        x >= datePosition.x - width / 2 - 15 &&
        x <= datePosition.x + width / 2 + 15 &&
        y >= datePosition.y - 15 &&
        y <= datePosition.y + 50

    );

}


// =====================================================
// 27. POINTER DOWN
// =====================================================

canvas.addEventListener("pointerdown", function (event) {

    if (!photos.length) return;

    const p = getCanvasCoordinates(event);

    lastPointer = p;

    if (isInsideText(p.x, p.y)) {

        activeDragTarget = "text";

        pointerOffsetX = p.x - textPosition.x;

        pointerOffsetY = p.y - textPosition.y;

    }

    else if (isInsideDate(p.x, p.y)) {

        activeDragTarget = "date";

        pointerOffsetX = p.x - datePosition.x;

        pointerOffsetY = p.y - datePosition.y;

    }

    else {

        const index = getPhotoAtPosition(p.x, p.y);

        if (index === -1) return;

        selectedPhotoIndex = index;

        activeDragTarget = "image";

        refreshPhotoList();

        updateSelectedPhotoControls();

    }

    isDragging = true;

    canvas.classList.add("dragging");

    canvas.setPointerCapture(event.pointerId);

});


// =====================================================
// 28. POINTER MOVE
// =====================================================

canvas.addEventListener("pointermove", function (event) {

    const p = getCanvasCoordinates(event);

    if (!isDragging) {

        if (!photos.length) return;

        canvas.style.cursor = (
            isInsideText(p.x, p.y) ||
            isInsideDate(p.x, p.y)
        ) ? "grab" : "move";

        return;

    }

    const dx = p.x - lastPointer.x;

    const dy = p.y - lastPointer.y;

    if (activeDragTarget === "text") {

        textPosition.x = Math.max(
            0,
            Math.min(DP_SIZE, p.x - pointerOffsetX)
        );

        textPosition.y = Math.max(
            0,
            Math.min(DP_SIZE, p.y - pointerOffsetY)
        );

    }

    else if (activeDragTarget === "date") {

        datePosition.x = Math.max(
            0,
            Math.min(DP_SIZE, p.x - pointerOffsetX)
        );

        datePosition.y = Math.max(
            0,
            Math.min(DP_SIZE, p.y - pointerOffsetY)
        );

    }

    else if (activeDragTarget === "image") {

        const photo = photos[selectedPhotoIndex];

        if (photo) {

            photo.panX += dx;

            photo.panY += dy;

        }

    }

    lastPointer = p;

    updateCanvas();

});


// =====================================================
// 29. POINTER UP
// =====================================================

function stopDragging() {

    isDragging = false;

    activeDragTarget = null;

    canvas.classList.remove("dragging");

}

canvas.addEventListener("pointerup", stopDragging);

canvas.addEventListener("pointercancel", stopDragging);

canvas.addEventListener("lostpointercapture", stopDragging);


// =====================================================
// 30. RESET POSITIONS
// =====================================================

$("reset-position").addEventListener("click", function () {

    Object.assign(textPosition, defaultTextPosition);

    updateCanvas();

});


$("reset-date-position").addEventListener("click", function () {

    Object.assign(datePosition, defaultDatePosition);

    updateCanvas();

});


// =====================================================
// 31. RESET ALL SETTINGS
// =====================================================

$("reset-all").addEventListener("click", function () {

    if (!confirm("Reset all settings?")) return;

    collageLayout.value = "grid3";

    gridGap.value = 8;

    cornerRadius.value = 8;

    gridColor.value = "#ffffff";

    gridBorder.value = 0;

    brightness.value = 100;

    contrast.value = 100;

    blur.value = 0;

    overlayOpacity.value = 45;

    textInput.value = "";

    textSize.value = 56;

    fontFamily.value = "Montserrat";

    fontWeight.value = 700;

    textAlign.value = "center";

    textColor.value = "#ffffff";

    textOpacity.value = 100;

    strokeWidth.value = 0;

    strokeColor.value = "#000000";

    shadowColor.value = "#000000";

    shadowBlur.value = 10;

    shadowX.value = 3;

    shadowY.value = 3;

    letterSpacing.value = 0;

    lineHeight.value = 1.3;

    dateFormat.value = "DD MMM YYYY";

    timeFormat.value = "12";

    showDate.checked = true;

    dateColor.value = "#38bdf8";

    showSafeArea.checked = true;

    photos.forEach(photo => {

        photo.zoom = 1;

        photo.panX = 0;

        photo.panY = 0;

    });

    Object.assign(textPosition, defaultTextPosition);

    Object.assign(datePosition, defaultDatePosition);

    updateSelectedPhotoControls();

    updateLabels();

    updateCanvas();

});


// =====================================================
// 32. CONTROL EVENTS
// =====================================================

const controls = [

    collageLayout,
    gridGap,
    cornerRadius,
    gridColor,
    gridBorder,

    textInput,
    textSize,
    fontFamily,
    fontWeight,
    textAlign,
    textColor,
    textOpacity,

    strokeWidth,
    strokeColor,
    shadowColor,
    shadowBlur,
    shadowX,
    shadowY,

    letterSpacing,
    lineHeight,

    dateFormat,
    timeFormat,
    showDate,
    dateColor,

    brightness,
    contrast,
    blur,
    overlayOpacity,
    showSafeArea

];

controls.forEach(control => {

    control.addEventListener("input", function () {

        updateLabels();

        updateCanvas();

    });

    control.addEventListener("change", updateCanvas);

});


// =====================================================
// 33. DOWNLOAD WHATSAPP DP
// =====================================================

downloadBtn.addEventListener("click", function () {

    if (!photos.length) {

        alert("Please add photos first.");

        return;

    }

    // Remove preview-only selection and safe-area guides

    updateCanvas(false);

    canvas.toBlob(function (blob) {

        if (!blob) {

            alert("Image export failed.");

            updateCanvas();

            return;

        }

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = `WhatsApp_Collage_${Date.now()}.jpg`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => {

            URL.revokeObjectURL(url);

            updateCanvas();

        }, 1000);

    }, "image/jpeg", 0.95);

});


// =====================================================
// 34. INITIALIZATION
// =====================================================

updateLabels();

refreshPhotoList();

downloadBtn.disabled = true;

