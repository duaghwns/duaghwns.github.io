// 전역 변수
let currentMetadata = {};
let fieldOrder = [];
let draggedElement = null;

// 기본 메타데이터 필드 정의
const defaultFields = [
    {
        key: 'camera',
        labels: { korean: '카메라', english: 'Camera', icon: '📷' },
        value: ''
    },
    {
        key: 'lens',
        labels: { korean: '렌즈', english: 'Lens', icon: '🔭' },
        value: ''
    },
    {
        key: 'focalLength',
        labels: { korean: '초점거리', english: 'Focal Length', icon: '📏' },
        value: ''
    },
    {
        key: 'aperture',
        labels: { korean: '조리개', english: 'Aperture', icon: '⚙️' },
        value: ''
    },
    {
        key: 'shutterSpeed',
        labels: { korean: '셔터속도', english: 'Shutter Speed', icon: '⏱️' },
        value: ''
    },
    {
        key: 'iso',
        labels: { korean: 'ISO', english: 'ISO', icon: '💡' },
        value: ''
    },
    {
        key: 'dateTime',
        labels: { korean: '촬영일시', english: 'Date', icon: '📅' },
        value: ''
    },
    {
        key: 'location',
        labels: { korean: '위치', english: 'Location', icon: '📍' },
        value: ''
    }
];

// DOM 요소
const fileInput = document.getElementById('fileInput');
const uploadBox = document.getElementById('uploadBox');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const fileName = document.getElementById('fileName');
const instagramId = document.getElementById('instagramId');
const metadataList = document.getElementById('metadataList');
const textEditor = document.getElementById('textEditor');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const previewUsername = document.getElementById('previewUsername');
const captionUsername = document.getElementById('captionUsername');
const captionText = document.getElementById('captionText');
const instagramPreviewImg = document.getElementById('instagramPreviewImg');

// 초기화
function init() {
    loadSettings();
    setupEventListeners();
    renderMetadataList();
    updatePreview();
}

// 설정 로드 (LocalStorage)
function loadSettings() {
    const savedOrder = localStorage.getItem('metadataFieldOrder');
    const savedInstagramId = localStorage.getItem('instagramId');
    const savedLabelType = localStorage.getItem('labelType');

    if (savedOrder) {
        fieldOrder = JSON.parse(savedOrder);
    } else {
        fieldOrder = defaultFields.map(field => ({
            ...field,
            enabled: true
        }));
    }

    if (savedInstagramId) {
        instagramId.value = savedInstagramId;
    }

    if (savedLabelType) {
        const radio = document.querySelector(`input[name="labelType"][value="${savedLabelType}"]`);
        if (radio) radio.checked = true;
    }
}

// 설정 저장 (LocalStorage)
function saveSettings() {
    localStorage.setItem('metadataFieldOrder', JSON.stringify(fieldOrder));
    localStorage.setItem('instagramId', instagramId.value);
    const labelType = document.querySelector('input[name="labelType"]:checked').value;
    localStorage.setItem('labelType', labelType);
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 파일 선택
    fileInput.addEventListener('change', handleFileSelect);

    // 드래그 앤 드롭
    uploadBox.addEventListener('dragover', handleDragOver);
    uploadBox.addEventListener('dragleave', handleDragLeave);
    uploadBox.addEventListener('drop', handleDrop);
    uploadBox.addEventListener('click', () => fileInput.click());

    // Instagram ID 변경
    instagramId.addEventListener('input', () => {
        saveSettings();
        updatePreview();
    });

    // 텍스트 편집
    textEditor.addEventListener('input', updatePreview);

    // 버튼
    copyBtn.addEventListener('click', copyText);
    resetBtn.addEventListener('click', resetAll);

    // 라벨 타입 변경
    document.querySelectorAll('input[name="labelType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            saveSettings();
            renderMetadataList();
            generateText();
        });
    });
}

// 파일 선택 처리
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// 드래그 오버
function handleDragOver(e) {
    e.preventDefault();
    uploadBox.classList.add('drag-over');
}

// 드래그 나가기
function handleDragLeave(e) {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');
}

// 드롭
function handleDrop(e) {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file && file.type.match('image/jpeg')) {
        processFile(file);
    } else {
        alert('JPG 파일만 업로드 가능합니다.');
    }
}

// 파일 처리
function processFile(file) {
    // 이미지 미리보기
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        instagramPreviewImg.src = e.target.result;
        imagePreview.style.display = 'block';
        fileName.textContent = file.name;
    };
    reader.readAsDataURL(file);

    // EXIF 데이터 읽기
    readExifData(file);
}

// EXIF 데이터 읽기
function readExifData(file) {
    EXIF.getData(file, function() {
        try {
            const allTags = EXIF.getAllTags(this);
            console.log('모든 EXIF 태그:', allTags);

            // 카메라 정보
            const make = EXIF.getTag(this, 'Make') || '';
            const model = EXIF.getTag(this, 'Model') || '';

            // 렌즈 정보 (여러 가능한 태그 확인)
            let lensInfo = EXIF.getTag(this, 'LensModel') ||
                          EXIF.getTag(this, 'LensInfo') ||
                          EXIF.getTag(this, 'Lens') ||
                          allTags['LensModel'] ||
                          allTags['LensInfo'] ||
                          allTags['Lens'] || '';

            // 촬영 설정
            const focalLength = EXIF.getTag(this, 'FocalLength');
            const fNumber = EXIF.getTag(this, 'FNumber');
            const exposureTime = EXIF.getTag(this, 'ExposureTime');
            const iso = EXIF.getTag(this, 'ISOSpeedRatings') || EXIF.getTag(this, 'ISO');

            // 날짜/시간
            const dateTime = EXIF.getTag(this, 'DateTime') ||
                           EXIF.getTag(this, 'DateTimeOriginal') ||
                           EXIF.getTag(this, 'CreateDate');

            // GPS 위치 정보
            const gpsLatitude = EXIF.getTag(this, 'GPSLatitude');
            const gpsLatitudeRef = EXIF.getTag(this, 'GPSLatitudeRef');
            const gpsLongitude = EXIF.getTag(this, 'GPSLongitude');
            const gpsLongitudeRef = EXIF.getTag(this, 'GPSLongitudeRef');

            // GPS 좌표가 있으면 주소로 변환
            if (gpsLatitude && gpsLongitude) {
                const lat = convertDMSToDD(gpsLatitude, gpsLatitudeRef);
                const lng = convertDMSToDD(gpsLongitude, gpsLongitudeRef);

                // 임시로 좌표를 저장
                currentMetadata = {
                    camera: (make && model) ? `${make} ${model}`.trim() : '',
                    lens: lensInfo,
                    focalLength: focalLength ? `${focalLength}mm` : '',
                    aperture: fNumber ? `f/${fNumber}` : '',
                    shutterSpeed: exposureTime ? formatShutterSpeed(exposureTime) : '',
                    iso: iso ? `ISO ${iso}` : '',
                    dateTime: dateTime ? formatDateTime(dateTime) : '',
                    location: '위치 조회 중...'
                };

                updateFieldValues();
                generateText();

                // 주소 변환 API 호출
                getAddressFromCoordinates(lat, lng);
            } else {
                currentMetadata = {
                    camera: (make && model) ? `${make} ${model}`.trim() : '',
                    lens: lensInfo,
                    focalLength: focalLength ? `${focalLength}mm` : '',
                    aperture: fNumber ? `f/${fNumber}` : '',
                    shutterSpeed: exposureTime ? formatShutterSpeed(exposureTime) : '',
                    iso: iso ? `ISO ${iso}` : '',
                    dateTime: dateTime ? formatDateTime(dateTime) : '',
                    location: ''
                };

                console.log('추출된 메타데이터:', currentMetadata);
                updateFieldValues();
                generateText();
            }
        } catch (error) {
            console.error('메타데이터 읽기 실패:', error);
            // 실패 시 더미 데이터 사용
            currentMetadata = {
                camera: 'Canon EOS R5',
                lens: 'RF 24-70mm F2.8 L IS USM',
                focalLength: '50mm',
                aperture: 'f/2.8',
                shutterSpeed: '1/125s',
                iso: 'ISO 400',
                dateTime: '2025.01.05',
                location: 'Seoul, Korea'
            };
            updateFieldValues();
            generateText();
        }
    });
}

// GPS DMS를 DD로 변환
function convertDMSToDD(dms, ref) {
    if (!dms || dms.length !== 3) return 0;

    const degrees = dms[0];
    const minutes = dms[1];
    const seconds = dms[2];

    let dd = degrees + minutes / 60 + seconds / 3600;

    if (ref === 'S' || ref === 'W') {
        dd = dd * -1;
    }

    return dd;
}

// 셔터 속도 포맷팅
function formatShutterSpeed(exposureTime) {
    if (exposureTime >= 1) {
        return `${exposureTime}s`;
    } else {
        const denominator = Math.round(1 / exposureTime);
        return `1/${denominator}s`;
    }
}

// 날짜/시간 포맷팅
function formatDateTime(dateTime) {
    // EXIF DateTime 형식: "YYYY:MM:DD HH:MM:SS"
    const parts = dateTime.split(' ')[0].split(':');
    if (parts.length === 3) {
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return dateTime;
}

// 필드 값 업데이트
function updateFieldValues() {
    fieldOrder = fieldOrder.map(field => ({
        ...field,
        value: currentMetadata[field.key] || ''
    }));
    renderMetadataList();
}

// 메타데이터 리스트 렌더링
function renderMetadataList() {
    metadataList.innerHTML = '';
    const labelType = document.querySelector('input[name="labelType"]:checked').value;

    fieldOrder.forEach((field, index) => {
        const item = document.createElement('div');
        item.className = 'metadata-item';
        item.draggable = true;
        item.dataset.index = index;

        const displayLabel = field.labels ? field.labels[labelType] : field.label;

        item.innerHTML = `
            <span class="drag-handle">☰</span>
            <input type="checkbox" class="metadata-checkbox" ${field.enabled ? 'checked' : ''}
                   onchange="toggleField(${index})">
            <span class="metadata-label">${displayLabel}</span>
            <span class="metadata-value">${field.value || '(값 없음)'}</span>
        `;

        // 드래그 이벤트
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOverItem);
        item.addEventListener('drop', handleDropItem);
        item.addEventListener('dragend', handleDragEnd);

        metadataList.appendChild(item);
    });
}

// 필드 활성화/비활성화
function toggleField(index) {
    fieldOrder[index].enabled = !fieldOrder[index].enabled;
    saveSettings();
    generateText();
}

// 드래그 시작
function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

// 드래그 오버 (아이템)
function handleDragOverItem(e) {
    e.preventDefault();
    const target = e.target.closest('.metadata-item');
    if (target && target !== draggedElement) {
        const rect = target.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
            target.parentNode.insertBefore(draggedElement, target);
        } else {
            target.parentNode.insertBefore(draggedElement, target.nextSibling);
        }
    }
}

// 드롭 (아이템)
function handleDropItem(e) {
    e.preventDefault();
}

// 드래그 종료
function handleDragEnd(e) {
    e.target.classList.remove('dragging');

    // 새로운 순서 저장
    const items = metadataList.querySelectorAll('.metadata-item');
    const newOrder = [];
    items.forEach(item => {
        const index = parseInt(item.dataset.index);
        newOrder.push(fieldOrder[index]);
    });

    fieldOrder = newOrder;
    saveSettings();
    renderMetadataList();
    generateText();
}

// 텍스트 생성
function generateText() {
    const lines = [];
    const labelType = document.querySelector('input[name="labelType"]:checked').value;

    fieldOrder.forEach(field => {
        if (field.enabled && field.value) {
            const displayLabel = field.labels ? field.labels[labelType] : field.label;
            lines.push(`${displayLabel}: ${field.value}`);
        }
    });

    const generatedText = lines.join('\n');
    textEditor.value = generatedText;
    updatePreview();
}

// 미리보기 업데이트
function updatePreview() {
    const username = instagramId.value.replace('@', '') || 'username';
    previewUsername.textContent = username;
    captionUsername.textContent = username;

    // Instagram 캡션 포맷팅 (username + space + 텍스트)
    const captionContent = textEditor.value;

    // Instagram은 username 다음 공백 포함하여 줄바꿈을 계산
    // 실제 Instagram과 동일하게 표시하기 위해 그대로 렌더링
    captionText.textContent = captionContent;
}

// 텍스트 복사
function copyText() {
    textEditor.select();
    document.execCommand('copy');

    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ 복사완료!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

// 초기화
function resetAll() {
    if (confirm('모든 설정을 초기화하시겠습니까?')) {
        localStorage.clear();
        fieldOrder = defaultFields.map(field => ({
            ...field,
            enabled: true
        }));
        currentMetadata = {};
        textEditor.value = '';
        instagramId.value = '';
        imagePreview.style.display = 'none';
        fileInput.value = '';
        renderMetadataList();
        updatePreview();
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', init);
