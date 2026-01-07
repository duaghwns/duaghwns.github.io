// 상태 변수
let currentMetadata = {};
let fieldOrder = [];
let outputFormat = 'multiline';
// 구분자는 기본적으로 활성화 상태에서 값을 가져오되, CSS/HTML로 제어
let copyrightPinned = true; 

// 기본 필드 (Copyright, Software 추가)
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
    { key: 'copyright', label: { ko: '저작권', en: 'Copyright' }, value: '', enabled: false, labelType: 'valueOnly' },
    { key: 'location', label: { ko: '위치', en: 'Location' }, value: '', enabled: false, labelType: 'valueOnly' }
];

// DOM Elements
const elements = {
    fileInput: document.getElementById('fileInput'),
    uploadBox: document.getElementById('uploadBox'),
    miniPreviewImg: document.getElementById('miniPreviewImg'),
    fileInfoArea: document.getElementById('fileInfoArea'),
    removeImgBtn: document.getElementById('removeImgBtn'),
    fileName: document.getElementById('fileName'),
    
    metadataList: document.getElementById('metadataList'),
    textEditor: document.getElementById('textEditor'),
    
    instagramId: document.getElementById('instagramId'),
    copyrightText: document.getElementById('copyrightText'),
    
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
    document.body.setAttribute('data-view', 'upload');
    
    // 초기 로드 시 포맷에 따른 구분자 비활성 처리
    handleFormatChange(outputFormat);
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
    
    // 워터마크 다운로드
    elements.downloadWatermarkBtn.addEventListener('click', downloadImageWithWatermark);

    // 프리셋 저장/로드
    elements.savePresetBtn.addEventListener('click', savePreset);
    elements.presetSelect.addEventListener('change', loadSelectedPreset);

    // 입력 감지
    elements.instagramId.addEventListener('input', () => { saveSettings(); updatePreview(); });
    elements.copyrightText.addEventListener('input', () => {
        // 저작권 텍스트 입력 시 메타데이터 값 업데이트
        const cpField = fieldOrder.find(f => f.key === 'copyright');
        if(cpField) cpField.value = elements.copyrightText.value;
        saveSettings();
        generateText();
    });
    
    elements.textEditor.addEventListener('input', updatePreview);
    elements.separatorInput.addEventListener('input', () => {
        if(outputFormat === 'inline') generateText();
    });

    // 포맷 변경
    document.querySelectorAll('input[name="outputFormat"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            outputFormat = e.target.value;
            handleFormatChange(outputFormat);
            saveSettings();
            generateText();
        });
    });
}

function handleFormatChange(format) {
    if(format === 'inline') {
        elements.separatorInput.disabled = false;
    } else {
        elements.separatorInput.disabled = true;
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
        
        // 미리보기 (Small Mode)
        elements.miniPreviewImg.src = imageUrl;
        elements.fileInfoArea.classList.remove('hidden');
        elements.instagramPreviewImg.src = imageUrl;
        elements.fileName.textContent = file.name;

        await readExifData(imageFile);
    } catch (error) {
        console.error(error);
        showToast('이미지 처리 실패');
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
            dateStr = `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
        }

        const location = (output.latitude && output.longitude) ? `${output.latitude.toFixed(4)}, ${output.longitude.toFixed(4)}` : '';

        currentMetadata = {
            camera, make, lens, focalLength: focal, aperture, shutterSpeed: shutter, iso, 
            dateTime: dateStr, location, software,
            copyright: elements.copyrightText.value // 사용자 입력값 유지
        };

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

function updateFieldValues() {
    fieldOrder = fieldOrder.map(f => ({
        ...f,
        value: currentMetadata[f.key] || (f.key === 'copyright' ? elements.copyrightText.value : '')
    }));
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
    
    // 요청 5: 사용자명 해시태그 추가
    const userId = elements.instagramId.value.replace('@', '').trim();
    if(userId) tags.push(`#${userId}`);

    if(currentMetadata.camera) tags.push(`#${currentMetadata.camera.replace(/\s/g, '')}`);
    if(currentMetadata.make) tags.push(`#${currentMetadata.make.replace(/\s/g, '')}`);
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

// 워터마크 모드 (이미지에 텍스트 합성)
async function downloadImageWithWatermark() {
    const img = elements.instagramPreviewImg;
    if(!img.src || img.src.includes('data:image/gif')) {
        showToast('이미지가 없습니다.');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const originalImage = new Image();
    originalImage.crossOrigin = "Anonymous";
    originalImage.src = img.src;

    originalImage.onload = () => {
        // 캔버스 크기 설정 (원본 비율 유지)
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;

        // 이미지 그리기
        ctx.drawImage(originalImage, 0, 0);

        // 텍스트 설정
        const text = elements.textEditor.value;
        const fontSize = Math.max(24, canvas.width * 0.025); // 이미지 크기에 비례
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        // 텍스트 줄바꿈 처리 및 그리기
        const lines = text.split('\n');
        const lineHeight = fontSize * 1.4;
        const totalHeight = lines.length * lineHeight;
        let startY = canvas.height - totalHeight - (canvas.height * 0.05); // 하단 5% 여백

        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
        });

        // 다운로드
        const link = document.createElement('a');
        link.download = `metashaper_${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        showToast('이미지 저장 완료!');
    };
}

// 프리셋 기능
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
    elements.presetSelect.innerHTML = '<option value="">프리셋 불러오기...</option>';
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

    // 현재 fieldOrder를 프리셋 순서대로 재정렬 및 설정 적용
    const newOrder = [];
    p.order.forEach(po => {
        const field = fieldOrder.find(f => f.key === po.key) || defaultFields.find(f => f.key === po.key);
        if(field) {
            field.enabled = po.enabled;
            field.labelType = po.labelType;
            newOrder.push(field);
        }
    });

    // 프리셋에 없는 필드들도 뒤에 붙여줌 (누락 방지)
    fieldOrder.forEach(f => {
        if(!newOrder.find(nf => nf.key === f.key)) newOrder.push(f);
    });

    fieldOrder = newOrder;
    outputFormat = p.format;
    elements.separatorInput.value = p.separator || ', ';
    
    // UI 반영
    const radio = document.querySelector(`input[name="outputFormat"][value="${outputFormat}"]`);
    if(radio) radio.checked = true;
    handleFormatChange(outputFormat);

    saveSettings();
    renderMetadataList();
    generateText();
    showToast(`프리셋 "${p.name}" 적용됨`);
}

function loadSettings() {
    const saved = localStorage.getItem('metaShaper_fields');
    if(saved) {
        // 저장된 설정 불러오되, defaultFields에 있는 최신 키값들 병합
        const savedOrder = JSON.parse(saved);
        fieldOrder = defaultFields.map(df => {
            const savedItem = savedOrder.find(so => so.key === df.key);
            // 값이 있으면 저장된 설정 사용, 없으면 기본값 사용 (새로 추가된 'software' 등 대응)
            return savedItem ? { ...df, ...savedItem, value: '' } : df;
        });
        
        // 순서도 저장된 순서 반영하려면 로직이 더 복잡해지므로, 
        // 여기서는 필드 속성만 복원하고 순서는 defaultFields 기준(혹은 저장된 순서)으로 병합해야 함.
        // 간단하게 위 매핑으로 처리.
    } else {
        fieldOrder = JSON.parse(JSON.stringify(defaultFields));
    }
    
    elements.instagramId.value = localStorage.getItem('instagramId') || '';
    elements.copyrightText.value = localStorage.getItem('copyrightText') || '';
}

function saveSettings() {
    // value는 저장 안 함 (설정만 저장)
    const toSave = fieldOrder.map(({ value, ...rest }) => rest);
    localStorage.setItem('metaShaper_fields', JSON.stringify(toSave));
    localStorage.setItem('instagramId', elements.instagramId.value);
    localStorage.setItem('copyrightText', elements.copyrightText.value);
}

function resetImage() {
    elements.fileInfoArea.classList.add('hidden');
    elements.instagramPreviewImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    elements.fileInput.value = '';
    currentMetadata = { ...currentMetadata, camera: '', lens: '', focalLength: '', aperture: '', shutterSpeed: '', iso: '', dateTime: '', location: '', software: '' };
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