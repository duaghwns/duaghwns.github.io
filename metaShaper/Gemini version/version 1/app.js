// 상태 변수
let currentMetadata = {};
let fieldOrder = [];
let outputFormat = 'multiline';
let separator = ', ';

// 상수
const defaultFields = [
    { key: 'make', label: { ko: '제조사', en: 'Make' }, value: '', enabled: false, labelType: 'valueOnly' },
    { key: 'camera', label: { ko: '카메라', en: 'Camera' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'lens', label: { ko: '렌즈', en: 'Lens' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'focalLength', label: { ko: '초점거리', en: 'Focal Length' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'aperture', label: { ko: '조리개', en: 'Aperture' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'shutterSpeed', label: { ko: '셔터속도', en: 'Shutter Speed' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'iso', label: { ko: 'ISO', en: 'ISO' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'dateTime', label: { ko: '촬영일', en: 'Date' }, value: '', enabled: true, labelType: 'valueOnly' },
    { key: 'location', label: { ko: '위치', en: 'Location' }, value: '', enabled: false, labelType: 'valueOnly' }
];

// DOM Elements
const elements = {
    fileInput: document.getElementById('fileInput'),
    uploadBox: document.getElementById('uploadBox'),
    previewImg: document.getElementById('previewImg'),
    removeImgBtn: document.getElementById('removeImgBtn'),
    metadataList: document.getElementById('metadataList'),
    textEditor: document.getElementById('textEditor'),
    instagramId: document.getElementById('instagramId'),
    previewUsername: document.getElementById('previewUsername'),
    captionUsername: document.getElementById('captionUsername'),
    captionText: document.getElementById('captionText'),
    instagramPreviewImg: document.getElementById('instagramPreviewImg'),
    themeToggle: document.getElementById('themeToggle'),
    toast: document.getElementById('toast'),
    addHashtagsBtn: document.getElementById('addHashtagsBtn'),
    fileName: document.getElementById('fileName')
};

// 초기화
function init() {
    loadSettings();
    setupEventListeners();
    setupMobileNav();
    applyTheme();
    renderMetadataList();
    
    // 모바일 초기 뷰 설정
    document.body.setAttribute('data-view', 'upload');
}

// 모바일 네비게이션 설정
function setupMobileNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Active 상태 변경
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 뷰 변경 (body attribute 활용하여 CSS로 제어)
            const target = item.dataset.target;
            document.body.setAttribute('data-view', target);
            
            window.scrollTo(0, 0);
        });
    });
}

// 이벤트 리스너
function setupEventListeners() {
    // 파일 업로드
    elements.uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadBox.classList.add('drag-over');
    });
    elements.uploadBox.addEventListener('dragleave', () => elements.uploadBox.classList.remove('drag-over'));
    elements.uploadBox.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // 이미지 제거
    elements.removeImgBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetImage();
    });

    // 테마 토글
    elements.themeToggle.addEventListener('click', toggleTheme);

    // 텍스트 복사
    document.getElementById('copyBtn').addEventListener('click', copyText);

    // 전체 선택/해제
    document.getElementById('toggleAllBtn').addEventListener('click', toggleAllFields);

    // 해시태그 추가
    elements.addHashtagsBtn.addEventListener('click', addHashtags);

    // 입력 필드 변경 감지
    elements.instagramId.addEventListener('input', () => {
        saveSettings();
        updatePreview();
    });

    elements.textEditor.addEventListener('input', updatePreview);

    // 포맷 변경 라디오 버튼
    document.querySelectorAll('input[name="outputFormat"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            outputFormat = e.target.value;
            saveSettings();
            generateText();
        });
    });
}

// 파일 처리 (HEIC 지원 포함)
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
        
        // HEIC 변환
        if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });
            imageFile = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
        }

        // 이미지 미리보기
        const imageUrl = URL.createObjectURL(imageFile);
        elements.previewImg.src = imageUrl;
        elements.previewImg.classList.remove('hidden');
        elements.removeImgBtn.classList.remove('hidden');
        document.querySelector('.upload-placeholder').classList.add('hidden');
        elements.instagramPreviewImg.src = imageUrl;
        elements.fileName.textContent = file.name;

        // EXIF 추출
        await readExifData(imageFile);

    } catch (error) {
        console.error(error);
        showToast('이미지 처리 실패');
        elements.fileName.textContent = "오류 발생";
    }
}

async function readExifData(file) {
    try {
        const output = await exifr.parse(file, {
            tiff: true, exif: true, gps: true, makerNote: true, xmp: true
        });

        if (!output) throw new Error("No EXIF");

        // 데이터 정제 (기존 로직 유지하되 간소화)
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
        
        // 날짜
        let dateStr = '';
        if (output.DateTimeOriginal) {
            const date = new Date(output.DateTimeOriginal);
            dateStr = `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
        }

        // GPS (간단하게)
        const location = (output.latitude && output.longitude) ? `${output.latitude.toFixed(4)}, ${output.longitude.toFixed(4)}` : '';

        currentMetadata = {
            camera, make, lens, focalLength: focal, aperture, shutterSpeed: shutter, iso, dateTime: dateStr, location
        };

        updateFieldValues();
        generateText();
        showToast('정보 추출 완료!');

        // 모바일이면 탭 이동 알림 느낌
        if(window.innerWidth <= 768) {
             // 뷰는 유지하되 토스트로 알려줌
        }

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
        value: currentMetadata[f.key] || ''
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
        
        // 라벨 텍스트 결정
        const labelText = getLabelText(field);

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
        
        // 드래그 이벤트 연결
        addDragEvents(item);
        container.appendChild(item);
    });
}

function getLabelTypeName(type) {
    const map = {
        'valueOnly': '값만',
        'en': 'English',
        'ko': '한글'
    };
    return map[type] || '값만';
}

function getLabelText(field) {
    if(field.labelType === 'valueOnly') return '';
    return field.label[field.labelType] || field.key;
}

function cycleLabelType(index) {
    const types = ['valueOnly', 'en', 'ko'];
    const current = fieldOrder[index].labelType || 'valueOnly';
    const next = types[(types.indexOf(current) + 1) % types.length];
    fieldOrder[index].labelType = next;
    saveSettings();
    renderMetadataList();
    generateText();
}

function toggleField(index) {
    fieldOrder[index].enabled = !fieldOrder[index].enabled;
    saveSettings();
    renderMetadataList(); // 스타일 업데이트 (opacity 등)
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
            if(f.labelType === 'valueOnly') {
                lines.push(f.value);
            } else {
                lines.push(`${f.label[f.labelType]}: ${f.value}`);
            }
        }
    });

    const sep = outputFormat === 'inline' ? (document.getElementById('separator').value || ', ') : '\n';
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
    if(currentMetadata.camera) tags.push(`#${currentMetadata.camera.replace(/\s/g, '')}`);
    if(currentMetadata.make) tags.push(`#${currentMetadata.make.replace(/\s/g, '')}`);
    // 필름 감성
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

function showToast(msg) {
    const toast = elements.toast;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = elements.themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
}

function applyTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const icon = elements.themeToggle.querySelector('i');
    icon.className = saved === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
}

function loadSettings() {
    const saved = localStorage.getItem('metaShaper_fields');
    if(saved) fieldOrder = JSON.parse(saved);
    else fieldOrder = JSON.parse(JSON.stringify(defaultFields));
    
    const savedId = localStorage.getItem('instagramId');
    if(savedId) elements.instagramId.value = savedId;
}

function saveSettings() {
    localStorage.setItem('metaShaper_fields', JSON.stringify(fieldOrder));
    localStorage.setItem('instagramId', elements.instagramId.value);
}

function resetImage() {
    elements.previewImg.src = '';
    elements.previewImg.classList.add('hidden');
    elements.removeImgBtn.classList.add('hidden');
    document.querySelector('.upload-placeholder').classList.remove('hidden');
    elements.instagramPreviewImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    elements.fileInput.value = '';
    elements.fileName.textContent = '파일을 선택해주세요';
    currentMetadata = {};
    updateFieldValues();
    generateText();
}

// 드래그 앤 드롭 정렬 (간소화됨)
let dragSrcEl = null;

function addDragEvents(item) {
    item.addEventListener('dragstart', function(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        this.classList.add('dragging');
    });

    item.addEventListener('dragover', function(e) {
        if (e.preventDefault) e.preventDefault();
        return false;
    });

    item.addEventListener('dragenter', function() {
        this.classList.add('over');
    });

    item.addEventListener('dragleave', function() {
        this.classList.remove('over');
    });

    item.addEventListener('drop', function(e) {
        if (e.stopPropagation) e.stopPropagation();
        if (dragSrcEl !== this) {
            const srcIdx = parseInt(dragSrcEl.dataset.index);
            const targetIdx = parseInt(this.dataset.index);
            
            // 배열 순서 변경
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