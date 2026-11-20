const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const xmlFormat = require('xml-formatter');
const hljs = require('highlight.js/lib/core');
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'));

let panel;
let latestXml = '';
let latestFileName = '';

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const handler = function () {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      latestFileName = path.basename(editor.document.fileName);
      latestXml = editor.document.getText();
    }
    if (panel) {
      panel.reveal(vscode.ViewColumn.Beside);
    } else {
      panel = createWebviewPanel(context);
    }
    updatePrettifiedXML();
  };
  const openCmd = vscode.commands.registerCommand("xmlVisualPreview.open", handler);
  const legacyCmd = vscode.commands.registerCommand("prettyXmlPreview.open", handler);
  context.subscriptions.push(legacyCmd);

  context.subscriptions.push(openCmd);

  // Auto update when user switches editor
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!panel || !editor || !editor.document) return;
    const fn = editor.document.fileName.toLowerCase();
    if (fn.endsWith('.xml') || fn.endsWith('.dtd') || editor.document.languageId === 'xml') {
      latestFileName = path.basename(editor.document.fileName);
      latestXml = editor.document.getText();
      updatePrettifiedXML();
    }
  }, null, context.subscriptions);

  // Update when user edits document
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (!panel) return;
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document === e.document) {
      const fn = e.document.fileName.toLowerCase();
      if (fn.endsWith('.xml') || fn.endsWith('.dtd') || e.document.languageId === 'xml') {
        latestFileName = path.basename(e.document.fileName);
        latestXml = e.document.getText();
        updatePrettifiedXML();
      }
    }
  }, null, context.subscriptions);
}

function deactivate() {}

function updatePrettifiedXML() {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document) {
    const fn = editor.document.fileName.toLowerCase();
    if (fn.endsWith('.xml') || fn.endsWith('.dtd') || editor.document.languageId === 'xml') {
      latestFileName = path.basename(editor.document.fileName);
      latestXml = editor.document.getText();
    }
  }

  if (!panel) return;

  const rawXml = latestXml || '';
  let formattedXml = rawXml;
  try {
    formattedXml = xmlFormat(rawXml, { indentation: '  ', collapseContent: true });
  } catch (e) {
    formattedXml = rawXml;
  }

  panel.webview.html = getWebviewHtml(rawXml, formattedXml, latestFileName || 'XML Document');
}

function createWebviewPanel(context) {
  let newPanel = vscode.window.createWebviewPanel(
    'prettyXmlPreview',
    'XML Preview',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  newPanel.onDidDispose(() => {
    panel = undefined;
  }, null, context.subscriptions);

  return newPanel;
}

function getWebviewHtml(rawXml, formattedXml, fileName) {
  // Generate highlighted code for the code tab
  let codeHighlight = '';
  try {
    codeHighlight = hljs.highlight(formattedXml, { language: 'xml' }).value;
  } catch (e) {
    codeHighlight = formattedXml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Safe JSON serialization of the XML string
  const safeXmlJson = JSON.stringify(rawXml);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XML Preview: ${fileName}</title>
  <style>
    :root {
      --bg: #1e1e24;
      --card-bg: #26262e;
      --card-border: #3b3b47;
      --card-hover: #2f2f3a;
      --text: #e1e1e6;
      --text-muted: #9e9ea7;
      --primary: #4f8cf6;
      --primary-light: rgba(79, 140, 246, 0.12);
      --badge-bg: #353542;
      --badge-text: #68d391;
      --accent: #ed64a6;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.5;
      padding: 0;
      margin: 0;
    }

    /* Sticky Toolbar */
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(30, 30, 36, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--card-border);
      padding: 8px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }
    .file-title {
      font-weight: 600;
      font-size: 13px;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .view-switcher {
      display: flex;
      background: #18181c;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
    }
    .view-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .view-btn:hover { color: var(--text); }
    .view-btn.active {
      background: var(--primary);
      color: #fff;
    }
    .search-box {
      margin-left: auto;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-box input {
      background: #18181c;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      color: var(--text);
      padding: 4px 10px 4px 26px;
      font-size: 12px;
      width: 180px;
      transition: width 0.2s ease, border-color 0.2s;
    }
    .search-box input:focus {
      outline: none;
      border-color: var(--primary);
      width: 240px;
    }
    .search-icon {
      position: absolute;
      left: 8px;
      color: var(--text-muted);
      font-size: 11px;
      pointer-events: none;
    }
    .action-btn {
      background: #2b2b35;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
    }
    .action-btn:hover { color: var(--text); background: var(--card-hover); }

    /* Main Container */
    .main-content {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* VIEW 1: UI / CARDS VIEW (NO RAW TAGS!) */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
      transition: border-color 0.15s ease;
    }
    .card:hover {
      border-color: #4a4a5a;
    }
    .card-header {
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .card-header .toggle-icon {
      font-size: 10px;
      color: var(--text-muted);
      transition: transform 0.2s;
    }
    .card-header.collapsed .toggle-icon {
      transform: rotate(-90deg);
    }
    .card-title {
      font-weight: 600;
      font-size: 13px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-left: auto;
    }
    .badge {
      background: var(--badge-bg);
      color: var(--badge-text);
      font-size: 11px;
      font-weight: 500;
      padding: 2px 7px;
      border-radius: 4px;
      font-family: var(--font-mono);
    }
    .badge.cat {
      background: rgba(79, 140, 246, 0.15);
      color: var(--primary);
    }
    .badge.id {
      background: rgba(237, 100, 166, 0.15);
      color: var(--accent);
    }
    .card-body {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .card-header.collapsed + .card-body {
      display: none;
    }

    /* Key - Value Rows */
    .kv-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .kv-row:last-child { border-bottom: none; }
    .kv-key {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      min-width: 130px;
      max-width: 200px;
      word-break: break-word;
      text-transform: capitalize;
    }
    .kv-val {
      font-size: 13px;
      color: var(--text);
      flex: 1;
      word-break: break-word;
      line-height: 1.6;
    }
    .kv-val a {
      color: var(--primary);
      text-decoration: underline;
    }
    .kv-val p {
      margin-bottom: 4px;
    }

    /* Subcards / Nested Lists */
    .item-card {
      background: #202028;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-left: 3px solid var(--primary);
      border-radius: 6px;
      padding: 10px 12px;
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .item-card.danger { border-left-color: #f56565; }
    .item-card.warning { border-left-color: #ecc94b; }
    .item-card.success { border-left-color: #48bb78; }

    /* VIEW 2: TREE VIEW */
    .tree-node {
      margin-left: 16px;
      border-left: 1px dashed rgba(255, 255, 255, 0.1);
      padding-left: 8px;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.8;
    }
    .tree-header {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 1px 4px;
      border-radius: 4px;
    }
    .tree-header:hover {
      background: var(--card-hover);
    }
    .tree-tag-name {
      color: var(--primary);
      font-weight: 600;
    }
    .tree-val {
      color: #9ae6b4;
    }
    .tree-attr {
      color: #ecc94b;
      font-size: 11px;
    }

    /* VIEW 3: RAW CODE */
    pre code {
      display: block;
      padding: 16px;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.6;
      background: #18181c;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      color: #d4d4d4;
    }
    .hljs-tag, .hljs-name { color: #569cd6; }
    .hljs-attr { color: #9cdcfe; }
    .hljs-string { color: #ce9178; }
    .hljs-comment { color: #6a9955; font-style: italic; }

    .hidden { display: none !important; }
  </style>
</head>
<body>

  <!-- Top Toolbar -->
  <div class="toolbar">
    <div class="file-title">
      <span>📄</span>
      <span>${fileName}</span>
    </div>

    <div class="view-switcher">
      <button class="view-btn active" id="btn-ui" onclick="switchView('ui')">🎨 Giao diện (UI)</button>
      <button class="view-btn" id="btn-tree" onclick="switchView('tree')">🌳 Cây phân cấp</button>
      <button class="view-btn" id="btn-code" onclick="switchView('code')">💻 Mã XML</button>
    </div>

    <button class="action-btn" onclick="toggleAllCards()">Mở/Thu gọn tất cả</button>

    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="searchInput" placeholder="Tìm kiếm nội dung..." oninput="handleSearch(this.value)">
    </div>
  </div>

  <!-- Content Container -->
  <div class="main-content">
    <!-- UI View Pane -->
    <div id="pane-ui">
      <div id="uiContainer">
        <div style="color: var(--text-muted); text-align: center; padding: 40px;">Đang tải và kết xuất giao diện...</div>
      </div>
    </div>

    <!-- Tree View Pane -->
    <div id="pane-tree" class="hidden">
      <div id="treeContainer" style="background: var(--card-bg); padding: 16px; border-radius: 8px; border: 1px solid var(--card-border);"></div>
    </div>

    <!-- Code View Pane -->
    <div id="pane-code" class="hidden">
      <pre><code class="hljs">${codeHighlight}</code></pre>
    </div>
  </div>

  <script>
    const rawXmlData = ${safeXmlJson};
    let allCollapsed = false;

    function switchView(viewName) {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('pane-ui').classList.add('hidden');
      document.getElementById('pane-tree').classList.add('hidden');
      document.getElementById('pane-code').classList.add('hidden');

      if (viewName === 'ui') {
        document.getElementById('btn-ui').classList.add('active');
        document.getElementById('pane-ui').classList.remove('hidden');
      } else if (viewName === 'tree') {
        document.getElementById('btn-tree').classList.add('active');
        document.getElementById('pane-tree').classList.remove('hidden');
      } else if (viewName === 'code') {
        document.getElementById('btn-code').classList.add('active');
        document.getElementById('pane-code').classList.remove('hidden');
      }
    }

    // Helper: format tag names (e.g. data_source -> Data Source)
    function formatLabel(tag) {
      if (!tag) return '';
      return tag.replace(/_/g, ' ').replace(/-/g, ' ');
    }

    // Parse and render XML to UI (without any raw tags!)
    function renderXmlToUi() {
      const container = document.getElementById('uiContainer');
      if (!rawXmlData || !rawXmlData.trim()) {
        container.innerHTML = '<div style="color: var(--text-muted); padding: 40px; text-align: center;">Tệp XML rỗng hoặc không có dữ liệu.</div>';
        return;
      }

      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rawXmlData, "text/xml");

        const parseErr = xmlDoc.querySelector("parsererror");
        if (parseErr) {
          container.innerHTML = '<div style="color: #f56565; padding: 20px; background: rgba(245,101,101,0.1); border-radius: 6px;">' +
            '<strong>Cảnh báo cú pháp XML:</strong> ' + parseErr.textContent +
            '<br/><br/><button class="action-btn" onclick="switchView(\\'code\\')">Xem mã thô</button></div>';
          return;
        }

        const root = xmlDoc.documentElement;
        let html = '';

        // Render root header
        html += '<div class="card" style="border-left: 4px solid var(--primary);">';
        html += '<div class="card-header">';
        html += '<span class="card-title">🚀 ' + formatLabel(root.tagName).toUpperCase() + '</span>';
        
        // Attributes as badges
        if (root.attributes && root.attributes.length > 0) {
          html += '<div class="card-badges">';
          for (let attr of root.attributes) {
            html += '<span class="badge cat">' + attr.name + ': ' + attr.value + '</span>';
          }
          html += '</div>';
        }
        html += '</div>';
        html += '<div class="card-body">';

        // Render direct children of root
        for (let child of root.children) {
          html += renderNodeToUi(child, 1);
        }

        html += '</div></div>';
        container.innerHTML = html;

        // Also build tree
        renderTree(root);

      } catch (err) {
        container.innerHTML = '<div style="color: #f56565; padding: 20px;">Lỗi kết xuất giao diện: ' + err.message + '</div>';
      }
    }

    function renderNodeToUi(node, depth) {
      const tag = node.tagName;
      const childElements = Array.from(node.children);
      const isLeaf = childElements.length === 0;

      // Leaf Node (Only contains text)
      if (isLeaf) {
        const text = node.textContent.trim();
        if (!text) return '';

        let valHtml = '';
        if (text.startsWith('http://') || text.startsWith('https://')) {
          valHtml = '<a href="' + text + '" target="_blank">' + text + '</a>';
        } else if (text.length > 100) {
          valHtml = '<div style="background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 4px; border-left: 2px solid var(--primary); white-space: pre-wrap;">' + text + '</div>';
        } else {
          valHtml = '<span>' + text + '</span>';
        }

        return '<div class="kv-row searchable-item">' +
          '<span class="kv-key">' + formatLabel(tag) + '</span>' +
          '<div class="kv-val">' + valHtml + '</div>' +
          '</div>';
      }

      // Container Node (Has child elements)
      let attrsHtml = '';
      if (node.attributes && node.attributes.length > 0) {
        for (let attr of node.attributes) {
          const cls = attr.name.toLowerCase().includes('id') ? 'id' : 'cat';
          attrsHtml += '<span class="badge ' + cls + '">' + attr.name + ': ' + attr.value + '</span> ';
        }
      }

      let html = '<div class="card searchable-item" style="margin-top: 8px;">';
      html += '<div class="card-header" onclick="toggleCard(this)">';
      html += '<span class="toggle-icon">▼</span>';
      html += '<span class="card-title">' + formatLabel(tag) + '</span>';
      if (attrsHtml) {
        html += '<div class="card-badges">' + attrsHtml + '</div>';
      }
      html += '</div>';

      html += '<div class="card-body">';
      for (let c of childElements) {
        html += renderNodeToUi(c, depth + 1);
      }
      html += '</div></div>';

      return html;
    }

    function toggleCard(headerEl) {
      headerEl.classList.toggle('collapsed');
    }

    function toggleAllCards() {
      allCollapsed = !allCollapsed;
      document.querySelectorAll('.card-header').forEach(h => {
        if (allCollapsed) h.classList.add('collapsed');
        else h.classList.remove('collapsed');
      });
    }

    // Interactive Tree View
    function renderTree(root) {
      const treeContainer = document.getElementById('treeContainer');
      function walk(node) {
        const hasChildren = node.children && node.children.length > 0;
        let attrs = '';
        if (node.attributes) {
          for (let a of node.attributes) {
            attrs += ' <span class="tree-attr">' + a.name + '="' + a.value + '"</span>';
          }
        }
        let h = '<div class="tree-node">';
        h += '<div class="tree-header" onclick="toggleTree(this)">';
        h += hasChildren ? '<span class="toggle-icon" style="color:#888;">▼</span> ' : '• ';
        h += '<span class="tree-tag-name">' + node.tagName + '</span>' + attrs;
        if (!hasChildren && node.textContent.trim()) {
          h += ': <span class="tree-val">' + node.textContent.trim().substring(0, 80) + '</span>';
        }
        h += '</div>';

        if (hasChildren) {
          h += '<div class="tree-children">';
          for (let c of node.children) {
            h += walk(c);
          }
          h += '</div>';
        }
        h += '</div>';
        return h;
      }
      treeContainer.innerHTML = walk(root);
    }

    function toggleTree(headerEl) {
      const children = headerEl.parentElement.querySelector('.tree-children');
      const icon = headerEl.querySelector('.toggle-icon');
      if (children) {
        if (children.style.display === 'none') {
          children.style.display = 'block';
          if (icon) icon.textContent = '▼';
        } else {
          children.style.display = 'none';
          if (icon) icon.textContent = '▶';
        }
      }
    }

    // Search filter
    function handleSearch(q) {
      const needle = q.trim().toLowerCase();
      document.querySelectorAll('.searchable-item').forEach(el => {
        if (!needle) {
          el.style.display = '';
        } else {
          const text = el.textContent.toLowerCase();
          el.style.display = text.includes(needle) ? '' : 'none';
        }
      });
    }

    // Initialize UI on load
    renderXmlToUi();
  </script>
</body>
</html>`;
}

module.exports = {
  activate,
  deactivate
};
