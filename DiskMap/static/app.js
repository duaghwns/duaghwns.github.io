const state = {
  tree: null,
  selected: null,
  focusPath: null,
  history: [],
  clickTimer: null,
  zoom: 1,
  activeTab: "mindmap",
  presets: [],
};

const els = {
  path: document.querySelector("#pathInput"),
  depth: document.querySelector("#depthInput"),
  childLimit: document.querySelector("#childLimitInput"),
  visualChildren: document.querySelector("#visualChildrenInput"),
  hidden: document.querySelector("#hiddenInput"),
  scan: document.querySelector("#scanBtn"),
  presets: document.querySelector("#presets"),
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
  zoomIn: document.querySelector("#zoomInBtn"),
  zoomOut: document.querySelector("#zoomOutBtn"),
  resetView: document.querySelector("#resetViewBtn"),
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

init();

async function init() {
  bindEvents();
  await loadPresets();
}

function bindEvents() {
  els.scan.addEventListener("click", scan);
  els.path.addEventListener("keydown", (event) => {
    if (event.key === "Enter") scan();
  });
  els.reveal.addEventListener("click", () => {
    if (state.selected) revealPath(state.selected.path);
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
  els.zoomIn.addEventListener("click", focusParent);
  els.zoomOut.addEventListener("click", goBack);
  els.resetView.addEventListener("click", goRoot);
  window.addEventListener("resize", () => {
    if (state.tree) renderMindmap();
  });
}

async function loadPresets() {
  let data;
  try {
    const res = await fetch("/api/presets");
    data = await res.json();
  } catch {
    data = {
      presets: [
        { label: "Local app only", path: "~/Downloads" },
      ],
    };
    els.summary.innerHTML = `
      <div class="empty-copy">DiskMap은 로컬 파일을 읽는 도구라서 GitHub Pages에서는 스캔을 실행할 수 없습니다. 저장소를 내려받고 <code>python3 server.py</code>로 실행하세요.</div>
    `;
  }
  state.presets = data.presets || [];
  const homePreset = state.presets.find((item) => item.label === "Downloads") || state.presets[0];
  if (homePreset) els.path.value = homePreset.path;
  els.presets.innerHTML = "";
  for (const preset of state.presets) {
    const button = document.createElement("button");
    button.textContent = preset.label;
    button.addEventListener("click", () => {
      els.path.value = preset.path;
      scan();
    });
    els.presets.append(button);
  }
}

async function scan() {
  const path = els.path.value.trim();
  if (!path) return;
  setLoading(true);
  try {
    const params = new URLSearchParams({
      path,
      maxDepth: els.depth.value,
      childLimit: els.childLimit.value,
      hidden: els.hidden.checked ? "1" : "0",
    });
    const res = await fetch(`/api/scan?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Scan failed");
    state.tree = data;
    state.selected = data;
    state.focusPath = data.path;
    state.history = [];
    state.zoom = 1;
    renderSummary();
    renderCandidates();
    renderMindmap();
    renderDetail();
  } catch (error) {
    els.summary.innerHTML = `<div class="empty-copy">${escapeHtml(error.message)}</div>`;
  } finally {
    setLoading(false);
  }
}

function renderSummary() {
  const scanInfo = state.tree.scan || {};
  const warnings = [];
  if (scanInfo.permissionErrors) warnings.push(`${scanInfo.permissionErrors}개 위치는 권한 때문에 건너뜀`);
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
    ${scanInfo.permissionErrors ? renderPermissionNotice(scanInfo) : ""}
  `;
  const permissionButton = els.summary.querySelector("#openPrivacyBtn");
  if (permissionButton) {
    permissionButton.addEventListener("click", openPrivacySettings);
  }
}

function renderPermissionNotice(scanInfo) {
  const paths = scanInfo.permissionPaths || [];
  const pathList = paths.length
    ? `<ul>${paths.slice(0, 5).map((path) => `<li>${escapeHtml(path)}</li>`).join("")}</ul>`
    : "";
  return `
    <div class="permission-card">
      <strong>일부 폴더를 읽지 못했습니다.</strong>
      <p>macOS 보호 폴더는 파일을 읽는 앱에 권한을 줘야 정확히 스캔됩니다. 설정을 열고 Codex 또는 터미널 앱에 전체 디스크 접근 권한을 켠 뒤 다시 스캔하세요.</p>
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
    if (!node.synthetic) revealPath(node.path);
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
        <button type="button">Finder</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => revealPath(candidate.path));
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
    els.detail.querySelector("div").innerHTML = `
      <strong>선택된 항목 없음</strong>
      <span>폴더는 한 번 클릭하면 들어가고, 더블클릭하면 Finder에서 열립니다.</span>
    `;
    return;
  }
  const flags = node.flags && node.flags.length ? ` · ${node.flags.join(", ")}` : "";
  els.detail.querySelector("div").innerHTML = `
    <strong>${escapeHtml(node.name || node.path)} · ${formatBytes(node.size || 0)}</strong>
    <span>${escapeHtml(node.displayPath || node.path)}${escapeHtml(flags)}</span>
  `;
}

async function revealPath(path) {
  const params = new URLSearchParams({ path });
  await fetch(`/api/reveal?${params.toString()}`);
}

async function openPrivacySettings() {
  await fetch("/api/open-privacy");
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
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) {
    state.focusPath = node.path;
    state.selected = node;
    state.zoom = 1;
    renderMindmap();
    renderDetail();
    return;
  }

  const stage = els.mindmapView;
  stage.classList.remove("lens-enter", "lens-exit", "lens-forward", "lens-back");
  stage.classList.add("lens-exit", direction === "back" ? "lens-back" : "lens-forward");
  window.setTimeout(() => {
    state.focusPath = node.path;
    state.selected = node;
    state.zoom = 1;
    renderMindmap();
    renderDetail();
    stage.classList.remove("lens-exit");
    stage.classList.add("lens-enter", direction === "back" ? "lens-back" : "lens-forward");
    window.setTimeout(() => {
      stage.classList.remove("lens-enter", "lens-forward", "lens-back");
    }, 260);
  }, 140);
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

function maxVisibleDepth(root) {
  let max = 0;
  const visit = (node, depth) => {
    max = Math.max(max, depth);
    for (const child of node.children || []) visit(child, depth + 1);
  };
  visit(root, 0);
  return Math.min(max, 7);
}

function shouldShowLabel(item, nodeCount, rootSize, isSelected) {
  if (isSelected || item.depth === 0) return true;
  if (item.node.synthetic) return item.depth <= 2;
  const share = (item.node.size || 0) / rootSize;
  if (nodeCount > 120) return item.depth <= 1 || item.node.score >= 3 || share >= 0.08;
  if (nodeCount > 70) return item.depth <= 2 || item.node.score >= 3 || share >= 0.05;
  return item.depth <= 3 || item.r >= 18 || item.node.score >= 3;
}

function renderFocusCrumb(focusRoot) {
  const focused = state.focusPath && state.tree && state.focusPath !== state.tree.path;
  els.focusUp.disabled = !focused;
  els.zoomIn.disabled = !focused;
  els.zoomOut.disabled = !state.history.length;
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
