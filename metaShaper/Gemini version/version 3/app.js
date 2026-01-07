// 상태 변수
let currentMetadata = {};
let fieldOrder = [];
let outputFormat = 'multiline';

// 기본 필드 (Copyright를 ID로 자동 처리하므로 labelType valueOnly로 설정)
const defaultFields = [
    { key: 'make', label: { ko: '제조사', en: 'Make' }, value: '', enabled: false, labelType: 'valueOnly' },
    { key: 'camera', label: { ko: '카메라', en: 'Camera' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'lens', label: { ko: '렌즈', en: 'Lens' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'focalLength', label: { ko: '초점거리', en: 'Focal Length' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'aperture', label: { ko: '조리개', en: 'Aperture' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'shutterSpeed', label: { ko: '셔터속도', en: 'Shutter Speed' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'iso', label: { ko: 'ISO', en: 'ISO' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'dateTime', label: { ko: '촬영일', en: 'Date' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'software', label: { ko: '소프트웨어', en: 'Software' }, value: '', enabled: false, labelType: 'valueOnly' },
    { key: 'copyright', label: { ko: '저작권', en: 'Copyright' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'location', label: { ko: '위치', en: 'Location' }, value: '', enabled: false, labelType: 'valueOnly' }
];

// DOM Elements
const elements = {
    fileInput: document.getElementById('fileInput'),
    uploadBox: document.getElementById('uploadBox'),
    fileInfoArea: document.getElementById('fileInfoArea'),
    removeImgBtn: document.getElementById('removeImgBtn'),
    fileName: document.getElementById('fileName'),
    
    metadataList: document.getElementById('metadataList'),
    textEditor: document.getElementById('textEditor'),
    
    instagramId: document.getElementById('instagramId'),
    // copyrightText 제거됨
    
    previewUsername: document.getElementById('previewUsername'),
    captionUsername: document.getElementById('captionUsername'),
    captionText: document.getElementById('captionText'),
    instagramPreviewImg: document.getElementById('instagramPreviewImg'),
    
    themeToggle: document.getElementById('themeToggle'),
    toast: document.getElementById('toast'),
    addHashtagsBtn: document.getElementById('addHashtagsBtn'),
    separatorInput: document.getElementById('separator'),
    
    presetSelect: document.getElementById('presetSelect'),
    savePresetBtn: document.getElementById('savePresetBtn'),
    downloadWatermarkBtn: document.getElementById('downloadWatermarkBtn')
};

function init() {
    loadSettings();
    loadPresets();
    setupEventListeners();
    setupMobileNav();
    applyTheme();
    renderMetadataList();
    
    // 초기 탭 설정 (미리보기)
    document.body.setAttribute('data-view', 'preview');
    
    // 초기 구분자 상태 설정
    handleFormatChange(outputFormat);
    
    // 저작권 및 미리보기 초기 업데이트
    updateCopyrightValue();
    updatePreview();
}

function setupMobileNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            document.body.setAttribute('data-view', item.dataset.target);
            window.scrollTo(0, 0);
        });
    });
}

function setupEventListeners() {
    // 업로드
    elements.uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); elements.uploadBox.classList.add('drag-over'); });
    elements.uploadBox.addEventListener('dragleave', () => elements.uploadBox.classList.remove('drag-over'));
    elements.uploadBox.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    elements.removeImgBtn.addEventListener('click', resetImage);
    elements.themeToggle.addEventListener('click', toggleTheme);
    document.getElementById('copyBtn').addEventListener('click', copyText);
    document.getElementById('toggleAllBtn').addEventListener('click', toggleAllFields);
    elements.addHashtagsBtn.addEventListener('click', addHashtags);
    elements.downloadWatermarkBtn.addEventListener('click', downloadImageWithWatermark);

    elements.savePresetBtn.addEventListener('click', savePreset);
    elements.presetSelect.addEventListener('change', loadSelectedPreset);

    // Instagram ID 변경 -> Copyright 자동 업데이트 + 미리보기 갱신
    elements.instagramId.addEventListener('input', () => { 
        saveSettings(); 
        updateCopyrightValue();
        generateText(); // Copyright 갱신을 위해 텍스트 재생성
        updatePreview(); 
    });
    
    elements.textEditor.addEventListener('input', updatePreview);
    
    // 구분자 입력 시 즉시 반영
    elements.separatorInput.addEventListener('input', () => {
        if(outputFormat === 'inline') generateText();
    });

    document.querySelectorAll('input[name="outputFormat"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            outputFormat = e.target.value;
            handleFormatChange(outputFormat);
            saveSettings();
            generateText();
        });
    });
}

// 저작권 필드 값 = © + Instagram ID
function updateCopyrightValue() {
    const cpField = fieldOrder.find(f => f.key === 'copyright');
    if (cpField) {
        const id = elements.instagramId.value.trim();
        cpField.value = id ? `© ${id}` : '';
    }
}

function handleFormatChange(format) {
    if(format === 'inline') {
        elements.separatorInput.disabled = false;
        elements.separatorInput.style.opacity = '1';
    } else {
        elements.separatorInput.disabled = true;
        elements.separatorInput.style.opacity = '0.5';
    }
}

async function handleDrop(e) {
    e.preventDefault();
    elements.uploadBox.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = '';
}

async function processFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 가능합니다.');
        return;
    }
    elements.fileName.textContent = "처리 중...";
    
    try {
        let imageFile = file;
        if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
            const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
            imageFile = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
        }

        const imageUrl = URL.createObjectURL(imageFile);
        
        elements.fileInfoArea.classList.remove('hidden');
        elements.instagramPreviewImg.src = imageUrl;
        elements.fileName.textContent = file.name;

        await readExifData(imageFile);
    } catch (error) {
        console.error(error);
        showToast('이미지 처리 실패');
        elements.fileName.textContent = "오류 발생";
    }
}

async function readExifData(file) {
    try {
        const output = await exifr.parse(file, { tiff: true, exif: true, gps: true, makerNote: true, xmp: true });
        if (!output) throw new Error("No EXIF");

        const make = output.Make || '';
        const model = output.Model || '';
        let camera = model;
        if (make && model && model.toLowerCase().startsWith(make.toLowerCase())) {
            camera = model.substring(make.length).trim();
        } else if (make && model) {
            camera = `${make} ${model}`;
        }

        let lens = output.LensModel || output.Lens || '';
        const focal = output.FocalLength ? `${Math.round(output.FocalLength)}mm` : '';
        const aperture = output.FNumber ? `f/${output.FNumber}` : '';
        const shutter = output.ExposureTime ? 
            (output.ExposureTime >= 1 ? `${output.ExposureTime}s` : `1/${Math.round(1/output.ExposureTime)}s`) : '';
        const iso = output.ISO ? `ISO ${output.ISO}` : '';
        const software = output.Software || '';
        
        let dateStr = '';
        if (output.DateTimeOriginal) {
            const date = new Date(output.DateTimeOriginal);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateStr = `${year}.${month}.${day}`;
        }

        // GPS 데이터 확인
        let location = '';
        if (output.latitude && output.longitude) {
            location = await getAddressFromCoordinates(output.latitude, output.longitude);
            // 위치가 있다면 인스타 미리보기의 장소 부분도 업데이트 가능 (옵션)
            document.querySelector('.insta-loc').textContent = location || "MetaShaper";
        }

        currentMetadata = {
            camera, make, lens, focalLength: focal, aperture, shutterSpeed: shutter, iso, 
            dateTime: dateStr, location, software,
            copyright: '' // 추후 업데이트
        };

        updateCopyrightValue();
        updateFieldValues();
        generateText();
        showToast('정보 추출 완료!');
    } catch (e) {
        console.log(e);
        currentMetadata = {};
        updateFieldValues();
        generateText();
    }
}

// [복구됨] 좌표 -> 주소 변환 (OpenStreetMap Nominatim)
async function getAddressFromCoordinates(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko`,
            { headers: { 'User-Agent': 'MetaShaper/1.0' } }
        );
        if (!response.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        const data = await response.json();
        const addr = data.address;
        
        // 시/구/동 위주로 간략하게
        let parts = [];
        if (addr.city || addr.county) parts.push(addr.city || addr.county);
        if (addr.borough || addr.district) parts.push(addr.borough || addr.district);
        if (addr.suburb || addr.neighborhood || addr.hamlet) parts.push(addr.suburb || addr.neighborhood || addr.hamlet);
        
        return parts.length > 0 ? parts.join(' ') : (data.display_name || "");
    } catch (e) {
        console.error(e);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

function updateFieldValues() {
    fieldOrder = fieldOrder.map(f => {
        let val = currentMetadata[f.key] || '';
        // copyright는 항상 실시간 ID 기준
        if(f.key === 'copyright') val = elements.instagramId.value ? `© ${elements.instagramId.value}` : '';
        return { ...f, value: val };
    });
    renderMetadataList();
}

function renderMetadataList() {
    const container = elements.metadataList;
    container.innerHTML = '';
    fieldOrder.forEach((field, index) => {
        const item = document.createElement('div');
        item.className = `metadata-item ${!field.enabled ? 'disabled' : ''}`;
        item.draggable = true;
        item.dataset.index = index;
        
        item.innerHTML = `
            <span class="drag-handle"><i class="ri-draggable"></i></span>
            <input type="checkbox" ${field.enabled ? 'checked' : ''} onchange="toggleField(${index})">
            <div class="meta-content">
                <span class="meta-key">${field.label.en} / ${field.label.ko}</span>
                <span class="meta-val">${field.value || '-'}</span>
            </div>
            <button class="label-toggle-btn" onclick="cycleLabelType(${index})">
                ${getLabelTypeName(field.labelType)}
            </button>
        `;
        addDragEvents(item);
        container.appendChild(item);
    });
}

function getLabelTypeName(type) {
    const map = { 'valueOnly': '값만', 'en': 'Eng', 'ko': '한글' };
    return map[type] || '값만';
}

function cycleLabelType(index) {
    const types = ['valueOnly', 'en', 'ko'];
    const current = fieldOrder[index].labelType || 'valueOnly';
    fieldOrder[index].labelType = types[(types.indexOf(current) + 1) % types.length];
    saveSettings();
    renderMetadataList();
    generateText();
}

function toggleField(index) {
    fieldOrder[index].enabled = !fieldOrder[index].enabled;
    saveSettings();
    renderMetadataList();
    generateText();
}

function toggleAllFields() {
    const anyDisabled = fieldOrder.some(f => !f.enabled);
    fieldOrder = fieldOrder.map(f => ({ ...f, enabled: anyDisabled }));
    saveSettings();
    renderMetadataList();
    generateText();
}

function generateText() {
    const lines = [];
    fieldOrder.forEach(f => {
        if(f.enabled && f.value) {
            const label = f.labelType === 'valueOnly' ? '' : `${f.label[f.labelType]}: `;
            lines.push(`${label}${f.value}`);
        }
    });

    const sep = outputFormat === 'inline' ? elements.separatorInput.value : '\n';
    elements.textEditor.value = lines.join(sep);
    updatePreview();
}

function updatePreview() {
    const id = elements.instagramId.value.replace('@', '') || 'username';
    elements.previewUsername.textContent = id;
    elements.captionUsername.textContent = id;
    elements.captionText.textContent = elements.textEditor.value;
}

function addHashtags() {
    const tags = ['#photography', '#photooftheday'];
    const userId = elements.instagramId.value.replace('@', '').trim();
    if(userId) tags.push(`#${userId}`);

    if(currentMetadata.camera) tags.push(`#${currentMetadata.camera.replace(/\s/g, '')}`);
    if(currentMetadata.make) tags.push(`#${currentMetadata.make.replace(/\s/g, '')}`);
    if(currentMetadata.lens) tags.push(`#${currentMetadata.lens.replace(/\s/g, '').replace(/\//g, '')}`);
    tags.push('#snapshot', '#exif');
    
    const current = elements.textEditor.value;
    elements.textEditor.value = current + (current ? '\n\n' : '') + tags.join(' ');
    updatePreview();
}

function copyText() {
    elements.textEditor.select();
    document.execCommand('copy');
    showToast('텍스트가 복사되었습니다!');
}

async function downloadImageWithWatermark() {
    const img = elements.instagramPreviewImg;
    if(!img.src || img.src.includes('data:image/gif')) {
        showToast('이미지가 없습니다.');
        return;
    }

    showToast('이미지 생성 중...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const originalImage = new Image();
    originalImage.crossOrigin = "Anonymous";
    originalImage.src = img.src;

    originalImage.onload = () => {
        const w = originalImage.width;
        const h = originalImage.height;
        const fontSize = Math.max(24, w * 0.03); 
        const padding = fontSize;
        const text = elements.textEditor.value;
        const lines = text.split('\n');
        const lineHeight = fontSize * 1.5;
        const textAreaHeight = (lines.length * lineHeight) + (padding * 2);

        canvas.width = w;
        canvas.height = h + textAreaHeight;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0);

        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        let startY = h + padding;
        lines.forEach((line) => {
            ctx.fillText(line, w / 2, startY);
            startY += lineHeight;
        });

        const link = document.createElement('a');
        link.download = `metashaper_${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
        showToast('저장되었습니다.');
    };
}

// 프리셋 기능 (단순화)
function savePreset() {
    const name = prompt("프리셋 이름을 입력하세요:");
    if(!name) return;
    const preset = {
        name: name,
        order: fieldOrder.map(f => ({ key: f.key, enabled: f.enabled, labelType: f.labelType })),
        format: outputFormat,
        separator: elements.separatorInput.value
    };
    let presets = JSON.parse(localStorage.getItem('metaShaper_presets') || '[]');
    presets.push(preset);
    localStorage.setItem('metaShaper_presets', JSON.stringify(presets));
    loadPresets();
    showToast(`프리셋 "${name}" 저장됨`);
}

function loadPresets() {
    const presets = JSON.parse(localStorage.getItem('metaShaper_presets') || '[]');
    elements.presetSelect.innerHTML = '<option value="">프리셋...</option>';
    presets.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = p.name;
        elements.presetSelect.appendChild(opt);
    });
}

function loadSelectedPreset() {
    const idx = elements.presetSelect.value;
    if(idx === "") return;
    const presets = JSON.parse(localStorage.getItem('metaShaper_presets') || '[]');
    const p = presets[idx];
    if(!p) return;

    const newOrder = [];
    p.order.forEach(po => {
        const field = fieldOrder.find(f => f.key === po.key) || defaultFields.find(f => f.key === po.key);
        if(field) {
            field.enabled = po.enabled;
            field.labelType = po.labelType;
            newOrder.push(field);
        }
    });

    fieldOrder.forEach(f => {
        if(!newOrder.find(nf => nf.key === f.key)) newOrder.push(f);
    });

    fieldOrder = newOrder;
    outputFormat = p.format;
    elements.separatorInput.value = p.separator || ', ';
    
    const radio = document.querySelector(`input[name="outputFormat"][value="${outputFormat}"]`);
    if(radio) radio.checked = true;
    handleFormatChange(outputFormat);

    saveSettings();
    renderMetadataList();
    generateText();
    showToast(`프리셋 적용됨`);
}

function loadSettings() {
    const saved = localStorage.getItem('metaShaper_fields');
    if(saved) {
        const savedOrder = JSON.parse(saved);
        fieldOrder = defaultFields.map(df => {
            const savedItem = savedOrder.find(so => so.key === df.key);
            return savedItem ? { ...df, ...savedItem, value: '' } : df;
        });
    } else {
        fieldOrder = JSON.parse(JSON.stringify(defaultFields));
    }
    elements.instagramId.value = localStorage.getItem('instagramId') || '';
}

function saveSettings() {
    const toSave = fieldOrder.map(({ value, ...rest }) => rest);
    localStorage.setItem('metaShaper_fields', JSON.stringify(toSave));
    localStorage.setItem('instagramId', elements.instagramId.value);
}

function resetImage() {
    elements.fileInfoArea.classList.add('hidden');
    elements.instagramPreviewImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    elements.fileInput.value = '';
    currentMetadata = {};
    updateFieldValues();
    generateText();
}

function showToast(msg) {
    elements.toast.textContent = msg;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 2000);
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    elements.themeToggle.querySelector('i').className = newTheme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
}

function applyTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    elements.themeToggle.querySelector('i').className = saved === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
}

let dragSrcEl = null;
function addDragEvents(item) {
    item.addEventListener('dragstart', function(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        this.classList.add('dragging');
    });
    item.addEventListener('dragover', (e) => { e.preventDefault(); return false; });
    item.addEventListener('dragenter', function() { this.classList.add('over'); });
    item.addEventListener('dragleave', function() { this.classList.remove('over'); });
    item.addEventListener('drop', function(e) {
        if (e.stopPropagation) e.stopPropagation();
        if (dragSrcEl !== this) {
            const srcIdx = parseInt(dragSrcEl.dataset.index);
            const targetIdx = parseInt(this.dataset.index);
            const [moved] = fieldOrder.splice(srcIdx, 1);
            fieldOrder.splice(targetIdx, 0, moved);
            saveSettings();
            renderMetadataList();
            generateText();
        }
        return false;
    });
    item.addEventListener('dragend', function() {
        this.classList.remove('dragging');
        document.querySelectorAll('.metadata-item').forEach(item => item.classList.remove('over'));
    });
}

document.addEventListener('DOMContentLoaded', init);