// 검색 관련 기능

class SearchManager {
    constructor() {
        this.currentMatches = [];
        this.currentMatchIndex = -1;
    }

    // 메시지 검색
    searchMessages(keyword) {
        if (!keyword) {
            this.clearSearch();
            return;
        }

        const container = document.getElementById('messageContainer');
        const messages = container.querySelectorAll('.message');
        const matches = [];

        messages.forEach((messageElement, index) => {
            const textElement = messageElement.querySelector('.message-text');
            if (!textElement) return;

            const text = textElement.textContent.toLowerCase();
            const lowerKeyword = keyword.toLowerCase();

            if (text.includes(lowerKeyword)) {
                matches.push({
                    element: messageElement,
                    index: index
                });
            }
        });

        this.currentMatches = matches;

        if (matches.length > 0) {
            this.currentMatchIndex = 0;
            this.showSearchNavigation(true);
            this.updateMatchCounter();
            this.highlightCurrentMatch();
        } else {
            this.showSearchNavigation(false);
            this.clearHighlights();
        }
    }

    // 다음 검색 결과
    nextMatch() {
        if (this.currentMatches.length === 0) return;

        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.currentMatches.length;
        this.updateMatchCounter();
        this.highlightCurrentMatch();
    }

    // 이전 검색 결과
    prevMatch() {
        if (this.currentMatches.length === 0) return;

        this.currentMatchIndex = (this.currentMatchIndex - 1 + this.currentMatches.length) % this.currentMatches.length;
        this.updateMatchCounter();
        this.highlightCurrentMatch();
    }

    // 현재 매치 하이라이트
    highlightCurrentMatch() {
        this.clearHighlights();

        if (this.currentMatches.length === 0 || this.currentMatchIndex < 0) return;

        const match = this.currentMatches[this.currentMatchIndex];
        match.element.classList.add('highlight');

        // 스크롤하여 해당 메시지 표시
        match.element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    // 하이라이트 제거
    clearHighlights() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => {
            msg.classList.remove('highlight');
        });
    }

    // 검색 네비게이션 표시/숨김
    showSearchNavigation(show) {
        const navigation = document.querySelector('.search-navigation');
        if (show) {
            navigation.classList.remove('hidden');
        } else {
            navigation.classList.add('hidden');
        }
    }

    // 매치 카운터 업데이트
    updateMatchCounter() {
        const counter = document.getElementById('matchCounter');
        if (this.currentMatches.length > 0) {
            counter.textContent = `${this.currentMatchIndex + 1} / ${this.currentMatches.length}`;
        } else {
            counter.textContent = '0 / 0';
        }
    }

    // 검색 초기화
    clearSearch() {
        this.currentMatches = [];
        this.currentMatchIndex = -1;
        this.clearHighlights();
        this.showSearchNavigation(false);
    }
}

// 전역 인스턴스
const searchManager = new SearchManager();
