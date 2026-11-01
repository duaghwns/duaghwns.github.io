let LIST_ORDER = ["unfollowers", "newFollowers", "onlyIFollow", "onlyTheyFollow", "mutuals"];
let visibleLists = {
  unfollowers: true,
  newFollowers: true,
  onlyIFollow: true,
  onlyTheyFollow: true,
  mutuals: true,
};
let currentLang = "ko";
let pastFile = null;
let currentFile = null;
let pieChart = null;
let listDataCache = {};
let followingSetGlobal = new Set();
let chartDataSnapshot = emptyChartData();
let allListsVisible = true;
let sortOrders = {
  unfollowers: { by: "status", order: "asc" },
  newFollowers: { by: "isFollowing", order: "asc" },
  onlyIFollow: { by: "timestamp", order: "desc" },
  onlyTheyFollow: { by: "timestamp", order: "desc" },
  mutuals: { by: "timestamp", order: "desc" },
};
let currentChartTab = 0;
let unfollowerFilter = "all";
let searchQueries = {};
let pastHasFollowing = true;
let previewMode = loadPreviewMode();
let previewWin = null;

const DATE_SORT_LISTS = ["onlyIFollow", "onlyTheyFollow", "mutuals"];
// 언팔로우 목록 상태 (정렬 순서 = 배열 순서)
const STATUS_ORDER = ["unfollowed", "iUnfollowed", "unknown", "gone", "blocked"];

// 인스타 내보내기 ZIP 안의 파일 이름 패턴
const FILES = {
  followers: /followers_\d+\.json$/,
  following: /(^|\/)following\.json$/,
  blocked: /blocked_(profiles|accounts)\.json$/,
  unfollowedByMe: /recently_unfollowed_(profiles|accounts)\.json$/,
};

function emptyChartData() {
  return { unfollowers: 0, newFollowers: 0, followers: 0, following: 0, onlyIFollow: 0, onlyTheyFollow: 0 };
}

// ---------- i18n ----------

function getText(key, fallback) {
  return (I18N[currentLang] && I18N[currentLang][key]) || fallback || key;
}

function getChartTabs() {
  return I18N[currentLang]?.chartTabs || I18N.ko.chartTabs;
}

function getListConfig() {
  const lists = I18N[currentLang].lists || I18N.ko.lists;
  let order = [...LIST_ORDER];
  // 과거 ZIP이 없으면 비교가 필요한 목록은 숨긴다
  if (!pastFile) order = order.filter((id) => id !== "unfollowers" && id !== "newFollowers");
  return order.map((id) => lists.find((l) => l.id === id)).filter(Boolean);
}

function setLang(lang) {
  currentLang = lang;
  renderAllI18n();
}

function renderAllI18n() {
  document.getElementById("mainTitle").innerText = getText("title");
  renderGuide();
  document.getElementById("pastDrop").innerHTML = getText("drop_past");
  document.getElementById("currentDrop").innerHTML = getText("drop_now");
  renderPreviewOption();
  renderListToggles();
  renderLists(listDataCache);
  renderLangSelect();
  renderChartTabs();
  updateChart(chartDataSnapshot);
}

function renderGuide() {
  document.getElementById("guideText").innerHTML = guideContent[currentLang] || guideContent.ko;
}

function renderLangSelect() {
  const names = { ko: "한국어", en: "English", ja: "日本語", zh: "中文" };
  const options = Object.keys(I18N)
    .map((lang) => `<option value="${lang}"${currentLang === lang ? " selected" : ""}>${names[lang]}</option>`)
    .join("");
  document.getElementById("langToggle").innerHTML =
    `<select class="lang-select" onchange="setLang(this.value)">${options}</select>`;
}

// ---------- 차트 탭 ----------

function renderChartTabs() {
  document.getElementById("chartTabs").innerHTML = getChartTabs()
    .map(
      (tab, i) =>
        `<button class="chart-tab-btn${i === currentChartTab ? " selected" : ""}" onclick="switchChartTab(${i})">${tab.label}</button>`,
    )
    .join("");
}

window.switchChartTab = function (idx) {
  currentChartTab = idx;
  renderChartTabs();
  updateChart(chartDataSnapshot);
};

// ---------- 목록 토글 (드래그로 순서 변경) ----------

function renderListToggles() {
  const wrap = document.getElementById("listToggles");
  wrap.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "list-toggle-btn" + (allListsVisible ? " selected" : "");
  allBtn.innerHTML = getText("all", "전체");
  allBtn.onclick = () => {
    allListsVisible = !allListsVisible;
    getListConfig().forEach((l) => (visibleLists[l.id] = allListsVisible));
    renderListToggles();
    renderLists(listDataCache);
  };
  wrap.appendChild(allBtn);

  let dragging = false;
  let dragFrom = null;
  let ghost = null;
  let dragOver = null;
  const config = getListConfig();

  config.forEach((list, idx) => {
    const btn = document.createElement("button");
    btn.className = "list-toggle-btn" + (visibleLists[list.id] ? " selected" : "");
    btn.innerHTML = list.title;
    btn.setAttribute("data-idx", idx);
    btn.onclick = () => {
      visibleLists[list.id] = !visibleLists[list.id];
      renderListToggles();
      renderLists(listDataCache);
    };
    btn.draggable = true;
    btn.ondragstart = (e) => {
      dragging = true;
      dragFrom = idx;
      dragOver = idx;
      ghost = btn.cloneNode(true);
      ghost.classList.add("drag-ghost");
      ghost.style.width = btn.offsetWidth + "px";
      ghost.style.height = btn.offsetHeight + "px";
      ghost.style.left = e.clientX - 30 + "px";
      ghost.style.top = e.clientY - 20 + "px";
      document.body.appendChild(ghost);
      setTimeout(() => (btn.style.visibility = "hidden"), 1);
    };
    btn.ondragend = () => {
      dragging = false;
      dragFrom = null;
      if (ghost) document.body.removeChild(ghost);
      ghost = null;
      Array.from(wrap.children).forEach((el) => el.classList.remove("drag-placeholder"));
      renderListToggles();
    };
    btn.ondragover = (e) => e.preventDefault();
    btn.ondragenter = () => {
      if (!dragging) return;
      dragOver = idx;
      // children[0]은 "전체" 버튼이라 인덱스를 1 밀어서 비교
      Array.from(wrap.children).forEach((el, i) => {
        el.classList.toggle("drag-placeholder", i - 1 === dragOver && dragOver !== undefined);
      });
    };
    btn.ondrop = (e) => {
      e.preventDefault();
      if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
        const shown = LIST_ORDER.filter((id) => config.some((l) => l.id === id));
        const moved = shown[dragFrom];
        shown.splice(dragFrom, 1);
        shown.splice(dragOver, 0, moved);
        LIST_ORDER = [...LIST_ORDER.filter((id) => !shown.includes(id)), ...shown];
        renderListToggles();
        renderLists(listDataCache);
      }
    };
    btn.onmousemove = (e) => {
      if (ghost) {
        ghost.style.left = e.clientX - 30 + "px";
        ghost.style.top = e.clientY - 20 + "px";
      }
    };
    wrap.appendChild(btn);
  });

  document.onmousemove = function (e) {
    const g = document.querySelector(".drag-ghost");
    if (g) {
      g.style.left = e.clientX - 30 + "px";
      g.style.top = e.clientY - 20 + "px";
    }
  };

  allListsVisible = getListConfig().every((l) => visibleLists[l.id]);
  allBtn.classList.toggle("selected", allListsVisible);
}

// ---------- 미리보기 창 ----------
// 인스타그램은 iframe 임베드를 막기 때문에(X-Frame-Options: DENY) 작은 팝업 창 하나를 재사용한다

function loadPreviewMode() {
  try {
    return localStorage.getItem("previewMode") === "on";
  } catch (e) {
    return false;
  }
}

function renderPreviewOption() {
  document.getElementById("previewOption").innerHTML = `
    <label class="preview-switch">
      <input type="checkbox" ${previewMode ? "checked" : ""} onchange="setPreviewMode(this.checked)">
      <span class="preview-slider"></span>
      <span>${getText("previewToggle")}</span>
    </label>
    ${previewMode ? `<p class="preview-hint">${getText("previewHint")}</p>` : ""}`;
}

window.setPreviewMode = function (on) {
  previewMode = on;
  try {
    localStorage.setItem("previewMode", on ? "on" : "off");
  } catch (e) {}
  renderPreviewOption();
};

function openPreview(href) {
  const w = 420;
  const h = Math.min(780, screen.availHeight - 80);
  const left = window.screenX + window.outerWidth - w - 20;
  const top = window.screenY + 60;
  // 같은 이름의 창을 쓰면 새 창 대신 기존 미리보기 창의 주소만 바뀐다
  previewWin = window.open(href, "instaPreview", `popup,width=${w},height=${h},left=${left},top=${top}`);
  if (previewWin) previewWin.focus();
  return !!previewWin;
}

document.getElementById("lists").addEventListener("click", (e) => {
  const link = e.target.closest("td a");
  if (!previewMode || !link) return;
  // 팝업이 막히면 기본 동작(새 탭)으로 둔다
  if (!openPreview(link.href)) return;
  e.preventDefault();
  document.querySelectorAll("#lists tr.previewing").forEach((tr) => tr.classList.remove("previewing"));
  link.closest("tr").classList.add("previewing");
});

// ---------- 파일 업로드 ----------

function setupDrop(dropId, inputId, isPast) {
  const zone = document.getElementById(dropId);
  // 드롭존 내용(input)은 renderAllI18n에서 그려지므로 잠시 뒤에 바인딩
  setTimeout(() => {
    const input = zone.querySelector("input[type='file']");
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("dragover");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.add("fileon");
      zone.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        if (isPast) pastFile = file;
        else currentFile = file;
        analyze();
      }
    });
    input.addEventListener("change", () => {
      zone.classList.toggle("fileon", input.value.length > 0);
    });
  }, 150);
}

setupDrop("pastDrop", "pastInput", true);
setupDrop("currentDrop", "currentInput", false);

document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "pastInput") {
    pastFile = e.target.files[0];
    analyze();
  }
  if (e.target && e.target.id === "currentInput") {
    currentFile = e.target.files[0];
    analyze();
  }
});

// ---------- 데이터 파싱 ----------

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `📅 ${d.getFullYear()}년 ${mm}월 ${dd}일`;
}

// 아이디 위치가 파일/내보내기 버전마다 다름
// followers_N.json은 string_list_data[].value, following.json·차단 목록은 title
function entryUsername(entry, item) {
  const fromHref = (item.href || "").split("/").filter(Boolean).pop();
  return (entry.title || item.value || fromHref || "").trim();
}

// [{string_list_data}] 배열 또는 { relationships_xxx: [...] } 형태
function parseRelationshipJson(text) {
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) return json;
    return Object.values(json).find(Array.isArray) || [json];
  } catch (e) {
    return [];
  }
}

function toUserMap(entries) {
  const map = new Map();
  for (const entry of entries) {
    for (const item of entry.string_list_data || []) {
      const username = entryUsername(entry, item);
      if (username) map.set(username.toLowerCase(), { username, href: item.href, timestamp: item.timestamp });
    }
  }
  return map;
}

// 팔로워가 많으면 followers_1.json, followers_2.json ... 으로 나뉘므로 패턴에 맞는 파일을 모두 합친다
async function readUserMap(zip, pattern) {
  const files = Object.values(zip.files).filter((f) => pattern.test(f.name));
  const texts = await Promise.all(files.map((f) => f.async("text")));
  return toUserMap(texts.flatMap(parseRelationshipJson));
}

// 언팔로우 목록 계정의 상태 추정
// 계정이 비활성/탈퇴되거나 상대가 나를 차단하면 양쪽 팔로우 관계가 함께 사라지므로,
// 과거에 내가 팔로우하던 계정이 내 팔로잉에서도 없어졌다면 계정이 사라진 쪽으로 본다
function classifyUnfollower(u, ctx) {
  if (ctx.blocked.has(u)) return "blocked";
  if (ctx.following.has(u)) return "unfollowed"; // 아직 팔로우 중 = 계정이 살아 있음
  if (ctx.unfollowedByMe.has(u)) return "iUnfollowed";
  if (ctx.pastFollowing.has(u)) return "gone";
  return "unknown"; // 원래 내가 팔로우하지 않던 계정은 근거가 없음
}

// ---------- 분석 ----------

async function analyze() {
  if (!currentFile) {
    chartDataSnapshot = emptyChartData();
    updateChart(chartDataSnapshot);
    renderLists({});
    renderListToggles();
    return;
  }

  const zip = await JSZip.loadAsync(currentFile);
  const [followersMap, followingMap, blockedMap, unfollowedByMeMap] = await Promise.all([
    readUserMap(zip, FILES.followers),
    readUserMap(zip, FILES.following),
    readUserMap(zip, FILES.blocked),
    readUserMap(zip, FILES.unfollowedByMe),
  ]);
  const followerSet = new Set(followersMap.keys());
  followingSetGlobal = new Set(followingMap.keys());

  let newFollowers = [];
  let unfollowers = [];
  unfollowerFilter = "all";
  if (pastFile) {
    const pastZip = await JSZip.loadAsync(pastFile);
    const [pastFollowersMap, pastFollowingMap] = await Promise.all([
      readUserMap(pastZip, FILES.followers),
      readUserMap(pastZip, FILES.following),
    ]);
    pastHasFollowing = pastFollowingMap.size > 0;
    const ctx = {
      blocked: blockedMap,
      following: followingSetGlobal,
      unfollowedByMe: unfollowedByMeMap,
      pastFollowing: pastFollowingMap,
    };
    newFollowers = [...followerSet]
      .filter((u) => !pastFollowersMap.has(u))
      .map((u) => ({ ...followersMap.get(u), username: u, isFollowing: followingSetGlobal.has(u) }));
    unfollowers = [...pastFollowersMap.keys()]
      .filter((u) => !followerSet.has(u))
      .map((u) => ({
        ...pastFollowersMap.get(u),
        username: u,
        isFollowing: followingSetGlobal.has(u),
        status: classifyUnfollower(u, ctx),
      }));
  }

  const mutuals = [...followerSet].filter((u) => followingSetGlobal.has(u)).map((u) => followersMap.get(u));
  const onlyIFollow = [...followingSetGlobal].filter((u) => !followerSet.has(u)).map((u) => followingMap.get(u));
  const onlyTheyFollow = [...followerSet].filter((u) => !followingSetGlobal.has(u)).map((u) => followersMap.get(u));

  listDataCache = { unfollowers, newFollowers, onlyIFollow, onlyTheyFollow, mutuals };
  chartDataSnapshot = {
    unfollowers: unfollowers.length,
    newFollowers: newFollowers.length,
    followers: followerSet.size,
    following: followingSetGlobal.size,
    onlyIFollow: onlyIFollow.length,
    onlyTheyFollow: onlyTheyFollow.length,
  };
  updateChart(chartDataSnapshot);
  renderLists(listDataCache);
  renderListToggles();
}

// ---------- 정렬 ----------

function sortList(listId, items) {
  if (DATE_SORT_LISTS.includes(listId)) {
    const { by = "timestamp", order } = sortOrders[listId] || {};
    const dir = order === "asc" ? 1 : -1;
    return [...items].sort((a, b) => dir * ((b[by] || 0) - (a[by] || 0)));
  }
  if (listId === "unfollowers") {
    const dir = sortOrders.unfollowers.order === "asc" ? 1 : -1;
    return [...items].sort((a, b) => dir * (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)));
  }
  if (listId === "newFollowers") {
    return [...items].sort((a, b) => {
      const x = !!a.isFollowing;
      const y = !!b.isFollowing;
      return sortOrders.newFollowers.order === "asc" ? x - y : y - x;
    });
  }
  return items;
}

function toggleSort(listId) {
  const s = sortOrders[listId];
  if (s) s.order = s.order === "desc" ? "asc" : "desc";
  renderLists(listDataCache);
}

// ---------- 목록 렌더링 ----------

function statusText(status) {
  return getText("status")[status] || I18N.ko.status[status];
}

function statusHelp(status) {
  return getText("statusHelp")[status] || I18N.ko.statusHelp[status];
}

function renderRow(listId, item) {
  const href = item.href || "https://instagram.com/" + item.username;
  let html = `<td><a href="${href}" target="_blank">@${item.username}</a></td>`;
  const tr = document.createElement("tr");
  if (listId === "unfollowers") {
    html += `<td><span class="status-badge status-${item.status}" title="${statusHelp(item.status)}">${statusText(item.status)}</span></td>`;
    tr.className = "status-row-" + item.status;
  } else if (listId === "newFollowers") {
    html += `<td>${item.isFollowing ? getText("follow") : getText("notfollow")}</td>`;
  } else {
    html += `<td>${formatDate(item.timestamp)}</td>`;
  }
  tr.innerHTML = html;
  return tr;
}

// 정렬 + 상태 필터 + 검색어를 적용한 목록
function getVisibleItems(listId, data) {
  let items = sortList(listId, data[listId] || []);
  if (listId === "unfollowers" && unfollowerFilter !== "all") {
    items = items.filter((item) => item.status === unfollowerFilter);
  }
  const query = searchQueries[listId];
  if (query) items = items.filter((item) => item.username.toLowerCase().includes(query));
  return items;
}

function statusFilterHtml(items) {
  const counts = {};
  items.forEach((item) => (counts[item.status] = (counts[item.status] || 0) + 1));
  const chip = (key, label, count, help) =>
    `<button class="status-chip${unfollowerFilter === key ? " selected" : ""}" title="${help || ""}" onclick="setUnfollowerFilter('${key}')">${label} ${count}</button>`;
  let html = chip("all", getText("all", "전체"), items.length);
  STATUS_ORDER.filter((s) => counts[s]).forEach((s) => (html += chip(s, statusText(s), counts[s], statusHelp(s))));
  const note = !pastHasFollowing && items.length ? `<p class="status-note">${getText("statusNoPastFollowing")}</p>` : "";
  return `<div class="status-filter">${html}</div>${note}`;
}

window.setUnfollowerFilter = function (status) {
  unfollowerFilter = status;
  renderLists(listDataCache);
};

function fillTbody(tbody, listId, items) {
  tbody.innerHTML = "";
  items.forEach((item) => tbody.appendChild(renderRow(listId, item)));
  if (items.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${getText("empty")}</td>`;
    tbody.appendChild(tr);
  }
}

function sortButtonHtml(listId) {
  if (DATE_SORT_LISTS.includes(listId)) {
    const arrow = sortOrders[listId].order === "desc" ? "⬇️" : "⬆️";
    return `<button class="sort-btn" onclick="toggleSort('${listId}', 'timestamp')">${getText("sort").date}${arrow}</button>`;
  }
  if (listId === "unfollowers") {
    const arrow = sortOrders.unfollowers.order === "asc" ? "⬇️" : "⬆️";
    return `<button class="sort-btn" onclick="toggleSort('unfollowers', 'status')">${getText("sort").status}${arrow}</button>`;
  }
  if (listId === "newFollowers") {
    const arrow = sortOrders.newFollowers.order === "asc" ? "⬇️" : "⬆️";
    return `<button class="sort-btn" onclick="toggleSort('newFollowers', 'isFollowing')">${getText("sort").follow}${arrow}</button>`;
  }
  return "";
}

function renderLists(data) {
  const container = document.getElementById("lists");
  container.innerHTML = "";
  getListConfig().forEach((list) => {
    if (!visibleLists[list.id]) return;
    const items = data[list.id] || [];

    const wrap = document.createElement("div");
    wrap.className = "list";
    wrap.id = list.id + "_list";

    const header = document.createElement("div");
    header.className = "list-sticky-header";
    const h3 = document.createElement("h3");
    h3.innerHTML = `<span id="${list.id}Title">${list.title} (${items.length})</span>${sortButtonHtml(list.id)}`;
    const search = document.createElement("div");
    search.className = "search-box";
    search.innerHTML = `<input type="text" placeholder="${getText("search")}" oninput="filterList('${list.id}', this.value)">`;
    search.querySelector("input").value = searchQueries[list.id] || "";
    header.appendChild(h3);
    header.appendChild(search);
    if (list.id === "unfollowers" && items.length) {
      header.insertAdjacentHTML("beforeend", statusFilterHtml(items));
    }

    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
    fillTbody(tbody, list.id, getVisibleItems(list.id, data));

    wrap.appendChild(header);
    wrap.appendChild(table);
    container.appendChild(wrap);
  });
}

window.filterList = function (listId, query) {
  searchQueries[listId] = (query || "").trim().toLowerCase();
  const tbody = document.querySelector(`#${listId}_list table tbody`);
  fillTbody(tbody, listId, getVisibleItems(listId, listDataCache));
};

// ---------- 차트 ----------

function updateChart(data) {
  const chartText = I18N[currentLang].chart;
  let labels, values, colors;
  if (currentChartTab === 0) {
    labels = [`${chartText[2] || "팔로워"} (${data.followers})`, `${chartText[3] || "팔로잉"} (${data.following})`];
    values = [data.followers, data.following];
    colors = ["#34A853", "#FBBC05"];
  } else if (currentChartTab === 1) {
    labels = [`${chartText[0] || "언팔로우"} (${data.unfollowers})`, `${chartText[1] || "새 팔로워"} (${data.newFollowers})`];
    values = [data.unfollowers, data.newFollowers];
    colors = ["#4285F4", "#EA4335"];
  } else {
    labels = [`${chartText[4] || "나만 팔로우"} (${data.onlyIFollow})`, `${chartText[5] || "상대만 팔로우"} (${data.onlyTheyFollow})`];
    values = [data.onlyIFollow, data.onlyTheyFollow];
    colors = ["#607d8b", "#9c27b0"];
  }

  const total = values.reduce((a, b) => a + b, 0);
  const chartData = {
    labels: labels.map((label, i) => `${label} ${total ? Math.round((values[i] * 1000) / total) / 10 : 0}%`),
    datasets: [{ data: values, backgroundColor: colors }],
  };

  if (pieChart) {
    pieChart.data = chartData;
    pieChart.options.responsive = true;
    pieChart.update();
  } else {
    pieChart = new Chart(document.getElementById("pieChart").getContext("2d"), {
      type: "pie",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: "bottom" },
          tooltip: { callbacks: { label: (ctx) => "" + ctx.label } },
        },
      },
    });
  }
}

// ---------- 기타 ----------

document.querySelector("#bank").addEventListener("click", (e) => {
  e.preventDefault();
  navigator.clipboard.writeText("토스뱅크 1000-0355-6332").then(() => alert("계좌가 복사되었습니다"));
});

// 브라우저 언어로 초기 언어 설정
(function () {
  const lang = (navigator.language || navigator.userLanguage || "ko").slice(0, 2).toLowerCase();
  if (I18N[lang]) currentLang = lang;
  renderAllI18n();
})();
