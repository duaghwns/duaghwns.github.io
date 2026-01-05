// 메인 애플리케이션

class App {
    constructor() {
        this.allConversations = [];
        this.filteredConversations = [];
        this.currentSortMode = 'recent'; // 'name' or 'recent'
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 파일 업로드 영역
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        // 정렬 버튼
        document.getElementById('sortByName').addEventListener('click', () => {
            this.setSortMode('name');
        });

        document.getElementById('sortByRecent').addEventListener('click', () => {
            this.setSortMode('recent');
        });

        // 사용자 검색
        const userSearch = document.getElementById('userSearch');
        userSearch.addEventListener('input', (e) => {
            this.filterConversations(e.target.value);
        });

        // 메시지 검색
        const messageSearch = document.getElementById('messageSearch');
        messageSearch.addEventListener('input', (e) => {
            searchManager.searchMessages(e.target.value);
        });

        // 검색 네비게이션
        document.getElementById('prevMatch').addEventListener('click', () => {
            searchManager.prevMatch();
        });

        document.getElementById('nextMatch').addEventListener('click', () => {
            searchManager.nextMatch();
        });
    }

    async handleFileUpload(file) {
        if (!file.name.endsWith('.zip')) {
            alert('ZIP 파일만 업로드 가능합니다.');
            return;
        }

        try {
            ui.showLoading(true);

            const conversations = await fileHandler.processZipFile(file);

            if (conversations.length === 0) {
                alert('대화를 찾을 수 없습니다. 올바른 Instagram 데이터 파일인지 확인해주세요.');
                ui.showLoading(false);
                return;
            }

            this.allConversations = conversations;
            this.applyCurrentSort();
            this.renderConversations();

            ui.showLoading(false);
            ui.showMainContent(true);

            // 사용자 이름 자동 감지 (첫 대화에서 가장 많이 나온 sender_name 사용)
            this.detectCurrentUser();

        } catch (error) {
            console.error('Error:', error);
            alert('파일 처리 중 오류가 발생했습니다: ' + error.message);
            ui.showLoading(false);
        }
    }

    detectCurrentUser() {
        if (this.allConversations.length === 0) return;

        // 모든 대화에서 sender 빈도 계산
        const senderCount = {};

        this.allConversations.forEach(conv => {
            conv.messages.forEach(msg => {
                const sender = msg.sender_name;
                senderCount[sender] = (senderCount[sender] || 0) + 1;
            });
        });

        // 가장 많이 나온 sender를 현재 사용자로 설정
        let maxCount = 0;
        let detectedUser = 'yeom';

        Object.entries(senderCount).forEach(([sender, count]) => {
            if (count > maxCount) {
                maxCount = count;
                detectedUser = sender;
            }
        });

        ui.setCurrentUser(detectedUser);
    }

    setSortMode(mode) {
        this.currentSortMode = mode;

        // 버튼 활성화 상태 변경
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (mode === 'name') {
            document.getElementById('sortByName').classList.add('active');
        } else {
            document.getElementById('sortByRecent').classList.add('active');
        }

        this.applyCurrentSort();
        this.renderConversations();
    }

    applyCurrentSort() {
        if (this.currentSortMode === 'name') {
            this.filteredConversations = fileHandler.sortByName(this.allConversations);
        } else {
            this.filteredConversations = fileHandler.sortByRecent(this.allConversations);
        }
    }

    filterConversations(keyword) {
        const searched = fileHandler.searchConversations(this.allConversations, keyword);

        if (this.currentSortMode === 'name') {
            this.filteredConversations = fileHandler.sortByName(searched);
        } else {
            this.filteredConversations = fileHandler.sortByRecent(searched);
        }

        this.renderConversations();
    }

    renderConversations() {
        ui.renderConversationList(this.filteredConversations, ui.currentUser);
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});
