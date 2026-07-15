const bgInput = document.getElementById('bg-input');
const textInput = document.getElementById('text-input');
const dateColorInput = document.getElementById('date-color');
const textColorInput = document.getElementById('text-color');
const colorSection = document.getElementById('color-section');
const downloadBtn = document.getElementById('download-btn');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const placeholderText = document.getElementById('placeholder-text');

let loadedImage = null;
const DP_SIZE = 1000; 

bgInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            loadedImage = img;
            canvas.width = DP_SIZE;
            canvas.height = DP_SIZE;
            
            textInput.disabled = false;
            downloadBtn.disabled = false;
            colorSection.style.display = 'flex';
            placeholderText.style.display = 'none';
            canvas.style.display = 'block';
            
            updateCanvas();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

textInput.addEventListener('input', updateCanvas);
dateColorInput.addEventListener('input', updateCanvas);
textColorInput.addEventListener('input', updateCanvas);

function updateCanvas() {
    if (!loadedImage) return;

    // 1. SQUARE CENTER CROP
    const imgWidth = loadedImage.width;
    const imgHeight = loadedImage.height;
    let sourceX = 0, sourceY = 0, sourceWidth = imgWidth, sourceHeight = imgHeight;

    if (imgWidth > imgHeight) {
        sourceWidth = imgHeight;
        sourceX = (imgWidth - imgHeight) / 2;
    } else if (imgHeight > imgWidth) {
        sourceHeight = imgWidth;
        sourceY = (imgHeight - imgWidth) / 2;
    }

    ctx.drawImage(loadedImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, DP_SIZE, DP_SIZE);

    // 2. DARK OVERLAY
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, DP_SIZE, DP_SIZE);

    // 3. DATE & TIME
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateTimeText = `${dateStr} • ${timeStr}`.toUpperCase();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top'; // Isse top alignment pure pixel-perfect ho jati hai

    // Date & Time (Upper se exact 30px door)
    ctx.font = "800 24px 'Montserrat', sans-serif"; 
    ctx.fillStyle = dateColorInput.value; 
    ctx.letterSpacing = "2px"; 
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    const dateYPosition = 30; // 30px from the top edge
    ctx.fillText(dateTimeText, DP_SIZE / 2, dateYPosition); 

    // 4. MULTI-LINE USER TEXT LOGIC
    const rawText = textInput.value || "YOUR TEXT\nHERE"; 
    const lines = rawText.split('\n');

    ctx.font = "bold 56px 'Montserrat', sans-serif"; 
    ctx.fillStyle = textColorInput.value; 
    ctx.letterSpacing = "0px";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Line spacing calculations:
    // Date is at 30px, Font size of date is 24px (Total ~54px reached)
    // Uske baad exact 50px ka gap chahiye. So, 30 + 24 + 50 = 104px height par text shuru hoga
    const startY = dateYPosition + 24 + 50; 
    const lineHeight = 70; 

    lines.forEach((line, index) => {
        ctx.fillText(line, DP_SIZE / 2, startY + (index * lineHeight));
    });
    
    ctx.shadowColor = "transparent";
}

downloadBtn.addEventListener('click', function() {
    const imageURL = canvas.toDataURL('image/jpeg', 0.95);
    const downloadLink = document.createElement('a');
    downloadLink.href = imageURL;
    downloadLink.download = `WhatsApp_DP_${Date.now()}.jpg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});