const guideContent = {
    ko: `<p>✔️ <strong>팔로워, 팔로잉 JSON 파일 다운로드 방법</strong></p>
  <ul>
    <li>1️⃣ 인스타그램 PC버전 로그인 후 <a href="https://accountscenter.instagram.com/?entry_point=app_settings" target="_blank">계정센터</a> 접속</li>
    <li>2️⃣ 내 정보 및 권한 → 내 정보 다운로드</li>
    <li>3️⃣ 상단에 <strong>정보 다운로드 또는 전송</strong> → 계정 선택 후 다음</li>
    <li>4️⃣ 일부 정보 → <strong>팔로워 및 팔로잉</strong> 체크 → <strong>기기에 다운로드</strong></li>
    <li>5️⃣ <strong>전체 기간</strong> + 형식 <strong>JSON</strong> + 품질 <strong>낮음</strong> → 요청 제출</li>
    <li>6️⃣ 이메일 수신 후 다운로드 (소요시간 다름)</li>
    <li>7️⃣ 다운로드된 zip 파일 업로드<br>👉 <strong>(과거 zip은 이전에 다운 받아놓았던 기준이 될 zip 파일)</strong></li>
    <li>8️⃣ 현재 zip 업로드 시 아래 분석 결과 자동 표시됨</li>
  </ul>`,
    en: `<p>✔️ <strong>How to download follower/following JSON files</strong></p>
  <ul>
    <li>1️⃣ Log in to Instagram PC version, go to <a href="https://accountscenter.instagram.com/?entry_point=app_settings" target="_blank">Accounts Center</a></li>
    <li>2️⃣ Go to 'Your information & permissions' → 'Download your information'</li>
    <li>3️⃣ Top: 'Download or transfer your information' → Select account, Next</li>
    <li>4️⃣ 'Some information' → <strong>Followers & Following</strong> → <strong>Download to device</strong></li>
    <li>5️⃣ <strong>All time</strong> + Format <strong>JSON</strong> + Quality <strong>Low</strong> → Submit request</li>
    <li>6️⃣ Download via email (may take time)</li>
    <li>7️⃣ Upload downloaded zip file<br>👉 <strong>(Past zip = previous reference backup)</strong></li>
    <li>8️⃣ Upload current zip to auto-analyze below</li>
  </ul>`,
    ja: `<p>✔️ <strong>フォロワー・フォローJSONファイルのダウンロード方法</strong></p>
  <ul>
    <li>1️⃣ InstagramのPC版にログインし、<a href="https://accountscenter.instagram.com/?entry_point=app_settings" target="_blank">アカウントセンター</a>へ</li>
    <li>2️⃣ 情報と権限 → 情報をダウンロード</li>
    <li>3️⃣ 上部「情報をダウンロードまたは転送」→ アカウント選択し「次へ」</li>
    <li>4️⃣ 一部の情報 → <strong>フォロワーとフォロー中</strong> → <strong>デバイスにダウンロード</strong></li>
    <li>5️⃣ <strong>全期間</strong>＋フォーマット<strong>JSON</strong>＋品質<strong>低</strong>→リクエスト送信</li>
    <li>6️⃣ メール受信後ダウンロード(時間かかる場合あり)</li>
    <li>7️⃣ ダウンロードしたzipをアップロード<br>👉 <strong>(過去zipはバックアップ用)</strong></li>
    <li>8️⃣ 現在のzipをアップロードし、下部で自動分析</li>
  </ul>`,
    zh: `<p>✔️ <strong>下载粉丝/关注者JSON文件的方法</strong></p>
  <ul>
    <li>1️⃣ 登录Instagram电脑版，进入<a href="https://accountscenter.instagram.com/?entry_point=app_settings" target="_blank">账户中心</a></li>
    <li>2️⃣ 进入“你的信息和权限”→“下载你的信息”</li>
    <li>3️⃣ 顶部“下载或转移你的信息”→ 选择账号，下一步</li>
    <li>4️⃣ 选择部分信息 → <strong>粉丝和关注</strong> → <strong>下载到设备</strong></li>
    <li>5️⃣ <strong>所有时间</strong>＋格式<strong>JSON</strong>＋质量<strong>低</strong>→提交请求</li>
    <li>6️⃣ 邮件收到后下载（可能需等待）</li>
    <li>7️⃣ 上传已下载的zip文件<br>👉 <strong>（过去的zip是之前备份）</strong></li>
    <li>8️⃣ 上传当前zip，自动分析并展示结果</li>
  </ul>`
};

const I18N = {
    ko: {
        title: "인스타 팔로우 추적",
        ads: "( 광고 영역 )",
        drop_past: "과거 ZIP (followers_1.json 포함)<br><input type='file' id='pastInput' accept='.zip'>",
        drop_now: "현재 ZIP (followers_1.json + following.json 포함)<br><input type='file' id='currentInput' accept='.zip'>",
        search: "아이디 검색",
        empty: "없음",
        lists: [
            { id: "unfollowers", title: "📉 언팔로우한 계정" },
            { id: "onlyIFollow", title: "🔁 나만 팔로우 중" },
            { id: "onlyTheyFollow", title: "🙋 상대만 나를 팔로우" },
            { id: "newFollowers", title: "🆕 새로운 팔로워" },
            { id: "mutuals", title: "🤝 맞팔(상호 팔로우) 계정" }
        ],
        follow: "✅ 내가 팔로우함", notfollow: "❌ 팔로우 안함",
        sort: { follow: "팔로우", date: "날짜" },
        chart: ["언팔로우","새 팔로워","팔로워", "팔로잉", "나만 팔로우", "상대만 팔로우"],
        chartTabs: [
            { key: "follow", label: "팔로워/팔로잉 비율" },      // ko
            { key: "diff", label: "언팔로우/새팔로워 비율" },    // ko
            { key: "oneway", label: "일방팔로우 비율" }         // ko
        ]
    },
    en: {
        title: "Instagram Follow Tracker",
        ads: "( Ads Area )",
        drop_past: "Past ZIP (includes followers_1.json)<br><input type='file' id='pastInput' accept='.zip'>",
        drop_now: "Current ZIP (includes followers_1.json + following.json)<br><input type='file' id='currentInput' accept='.zip'>",
        search: "Search ID",
        empty: "Empty",
        lists: [
            { id: "unfollowers", title: "📉 Unfollowed Accounts" },
            { id: "onlyIFollow", title: "🔁 Only I Follow" },
            { id: "onlyTheyFollow", title: "🙋 Only They Follow Me" },
            { id: "newFollowers", title: "🆕 New Followers" },
            { id: "mutuals", title: "🤝 Mutual Follows" }
        ],
        follow: "✅ I Follow", notfollow: "❌ Not Following",
        sort: { follow: "Follow", date: "Date" },
        chart: ["Unfollowers", "New Followers", "Followers", "Following", "Only I Follow", "Only They Follow"],
        chartTabs: [
            { key: "follow", label: "Followers/Following" },
            { key: "diff", label: "Unfollower/New Follower Ratio" },
            { key: "oneway", label: "One-way Follows" }
        ]
    },
    ja: {
        title: "インスタフォロー追跡",
        ads: "（広告エリア）",
        drop_past: "過去ZIP（followers_1.json含む）<br><input type='file' id='pastInput' accept='.zip'>",
        drop_now: "現在ZIP（followers_1.json＋following.json含む）<br><input type='file' id='currentInput' accept='.zip'>",
        search: "ID検索",
        empty: "なし",
        lists: [
            { id: "unfollowers", title: "📉 アンフォローしたアカウント" },
            { id: "onlyIFollow", title: "🔁 自分だけフォロー中" },
            { id: "onlyTheyFollow", title: "🙋 相手だけフォロー" },
            { id: "newFollowers", title: "🆕 新しいフォロワー" },
            { id: "mutuals", title: "🤝 相互フォロー" }
        ],
        follow: "✅ フォロー中", notfollow: "❌ フォローしていない",
        sort: { follow: "フォロー", date: "日付" },
        chart: ["アンフォロー", "新しいフォロワー", "フォロワー", "フォロー中", "自分だけフォロー", "相手だけフォロー"],
        chartTabs: [
            { key: "follow", label: "フォロワー/フォロー中" },
            { key: "diff", label: "アンフォロー/新フォロワー比率" },
            { key: "oneway", label: "一方フォロー比率" }
        ]
    },
    zh: {
        title: "Instagram 粉丝追踪",
        ads: "（广告位）",
        drop_past: "过去ZIP（包含followers_1.json）<br><input type='file' id='pastInput' accept='.zip'>",
        drop_now: "当前ZIP（包含followers_1.json和following.json）<br><input type='file' id='currentInput' accept='.zip'>",
        search: "搜索ID",
        empty: "无",
        lists: [
            { id: "unfollowers", title: "📉 取消关注的账号" },
            { id: "onlyIFollow", title: "🔁 仅我关注" },
            { id: "onlyTheyFollow", title: "🙋 仅对方关注我" },
            { id: "newFollowers", title: "🆕 新粉丝" },
            { id: "mutuals", title: "🤝 互相关注" }
        ],
        follow: "✅ 我已关注", notfollow: "❌ 未关注",
        sort: { follow: "关注", date: "日期" },
        chart: ["取关", "新粉丝", "粉丝", "关注", "仅我关注", "仅对方关注"],
        chartTabs: [
            { key: "follow", label: "粉丝/关注比例" },
            { key: "diff", label: "取关/新粉丝比例" },
            { key: "oneway", label: "单向关注比例" }
        ]
    }
};