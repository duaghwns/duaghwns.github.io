// UI 관련 기능

class UI {
    constructor() {
        this.currentConversation = null;
        this.currentUser = 'yeom'; // 기본 사용자 이름
    }

    // 대화 목록 렌더링
    renderConversationList(conversations, currentUser) {
        const listElement = document.getElementById('conversationList');
        listElement.innerHTML = '';

        if (conversations.length === 0) {
            listElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">대화가 없습니다</div>';
            return;
        }

        conversations.forEach((conv, index) => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.dataset.index = index;

            // 상대방 이름만 표시 (내 이름 제외)
            const otherParticipants = conv.participants.filter(p => p.name !== currentUser);
            const displayName = otherParticipants.length > 0
                ? otherParticipants.map(p => p.name).join(', ')
                : conv.title;

            const name = document.createElement('div');
            name.className = 'conversation-name';
            name.textContent = displayName;

            // ID 표시 (있는 경우)
            if (conv.threadId) {
                const idSpan = document.createElement('span');
                idSpan.className = 'conversation-id';
                idSpan.textContent = ` (${conv.threadId})`;
                name.appendChild(idSpan);
            }

            const preview = document.createElement('div');
            preview.className = 'conversation-preview';
            preview.textContent = conv.lastMessage || '메시지 없음';

            const time = document.createElement('div');
            time.className = 'conversation-time';
            time.textContent = this.formatDate(conv.lastMessageTime);

            item.appendChild(name);
            item.appendChild(preview);
            item.appendChild(time);

            item.addEventListener('click', () => {
                this.selectConversation(conv, item);
            });

            listElement.appendChild(item);
        });
    }

    // 대화 선택
    selectConversation(conversation, element) {
        // 이전 선택 제거
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });

        // 새 선택 추가
        if (element) {
            element.classList.add('active');
        }

        this.currentConversation = conversation;
        this.renderMessages(conversation);
    }

    // 메시지 렌더링
    renderMessages(conversation) {
        const container = document.getElementById('messageContainer');
        const title = document.getElementById('chatTitle');

        // 상대방 이름만 제목에 표시
        const otherParticipants = conversation.participants.filter(p => p.name !== this.currentUser);
        const displayTitle = otherParticipants.length > 0
            ? otherParticipants.map(p => p.name).join(', ')
            : conversation.title;

        title.textContent = displayTitle;
        if (conversation.threadId) {
            title.textContent += ` (${conversation.threadId})`;
        }

        container.innerHTML = '';

        if (conversation.messages.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>메시지가 없습니다</p></div>';
            return;
        }

        conversation.messages.forEach(msg => {
            const messageDiv = this.createMessageElement(msg, conversation);
            container.appendChild(messageDiv);
        });

        // 스크롤을 최하단으로
        container.scrollTop = container.scrollHeight;
    }

    // 메시지 요소 생성
    createMessageElement(msg, conversation) {
        const messageDiv = document.createElement('div');
        const isSent = msg.sender_name === this.currentUser;
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        if (!isSent) {
            const sender = document.createElement('div');
            sender.className = 'message-sender';

            // 상대방 이름과 ID 표시
            sender.textContent = msg.sender_name;
            if (conversation && conversation.threadId) {
                sender.textContent += ` (${conversation.threadId})`;
            }
            bubble.appendChild(sender);
        }

        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = msg.content || '(메시지 없음)';
        bubble.appendChild(text);

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(msg.timestamp);
        bubble.appendChild(time);

        messageDiv.appendChild(bubble);
        return messageDiv;
    }

    // 날짜 포맷팅 (대화 목록용)
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return this.formatTime(date);
        } else if (days === 1) {
            return '어제';
        } else if (days < 7) {
            return `${days}일 전`;
        } else {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }

    // 시간 포맷팅 (메시지용)
    formatTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // 로딩 표시
    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    // 메인 컨텐츠 표시
    showMainContent(show = true) {
        const uploadArea = document.getElementById('uploadArea');
        const mainContent = document.getElementById('mainContent');

        if (show) {
            uploadArea.style.display = 'none';
            mainContent.classList.remove('hidden');
        } else {
            uploadArea.style.display = 'block';
            mainContent.classList.add('hidden');
        }
    }

    // 현재 대화 가져오기
    getCurrentConversation() {
        return this.currentConversation;
    }

    // 사용자 이름 설정
    setCurrentUser(username) {
        this.currentUser = username;
        if (this.currentConversation) {
            this.renderMessages(this.currentConversation);
        }
    }
}

// 전역 인스턴스
const ui = new UI();
