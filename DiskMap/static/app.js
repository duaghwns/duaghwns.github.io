const state = {
  tree: null,
  selected: null,
  focusPath: null,
  history: [],
  clickTimer: null,
  zoom: 1,
  activeTab: "mindmap",
};

const els = {
  depth: document.querySelector("#depthInput"),
  childLimit: document.querySelector("#childLimitInput"),
  visualChildren: document.querySelector("#visualChildrenInput"),
  hidden: document.querySelector("#hiddenInput"),
  scan: document.querySelector("#scanBtn"),
  picked: document.querySelector("#pickedFolder"),
  serverScan: document.querySelector("#serverScan"),
  path: document.querySelector("#pathInput"),
  scanPath: document.querySelector("#scanPathBtn"),
  presets: document.querySelector("#presets"),
  quit: document.querySelector("#quitBtn"),
  summary: document.querySelector("#summary"),
  breadcrumb: document.querySelector("#breadcrumb"),
  folderHeading: document.querySelector("#folderHeading"),
  folderList: document.querySelector("#folderList"),
  svg: document.querySelector("#mindmap"),
  loading: document.querySelector("#loading"),
  detail: document.querySelector("#detailBar"),
  reveal: document.querySelector("#revealBtn"),
  focus: document.querySelector("#focusBtn"),
  focusUp: document.querySelector("#focusUpBtn"),
  mindmapView: document.querySelector("#mindmapView"),
  listView: document.querySelector("#listView"),
  candidateList: document.querySelector("#candidateList"),
  mindmapTab: document.querySelector("#mindmapTab"),
  listTab: document.querySelector("#listTab"),
  zoomOut: document.querySelector("#zoomOutBtn"),
  resetView: document.querySelector("#resetViewBtn"),
  toast: document.querySelector("#toast"),
  progress: document.querySelector("#scanProgress"),
};

const colors = {
  folder: "#5b8e7d",
  file: "#6c757d",
  cache: "#d1495b",
  "dev-artifact": "#5b6f82",
  archive: "#edae49",
  media: "#1f7a8c",
  image: "#4f86c6",
  document: "#48735f",
};

const ARCHIVE_EXTS = new Set([
  ".zip", ".rar", ".7z", ".tar", ".gz", ".tgz", ".bz2", ".xz", ".dmg", ".pkg", ".iso",
]);
const MEDIA_EXTS = new Set([
  ".mov", ".mp4", ".m4v", ".avi", ".mkv", ".hevc", ".mp3", ".wav", ".aiff", ".flac",
]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".heic", ".raw", ".tiff", ".gif", ".webp"]);
const DOC_EXTS = new Set([".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx", ".key"]);
const DEV_DIRS = new Set([
  "node_modules", ".gradle", ".npm", ".pnpm-store", ".yarn", ".cargo", ".rustup",
  ".pub-cache", "Pods", ".build", "build", "dist", ".next", ".turbo", "DerivedData",
]);
const CACHE_DIRS = new Set([
  "Caches", ".cache", "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
  ".parcel-cache", ".vite",
]);

const MAX_ENTRIES = 240000;

let toastTimer = null;
let serverMode = false;
let serverPlatform = "";
let presets = [];

init();

async function init() {
  bindEvents();
  await detectServerMode();

  const canPick = !!window.showDirectoryPicker;
  if (!canPick) {
    els.scan.disabled = true;
    els.picked.textContent = "이 브라우저는 폴더 선택을 지원하지 않습니다 (Chrome/Edge 권장).";
  }

  if (serverMode) {
    els.summary.innerHTML = `
      <div class="empty-copy">로컬 서버 모드입니다. 폴더를 선택하거나 경로를 입력해 스캔하세요. 권한이 닿는 시스템 폴더까지 읽을 수 있습니다.</div>
    `;
  } else if (canPick) {
    els.summary.innerHTML = `
      <div class="empty-copy">폴더를 선택하면 브라우저 안에서만 크기를 분석합니다. 파일 내용은 어디에도 전송되지 않습니다.</div>
    `;
  } else {
    els.summary.innerHTML = `
      <div class="empty-copy">이 브라우저는 폴더 스캔(File System Access API)을 지원하지 않습니다. <strong>Chrome</strong> 또는 <strong>Edge</strong>에서 열어주세요.</div>
    `;
  }
}

// 로컬 server.py가 제공하는 /api/presets 응답이 있으면 서버 모드로 동작합니다.
// GitHub Pages 등 일반 웹에서는 404가 떨어져 브라우저 전용으로 남습니다.
async function detectServerMode() {
  try {
    const res = await fetch("/api/presets", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    serverMode = true;
    serverPlatform = data.platform || "";
    presets = Array.isArray(data.presets) ? data.presets : [];
    enableServerScanUI();
  } catch {
    // 서버 없음 → 브라우저 전용 유지
  }
}

// 서버 OS에 맞춰 "파일 위치 열기" 동작의 이름을 정합니다.
function revealLabel() {
  if (serverPlatform === "darwin") return "Finder에서 보기";
  if (serverPlatform === "win32") return "탐색기에서 보기";
  return "파일 위치 열기";
}

function revealShort() {
  if (serverPlatform === "darwin") return "Finder";
  if (serverPlatform === "win32") return "탐색기";
  return "위치 열기";
}

function revealHint() {
  if (serverPlatform === "darwin") return "더블클릭하면 Finder에서 열립니다";
  if (serverPlatform === "win32") return "더블클릭하면 탐색기에서 열립니다";
  return "더블클릭하면 파일 위치가 열립니다";
}

function enableServerScanUI() {
  if (els.serverScan) els.serverScan.classList.remove("hidden");
  if (els.reveal) els.reveal.textContent = revealLabel();

  if (els.presets) {
    els.presets.innerHTML = "";
    for (const preset of presets) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = preset.label;
      button.addEventListener("click", () => {
        els.path.value = preset.path;
        scanServer();
      });
      els.presets.append(button);
    }
  }
  const home = presets.find((item) => item.label === "Downloads") || presets[0];
  if (home && els.path && !els.path.value) els.path.value = home.path;
}

function bindEvents() {
  els.scan.addEventListener("click", scan);
  els.scanPath.addEventListener("click", scanServer);
  els.path.addEventListener("keydown", (event) => {
    if (event.key === "Enter") scanServer();
  });
  els.quit.addEventListener("click", quitApp);
  els.reveal.addEventListener("click", () => {
    if (state.selected) revealOrCopy(state.selected.path);
  });
  els.focus.addEventListener("click", () => {
    if (!canFocusNode(state.selected)) return;
    enterNode(state.selected);
  });
  els.focusUp.addEventListener("click", () => {
    focusParent();
  });
  els.visualChildren.addEventListener("change", renderMindmap);
  els.mindmapTab.addEventListener("click", () => setTab("mindmap"));
  els.listTab.addEventListener("click", () => setTab("list"));
  els.zoomOut.addEventListener("click", goBack);
  els.resetView.addEventListener("click", goRoot);
  window.addEventListener("resize", () => {
    if (state.tree) renderMindmap();
  });
}

async function scan() {
  if (!window.showDirectoryPicker) return;

  let dirHandle;
  try {
    dirHandle = await window.showDirectoryPicker({ mode: "read" });
  } catch (error) {
    if (error && error.name === "AbortError") return;
    els.summary.innerHTML = `<div class="empty-copy">${escapeHtml(error.message || "폴더를 열 수 없습니다.")}</div>`;
    return;
  }

  setLoading(true);
  if (els.progress) els.progress.textContent = "";
  // 로딩 화면이 먼저 그려지도록 한 프레임 양보합니다.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  try {
    const options = {
      maxDepth: boundedNumber(els.depth.value, 1, 20, 9),
      childLimit: boundedNumber(els.childLimit.value, 8, 100, 36),
      includeHidden: els.hidden.checked,
      maxEntries: MAX_ENTRIES,
    };
    const data = await buildTree(dirHandle, options);
    state.tree = data;
    state.selected = data;
    state.focusPath = data.path;
    state.history = [];
    state.zoom = 1;
    els.picked.textContent = `선택됨: ${dirHandle.name}`;
    renderSummary();
    renderCandidates();
    renderMindmap();
    renderDetail();
  } catch (error) {
    els.summary.innerHTML = `<div class="empty-copy">${escapeHtml(error.message || "스캔에 실패했습니다.")}</div>`;
  } finally {
    setLoading(false);
  }
}

// 로컬 서버 모드: server.py가 직접 스캔한 결과(트리)를 받아 그립니다.
async function scanServer() {
  if (!serverMode) return;
  const path = els.path.value.trim();
  if (!path) return;

  setLoading(true);
  if (els.progress) els.progress.textContent = "";

  try {
    const params = new URLSearchParams({
      path,
      maxDepth: String(boundedNumber(els.depth.value, 1, 20, 9)),
      childLimit: String(boundedNumber(els.childLimit.value, 8, 100, 36)),
      hidden: els.hidden.checked ? "1" : "0",
    });
    const res = await fetch(`/api/scan?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "스캔에 실패했습니다.");
    state.tree = data;
    state.selected = data;
    state.focusPath = data.path;
    state.history = [];
    state.zoom = 1;
    els.picked.textContent = `스캔됨: ${data.scan?.displayRoot || data.displayPath || path}`;
    renderSummary();
    renderCandidates();
    renderMindmap();
    renderDetail();
  } catch (error) {
    els.summary.innerHTML = `<div class="empty-copy">${escapeHtml(error.message || "스캔에 실패했습니다.")}</div>`;
  } finally {
    setLoading(false);
  }
}

async function buildTree(rootHandle, options) {
  const scanState = {
    entries: 0,
    permissionErrors: 0,
    truncated: false,
    skippedHidden: 0,
    maxEntries: options.maxEntries,
    totalTop: 0,
    doneTop: 0,
    currentTop: "",
    lastYield: performance.now(),
  };

  // 최상위 항목을 기준으로 진행률을 표시하며 한 번에 스캔합니다.
  updateProgress(scanState);
  const started = performance.now();
  const rootNode = await scanEntry(rootHandle, rootHandle.name, 0, options, scanState);
  const candidates = collectCandidates(rootNode);
  rootNode.scan = {
    durationMs: Math.round(performance.now() - started),
    entries: scanState.entries,
    permissionErrors: scanState.permissionErrors,
    permissionPaths: [],
    truncated: scanState.truncated,
    skippedHidden: scanState.skippedHidden,
    root: rootHandle.name,
    displayRoot: rootHandle.name,
  };
  rootNode.candidates = candidates;
  return rootNode;
}

// 진행률 텍스트를 갱신하고, 80ms마다 한 번 양보해 화면이 멈추지 않게 합니다.
async function maybeYield(scanState) {
  const now = performance.now();
  if (now - scanState.lastYield >= 80) {
    scanState.lastYield = now;
    updateProgress(scanState);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function updateProgress(scanState) {
  if (!els.progress) return;
  const total = scanState.totalTop || 0;
  const done = scanState.doneTop || 0;
  const items = scanState.entries || 0;
  if (total > 0) {
    const pct = Math.min(100, Math.floor((done / total) * 100));
    const current = scanState.currentTop ? ` · ${truncateMiddle(scanState.currentTop, 22)}` : "";
    els.progress.textContent = `${pct}%  ·  ${formatNumber(items)}개${current}`;
  } else {
    els.progress.textContent = `${formatNumber(items)}개 스캔됨`;
  }
}

async function scanEntry(handle, relPath, depth, options, scanState) {
  if (scanState.entries >= options.maxEntries) {
    scanState.truncated = true;
    return placeholderNode(relPath, "항목 수 제한에 도달");
  }
  scanState.entries += 1;
  const lowerPath = relPath.toLowerCase();

  if (handle.kind === "file") {
    let file;
    try {
      file = await handle.getFile();
    } catch {
      scanState.permissionErrors += 1;
      return placeholderNode(relPath, "읽을 수 없음", false);
    }
    const size = file.size;
    const ext = extensionOf(handle.name);
    const { kind, flags, score } = classify(handle.name, lowerPath, ext, false, size);
    return {
      name: handle.name,
      path: relPath,
      displayPath: relPath,
      size,
      kind,
      isDir: false,
      modified: file.lastModified ? file.lastModified / 1000 : null,
      flags,
      score,
      children: [],
      entryCount: 1,
    };
  }

  // 디렉터리: 깊이 제한에 도달하면 크기만 측정합니다.
  if (depth >= options.maxDepth) {
    const [total, measured] = await measureSubtree(handle, options, scanState);
    const { kind, flags, score } = classify(handle.name, lowerPath, "", true, total);
    return {
      name: handle.name,
      path: relPath,
      displayPath: relPath,
      size: total,
      kind,
      isDir: true,
      modified: null,
      flags: [...flags, "깊이 제한"],
      score,
      children: [],
      entryCount: measured,
      limited: true,
    };
  }

  let entries;
  try {
    entries = [];
    for await (const child of handle.values()) entries.push(child);
  } catch {
    scanState.permissionErrors += 1;
    const { kind, flags, score } = classify(handle.name, lowerPath, "", true, 0);
    return {
      name: handle.name,
      path: relPath,
      displayPath: relPath,
      size: 0,
      kind,
      isDir: true,
      modified: null,
      flags,
      score,
      children: [],
      entryCount: 1,
      error: "읽을 수 없음",
    };
  }

  let total = 0;
  let entryCount = 1;
  const children = [];
  const unreadable = [];

  // 최상위 폴더의 직속 항목 수를 진행률 분모로 사용합니다.
  const isRoot = depth === 0;
  if (isRoot) {
    scanState.totalTop = entries.filter(
      (child) => options.includeHidden || !child.name.startsWith("."),
    ).length;
    scanState.doneTop = 0;
  }

  for (const child of entries) {
    if (!options.includeHidden && child.name.startsWith(".")) {
      scanState.skippedHidden += 1;
      continue;
    }
    if (isRoot) scanState.currentTop = child.name;
    const childNode = await scanEntry(child, `${relPath}/${child.name}`, depth + 1, options, scanState);
    total += childNode.size || 0;
    entryCount += childNode.entryCount || 1;
    if (childNode.error) unreadable.push(childNode.name);
    children.push(childNode);
    if (isRoot) scanState.doneTop += 1;
    if (scanState.truncated) break;
    await maybeYield(scanState);
  }
  if (isRoot) scanState.currentTop = "";

  children.sort((a, b) => (b.size || 0) - (a.size || 0));
  const omitted = children.slice(options.childLimit);
  const visibleChildren = children.slice(0, options.childLimit);
  const omittedSize = omitted.reduce((sum, item) => sum + (item.size || 0), 0);
  let { kind, flags, score } = classify(handle.name, lowerPath, "", true, total);
  if (unreadable.length) {
    flags = [...new Set([...flags, "일부 읽지 못함"])].sort();
  }

  return {
    name: handle.name,
    path: relPath,
    displayPath: relPath,
    size: total,
    kind,
    isDir: true,
    modified: null,
    flags,
    score,
    children: visibleChildren,
    entryCount,
    childCount: children.length,
    omittedCount: omitted.length,
    omittedSize,
  };
}

async function measureSubtree(handle, options, scanState) {
  let total = 0;
  let entryCount = 1;
  let entries;
  try {
    entries = [];
    for await (const child of handle.values()) entries.push(child);
  } catch {
    scanState.permissionErrors += 1;
    return [0, entryCount];
  }

  for (const child of entries) {
    if (scanState.entries >= options.maxEntries) {
      scanState.truncated = true;
      break;
    }
    if (!options.includeHidden && child.name.startsWith(".")) {
      scanState.skippedHidden += 1;
      continue;
    }
    scanState.entries += 1;
    entryCount += 1;
    if (child.kind === "directory") {
      const [childTotal, childEntries] = await measureSubtree(child, options, scanState);
      total += childTotal;
      entryCount += Math.max(0, childEntries - 1);
    } else {
      try {
        const file = await child.getFile();
        total += file.size;
      } catch {
        scanState.permissionErrors += 1;
      }
    }
    await maybeYield(scanState);
  }
  return [total, entryCount];
}

function classify(name, lowerPath, ext, isDir, size) {
  let kind = isDir ? "folder" : "file";
  const flags = [];
  let score = 0;

  if (isDir && CACHE_DIRS.has(name)) {
    kind = "cache";
    flags.push("cache");
    score += 4;
  }
  if (isDir && DEV_DIRS.has(name)) {
    kind = "dev-artifact";
    flags.push("developer artifact");
    score += 3;
  }
  if (lowerPath.includes("/library/caches/") || lowerPath.endsWith("/library/caches")) {
    kind = "cache";
    flags.push("cache");
    score += 4;
  }
  if (lowerPath.includes("/downloads/")) {
    flags.push("download");
    score += 1;
  }
  if (!isDir && ARCHIVE_EXTS.has(ext)) {
    kind = "archive";
    flags.push("archive/installer");
    score += 3;
  }
  if (!isDir && MEDIA_EXTS.has(ext)) {
    kind = "media";
    flags.push("large media");
    score += 1;
  }
  if (!isDir && IMAGE_EXTS.has(ext)) {
    kind = "image";
  }
  if (!isDir && DOC_EXTS.has(ext)) {
    kind = "document";
  }
  if (lowerPath.includes("xcode/deriveddata")) {
    kind = "dev-artifact";
    flags.push("Xcode DerivedData");
    score += 4;
  }
  if (lowerPath.includes("/trash/") || lowerPath.includes("/.trash/")) {
    flags.push("trash");
    score += 5;
  }
  if (size >= 5 * 1024 ** 3) {
    flags.push("very large");
    score += 3;
  } else if (size >= 1024 ** 3) {
    flags.push("large");
    score += 2;
  }

  return { kind, flags: [...new Set(flags)].sort(), score };
}

function collectCandidates(root) {
  const items = [];
  const walk = (node) => {
    const size = node.size || 0;
    const score = node.score || 0;
    if (size >= 300 * 1024 ** 2 || score >= 3) {
      items.push({
        name: node.name,
        path: node.path,
        displayPath: node.displayPath,
        size,
        kind: node.kind,
        isDir: node.isDir,
        flags: node.flags || [],
        score,
        modified: node.modified,
      });
    }
    for (const child of node.children || []) walk(child);
  };
  walk(root);
  items.sort((a, b) => b.score - a.score || b.size - a.size);
  return items.slice(0, 120);
}

function placeholderNode(relPath, error, isDir = true) {
  const name = relPath.split("/").pop() || relPath;
  return {
    name,
    path: relPath,
    displayPath: relPath,
    size: 0,
    kind: isDir ? "folder" : "file",
    isDir,
    modified: null,
    flags: [],
    score: 0,
    children: [],
    entryCount: 1,
    error,
  };
}

function extensionOf(name) {
  const index = String(name || "").lastIndexOf(".");
  return index > 0 ? name.slice(index).toLowerCase() : "";
}

function renderSummary() {
  const scanInfo = state.tree.scan || {};
  const warnings = [];
  if (scanInfo.permissionErrors) warnings.push(`${scanInfo.permissionErrors}개 항목은 읽지 못해 건너뜀`);
  if (scanInfo.truncated) warnings.push("항목 수 제한에 도달해 일부만 표시");
  if (scanInfo.skippedHidden) warnings.push(`숨김 항목 ${scanInfo.skippedHidden}개 제외`);

  els.summary.innerHTML = `
    <div class="metric-grid">
      <div class="metric"><span>총 크기</span><strong>${formatBytes(state.tree.size)}</strong></div>
      <div class="metric"><span>항목 수</span><strong>${formatNumber(scanInfo.entries || 0)}</strong></div>
      <div class="metric"><span>정리 후보</span><strong>${formatNumber((state.tree.candidates || []).length)}</strong></div>
      <div class="metric"><span>스캔 시간</span><strong>${formatMs(scanInfo.durationMs || 0)}</strong></div>
    </div>
    <div class="scan-note">${escapeHtml(scanInfo.displayRoot || state.tree.displayPath)}</div>
    ${warnings.length ? `<div class="scan-note">${warnings.map(escapeHtml).join(" · ")}</div>` : ""}
    ${serverMode && scanInfo.permissionErrors ? renderPermissionNotice(scanInfo) : ""}
  `;

  const permissionButton = els.summary.querySelector("#openPrivacyBtn");
  if (permissionButton) permissionButton.addEventListener("click", openPrivacySettings);
}

function renderPermissionNotice(scanInfo) {
  const paths = scanInfo.permissionPaths || [];
  const pathList = paths.length
    ? `<ul>${paths.slice(0, 5).map((path) => `<li>${escapeHtml(path)}</li>`).join("")}</ul>`
    : "";
  return `
    <div class="permission-card">
      <strong>일부 폴더를 읽지 못했습니다.</strong>
      <p>macOS 보호 폴더는 스캔하는 앱(터미널 등)에 전체 디스크 접근 권한이 있어야 정확히 읽힙니다. 설정을 연 뒤 권한을 켜고 다시 스캔하세요.</p>
      ${pathList}
      <button id="openPrivacyBtn" type="button">권한 설정 열기</button>
    </div>
  `;
}

function renderMindmap() {
  const svg = els.svg;
  svg.innerHTML = "";
  if (!state.tree) {
    els.breadcrumb.innerHTML = "";
    els.folderList.innerHTML = "";
    drawEmpty(svg);
    return;
  }
  const focusRoot = findNodeByPath(state.tree, state.focusPath) || state.tree;
  state.focusPath = focusRoot.path;
  const items = getLensItems(focusRoot);
  renderFolderPanel(focusRoot, items);
  renderBreadcrumb(focusRoot);

  const rect = svg.getBoundingClientRect();
  const width = Math.max(560, rect.width || 840);
  const height = Math.max(520, rect.height || 680);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  if (!items.length) {
    const text = svgEl("text", {
      x: width / 2,
      y: height / 2,
      "text-anchor": "middle",
      class: "empty-lens-text",
    });
    text.textContent = "표시할 하위 항목이 없습니다.";
    svg.append(text);
    renderDetail();
    renderFocusCrumb(focusRoot);
    return;
  }

  const defs = svgEl("defs");
  defs.append(
    radialGradient("bubbleGradient", "#f4fbf8", "#cfe5dc"),
    radialGradient("selectedBubbleGradient", "#e9f7fa", "#b7dfe6"),
    radialGradient("otherBubbleGradient", "#f0f1ee", "#d4d9d5"),
  );
  svg.append(defs);

  const bubbles = layoutBubbles(items, width, height);
  for (const bubble of bubbles) {
    svg.append(renderBubble(bubble));
  }
  renderDetail();
  renderFocusCrumb(focusRoot);
}

function getLensItems(root) {
  const limit = boundedNumber(els.visualChildren.value, 4, 30, 12);
  const allChildren = (root.children || []).filter((child) => (child.size || 0) > 0);
  const visible = allChildren.slice(0, limit);
  const hidden = allChildren.slice(limit);
  const hiddenSize = hidden.reduce((sum, child) => sum + (child.size || 0), 0) + (root.omittedSize || 0);
  const hiddenCount = hidden.length + (root.omittedCount || 0);
  const items = [...visible];
  if (hiddenCount > 0 && hiddenSize > 0) {
    items.push({
      name: "기타 항목",
      path: `${root.path}#other`,
      displayPath: root.displayPath,
      size: hiddenSize,
      kind: "folder",
      isDir: false,
      synthetic: true,
      flags: [`${formatNumber(hiddenCount)}개 묶음`],
      children: [],
    });
  }
  return items;
}

function renderFolderPanel(root, items) {
  els.folderHeading.innerHTML = `
    <div class="folder-icon">${root.isDir ? "□" : "◇"}</div>
    <div>
      <h2>${escapeHtml(root.name || root.path)}</h2>
      <p>${formatBytes(root.size || 0)} · ${formatNumber(root.childCount || root.entryCount || items.length)}개의 항목</p>
    </div>
  `;
  els.folderList.innerHTML = "";

  for (const [index, item] of items.entries()) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `folder-row ${state.selected?.path === item.path ? "active" : ""}`;
    row.style.animationDelay = `${Math.min(index * 24, 180)}ms`;
    const iconClass = item.synthetic ? "other" : item.isDir ? "folder" : "file";
    row.innerHTML = `
      <span class="row-check"></span>
      <span class="row-icon ${iconClass}">${item.synthetic ? "…" : item.isDir ? "" : ""}</span>
      <span class="row-name">${escapeHtml(item.name || item.path)}</span>
      <strong>${formatBytes(item.size || 0)}</strong>
    `;
    bindItemActions(row, item);
    els.folderList.append(row);
  }
}

function renderBreadcrumb(root) {
  const chain = [];
  let cursor = root;
  while (cursor) {
    chain.unshift(cursor);
    cursor = findParentByPath(state.tree, cursor.path);
  }

  els.breadcrumb.innerHTML = "";
  chain.forEach((node, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${index === 0 ? "▣" : "□"} ${node.name || node.path}`;
    button.addEventListener("click", () => {
      if (node.path === state.focusPath) return;
      state.history.push(state.focusPath);
      state.focusPath = node.path;
      state.selected = node;
      renderMindmap();
    });
    els.breadcrumb.append(button);
    if (index < chain.length - 1) {
      const sep = document.createElement("span");
      sep.textContent = "›";
      els.breadcrumb.append(sep);
    }
  });
}

function layoutBubbles(items, width, height) {
  const maxSize = Math.max(...items.map((item) => item.size || 1));
  const baseMaxRadius = Math.min(width, height) * (items.length <= 4 ? 0.2 : 0.16);
  const baseMinRadius = Math.max(38, Math.min(width, height) * 0.055);

  for (let scale = 1; scale >= 0.48; scale -= 0.06) {
    const placed = [];
    let failed = false;
    for (const [index, node] of items.entries()) {
      const weight = Math.sqrt((node.size || 1) / maxSize);
      const radius = Math.max(
        28,
        (baseMinRadius + weight * (baseMaxRadius - baseMinRadius)) * scale,
      );
      const bubble = findBubbleSpot(node, radius, index, placed, width, height);
      if (!bubble) {
        failed = true;
        break;
      }
      placed.push({ ...bubble, order: index });
    }
    if (!failed) return placed;
  }

  return compactFallbackLayout(items, width, height, maxSize);
}

function findBubbleSpot(node, radius, index, placed, width, height) {
  const margin = 18;
  const centerX = width * 0.5;
  const centerY = height * 0.48;

  if (index === 0) {
    return {
      node,
      x: Math.max(radius + margin, Math.min(width - radius - margin, centerX)),
      y: Math.max(radius + margin, Math.min(height - radius - margin, centerY)),
      r: radius,
      order: index,
    };
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const maxDistance = Math.hypot(width, height);
  for (let step = 1; step < 2400; step += 1) {
    const angle = step * goldenAngle;
    const distance = Math.sqrt(step) * (radius * 0.34 + 8);
    if (distance > maxDistance) break;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    if (x - radius < margin || x + radius > width - margin) continue;
    if (y - radius < margin || y + radius > height - margin) continue;
    const overlaps = placed.some(
      (other) => Math.hypot(x - other.x, y - other.y) < radius + other.r + 18,
    );
    if (!overlaps) return { node, x, y, r: radius, order: index };
  }
  return null;
}

function compactFallbackLayout(items, width, height, maxSize) {
  const gap = 18;
  const columns = Math.max(1, Math.ceil(Math.sqrt(items.length * (width / Math.max(height, 1)))));
  const rows = Math.ceil(items.length / columns);
  const cellWidth = (width - gap * (columns + 1)) / columns;
  const cellHeight = (height - gap * (rows + 1)) / rows;
  const maxRadius = Math.max(28, Math.min(cellWidth, cellHeight) * 0.36);
  const minRadius = Math.max(24, maxRadius * 0.62);

  return items.map((node, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const weight = Math.sqrt((node.size || 1) / maxSize);
    return {
      node,
      x: gap + column * (cellWidth + gap) + cellWidth / 2,
      y: gap + row * (cellHeight + gap) + cellHeight / 2,
      r: Math.max(minRadius, Math.min(maxRadius, minRadius + weight * (maxRadius - minRadius))),
      order: index,
    };
  });
}

function bindItemActions(element, node) {
  element.addEventListener("click", () => {
    clearPendingClick();
    state.clickTimer = window.setTimeout(() => {
      state.clickTimer = null;
      if (node.synthetic) {
        selectNode(node);
      } else if (node.isDir) {
        enterNode(node);
      } else {
        selectNode(node);
      }
    }, 180);
  });

  element.addEventListener("dblclick", () => {
    clearPendingClick();
    if (!node.synthetic) revealOrCopy(node.path);
  });
}

function clearPendingClick() {
  if (state.clickTimer) {
    window.clearTimeout(state.clickTimer);
    state.clickTimer = null;
  }
}

function renderBubble(bubble) {
  const group = svgEl("g", {
    class: `bubble ${state.selected?.path === bubble.node.path ? "active" : ""} ${bubble.node.synthetic ? "synthetic" : ""}`,
    transform: `translate(${bubble.x} ${bubble.y})`,
    style: `animation-delay: ${Math.min((bubble.order || 0) * 26, 220)}ms`,
  });
  bindItemActions(group, bubble.node);

  const title = svgEl("title");
  title.textContent = `${bubble.node.name || bubble.node.path} · ${formatBytes(bubble.node.size || 0)}`;
  const circle = svgEl("circle", {
    class: "bubble-circle",
    cx: 0,
    cy: 0,
    r: bubble.r,
    fill: bubble.node.synthetic ? "url(#otherBubbleGradient)" : state.selected?.path === bubble.node.path ? "url(#selectedBubbleGradient)" : "url(#bubbleGradient)",
  });
  group.append(title, circle);

  if (bubble.node.isDir && !bubble.node.synthetic) {
    group.append(drawFolderIcon(-bubble.r * 0.28, -bubble.r * 0.35, bubble.r * 0.56));
  } else if (!bubble.node.synthetic) {
    group.append(drawFileIcon(-bubble.r * 0.14, -bubble.r * 0.4, bubble.r * 0.36));
  } else {
    const dot = svgEl("circle", { class: "other-dot", cx: 0, cy: -bubble.r * 0.18, r: bubble.r * 0.16 });
    group.append(dot);
  }

  const labelFontSize = Math.max(10, Math.min(18, bubble.r * 0.18));
  const sizeFontSize = Math.max(10, Math.min(15, bubble.r * 0.15));
  const name = svgEl("text", {
    class: "bubble-label",
    x: 0,
    y: bubble.r * 0.36,
    "text-anchor": "middle",
    style: `font-size: ${labelFontSize}px`,
  });
  const nameLines = bubbleLabelLines(bubble.node.name || bubble.node.path, bubble.r);
  nameLines.forEach((line, index) => {
    const tspan = svgEl("tspan", {
      x: 0,
      dy: index === 0 ? 0 : labelFontSize * 1.05,
    });
    tspan.textContent = line;
    name.append(tspan);
  });
  const size = svgEl("text", {
    class: "bubble-size",
    x: 0,
    y: bubble.r * 0.62,
    "text-anchor": "middle",
    style: `font-size: ${sizeFontSize}px`,
  });
  size.textContent = formatBytes(bubble.node.size || 0);
  group.append(name, size);
  return group;
}

function bubbleLabelLines(text, radius) {
  const clean = String(text || "");
  const maxChars = Math.max(5, Math.floor(radius / 5.2));
  const truncated = truncateMiddle(clean, maxChars * 2);
  if (truncated.length <= maxChars) return [truncated];

  const middle = Math.ceil(truncated.length / 2);
  let splitAt = truncated.lastIndexOf(" ", middle);
  if (splitAt < Math.floor(maxChars * 0.45)) splitAt = middle;
  const first = truncated.slice(0, splitAt).trim();
  const second = truncated.slice(splitAt).trim();
  return [truncateMiddle(first, maxChars), truncateMiddle(second, maxChars)];
}

function radialGradient(id, inner, outer) {
  const gradient = svgEl("radialGradient", { id, cx: "36%", cy: "28%", r: "78%" });
  gradient.append(svgEl("stop", { offset: "0%", "stop-color": inner }));
  gradient.append(svgEl("stop", { offset: "100%", "stop-color": outer }));
  return gradient;
}

function drawFolderIcon(x, y, width) {
  const height = width * 0.58;
  const group = svgEl("g", { class: "bubble-folder-icon", transform: `translate(${x} ${y})` });
  group.append(
    svgEl("path", {
      d: `M 0 ${height * 0.18} Q 0 0 ${height * 0.18} 0 H ${width * 0.38} Q ${width * 0.48} 0 ${width * 0.54} ${height * 0.14} H ${width * 0.82} Q ${width} ${height * 0.14} ${width} ${height * 0.32} V ${height * 0.82} Q ${width} ${height} ${width * 0.82} ${height} H ${height * 0.18} Q 0 ${height} 0 ${height * 0.82} Z`,
    }),
  );
  return group;
}

function drawFileIcon(x, y, width) {
  const height = width * 1.28;
  const fold = width * 0.28;
  const group = svgEl("g", { class: "bubble-file-icon", transform: `translate(${x} ${y})` });
  group.append(
    svgEl("path", {
      d: `M 0 0 H ${width - fold} L ${width} ${fold} V ${height} H 0 Z`,
    }),
    svgEl("path", {
      d: `M ${width - fold} 0 V ${fold} H ${width}`,
      class: "file-fold",
    }),
  );
  return group;
}

function selectNode(node) {
  state.selected = node;
  renderMindmap();
}

function enterNode(node) {
  if (node.synthetic || !node?.isDir) return;
  if (node.isDir && findNodeByPath(state.tree, node.path)) {
    if (state.focusPath !== node.path) state.history.push(state.focusPath);
    transitionToNode(node, "forward");
  }
}

function renderCandidates() {
  const candidates = state.tree?.candidates || [];
  if (!candidates.length) {
    els.candidateList.innerHTML = `<div class="empty-copy">아직 정리 후보가 없습니다.</div>`;
    return;
  }
  els.candidateList.innerHTML = "";
  for (const candidate of candidates) {
    const card = document.createElement("article");
    card.className = "candidate";
    const badges = (candidate.flags || []).map((flag) => {
      const warning = ["cache", "archive/installer", "developer artifact", "trash"].includes(flag);
      return `<span class="badge ${warning ? "warn" : ""}">${escapeHtml(flag)}</span>`;
    });
    card.innerHTML = `
      <div class="candidate-row">
        <h3>${escapeHtml(candidate.name || candidate.path)}</h3>
        <strong>${formatBytes(candidate.size)}</strong>
      </div>
      <div class="candidate-meta">${escapeHtml(candidate.displayPath || candidate.path)}</div>
      <div class="badge-row">${badges.join("") || `<span class="badge">${escapeHtml(candidate.kind)}</span>`}</div>
      <div class="candidate-row">
        <span class="candidate-meta">${candidate.isDir ? "Folder" : "File"} · ${formatDate(candidate.modified)}</span>
        <button type="button">${serverMode ? revealShort() : "경로 복사"}</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => revealOrCopy(candidate.path));
    card.addEventListener("click", (event) => {
      if (event.target.tagName === "BUTTON") return;
      state.selected = candidate;
      renderDetail();
    });
    els.candidateList.append(card);
  }
}

function renderDetail() {
  const node = state.selected;
  els.reveal.disabled = !node || node.synthetic;
  els.focus.disabled = !canFocusNode(node);
  els.focusUp.disabled = !state.tree || !state.focusPath || state.focusPath === state.tree.path;
  if (!node) {
    const tail = serverMode ? revealHint() : "더블클릭하면 경로가 복사됩니다";
    els.detail.querySelector("div").innerHTML = `
      <strong>선택된 항목 없음</strong>
      <span>폴더는 한 번 클릭하면 들어가고, ${tail}.</span>
    `;
    return;
  }
  const flags = node.flags && node.flags.length ? ` · ${node.flags.join(", ")}` : "";
  els.detail.querySelector("div").innerHTML = `
    <strong>${escapeHtml(node.name || node.path)} · ${formatBytes(node.size || 0)}</strong>
    <span>${escapeHtml(node.displayPath || node.path)}${escapeHtml(flags)}</span>
  `;
}

// 서버 모드면 Finder에서 위치를 열고, 아니면 경로를 클립보드에 복사합니다.
async function revealOrCopy(path) {
  if (!path) return;
  if (serverMode) {
    try {
      await fetch(`/api/reveal?${new URLSearchParams({ path }).toString()}`, { cache: "no-store" });
      const where = serverPlatform === "win32" ? "탐색기" : serverPlatform === "darwin" ? "Finder" : "파일 위치";
      showToast(`${where}에서 열었습니다`);
    } catch {
      showToast("열 수 없습니다");
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(path);
    showToast("경로를 복사했습니다");
  } catch {
    showToast("복사할 수 없습니다");
  }
}

async function openPrivacySettings() {
  try {
    await fetch("/api/open-privacy", { cache: "no-store" });
  } catch {
    showToast("설정을 열 수 없습니다");
  }
}

// 로컬 서버를 종료하고 안내 화면으로 전환합니다.
async function quitApp() {
  try {
    await fetch("/api/quit", { cache: "no-store" });
  } catch {
    // 서버가 이미 종료되며 응답이 끊길 수 있으므로 무시합니다.
  }
  const shell = document.querySelector(".app-shell");
  if (shell) {
    shell.innerHTML = `
      <div class="quit-screen">
        <h1>DiskMap을 종료했습니다.</h1>
        <p>이 탭(창)을 닫으세요. 다시 사용하려면 DiskMap을 한 번 더 실행하면 됩니다.</p>
      </div>
    `;
  }
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("show");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 1600);
}

function setTab(tab) {
  state.activeTab = tab;
  const isMindmap = tab === "mindmap";
  els.mindmapView.classList.toggle("hidden", !isMindmap);
  els.listView.classList.toggle("hidden", isMindmap);
  els.mindmapTab.classList.toggle("active", isMindmap);
  els.listTab.classList.toggle("active", !isMindmap);
}

function setLoading(isLoading) {
  els.loading.classList.toggle("hidden", !isLoading);
  els.scan.disabled = isLoading;
}

function focusParent() {
  if (!state.tree || !state.focusPath || state.focusPath === state.tree.path) return;
  const parent = findParentByPath(state.tree, state.focusPath);
  state.history.push(state.focusPath);
  transitionToNode(parent || state.tree, "back");
}

function goBack() {
  if (!state.history.length) return;
  const previous = state.history.pop();
  const node = findNodeByPath(state.tree, previous);
  if (!node) return;
  transitionToNode(node, "back");
}

function goRoot() {
  if (!state.tree) return;
  if (state.focusPath !== state.tree.path) state.history.push(state.focusPath);
  transitionToNode(state.tree, "back");
}

function transitionToNode(node, direction = "forward") {
  if (!node) return;

  const stage = els.mindmapView;
  const dirClass = direction === "back" ? "lens-back" : "lens-forward";
  stage.classList.remove("lens-enter", "lens-exit", "lens-forward", "lens-back");
  // 강제 리플로우로 같은 애니메이션이 매번 다시 재생되도록 합니다.
  void stage.offsetWidth;
  stage.classList.add("lens-exit", dirClass);
  window.setTimeout(() => {
    state.focusPath = node.path;
    state.selected = node;
    state.zoom = 1;
    renderMindmap();
    renderDetail();
    stage.classList.remove("lens-exit");
    void stage.offsetWidth;
    stage.classList.add("lens-enter", dirClass);
    window.setTimeout(() => {
      stage.classList.remove("lens-enter", "lens-forward", "lens-back");
    }, 320);
  }, 200);
}

function drawEmpty(svg) {
  const width = Math.max(720, svg.getBoundingClientRect().width || 960);
  const height = Math.max(560, svg.getBoundingClientRect().height || 720);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const text = svgEl("text", {
    x: width / 2,
    y: height / 2,
    "text-anchor": "middle",
    class: "node-label",
  });
  text.textContent = "스캔할 폴더를 선택하세요.";
  svg.append(text);
}

function renderFocusCrumb(focusRoot) {
  const focused = state.focusPath && state.tree && state.focusPath !== state.tree.path;
  els.focusUp.disabled = !focused;
  els.zoomOut.disabled = !state.history.length;
  els.resetView.disabled = !focused;
  if (!state.selected && focusRoot) state.selected = focusRoot;
}

function findNodeByPath(root, path) {
  if (!root || !path) return null;
  if (root.path === path) return root;
  for (const child of root.children || []) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }
  return null;
}

function findParentByPath(root, path, parent = null) {
  if (!root || !path) return null;
  if (root.path === path) return parent;
  for (const child of root.children || []) {
    const found = findParentByPath(child, path, root);
    if (found) return found;
  }
  return null;
}

function canFocusNode(node) {
  return Boolean(node?.isDir && !node.synthetic && findNodeByPath(state.tree, node.path));
}

function boundedNumber(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatMs(ms) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatDate(timestamp) {
  if (!timestamp) return "unknown";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(timestamp * 1000));
}

function truncateMiddle(text, limit) {
  if (!text || text.length <= limit) return text || "";
  const left = Math.ceil((limit - 1) / 2);
  const right = Math.floor((limit - 1) / 2);
  return `${text.slice(0, left)}…${text.slice(text.length - right)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
