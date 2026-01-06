// 전역 변수
let currentMetadata = {};
let fieldOrder = [];
let draggedElement = null;
let englishCaseMode = 'title'; // 'title', 'upper', or 'lower'
let outputFormat = 'multiline'; // 'multiline' or 'inline'
let separator = ', '; // 구분자
let isPinned = false; // 고정 모드
let userEdited = false; // 사용자가 직접 편집했는지 여부
let copyrightPinnedToBottom = true; // copyright가 맨 아래에 고정되어 있는지

// 기본 정보 필드 (기본값으로 체크될 필드들)
const basicFields = ['camera', 'lens', 'aperture', 'shutterSpeed', 'iso', 'dateTime'];

// 기본 메타데이터 필드 정의
const defaultFields = [
    {
        key: 'camera',
        labels: { korean: '카메라', english: 'Camera', englishUpper: 'CAMERA', englishLower: 'camera', icon: '📷', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'make',
        labels: { korean: '제조사', english: 'Make', englishUpper: 'MAKE', englishLower: 'make', icon: '🏭', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'lens',
        labels: { korean: '렌즈', english: 'Lens', englishUpper: 'LENS', englishLower: 'lens', icon: '🔭', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'focalLength',
        labels: { korean: '초점거리', english: 'Focal Length', englishUpper: 'FOCAL LENGTH', englishLower: 'focal length', icon: '📏', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'aperture',
        labels: { korean: '조리개', english: 'Aperture', englishUpper: 'APERTURE', englishLower: 'aperture', icon: '✨', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'shutterSpeed',
        labels: { korean: '셔터속도', english: 'Shutter Speed', englishUpper: 'SHUTTER SPEED', englishLower: 'shutter speed', icon: '⏱️', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'iso',
        labels: { korean: 'ISO', english: 'ISO', englishUpper: 'ISO', englishLower: 'iso', icon: '💡', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'flash',
        labels: { korean: '플래시', english: 'Flash', englishUpper: 'FLASH', englishLower: 'flash', icon: '⚡', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'dateTime',
        labels: { korean: '촬영일시', english: 'Date', englishUpper: 'DATE', englishLower: 'date', icon: '📅', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'location',
        labels: { korean: '위치', english: 'Location', englishUpper: 'LOCATION', englishLower: 'location', icon: '📍', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'creator',
        labels: { korean: '작가', english: 'Creator', englishUpper: 'CREATOR', englishLower: 'creator', icon: '👤', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'artist',
        labels: { korean: '아티스트', english: 'Artist', englishUpper: 'ARTIST', englishLower: 'artist', icon: '🎨', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'software',
        labels: { korean: '소프트웨어', english: 'Software', englishUpper: 'SOFTWARE', englishLower: 'software', icon: '💻', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
    {
        key: 'copyright',
        labels: { korean: '저작권', english: 'Copyright', englishUpper: 'COPYRIGHT', englishLower: 'copyright', icon: '©️', valueOnly: '' },
        labelType: 'valueOnly',
        value: ''
    },
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
const toggleAllBtn = document.getElementById('toggleAllBtn');
const basicInfoBtn = document.getElementById('basicInfoBtn');
const separatorInput = document.getElementById('separator');
const pinBtn = document.getElementById('pinBtn');

// 초기화
function init() {
    loadSettings();
    setupEventListeners();
    renderMetadataList();
    updatePreview();
}

// 설정 로드 (LocalStorage)
function loadSettings() {
    const savedOrder = localStorage.getItem('metadataFieldOrder_v3');
    const savedInstagramId = localStorage.getItem('instagramId');
    const savedEnglishCase = localStorage.getItem('englishCaseMode');
    const savedOutputFormat = localStorage.getItem('outputFormat') || 'multiline';
    const savedSeparator = localStorage.getItem('separator');

    if (savedOrder) {
        fieldOrder = JSON.parse(savedOrder);
        // 저장된 필드에 labelType이 없는 경우 기본값 설정
        fieldOrder = fieldOrder.map(field => ({
            ...field,
            labelType: field.labelType || 'valueOnly'
        }));
    } else {
        // 첫 로드 시 기본정보만 체크
        fieldOrder = defaultFields.map(field => ({
            ...field,
            enabled: basicFields.includes(field.key)
        }));
    }

    if (savedInstagramId) {
        instagramId.value = savedInstagramId;
    }

    if (savedEnglishCase) {
        englishCaseMode = savedEnglishCase;
    }

    outputFormat = savedOutputFormat;
    const formatRadio = document.querySelector(`input[name="outputFormat"][value="${savedOutputFormat}"]`);
    if (formatRadio) {
        formatRadio.checked = true;
        // active 클래스 추가
        document.querySelectorAll('.format-label').forEach(label => label.classList.remove('active'));
        formatRadio.closest('.format-label').classList.add('active');
    }

    if (savedSeparator !== null) {
        separator = savedSeparator;
        separatorInput.value = savedSeparator;
    }

    // 구분자 disabled 상태 업데이트
    separatorInput.disabled = (outputFormat === 'multiline');

    updateToggleAllButton();
}

// 설정 저장 (LocalStorage)
function saveSettings() {
    localStorage.setItem('metadataFieldOrder_v3', JSON.stringify(fieldOrder));
    localStorage.setItem('instagramId', instagramId.value);
    localStorage.setItem('englishCaseMode', englishCaseMode);
    localStorage.setItem('outputFormat', outputFormat);
    localStorage.setItem('separator', separator);
}

// 전체 켜기/끄기 토글
function toggleAllFields() {
    const allEnabled = fieldOrder.every(field => field.enabled);

    fieldOrder = fieldOrder.map(field => ({
        ...field,
        enabled: !allEnabled
    }));

    saveSettings();
    renderMetadataList();

    // 고정 모드일 때는 추가, 아니면 덮어쓰기
    if (isPinned && userEdited) {
        appendMetadataToText();
    } else {
        generateText();
    }

    updateToggleAllButton();
}

// 전체 켜기/끄기 버튼 텍스트 업데이트
function updateToggleAllButton() {
    const allEnabled = fieldOrder.every(field => field.enabled);
    toggleAllBtn.textContent = allEnabled ? '✗ 전체 끄기' : '✓ 전체 켜기';
}

// 기본정보 선택
function selectBasicInfo() {
    fieldOrder = fieldOrder.map(field => ({
        ...field,
        enabled: basicFields.includes(field.key)
    }));

    saveSettings();
    renderMetadataList();

    // 고정 모드일 때는 추가, 아니면 덮어쓰기
    if (isPinned && userEdited) {
        appendMetadataToText();
    } else {
        generateText();
    }

    updateToggleAllButton();
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
    textEditor.addEventListener('input', () => {
        userEdited = true; // 사용자가 직접 편집함
        updatePreview();
    });

    // 고정 버튼
    pinBtn.addEventListener('click', () => {
        isPinned = !isPinned;
        pinBtn.classList.toggle('active', isPinned);

        if (isPinned) {
            pinBtn.title = '고정 해제: 메타데이터를 덮어쓰기';
        } else {
            pinBtn.title = '고정 모드: 메타데이터를 아래에 추가';
            userEdited = false;
        }
    });

    // 버튼
    copyBtn.addEventListener('click', copyText);
    resetBtn.addEventListener('click', resetAll);

    // 기본정보 버튼
    basicInfoBtn.addEventListener('click', selectBasicInfo);

    // 전체 켜기/끄기 버튼
    toggleAllBtn.addEventListener('click', toggleAllFields);

    // 출력 형식 변경 - label 클릭으로 동작
    document.querySelectorAll('.format-label').forEach(label => {
        label.addEventListener('click', (e) => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                outputFormat = radio.value;

                // active 클래스 토글
                document.querySelectorAll('.format-label').forEach(l => l.classList.remove('active'));
                label.classList.add('active');

                // 구분자 disabled 상태 업데이트
                separatorInput.disabled = (outputFormat === 'multiline');

                saveSettings();

                // 고정 모드일 때는 추가, 아니면 덮어쓰기
                if (isPinned && userEdited) {
                    appendMetadataToText();
                } else {
                    generateText();
                }
            }
        });
    });

    // 구분자 변경
    separatorInput.addEventListener('input', (e) => {
        separator = e.target.value;
        saveSettings();
        if (outputFormat === 'inline') {
            // 고정 모드일 때는 추가, 아니면 덮어쓰기
            if (isPinned && userEdited) {
                appendMetadataToText();
            } else {
                generateText();
            }
        }
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

        // 중복 제거: 모델명이 제조사명으로 시작하면 제조사명 제거
        let camera = '';
        if (make && model) {
            // 모델명에 제조사명이 포함되어 있는지 확인 (대소문자 무시)
            let tempModel = model;
            const makeLower = make.toLowerCase();

            // 제조사명이 여러 번 반복될 수 있으므로 모두 제거
            while (tempModel.toLowerCase().startsWith(makeLower + ' ') ||
                   (tempModel.toLowerCase().startsWith(makeLower) && tempModel.length > make.length)) {
                tempModel = tempModel.substring(make.length).trim();
            }

            camera = tempModel || model;
        } else {
            camera = model || make;
        }

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

        // 4. 플래시 정보
        let flashInfo = '';
        if (output.Flash !== undefined) {
            flashInfo = output.Flash === 0 ? 'Off' : 'On';
        }

        // 5. 날짜 변환
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

        // 6. GPS 처리 (exifr는 자동으로 십진수 좌표를 줍니다. 변환 함수 필요 없음)
        const lat = output.latitude;
        const lng = output.longitude;

        // 7. 크리에이터, 아티스트, 저작권, 소프트웨어 정보
        const creator = output.Creator || output.XPAuthor || '';
        const artist = output.Artist || '';
        const copyright = output.Copyright || '';
        const software = output.Software || '';

        // 전역 변수 업데이트
        currentMetadata = {
            camera: camera,  // 중복 제거된 camera 변수 사용
            make: make,
            lens: lensInfo,
            focalLength: focalLength,
            aperture: fNumber,
            shutterSpeed: shutterSpeed,
            iso: iso,
            flash: flashInfo,
            dateTime: dateTimeStr,
            location: (lat && lng) ? '위치 조회 중...' : '',
            creator: creator,
            artist: artist,
            copyright: copyright,
            software: software
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

    fieldOrder.forEach((field, index) => {
        const item = document.createElement('div');
        item.className = 'metadata-item';
        item.draggable = true;
        item.dataset.index = index;

        // 현재 필드의 labelType에 따라 표시할 라벨 결정
        let displayLabel = getDisplayLabel(field);

        // 라벨 타입 버튼 텍스트
        const labelTypeButtons = {
            valueOnly: '정보만',
            korean: '한글',
            english: 'English',
            englishUpper: 'ENGLISH',
            englishLower: 'english',
            icon: '아이콘'
        };

        item.innerHTML = `
            <span class="drag-handle">☰</span>
            <input type="checkbox" class="metadata-checkbox" ${field.enabled ? 'checked' : ''}
                   onchange="toggleField(${index})">
            <span class="metadata-label">${displayLabel}</span>
            <span class="metadata-value">${field.value || '(값 없음)'}</span>
            <button class="label-type-btn" onclick="cycleLabelType(${index})" title="라벨 표시 형식 변경">
                ${labelTypeButtons[field.labelType]}
            </button>
        `;

        // 드래그 이벤트
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOverItem);
        item.addEventListener('drop', handleDropItem);
        item.addEventListener('dragend', handleDragEnd);

        metadataList.appendChild(item);
    });
}

// 필드의 labelType에 따라 표시할 라벨 반환
function getDisplayLabel(field) {
    const labelType = field.labelType || 'valueOnly';

    if (labelType === 'valueOnly') {
        return '';
    } else if (labelType === 'english' || labelType === 'englishUpper' || labelType === 'englishLower') {
        return field.labels[labelType] || field.labels.english;
    } else {
        return field.labels[labelType] || field.key;
    }
}

// 개별 필드의 라벨 타입 순환 (valueOnly -> korean -> english -> englishUpper -> englishLower -> icon -> valueOnly)
function cycleLabelType(index) {
    const field = fieldOrder[index];
    const cycle = ['valueOnly', 'korean', 'english', 'englishUpper', 'englishLower', 'icon'];
    const currentIndex = cycle.indexOf(field.labelType);
    const nextIndex = (currentIndex + 1) % cycle.length;

    fieldOrder[index].labelType = cycle[nextIndex];

    saveSettings();
    renderMetadataList();

    // 고정 모드일 때는 텍스트를 수정하지 않음 (라벨 타입 변경은 UI에만 반영)
    // 고정 모드가 아닐 때만 텍스트를 다시 생성
    if (!isPinned || !userEdited) {
        generateText();
    }
}

// 필드 활성화/비활성화
function toggleField(index) {
    const wasEnabled = fieldOrder[index].enabled;
    fieldOrder[index].enabled = !fieldOrder[index].enabled;
    saveSettings();

    // 고정 모드일 때는 변경된 필드만 추가, 아니면 덮어쓰기
    if (isPinned && userEdited) {
        // 활성화된 경우에만 해당 필드를 추가
        if (fieldOrder[index].enabled) {
            appendSingleFieldToText(index);
        }
        // 비활성화된 경우는 텍스트에서 제거하지 않음 (사용자가 직접 편집한 내용 유지)
    } else {
        generateText();
    }

    updateToggleAllButton();
}

// 단일 필드만 텍스트에 추가 (고정 모드)
function appendSingleFieldToText(index) {
    const field = fieldOrder[index];

    if (!field.enabled || !field.value) {
        return;
    }

    let displayValue = field.value;

    // Copyright 처리
    if (field.key === 'copyright') {
        const year = currentMetadata.dateTime ? currentMetadata.dateTime.split('.')[0] : new Date().getFullYear();
        const username = instagramId.value.replace('@', '') || (currentMetadata.copyright || currentMetadata.creator || currentMetadata.artist || '');
        displayValue = `Copyright ${year} ${username} All rights reserved.`;

        // Copyright가 맨 아래 고정인 경우는 appendMetadataToText로 처리
        if (copyrightPinnedToBottom) {
            appendMetadataToText();
            return;
        }
    }

    // 개별 필드의 labelType 사용
    const fieldLabelType = field.labelType || 'valueOnly';
    let lineText;

    if (fieldLabelType === 'valueOnly') {
        lineText = displayValue;
    } else {
        const displayLabel = field.labels[fieldLabelType] || field.key;
        lineText = `${displayLabel}: ${displayValue}`;
    }

    // 기존 텍스트에 추가
    const currentText = textEditor.value.trim();
    if (currentText) {
        textEditor.value = currentText + '\n' + lineText;
    } else {
        textEditor.value = lineText;
    }

    updatePreview();
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

    // copyright 위치 확인 - 맨 마지막이 아니면 고정 해제
    const copyrightIndex = fieldOrder.findIndex(f => f.key === 'copyright');
    if (copyrightIndex !== -1 && copyrightIndex !== fieldOrder.length - 1) {
        copyrightPinnedToBottom = false;
    } else if (copyrightIndex === fieldOrder.length - 1) {
        copyrightPinnedToBottom = true;
    }

    saveSettings();
    renderMetadataList();
    generateText();
}

// 텍스트 생성
function generateText() {
    // 고정 모드일 때는 생성하지 않음
    if (isPinned && userEdited) {
        return;
    }

    const lines = [];
    let copyrightLine = '';

    fieldOrder.forEach(field => {
        if (field.enabled && field.value) {
            // Copyright는 별도 처리 (맨 아래 고정인 경우)
            if (field.key === 'copyright' && copyrightPinnedToBottom) {
                const year = currentMetadata.dateTime ? currentMetadata.dateTime.split('.')[0] : new Date().getFullYear();
                const username = instagramId.value.replace('@', '') || (currentMetadata.copyright || currentMetadata.creator || currentMetadata.artist || '');
                copyrightLine = `Copyright ${year} ${username} All rights reserved.`;
                return;
            }

            let displayValue = field.value;

            // Copyright가 맨 아래 고정이 아닌 경우
            if (field.key === 'copyright') {
                const year = currentMetadata.dateTime ? currentMetadata.dateTime.split('.')[0] : new Date().getFullYear();
                const username = instagramId.value.replace('@', '') || (currentMetadata.copyright || currentMetadata.creator || currentMetadata.artist || '');
                displayValue = `Copyright ${year} ${username} All rights reserved.`;
            }

            // 개별 필드의 labelType 사용
            const fieldLabelType = field.labelType || 'valueOnly';

            if (fieldLabelType === 'valueOnly') {
                // "정보만" 옵션: 라벨 없이 값만 표시
                lines.push(displayValue);
            } else {
                const displayLabel = field.labels[fieldLabelType] || field.key;
                lines.push(`${displayLabel}: ${displayValue}`);
            }
        }
    });

    // 출력 형식에 따라 텍스트 생성
    let generatedText;
    if (outputFormat === 'inline') {
        // 일렬로 출력 (구분자 사용)
        generatedText = lines.join(separator);
    } else {
        // 한 줄씩 출력
        generatedText = lines.join('\n');
    }

    // Copyright가 맨 아래 고정이면 한 줄 띄우고 추가
    if (copyrightLine) {
        generatedText += '\n\n' + copyrightLine;
    }

    textEditor.value = generatedText;
    userEdited = false; // 자동 생성된 텍스트
    updatePreview();
}

// 텍스트에 메타데이터 추가 (고정 모드)
function appendMetadataToText() {
    const lines = [];
    let copyrightLine = '';

    fieldOrder.forEach(field => {
        if (field.enabled && field.value) {
            // Copyright는 별도 처리 (맨 아래 고정인 경우)
            if (field.key === 'copyright' && copyrightPinnedToBottom) {
                const year = currentMetadata.dateTime ? currentMetadata.dateTime.split('.')[0] : new Date().getFullYear();
                const username = instagramId.value.replace('@', '') || (currentMetadata.copyright || currentMetadata.creator || currentMetadata.artist || '');
                copyrightLine = `Copyright ${year} ${username} All rights reserved.`;
                return;
            }

            let displayValue = field.value;

            // Copyright가 맨 아래 고정이 아닌 경우
            if (field.key === 'copyright') {
                const year = currentMetadata.dateTime ? currentMetadata.dateTime.split('.')[0] : new Date().getFullYear();
                const username = instagramId.value.replace('@', '') || (currentMetadata.copyright || currentMetadata.creator || currentMetadata.artist || '');
                displayValue = `Copyright ${year} ${username} All rights reserved.`;
            }

            // 개별 필드의 labelType 사용
            const fieldLabelType = field.labelType || 'valueOnly';

            if (fieldLabelType === 'valueOnly') {
                lines.push(displayValue);
            } else {
                const displayLabel = field.labels[fieldLabelType] || field.key;
                lines.push(`${displayLabel}: ${displayValue}`);
            }
        }
    });

    let metadataText;
    if (outputFormat === 'inline') {
        metadataText = lines.join(separator);
    } else {
        metadataText = lines.join('\n');
    }

    if (copyrightLine) {
        metadataText += '\n\n' + copyrightLine;
    }

    // 기존 텍스트에 추가
    const currentText = textEditor.value.trim();
    if (currentText) {
        textEditor.value = currentText + '\n\n' + metadataText;
    } else {
        textEditor.value = metadataText;
    }

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
