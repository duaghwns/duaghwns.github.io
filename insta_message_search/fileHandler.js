// 파일 처리 관련 기능

class FileHandler {
    constructor() {
        this.conversations = [];
    }

    // ZIP 파일 처리
    async processZipFile(file) {
        try {
            const zip = await JSZip.loadAsync(file);
            const conversations = [];

            // inbox 폴더 내의 모든 message_*.json 파일 찾기
            // 대화가 길면 message_1.json, message_2.json ... 으로 나뉘므로 대화방 폴더별로 묶는다
            const threadFiles = new Map();
            Object.keys(zip.files)
                .filter(filename => filename.includes('inbox/') && /message_\d+\.json$/.test(filename))
                .forEach(filename => {
                    const folder = filename.slice(0, filename.lastIndexOf('/'));
                    if (!threadFiles.has(folder)) threadFiles.set(folder, []);
                    threadFiles.get(folder).push(filename);
                });

            for (const [folder, filenames] of threadFiles) {
                try {
                    const parts = await Promise.all(
                        filenames.map(async filename => JSON.parse(await zip.files[filename].async('string')))
                    );
                    // 참여자·제목은 첫 파일 기준, 메시지는 모든 파일을 합친다
                    const data = { ...parts[0], messages: parts.flatMap(p => p.messages || []) };

                    // 폴더명에서 대화방 ID 추출
                    // 예: "your_instagram_activity/messages/inbox/username_123/message_1.json"
                    const pathParts = folder.split('/');
                    let threadId = '';

                    // inbox 다음의 폴더명이 대화방 ID
                    const inboxIndex = pathParts.indexOf('inbox');
                    if (inboxIndex !== -1 && inboxIndex + 1 < pathParts.length) {
                        threadId = pathParts[inboxIndex + 1];
                        // 언더스코어와 숫자 제거 (예: username_2379847298 -> username)
                        threadId = threadId.replace(/_\d+$/, '');
                    }

                    // 유니코드 디코딩
                    const conversation = this.decodeConversation(data, threadId);
                    conversations.push(conversation);
                } catch (error) {
                    console.error(`Error processing ${folder}:`, error);
                }
            }

            this.conversations = conversations;
            return conversations;
        } catch (error) {
            console.error('Error processing ZIP file:', error);
            throw error;
        }
    }

    // 유니코드 이스케이프 디코딩
    decodeText(text) {
        if (!text) return '';
        try {
            // Instagram JSON의 특수 인코딩 처리
            const bytes = [];
            for (let i = 0; i < text.length; i++) {
                bytes.push(text.charCodeAt(i));
            }
            return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        } catch (error) {
            return text;
        }
    }

    // 대화 데이터 디코딩
    decodeConversation(data, threadId = '') {
        const participants = data.participants.map(p => ({
            name: this.decodeText(p.name)
        }));

        const messages = (data.messages || []).map(msg => ({
            sender_name: this.decodeText(msg.sender_name || '알 수 없음'),
            content: this.decodeText(msg.content || ''),
            timestamp_ms: msg.timestamp_ms,
            timestamp: new Date(msg.timestamp_ms)
        }));

        // 시간순으로 정렬 (오래된 것부터)
        messages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

        // title이 있으면 사용, 없으면 participants에서 추출
        let threadTitle = '';
        if (data.title) {
            threadTitle = this.decodeText(data.title);
        } else {
            threadTitle = participants.map(p => p.name).join(', ');
        }

        return {
            participants,
            messages,
            title: threadTitle,
            threadId: threadId,
            lastMessageTime: messages.length > 0 ? messages[messages.length - 1].timestamp : new Date(0),
            lastMessage: messages.length > 0 ? messages[messages.length - 1].content : ''
        };
    }

    // 대화 목록 가져오기
    getConversations() {
        return this.conversations;
    }

    // 이름순 정렬
    sortByName(conversations) {
        return [...conversations].sort((a, b) =>
            a.title.localeCompare(b.title, 'ko')
        );
    }

    // 최근 대화순 정렬
    sortByRecent(conversations) {
        return [...conversations].sort((a, b) =>
            b.lastMessageTime - a.lastMessageTime
        );
    }

    // 사용자 검색
    searchConversations(conversations, keyword) {
        if (!keyword) return conversations;

        const lowerKeyword = keyword.toLowerCase();
        return conversations.filter(conv => {
            // 제목과 ID 모두 검색
            const titleMatch = conv.title.toLowerCase().includes(lowerKeyword);
            const idMatch = conv.threadId && conv.threadId.toLowerCase().includes(lowerKeyword);
            return titleMatch || idMatch;
        });
    }
}

// 전역 인스턴스
const fileHandler = new FileHandler();
