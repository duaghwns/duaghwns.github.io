// 상태 변수
let currentMetadata = {};
let fieldOrder = [];
let outputFormat = 'multiline';

// 모든 옵션 복구 (Make, Camera, Lens, FocalLength, Aperture, ShutterSpeed, ISO, Flash, Date, Location, Software, Copyright)
const defaultFields = [
    { key: 'make', labels: { ko: '제조사', en: 'Maker', en_upper: 'MAKER', en_lower: 'maker', icon: '🏭' }, value: '', enabled: false, labelType: 'valueOnly' },
    { key: 'camera', labels: { ko: '카메라', en: 'Camera', en_upper: 'CAMERA', en_lower: 'camera', icon: '📷' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'lens', labels: { ko: '렌즈', en: 'Lens', en_upper: 'LENS', en_lower: 'lens', icon: '🔭' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'focalLength', labels: { ko: '초점거리', en: 'Focal Length', en_upper: 'FOCAL LENGTH', en_lower: 'focal length', icon: '📏' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'aperture', labels: { ko: '조리개', en: 'Aperture', en_upper: 'APERTURE', en_lower: 'aperture', icon: '✨' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'shutterSpeed', labels: { ko: '셔터속도', en: 'Shutter Speed', en_upper: 'SHUTTER SPEED', en_lower: 'shutter speed', icon: '⏱️' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'iso', labels: { ko: 'ISO', en: 'ISO', en_upper: 'ISO', en_lower: 'iso', icon: '💡' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'flash', labels: { ko: '플래시', en: 'Flash', en_upper: 'FLASH', en_lower: 'flash', icon: '⚡' }, value: '', enabled: false, labelType: 'valueOnly' },
    { key: 'dateTime', labels: { ko: '촬영일', en: 'Date', en_upper: 'DATE', en_lower: 'date', icon: '📅' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'software', labels: { ko: '소프트웨어', en: 'Software', en_upper: 'SOFTWARE', en_lower: 'software', icon: '💻' }, value: '', enabled: false, labelType: 'valueOnly' },
    { key: 'location', labels: { ko: '위치', en: 'Location', en_upper: 'LOCATION', en_lower: 'location', icon: '📍' }, value: '', enabled: false, labelType: 'valueOnly' },
    { key: 'copyright', labels: { ko: '저작권', en: 'Copyright', en_upper: 'COPYRIGHT', en_lower: 'copyright', icon: '©️' }, value: '', enabled: true, labelType: 'valueOnly' }
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
    deletePresetBtn: document.getElementById('deletePresetBtn'),
    downloadWatermarkBtn: document.getElementById('downloadWatermarkBtn'),
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
    
    handleFormatChange(outputFormat);
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
    elements.deletePresetBtn.addEventListener('click', deletePreset);
    elements.presetSelect.addEventListener('change', handlePresetChange);

    // Instagram ID 변경시 저작권 자동 업데이트 및 텍스트 갱신
    elements.instagramId.addEventListener('input', (e) => {
        // Instagram ID 포맷 검증 및 변환
        const originalValue = e.target.value;
        let value = originalValue;

        // 대문자를 소문자로 변환
        value = value.toLowerCase();
        // 허용된 문자만 유지 (영문 소문자, 숫자, _, .)
        value = value.replace(/[^a-z0-9_.]/g, '');

        // 변환된 값으로 업데이트
        e.target.value = value;

        // 변환이 발생했으면 알림 표시
        if (originalValue !== value && originalValue.length > 0) {
            showToast('영문 소문자, 숫자, _, . 만 입력 가능합니다');
        }

        saveSettings();
        updateFieldValues(); // 저작권 필드 업데이트
        generateText(); // 텍스트 재생성
        updatePreview();
    });

    // Copyright 입력창 (ID와 별개로 수동 입력시)
    if(elements.copyrightText) {
        elements.copyrightText.addEventListener('input', () => {
            saveSettings();
            generateText();
        });
    }

    elements.textEditor.addEventListener('input', updatePreview);
    
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
            // camera = model.substring(make.length).trim();
            camera = `${make} ${model.substring(make.length).trim()}`;
            // camera = model.replace(make, '').trim();
        } else if (make && model) {
            camera = `${make} ${model}`;
        }

        let lens = output.LensModel || output.Lens || output.LensInfo || '';
        if(!lens && output.LensID) lens = output.LensID;

        const focal = output.FocalLength ? `${Math.round(output.FocalLength)}mm` : '';
        const aperture = output.FNumber ? `f/${output.FNumber}` : '';
        const shutter = output.ExposureTime ? 
            (output.ExposureTime >= 1 ? `${output.ExposureTime}s` : `1/${Math.round(1/output.ExposureTime)}s`) : '';
        const iso = output.ISO ? `ISO ${output.ISO}` : '';
        const flash = output.Flash ? (output.Flash === 0 ? 'Off' : 'On') : '';
        const software = output.Software || '';
        
        let dateStr = '';
        if (output.DateTimeOriginal) {
            const date = new Date(output.DateTimeOriginal);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateStr = `${year}.${month}.${day}`;
        }

        let location = '';
        if (output.latitude && output.longitude) {
            location = await getAddressFromCoordinates(output.latitude, output.longitude);
        }
        document.querySelector('.insta-loc').textContent = location || "MetaShaper";

        currentMetadata = {
            camera, make, lens, focalLength: focal, aperture, shutterSpeed: shutter, iso, flash,
            dateTime: dateStr, location, software,
            copyright: '' // ID로 자동 생성
        };

        console.log('currentMetadata :: ',currentMetadata)

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

async function getAddressFromCoordinates(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko`,
            { headers: { 'User-Agent': 'MetaShaper/1.0' } }
        );
        if (!response.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        const data = await response.json();
        const addr = data.address;

        let parts = [];

        // 국가 정보 추가
        if (addr.country) {
            parts.push(addr.country);
        }

        // 도시 정보 추가 (state, province, city, town 등)
        if (addr.state || addr.province) {
            parts.push(addr.state || addr.province);
        }

        // 시/군/구 동/읍/면 추출
        if (addr.city || addr.county || addr.town) {
            parts.push(addr.city || addr.county || addr.town);
        }
        if (addr.borough || addr.district) parts.push(addr.borough || addr.district);
        if (addr.suburb || addr.neighbourhood || addr.hamlet || addr.village) {
            parts.push(addr.suburb || addr.neighbourhood || addr.hamlet || addr.village);
        }

        return parts.length > 0 ? parts.join(' ') : (data.display_name.split(',')[0] || "");
    } catch (e) {
        console.error(e);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

function updateFieldValues() {
    fieldOrder = fieldOrder.map(f => {
        let val = currentMetadata[f.key] || '';
        // Copyright는 instagramId가 있으면 자동 생성
        if(f.key === 'copyright') {
            const id = elements.instagramId.value.trim();
            const year = currentMetadata.dateTime ? currentMetadata.dateTime.substring(0,4) : new Date().getFullYear();

            if(elements.copyrightText && elements.copyrightText.value.trim()) {
                val = elements.copyrightText.value.trim(); // 수동 입력 우선
            } else if(id) {
                val = `Copyright ${year}. ${id} All rights reserved.`;
            }
        }
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
        
        // 라벨 타입에 따른 텍스트 표시
        const typeNameMap = {
            'valueOnly': '값만',
            'ko': '한글',
            'en': 'English',
            'en_upper': 'UPPER',
            'en_lower': 'lower',
            'icon': '아이콘'
        };

        const currentTypeName = typeNameMap[field.labelType] || '값만';

        item.innerHTML = `
            <span class="drag-handle"><i class="ri-draggable"></i></span>
            <div class="mobile-reorder-btns">
                <button class="mobile-arrow-btn" onclick="moveItemUp(${index})" title="위로 이동" ${index === 0 ? 'disabled' : ''}>
                    <i class="ri-arrow-up-s-line"></i>
                </button>
                <button class="mobile-arrow-btn" onclick="moveItemDown(${index})" title="아래로 이동" ${index === fieldOrder.length - 1 ? 'disabled' : ''}>
                    <i class="ri-arrow-down-s-line"></i>
                </button>
            </div>
            <input type="checkbox" class="metadata-checkbox" ${field.enabled ? 'checked' : ''} onchange="toggleField(${index})">
            <div class="meta-content">
                <span class="meta-key">${field.labels.en}</span>
                <span class="meta-val">${field.value || '-'}</span>
            </div>
            <button class="label-toggle-btn" onclick="cycleLabelType(${index})" title="라벨 형식 변경">
                ${currentTypeName}
            </button>
        `;
        addDragEvents(item);
        container.appendChild(item);
    });
}

function cycleLabelType(index) {
    const types = ['valueOnly', 'ko', 'en', 'en_upper', 'en_lower', 'icon'];
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

// 모바일용 항목 위로 이동
function moveItemUp(index) {
    if (index === 0) return;
    const [item] = fieldOrder.splice(index, 1);
    fieldOrder.splice(index - 1, 0, item);
    saveSettings();
    renderMetadataList();
    generateText();
}

// 모바일용 항목 아래로 이동
function moveItemDown(index) {
    if (index === fieldOrder.length - 1) return;
    const [item] = fieldOrder.splice(index, 1);
    fieldOrder.splice(index + 1, 0, item);
    saveSettings();
    renderMetadataList();
    generateText();
}

function generateText() {
    const lines = [];
    
    fieldOrder.forEach(f => {
        if(f.enabled && f.value) {
            let prefix = '';
            if (f.labelType !== 'valueOnly') {
                 // 해당 타입의 라벨을 가져옴 (없으면 기본키)
                 prefix = (f.labels[f.labelType] || f.key) + ': ';
            }
            lines.push(`${prefix}${f.value}`);
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
    const tags = [];
    const userId = elements.instagramId.value.replace('@', '').trim();
    
    // 해시태그용 문자열 정리 함수
    const sanitizeHashtag = (str) => {
        return str
        .toLowerCase()
        .replace(/-/g, '_')  // 하이픈을 언더스코어로 변환
        .replace(/\./g, '')  // 마침표 제거
        .replace(/\s+/g, '')  // 공백 제거
        .replace(/[^a-z0-9_]/g, '');  // 영문, 숫자, 언더스코어만 허용
    };
    
    if(userId) tags.push('#'+sanitizeHashtag(`${userId}`));

    // 제조사 해시태그 (소문자)
    if(currentMetadata.make) {
        const makeTag = sanitizeHashtag(currentMetadata.make);
        if(makeTag) tags.push(`#${makeTag}`);
    }

    // 모델명 해시태그 (제조사 제외, 소문자)
    if(currentMetadata.camera) {
        let modelTag = currentMetadata.camera;
        // 제조사명이 포함되어 있으면 제거
        if(currentMetadata.make && modelTag.toLowerCase().startsWith(currentMetadata.make.toLowerCase())) {
            modelTag = modelTag.substring(currentMetadata.make.length).trim();
        }
        modelTag = sanitizeHashtag(modelTag);
        if(modelTag) tags.push(`#${modelTag}`);
    }

    // 렌즈 해시태그 (소문자)
    if(currentMetadata.lens) {
        const lensTag = sanitizeHashtag(currentMetadata.lens);
        if(lensTag) tags.push(`#${lensTag}`);
    }

    tags.push('#metashaper');

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
    elements.presetSelect.innerHTML = '<option value="">현재 프리셋 저장</option>';
    presets.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = p.name;
        elements.presetSelect.appendChild(opt);
    });
}

function handlePresetChange() {
    const idx = elements.presetSelect.value;

    // 버튼 표시 상태 변경
    if(idx === "") {
        elements.savePresetBtn.style.display = 'flex';
        elements.deletePresetBtn.style.display = 'none';
    } else {
        elements.savePresetBtn.style.display = 'none';
        elements.deletePresetBtn.style.display = 'flex';
    }

    // 프리셋 로드
    if(idx === "") return;
    loadSelectedPreset(idx);
}

function loadSelectedPreset(idx) {
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
    showToast(`프리셋 "${p.name}" 적용됨`);
}

function deletePreset() {
    const idx = elements.presetSelect.value;
    if(idx === "") return;

    const presets = JSON.parse(localStorage.getItem('metaShaper_presets') || '[]');
    const presetName = presets[idx].name;

    if(!confirm(`"${presetName}" 프리셋을 삭제하시겠습니까?`)) return;

    presets.splice(idx, 1);
    localStorage.setItem('metaShaper_presets', JSON.stringify(presets));

    elements.presetSelect.value = "";
    elements.savePresetBtn.style.display = 'flex';
    elements.deletePresetBtn.style.display = 'none';

    loadPresets();
    showToast(`프리셋 "${presetName}" 삭제됨`);
}

function loadSettings() {
    const saved = localStorage.getItem('metaShaper_fields');
    if(saved) {
        const savedOrder = JSON.parse(saved);
        fieldOrder = defaultFields.map(df => {
            const savedItem = savedOrder.find(so => so.key === df.key);
            // 라벨 설정 병합
            if (savedItem) {
                return { ...df, enabled: savedItem.enabled, labelType: savedItem.labelType, value: '' };
            }
            return df;
        });
    } else {
        fieldOrder = JSON.parse(JSON.stringify(defaultFields));
    }

    elements.instagramId.value = localStorage.getItem('instagramId') || '';

    // if(elements.copyrightText) {
    //     elements.copyrightText.value = localStorage.getItem('copyrightText') || '';
    // }
}

function saveSettings() {
    const toSave = fieldOrder.map(({ value, ...rest }) => rest);
    localStorage.setItem('metaShaper_fields', JSON.stringify(toSave));
    localStorage.setItem('instagramId', elements.instagramId.value);
    // if(elements.copyrightText) {
    //     localStorage.setItem('copyrightText', elements.copyrightText.value);
    // }
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
    elements.themeToggle.querySelector('i').className = newTheme === 'dark' ? 'ri-moon-line' : 'ri-sun-line';
}

function applyTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    elements.themeToggle.querySelector('i').className = saved === 'dark' ? 'ri-moon-line' : 'ri-sun-line';
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