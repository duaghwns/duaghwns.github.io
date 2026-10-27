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
    <li>9️⃣ 언팔로우 목록에는 계정 상태가 표시돼요. ⚠️ 비활성·탈퇴 추정 계정은 링크를 눌러도 '페이지를 찾을 수 없음'으로 나올 수 있으니, 상태 버튼으로 <strong>✅ 언팔 (계정 활성)</strong>만 골라 보세요.</li>
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
    <li>9️⃣ The unfollow list shows each account's status. ⚠️ Likely-deactivated accounts may open as 'Page not found', so use the status buttons to show only <strong>✅ Unfollowed (active)</strong>.</li>
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
    <li>9️⃣ アンフォロー一覧にはアカウントの状態が表示されます。⚠️ 無効化の可能性があるアカウントは「ページが見つかりません」と表示されることがあるため、状態ボタンで<strong>✅ アンフォロー (有効)</strong>だけを絞り込めます。</li>
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
    <li>9️⃣ 取关列表会显示账号状态。⚠️ 疑似停用的账号点开可能显示“找不到页面”，可用状态按钮只查看<strong>✅ 取关 (账号正常)</strong>。</li>
  </ul>`,
};

const I18N = {
  ko: {
    title: "인스타 팔로우 추적",
    ads: "( 광고 영역 )",
    drop_past:
      "과거 ZIP (followers_1.json + following.json 포함)<br><input type='file' id='pastInput' accept='.zip'>",
    drop_now:
      "현재 ZIP (followers_1.json + following.json 포함)<br><input type='file' id='currentInput' accept='.zip'>",
    search: "아이디 검색",
    empty: "없음",
    lists: [
      {
        id: "unfollowers",
        title: "📉 언팔로우한 계정",
      },
      {
        id: "onlyIFollow",
        title: "🔁 나만 팔로우 중",
      },
      {
        id: "onlyTheyFollow",
        title: "🙋 상대만 나를 팔로우",
      },
      {
        id: "newFollowers",
        title: "🆕 새로운 팔로워",
      },
      {
        id: "mutuals",
        title: "🤝 맞팔(상호 팔로우) 계정",
      },
    ],
    follow: "✅ 내가 팔로우함",
    notfollow: "❌ 팔로우 안함",
    sort: {
      follow: "팔로우",
      date: "날짜",
      status: "상태",
    },
    chart: [
      "언팔로우",
      "새 팔로워",
      "팔로워",
      "팔로잉",
      "나만 팔로우",
      "상대만 팔로우",
    ],
    chartTabs: [
      {
        key: "follow",
        label: "팔로워/팔로잉 비율",
      },
      {
        key: "diff",
        label: "언팔로우/새팔로워 비율",
      },
      {
        key: "oneway",
        label: "일방팔로우 비율",
      },
    ],
    all: "전체",
    status: {
      unfollowed: "✅ 언팔 (계정 활성)",
      iUnfollowed: "↩️ 내가 먼저 언팔",
      unknown: "❓ 확인 불가",
      gone: "⚠️ 비활성·탈퇴 추정",
      blocked: "🚫 내가 차단",
    },
    statusHelp: {
      unfollowed:
        "내가 아직 팔로우 중이라 계정이 살아 있습니다. 상대가 직접 언팔로우했습니다.",
      iUnfollowed:
        "내 최근 언팔로우 기록에 있는 계정입니다. 계정이 지금 활성인지는 알 수 없습니다.",
      unknown:
        "원래 내가 팔로우하지 않던 계정이라 데이터만으로는 상태를 알 수 없습니다.",
      gone: "과거엔 내가 팔로우했는데 내 팔로잉에서도 사라졌습니다. 비활성화·탈퇴·아이디 변경 또는 상대가 나를 차단했을 가능성이 높습니다.",
      blocked: "현재 ZIP의 차단 목록(blocked_profiles.json)에 있는 계정입니다.",
    },
    statusNoPastFollowing:
      "과거 ZIP에 following.json이 없어 '비활성·탈퇴 추정'을 판별하지 못했습니다.",
    previewToggle: "🔍 미리보기 창으로 열기",
    previewHint:
      "아이디를 누르면 작은 창 하나에서 차례로 열려요. 로그인 상태에서 '페이지를 찾을 수 없음'인데 시크릿 창에서는 프로필이 보인다면 상대가 나를 차단한 거예요. 시크릿 창에서도 안 보이면 비활성화·탈퇴·아이디 변경이에요.",
  },
  en: {
    title: "Instagram Follow Tracker",
    ads: "( Ads Area )",
    drop_past:
      "Past ZIP (includes followers_1.json + following.json)<br><input type='file' id='pastInput' accept='.zip'>",
    drop_now:
      "Current ZIP (includes followers_1.json + following.json)<br><input type='file' id='currentInput' accept='.zip'>",
    search: "Search ID",
    empty: "Empty",
    lists: [
      {
        id: "unfollowers",
        title: "📉 Unfollowed Accounts",
      },
      {
        id: "onlyIFollow",
        title: "🔁 Only I Follow",
      },
      {
        id: "onlyTheyFollow",
        title: "🙋 Only They Follow Me",
      },
      {
        id: "newFollowers",
        title: "🆕 New Followers",
      },
      {
        id: "mutuals",
        title: "🤝 Mutual Follows",
      },
    ],
    follow: "✅ I Follow",
    notfollow: "❌ Not Following",
    sort: {
      follow: "Follow",
      date: "Date",
      status: "Status",
    },
    chart: [
      "Unfollowers",
      "New Followers",
      "Followers",
      "Following",
      "Only I Follow",
      "Only They Follow",
    ],
    chartTabs: [
      {
        key: "follow",
        label: "Followers/Following",
      },
      {
        key: "diff",
        label: "Unfollower/New Follower Ratio",
      },
      {
        key: "oneway",
        label: "One-way Follows",
      },
    ],
    all: "All",
    status: {
      unfollowed: "✅ Unfollowed (active)",
      iUnfollowed: "↩️ I unfollowed first",
      unknown: "❓ Unknown",
      gone: "⚠️ Likely deactivated",
      blocked: "🚫 Blocked by me",
    },
    statusHelp: {
      unfollowed:
        "You still follow this account, so it exists. They unfollowed you themselves.",
      iUnfollowed:
        "This account is in your recently unfollowed list. Its current status is unknown.",
      unknown:
        "You never followed this account, so its status can't be determined from the data.",
      gone: "You used to follow this account but it also disappeared from your following. It was likely deactivated, deleted, renamed, or blocked you.",
      blocked:
        "This account is in the block list (blocked_profiles.json) of your current ZIP.",
    },
    statusNoPastFollowing:
      "The past ZIP has no following.json, so 'Likely deactivated' couldn't be detected.",
    previewToggle: "🔍 Open in preview window",
    previewHint:
      "Clicking an ID opens it in one small window. If a profile shows 'Page not found' while logged in but appears in a private window, that account blocked you. If it's missing in a private window too, it was deactivated, deleted, or renamed.",
  },
  ja: {
    title: "インスタフォロー追跡",
    ads: "（広告エリア）",
    drop_past:
      "過去ZIP（followers_1.json＋following.json含む）<br><input type='file' id='pastInput' accept='.zip'>",
    drop_now:
      "現在ZIP（followers_1.json＋following.json含む）<br><input type='file' id='currentInput' accept='.zip'>",
    search: "ID検索",
    empty: "なし",
    lists: [
      {
        id: "unfollowers",
        title: "📉 アンフォローしたアカウント",
      },
      {
        id: "onlyIFollow",
        title: "🔁 自分だけフォロー中",
      },
      {
        id: "onlyTheyFollow",
        title: "🙋 相手だけフォロー",
      },
      {
        id: "newFollowers",
        title: "🆕 新しいフォロワー",
      },
      {
        id: "mutuals",
        title: "🤝 相互フォロー",
      },
    ],
    follow: "✅ フォロー中",
    notfollow: "❌ フォローしていない",
    sort: {
      follow: "フォロー",
      date: "日付",
      status: "状態",
    },
    chart: [
      "アンフォロー",
      "新しいフォロワー",
      "フォロワー",
      "フォロー中",
      "自分だけフォロー",
      "相手だけフォロー",
    ],
    chartTabs: [
      {
        key: "follow",
        label: "フォロワー/フォロー中",
      },
      {
        key: "diff",
        label: "アンフォロー/新フォロワー比率",
      },
      {
        key: "oneway",
        label: "一方フォロー比率",
      },
    ],
    all: "すべて",
    status: {
      unfollowed: "✅ アンフォロー (有効)",
      iUnfollowed: "↩️ 自分が先に解除",
      unknown: "❓ 判定不可",
      gone: "⚠️ 無効化・退会の可能性",
      blocked: "🚫 自分がブロック",
    },
    statusHelp: {
      unfollowed:
        "まだフォロー中なのでアカウントは存在します。相手がフォローを外しました。",
      iUnfollowed:
        "最近フォロー解除した記録にあるアカウントです。現在の状態はわかりません。",
      unknown:
        "もともとフォローしていないアカウントのため、データだけでは状態がわかりません。",
      gone: "以前はフォローしていたのに、フォロー中一覧からも消えています。無効化・退会・ID変更、または相手にブロックされた可能性が高いです。",
      blocked:
        "現在ZIPのブロック一覧(blocked_profiles.json)にあるアカウントです。",
    },
    statusNoPastFollowing:
      "過去ZIPにfollowing.jsonがないため「無効化・退会の可能性」を判定できませんでした。",
    previewToggle: "🔍 プレビューウィンドウで開く",
    previewHint:
      "IDをクリックすると小さなウィンドウ1つで順に開きます。ログイン中は「ページが見つかりません」なのにシークレットウィンドウでは表示される場合、相手にブロックされています。シークレットでも表示されなければ無効化・退会・ID変更です。",
  },
  zh: {
    title: "Instagram 粉丝追踪",
    ads: "（广告位）",
    drop_past:
      "过去ZIP（包含followers_1.json和following.json）<br><input type='file' id='pastInput' accept='.zip'>",
    drop_now:
      "当前ZIP（包含followers_1.json和following.json）<br><input type='file' id='currentInput' accept='.zip'>",
    search: "搜索ID",
    empty: "无",
    lists: [
      {
        id: "unfollowers",
        title: "📉 取消关注的账号",
      },
      {
        id: "onlyIFollow",
        title: "🔁 仅我关注",
      },
      {
        id: "onlyTheyFollow",
        title: "🙋 仅对方关注我",
      },
      {
        id: "newFollowers",
        title: "🆕 新粉丝",
      },
      {
        id: "mutuals",
        title: "🤝 互相关注",
      },
    ],
    follow: "✅ 我已关注",
    notfollow: "❌ 未关注",
    sort: {
      follow: "关注",
      date: "日期",
      status: "状态",
    },
    chart: ["取关", "新粉丝", "粉丝", "关注", "仅我关注", "仅对方关注"],
    chartTabs: [
      {
        key: "follow",
        label: "粉丝/关注比例",
      },
      {
        key: "diff",
        label: "取关/新粉丝比例",
      },
      {
        key: "oneway",
        label: "单向关注比例",
      },
    ],
    all: "全部",
    status: {
      unfollowed: "✅ 取关 (账号正常)",
      iUnfollowed: "↩️ 我先取关",
      unknown: "❓ 无法判断",
      gone: "⚠️ 疑似停用/注销",
      blocked: "🚫 我已拉黑",
    },
    statusHelp: {
      unfollowed: "我仍在关注该账号，说明账号存在，是对方主动取关。",
      iUnfollowed: "该账号在我最近取关的记录中，目前状态未知。",
      unknown: "我原本没有关注该账号，仅凭数据无法判断状态。",
      gone: "以前我关注过，但现在也从我的关注列表中消失了。很可能已停用、注销、改名或拉黑了我。",
      blocked: "该账号在当前ZIP的黑名单(blocked_profiles.json)中。",
    },
    statusNoPastFollowing:
      "过去ZIP中没有following.json，无法判断“疑似停用/注销”。",
    previewToggle: "🔍 在预览窗口中打开",
    previewHint:
      "点击ID会在同一个小窗口中依次打开。如果登录状态下显示“找不到页面”，但在无痕窗口中能看到主页，说明对方拉黑了我。无痕窗口也看不到则是停用、注销或改名。",
  },
};
