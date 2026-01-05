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
// EXIF 데이터 읽기 (exifr 라이브러리 사용으로 변경)
async function readExifData(file) {
    try {
        // exifr를 사용하여 메타데이터 추출 (makerNote: true가 렌즈 정보 핵심)
        const output = await exifr.parse(file, {
            tiff: true,
            exif: true,
            gps: true,
            makerNote: true, // 제조사 노트(렌즈 정보 포함) 읽기
            xmp: true        // Adobe 정보 읽기
        });

        console.log('추출된 원본 데이터:', output);

        if (!output) {
            throw new Error('EXIF 데이터가 없습니다.');
        }

        // 1. 카메라 정보 조합
        const make = output.Make || '';
        const model = output.Model || '';
        const camera = (make && model) ? `${make} ${model}`.replace(make, '').trim() : (model || make); 
        // replace는 'Canon Canon EOS...' 처럼 중복되는 경우 방지

        // 2. 렌즈 정보 (exifr가 자동으로 제조사별 태그를 찾아 LensModel에 넣어줍니다)
        let lensInfo = output.LensModel || output.Lens || output.LensInfo || '';
        
        // 렌즈 정보가 없고 XMP 데이터에만 있는 경우 (일부 소니/니콘 등)
        if (!lensInfo && output.LensID) lensInfo = output.LensID;

        // 3. 노출 정보 포맷팅
        const focalLength = output.FocalLength ? `${Math.round(output.FocalLength)}mm` : '';
        const fNumber = output.FNumber ? `f/${output.FNumber}` : '';
        
        // 셔터스피드 계산
        let shutterSpeed = '';
        if (output.ExposureTime) {
            if (output.ExposureTime >= 1) {
                shutterSpeed = `${output.ExposureTime}s`;
            } else {
                shutterSpeed = `1/${Math.round(1 / output.ExposureTime)}s`;
            }
        }

        const iso = (output.ISO || output.ISOSpeedRatings) ? `ISO ${output.ISO || output.ISOSpeedRatings}` : '';

        // 4. 날짜 변환
        let dateTimeStr = '';
        const dateSource = output.DateTimeOriginal || output.CreateDate || output.DateTime;
        if (dateSource) {
            // Date 객체이거나 문자열일 수 있음
            const dateObj = new Date(dateSource);
            if (!isNaN(dateObj)) {
                // 유효한 날짜 객체인 경우
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                dateTimeStr = `${year}.${month}.${day}`;
            } else {
                // 문자열인 경우 기존 방식 유지
                dateTimeStr = String(dateSource).split(' ')[0].replace(/:/g, '.');
            }
        }

        // 5. GPS 처리 (exifr는 자동으로 십진수 좌표를 줍니다. 변환 함수 필요 없음)
        const lat = output.latitude;
        const lng = output.longitude;

        // 전역 변수 업데이트
        currentMetadata = {
            camera: make && model ? `${make} ${model}` : (model || ''),
            lens: lensInfo,
            focalLength: focalLength,
            aperture: fNumber,
            shutterSpeed: shutterSpeed,
            iso: iso,
            dateTime: dateTimeStr,
            location: (lat && lng) ? '위치 조회 중...' : ''
        };

        // UI 업데이트
        updateFieldValues();
        generateText();

        // 위치 정보가 있다면 주소 변환 실행
        if (lat && lng) {
            getAddressFromCoordinates(lat, lng);
        }

    } catch (error) {
        console.error('메타데이터 읽기 실패:', error);
        alert('사진 정보를 읽을 수 없거나 지원하지 않는 형식입니다.');
        
        // 실패 시 빈 값으로 초기화
        currentMetadata = {
            camera: '', lens: '', focalLength: '', aperture: '',
            shutterSpeed: '', iso: '', dateTime: '', location: ''
        };
        updateFieldValues();
        generateText();
    }
}

// GPS 좌표를 주소로 변환
async function getAddressFromCoordinates(lat, lng) {
    try {
        // 현재 선택된 라벨 타입 확인
        const labelType = document.querySelector('input[name="labelType"]:checked').value;
        const language = (labelType === 'korean') ? 'ko' : 'en';

        // Nominatim API 사용 (무료, 제한: 1초당 1회)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${language}`,
            {
                headers: {
                    'User-Agent': 'PhotoMetadataTextGenerator/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('주소 변환 실패');
        }

        const data = await response.json();
        console.log('Geocoding 결과:', data);

        let addressParts = [];
        const addr = data.address;

        // 주소 형식으로 조합
        if (addr) {
            // 국가
            if (addr.country) {
                addressParts.push(addr.country);
            }
            // 시/도
            if (addr.province || addr.state) {
                addressParts.push(addr.province || addr.state);
            }
            // 시/군/구
            if (addr.city || addr.county) {
                addressParts.push(addr.city || addr.county);
            }
            // 구
            if (addr.borough || addr.district) {
                addressParts.push(addr.borough || addr.district);
            }
            // 동/읍/면
            if (addr.suburb || addr.neighbourhood || addr.hamlet || addr.village) {
                addressParts.push(addr.suburb || addr.neighbourhood || addr.hamlet || addr.village);
            }
        }

        const formattedAddress = addressParts.length > 0
            ? addressParts.join(' ')
            : data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        currentMetadata.location = formattedAddress;
        console.log('변환된 주소:', formattedAddress);

        updateFieldValues();
        generateText();
    } catch (error) {
        console.error('주소 변환 오류:', error);
        // 실패 시 좌표 표시
        currentMetadata.location = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        updateFieldValues();
        generateText();
    }
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
