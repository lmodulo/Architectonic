#!/usr/bin/env node
/**
 * docs.js — Architectonic documentation generator
 *
 * Usage:
 *   node docs.js                  # → docs/ in repo root
 *   node docs.js --out ./my-docs  # custom output directory
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCAFFOLD    = path.join(__dirname, 'example');
const MODULES_DIR = path.join(__dirname, 'modules');
const THEME_SRC   = path.join(__dirname, 'example/frontend/node_modules/@skeletonlabs/skeleton/src/themes/terminus.css');

const args   = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT    = outIdx !== -1 && args[outIdx + 1]
  ? path.resolve(args[outIdx + 1])
  : path.join(__dirname, 'docs');

// ── Module loader ──────────────────────────────────────────────────────────────

function loadModules() {
  if (!fs.existsSync(MODULES_DIR)) return [];
  return fs.readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(MODULES_DIR, e.name, 'module.json')))
    .map(e => ({
      name: e.name,
      mod:  JSON.parse(fs.readFileSync(path.join(MODULES_DIR, e.name, 'module.json'), 'utf8')),
    }));
}

// ── Markdown → HTML ────────────────────────────────────────────────────────────

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(text) {
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="sk-anchor">$1</a>')
    .replace(/\x00BLOCK(\d+)\x00/g, m => m);
}

function parseTableRow(line) {
  return line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}

function isTableSeparator(line) {
  return /^\|[\s|:\-]+\|$/.test(line.trim()) && line.includes('-');
}

function mdToHtml(src) {
  const blocks = [];

  // Extract fenced code blocks
  src = src.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = blocks.length;
    const cls  = lang ? ` class="language-${lang}"` : '';
    blocks.push(`<pre class="code-block"><code${cls}>${escHtml(code.trimEnd())}</code></pre>`);
    return `\x00BLOCK${idx}\x00`;
  });

  // Extract inline code
  src = src.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = blocks.length;
    blocks.push(`<code class="inline-code">${escHtml(code)}</code>`);
    return `\x00BLOCK${idx}\x00`;
  });

  const lines  = src.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Standalone block placeholder (fenced code block)
    if (/^\x00BLOCK\d+\x00$/.test(line.trim())) {
      output.push(line.trim());
      i++; continue;
    }

    // ATX heading
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const level = hm[1].length;
      const raw   = hm[2].replace(/\x00BLOCK\d+\x00/g, '');
      const id    = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      output.push(`<h${level} id="${id}" class="sk-heading sk-heading-${level}">${inline(hm[2])}</h${level}>`);
      i++; continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim()) || /^___+$/.test(line.trim())) {
      output.push('<hr class="sk-divider">');
      i++; continue;
    }

    // Blockquote (single-level, no recursion)
    if (line.startsWith('> ')) {
      const bqLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        bqLines.push(inline(lines[i].slice(2)));
        i++;
      }
      output.push(`<blockquote class="sk-blockquote"><p>${bqLines.join(' ')}</p></blockquote>`);
      continue;
    }

    // Table (header row followed by separator)
    if (line.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerCells = parseTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      let t = '<table class="sk-table"><thead><tr>';
      for (const cell of headerCells) t += `<th>${inline(cell)}</th>`;
      t += '</tr></thead><tbody>';
      for (const row of rows) {
        t += '<tr>';
        for (const cell of row) t += `<td>${inline(cell)}</td>`;
        t += '</tr>';
      }
      t += '</tbody></table>';
      output.push(t);
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*+]\s/, ''))}</li>`);
        i++;
      }
      output.push(`<ul class="sk-list">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s/, ''))}</li>`);
        i++;
      }
      output.push(`<ol class="sk-list-ordered">${items.join('')}</ol>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Paragraph
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !lines[i].startsWith('|') &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^\*\*\*+$/.test(lines[i].trim()) &&
      !/^\x00BLOCK\d+\x00$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      output.push(`<p class="sk-para">${inline(paraLines.join(' '))}</p>`);
    }
  }

  let html = output.join('\n');
  html = html.replace(/\x00BLOCK(\d+)\x00/g, (_, n) => blocks[+n]);
  return html;
}

// ── Stylesheet ─────────────────────────────────────────────────────────────────

const STYLE_CSS = `
/* === Layout === */
html, body { min-height: 100vh; margin: 0; padding: 0; }
body {
  display: flex;
  background-color: var(--body-background-color);
  color: var(--base-font-color);
  font-family: var(--base-font-family);
  letter-spacing: var(--base-letter-spacing);
}
html.dark body {
  background-color: var(--body-background-color-dark);
  color: var(--base-font-color-dark);
}

/* === Sidebar === */
.sidebar {
  width: 240px;
  min-height: 100vh;
  flex-shrink: 0;
  padding: 1.5rem 0 2rem;
  background-color: var(--color-surface-100);
  border-right: 1px solid var(--color-surface-200);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
}
html.dark .sidebar {
  background-color: var(--color-surface-900);
  border-right-color: var(--color-surface-800);
}
.sidebar-brand {
  padding: 0 1.25rem 1.25rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-surface-200);
}
html.dark .sidebar-brand { border-bottom-color: var(--color-surface-800); }
.sidebar-brand-name {
  font-family: var(--heading-font-family);
  font-weight: bold;
  font-size: 1rem;
  letter-spacing: var(--heading-letter-spacing);
  color: var(--color-surface-950);
}
html.dark .sidebar-brand-name { color: var(--color-surface-50); }
.sidebar-brand-sub {
  font-size: 0.7rem;
  color: var(--color-surface-500);
  margin-top: 0.15rem;
}
.nav-label {
  padding: 0.9rem 1.25rem 0.25rem;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-surface-500);
  font-weight: 600;
}
.nav-item {
  display: block;
  padding: 0.4rem 1.25rem;
  font-size: 0.875rem;
  color: var(--color-surface-700);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: background 0.12s, color 0.12s;
}
html.dark .nav-item { color: var(--color-surface-300); }
.nav-item:hover {
  background-color: color-mix(in srgb, var(--color-surface-500) 10%, transparent);
  color: var(--color-surface-950);
}
html.dark .nav-item:hover {
  color: var(--color-surface-50);
}
.nav-item.active {
  border-left-color: var(--color-primary-500);
  color: var(--color-primary-500);
  background-color: color-mix(in srgb, var(--color-primary-500) 8%, transparent);
  font-weight: 600;
}
.nav-sub .nav-item {
  font-size: 0.8rem;
  padding: 0.3rem 1.25rem 0.3rem 2rem;
}
.dark-toggle {
  margin: 1.25rem 1.25rem 0;
  padding: 0.35rem 0.75rem;
  width: calc(100% - 2.5rem);
  box-sizing: border-box;
  font-size: 0.75rem;
  border-radius: var(--radius-base);
  border: 1px solid var(--color-surface-300);
  background: transparent;
  color: var(--color-surface-600);
  cursor: pointer;
  text-align: center;
  font-family: var(--base-font-family);
  transition: opacity 0.12s;
}
html.dark .dark-toggle {
  border-color: var(--color-surface-700);
  color: var(--color-surface-400);
}
.dark-toggle:hover { opacity: 0.7; }

/* === Main content === */
.main {
  flex: 1;
  min-width: 0;
  padding: 2.5rem 3.5rem;
  max-width: 860px;
}

/* === Typography === */
.sk-heading {
  font-family: var(--heading-font-family);
  font-weight: bold;
  letter-spacing: var(--heading-letter-spacing);
  margin-top: 2.25rem;
  margin-bottom: 0.6rem;
  color: var(--color-surface-950);
}
html.dark .sk-heading { color: var(--color-surface-50); }
.sk-heading-1 { font-size: 2rem; margin-top: 0; border-bottom: 2px solid var(--color-surface-200); padding-bottom: 0.5rem; }
html.dark .sk-heading-1 { border-bottom-color: var(--color-surface-800); }
.sk-heading-2 { font-size: 1.4rem; }
.sk-heading-3 { font-size: 1.15rem; }
.sk-heading-4 { font-size: 1rem; }
.sk-para { margin: 0.7rem 0; line-height: 1.75; color: var(--color-surface-800); }
html.dark .sk-para { color: var(--color-surface-200); }
.sk-anchor { color: var(--color-secondary-950); text-decoration: none; }
html.dark .sk-anchor { color: var(--color-secondary-500); }
.sk-anchor:hover { text-decoration: underline; }
.sk-divider { border: none; border-top: 1px solid var(--color-surface-200); margin: 2rem 0; }
html.dark .sk-divider { border-top-color: var(--color-surface-700); }

/* === Code === */
.code-block {
  background-color: var(--color-surface-900);
  color: var(--color-surface-50);
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-container);
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.65;
  margin: 1rem 0;
  font-family: 'Courier New', Courier, monospace;
}
html.dark .code-block {
  background-color: oklch(14% 0 none);
  border: 1px solid var(--color-surface-800);
}
.inline-code {
  background-color: var(--color-surface-100);
  color: var(--color-primary-700);
  padding: 0.15em 0.45em;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Courier New', Courier, monospace;
}
html.dark .inline-code {
  background-color: var(--color-surface-800);
  color: var(--color-primary-200);
}

/* === Tables === */
.sk-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
}
.sk-table th {
  background-color: var(--color-surface-100);
  color: var(--color-surface-800);
  font-weight: 600;
  text-align: left;
  padding: 0.6rem 1rem;
  border-bottom: 2px solid var(--color-surface-200);
}
html.dark .sk-table th {
  background-color: var(--color-surface-850, var(--color-surface-800));
  color: var(--color-surface-200);
  border-bottom-color: var(--color-surface-700);
}
.sk-table td {
  padding: 0.55rem 1rem;
  border-bottom: 1px solid var(--color-surface-200);
  color: var(--color-surface-800);
  vertical-align: top;
  line-height: 1.5;
}
html.dark .sk-table td {
  border-bottom-color: var(--color-surface-800);
  color: var(--color-surface-200);
}
.sk-table tr:last-child td { border-bottom: none; }
.sk-table tr:hover td {
  background-color: color-mix(in srgb, var(--color-primary-500) 4%, transparent);
}

/* === Lists === */
.sk-list, .sk-list-ordered {
  padding-left: 1.6rem;
  margin: 0.6rem 0;
  color: var(--color-surface-800);
}
html.dark .sk-list, html.dark .sk-list-ordered { color: var(--color-surface-200); }
.sk-list { list-style-type: disc; }
.sk-list-ordered { list-style-type: decimal; }
.sk-list li, .sk-list-ordered li { margin: 0.3rem 0; line-height: 1.65; }

/* === Blockquote === */
.sk-blockquote {
  border-left: 3px solid var(--color-primary-400);
  padding: 0.5rem 1.25rem;
  margin: 1rem 0;
  background-color: color-mix(in srgb, var(--color-primary-500) 5%, transparent);
  border-radius: 0 var(--radius-base) var(--radius-base) 0;
  color: var(--color-surface-700);
}
html.dark .sk-blockquote { color: var(--color-surface-300); }
.sk-blockquote p { margin: 0; font-style: italic; line-height: 1.6; }

/* === Badges === */
.badge {
  display: inline-block;
  padding: 0.1em 0.55em;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.02em;
}
.badge-primary  { background-color: color-mix(in srgb, var(--color-primary-500) 15%, transparent); color: var(--color-primary-700); }
.badge-success  { background-color: color-mix(in srgb, var(--color-success-500) 15%, transparent); color: var(--color-success-800); }
.badge-warning  { background-color: color-mix(in srgb, var(--color-warning-500) 20%, transparent); color: var(--color-warning-950); }
.badge-error    { background-color: color-mix(in srgb, var(--color-error-500) 15%, transparent);   color: var(--color-error-700); }
.badge-surface  { background-color: var(--color-surface-200); color: var(--color-surface-600); }
html.dark .badge-primary  { background-color: color-mix(in srgb, var(--color-primary-500) 20%, transparent); color: var(--color-primary-300); }
html.dark .badge-success  { background-color: color-mix(in srgb, var(--color-success-500) 15%, transparent); color: var(--color-success-400); }
html.dark .badge-error    { background-color: color-mix(in srgb, var(--color-error-500) 15%, transparent);   color: var(--color-error-400); }
html.dark .badge-surface  { background-color: var(--color-surface-700); color: var(--color-surface-300); }

/* === Module cards === */
.module-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1.25rem 0 2rem;
}
.module-card {
  display: block;
  padding: 1.25rem;
  border-radius: var(--radius-container);
  border: 1px solid var(--color-surface-200);
  background-color: var(--color-surface-50);
  text-decoration: none;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
html.dark .module-card {
  border-color: var(--color-surface-700);
  background-color: var(--color-surface-900);
}
.module-card:hover {
  border-color: var(--color-primary-400);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--color-primary-500) 12%, transparent);
  transform: translateY(-1px);
}
.module-card h3 {
  font-family: var(--heading-font-family);
  font-weight: bold;
  font-size: 0.975rem;
  margin: 0 0 0.35rem;
  letter-spacing: var(--heading-letter-spacing);
  color: var(--color-primary-700);
}
html.dark .module-card h3 { color: var(--color-primary-300); }
.module-card p { font-size: 0.85rem; margin: 0; color: var(--color-surface-600); line-height: 1.5; }
html.dark .module-card p { color: var(--color-surface-400); }

/* === Module detail sections === */
.mod-section { margin-top: 2.25rem; }
.mod-section-title {
  font-family: var(--heading-font-family);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--color-surface-900);
  letter-spacing: var(--heading-letter-spacing);
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--color-surface-200);
}
html.dark .mod-section-title { color: var(--color-surface-100); border-bottom-color: var(--color-surface-700); }
.sub-label { font-size: 0.8rem; font-weight: 600; color: var(--color-surface-600); margin: 1rem 0 0.35rem; text-transform: uppercase; letter-spacing: 0.06em; }
html.dark .sub-label { color: var(--color-surface-400); }

/* === Command box === */
.cmd-box {
  background-color: var(--color-surface-900);
  color: var(--color-secondary-400);
  padding: 1rem 1.25rem;
  border-radius: var(--radius-container);
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  line-height: 1.7;
  margin: 0.75rem 0;
  white-space: pre;
  overflow-x: auto;
}
html.dark .cmd-box {
  background-color: oklch(14% 0 none);
  border: 1px solid var(--color-surface-800);
  color: var(--color-secondary-300);
}

/* === Empty state === */
.empty { color: var(--color-surface-400); font-style: italic; font-size: 0.85rem; }

/* === Responsive === */
@media (max-width: 768px) {
  body { flex-direction: column; }
  .sidebar { width: 100%; height: auto; min-height: unset; position: relative; border-right: none; border-bottom: 1px solid var(--color-surface-200); }
  html.dark .sidebar { border-bottom-color: var(--color-surface-800); }
  .main { padding: 1.5rem; }
}
`;

// ── HTML layout ────────────────────────────────────────────────────────────────

function layout(title, content, activeSection, modules, depth = 0) {
  const base = depth === 0 ? './' : '../';

  const link = (href, label, section) => {
    const active = activeSection === section ? ' active' : '';
    return `<a href="${base}${href}" class="nav-item${active}">${label}</a>`;
  };

  const subLinks = modules.map(({ name, mod }) => {
    const active = activeSection === `module:${name}` ? ' active' : '';
    return `<a href="${base}modules/${name}.html" class="nav-item${active}">${escHtml(mod.name ?? name)}</a>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en" data-theme="terminus">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)}</title>
  <link rel="stylesheet" href="${base}terminus.css">
  <link rel="stylesheet" href="${base}style.css">
</head>
<body>
  <nav class="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-name">Architectonic</div>
      <div class="sidebar-brand-sub">Documentation</div>
    </div>
    <div class="nav-label">Framework</div>
    ${link('index.html', 'Overview', 'index')}
    ${link('scaffold.html', 'Scaffold', 'scaffold')}
    ${link('cli.html', 'CLI Reference', 'cli')}
    <div class="nav-label">Modules</div>
    ${link('modules.html', 'Module System', 'modules')}
    <div class="nav-sub">${subLinks}</div>
    <button class="dark-toggle" onclick="toggleDark()">Toggle dark mode</button>
  </nav>
  <main class="main">
    ${content}
  </main>
  <script>
    function toggleDark() {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('arch-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }
    (function () {
      var saved = localStorage.getItem('arch-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
</body>
</html>`;
}

// ── Module page renderer ───────────────────────────────────────────────────────

function renderModuleContent(name, mod) {
  const parts = [];

  parts.push(`<h1 class="sk-heading sk-heading-1">${escHtml(mod.name ?? name)}</h1>`);
  if (mod.description) {
    parts.push(`<p class="sk-para">${escHtml(mod.description)}</p>`);
  }

  // Integration
  parts.push(`<div class="mod-section">
  <div class="mod-section-title">Integration</div>
  <p class="sk-para">Add this module when creating a new project with <code class="inline-code">arch.js</code>:</p>
  <div class="cmd-box">node arch.js create my-app --modules ${name}</div>
</div>`);

  // Nav items
  if (mod.nav?.length) {
    const rows = mod.nav.map(item => `<tr>
    <td><strong>${escHtml(item.label)}</strong></td>
    <td><code class="inline-code">${escHtml(item.href)}</code></td>
    <td><code class="inline-code">${escHtml(item.icon ?? '')}</code></td>
    <td><code class="inline-code">${escHtml(item.permission ?? '')}</code></td>
  </tr>`).join('');
    parts.push(`<div class="mod-section">
  <div class="mod-section-title">Navigation Items</div>
  <table class="sk-table">
    <thead><tr><th>Label</th><th>Route</th><th>Icon</th><th>Permission</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`);
  }

  // Permissions
  if (mod.permissions?.length) {
    const rows = mod.permissions.map(p => {
      const actionBadges = ['create', 'read', 'update', 'delete'].map(a =>
        p.actions.includes(a)
          ? `<span class="badge badge-success">${a}</span>`
          : `<span class="badge badge-surface">${a}</span>`
      ).join(' ');
      return `<tr><td><code class="inline-code">${escHtml(p.resource)}</code></td><td>${actionBadges}</td></tr>`;
    }).join('');
    parts.push(`<div class="mod-section">
  <div class="mod-section-title">Permissions</div>
  <table class="sk-table">
    <thead><tr><th>Resource</th><th>Actions</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`);
  }

  // Dependencies
  const feDeps  = Object.entries(mod.dependencies?.frontend ?? {});
  const apiDeps = Object.entries(mod.dependencies?.api ?? {});
  if (feDeps.length || apiDeps.length) {
    let depHtml = '';
    if (feDeps.length) {
      const rows = feDeps.map(([pkg, ver]) =>
        `<tr><td><code class="inline-code">${escHtml(pkg)}</code></td><td>${escHtml(ver)}</td></tr>`
      ).join('');
      depHtml += `<p class="sub-label">Frontend</p>
<table class="sk-table"><thead><tr><th>Package</th><th>Version</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    if (apiDeps.length) {
      const rows = apiDeps.map(([pkg, ver]) =>
        `<tr><td><code class="inline-code">${escHtml(pkg)}</code></td><td>${escHtml(ver)}</td></tr>`
      ).join('');
      depHtml += `<p class="sub-label">API</p>
<table class="sk-table"><thead><tr><th>Package</th><th>Version</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    parts.push(`<div class="mod-section">
  <div class="mod-section-title">Dependencies</div>
  ${depHtml}
</div>`);
  }

  // Environment variables
  if (mod.env?.length) {
    const rows = mod.env.map(e => {
      const reqBadge = e.required
        ? `<span class="badge badge-error">required</span>`
        : `<span class="badge badge-surface">optional</span>`;
      return `<tr>
    <td><code class="inline-code">${escHtml(e.key)}</code></td>
    <td><code class="inline-code">${escHtml(String(e.default ?? ''))}</code></td>
    <td>${reqBadge}</td>
    <td>${escHtml(e.description ?? '')}</td>
  </tr>`;
    }).join('');
    parts.push(`<div class="mod-section">
  <div class="mod-section-title">Environment Variables</div>
  <table class="sk-table">
    <thead><tr><th>Variable</th><th>Default</th><th>Required</th><th>Description</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`);
  }

  // Dashboard widgets
  if (mod.widgets?.length) {
    const rows = mod.widgets.map(w => `<tr>
    <td><code class="inline-code">${escHtml(w.component)}</code></td>
    <td><code class="inline-code">${escHtml(w.import)}</code></td>
    <td><code class="inline-code">${escHtml(w.permission)}</code></td>
    <td>${w.order ?? 0}</td>
  </tr>`).join('');
    parts.push(`<div class="mod-section">
  <div class="mod-section-title">Dashboard Widgets</div>
  <table class="sk-table">
    <thead><tr><th>Component</th><th>Import Path</th><th>Permission</th><th>Order</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`);
  }

  return parts.join('\n');
}

// ── Page generators ────────────────────────────────────────────────────────────

function genIndex(modules) {
  const md = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
  return layout('Overview — Architectonic', mdToHtml(md), 'index', modules);
}

function genScaffold(modules) {
  const md = fs.readFileSync(path.join(SCAFFOLD, 'CLAUDE.md'), 'utf8');
  return layout('Scaffold Reference — Architectonic', mdToHtml(md), 'scaffold', modules);
}

function genModules(modules) {
  const integrationPath = path.join(SCAFFOLD, 'INTEGRATION.md');
  const md = fs.existsSync(integrationPath) ? fs.readFileSync(integrationPath, 'utf8') : '';

  const cards = modules.length > 0
    ? `<h2 class="sk-heading sk-heading-2">Available Modules</h2>
<div class="module-cards">
  ${modules.map(({ name, mod }) => `
  <a href="modules/${name}.html" class="module-card">
    <h3>${escHtml(mod.name ?? name)}</h3>
    <p>${escHtml(mod.description ?? 'No description.')}</p>
  </a>`).join('')}
</div>`
    : '<p class="empty">No modules found in the <code>modules/</code> directory.</p>';

  return layout('Module System — Architectonic', mdToHtml(md) + '\n' + cards, 'modules', modules);
}

function genModulePage(name, mod, allModules) {
  return layout(
    `${escHtml(mod.name ?? name)} — Architectonic`,
    renderModuleContent(name, mod),
    `module:${name}`,
    allModules,
    1,
  );
}

function genCli(modules) {
  const content = `<h1 class="sk-heading sk-heading-1">CLI Reference</h1>
<p class="sk-para"><code class="inline-code">arch.js</code> is a Node.js CLI for scaffolding new projects and working with available modules. It lives at the root of the framework directory alongside <code class="inline-code">docs.js</code>.</p>

<h2 class="sk-heading sk-heading-2">Commands</h2>

<h3 class="sk-heading sk-heading-3">create</h3>
<p class="sk-para">Scaffold a new project under <code class="inline-code">projects/</code>.</p>
<div class="cmd-box">node arch.js create &lt;project-name&gt; [--modules mod1,mod2,...] [--no-install]</div>
<table class="sk-table">
  <thead><tr><th>Argument / Flag</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code class="inline-code">&lt;project-name&gt;</code></td><td>Name for the new project directory (no path separators).</td></tr>
    <tr><td><code class="inline-code">--modules mod1,mod2</code></td><td>Comma-separated modules to merge into the scaffold at creation time.</td></tr>
    <tr><td><code class="inline-code">--no-install</code></td><td>Skip <code class="inline-code">npm install</code> in both <code class="inline-code">frontend/</code> and <code class="inline-code">api/</code>.</td></tr>
  </tbody>
</table>
<p class="sk-para">What <code class="inline-code">create</code> does step by step:</p>
<ol class="sk-list-ordered">
  <li>Copies <code class="inline-code">example/</code> to <code class="inline-code">projects/&lt;project-name&gt;/</code></li>
  <li>Updates the MongoDB database name in <code class="inline-code">docker-compose.yml</code>, <code class="inline-code">.env</code>, and <code class="inline-code">.env.example</code></li>
  <li>Runs a collision check — module files cannot overwrite scaffold files or each other</li>
  <li>Copies module API and frontend files into the project tree</li>
  <li>Merges nav entries into <code class="inline-code">frontend/src/lib/config/nav.ts</code></li>
  <li>Merges permissions into <code class="inline-code">api/src/data/permissions.json</code></li>
  <li>Merges npm dependencies into both <code class="inline-code">package.json</code> files</li>
  <li>Appends environment variables to <code class="inline-code">.env</code> and <code class="inline-code">.env.example</code></li>
  <li>Runs <code class="inline-code">npm install</code> in both sub-packages (unless <code class="inline-code">--no-install</code>)</li>
</ol>

<h3 class="sk-heading sk-heading-3">list</h3>
<p class="sk-para">List all available modules with their descriptions.</p>
<div class="cmd-box">node arch.js list</div>

<h3 class="sk-heading sk-heading-3">info</h3>
<p class="sk-para">Print the full <code class="inline-code">module.json</code> manifest for a module.</p>
<div class="cmd-box">node arch.js info &lt;module-name&gt;</div>

<h2 class="sk-heading sk-heading-2">Examples</h2>
<div class="cmd-box">node arch.js create my-app
node arch.js create my-app --modules notifications
node arch.js create my-app --modules commerce,github --no-install
node arch.js list
node arch.js info personal-budget</div>

<h2 class="sk-heading sk-heading-2">After Creating a Project</h2>
<div class="cmd-box">cd projects/my-app
cp .env.example .env
# Edit .env — set SESSION_SECRET at minimum
docker compose build
docker compose up</div>
<p class="sk-para">Generate a <code class="inline-code">SESSION_SECRET</code>:</p>
<div class="cmd-box">node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"</div>

<h2 class="sk-heading sk-heading-2">Regenerating Docs</h2>
<p class="sk-para">Run the documentation generator from the framework root to regenerate this site:</p>
<div class="cmd-box">node docs.js
# Custom output directory:
node docs.js --out ./my-docs</div>`;

  return layout('CLI Reference — Architectonic', content, 'cli', modules);
}

// ── Main ───────────────────────────────────────────────────────────────────────

function main() {
  const modules = loadModules();

  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'modules'), { recursive: true });

  // Theme CSS — read from node_modules, fall back to minimal embed
  const themeCSS = fs.existsSync(THEME_SRC)
    ? fs.readFileSync(THEME_SRC, 'utf8')
    : `[data-theme='terminus'] {
  --base-font-family: Avenir, Montserrat, sans-serif;
  --heading-font-family: Inter, Roboto, 'Helvetica Neue', Arial, sans-serif;
  --heading-letter-spacing: -0.025em;
  --base-letter-spacing: 0.025em;
  --radius-base: 0.375rem;
  --radius-container: 0.75rem;
  --body-background-color: oklch(99.11% 0 none);
  --body-background-color-dark: oklch(18.67% 0 none);
  --base-font-color: oklch(18.67% 0 none);
  --base-font-color-dark: oklch(99.11% 0 none);
  --color-primary-200: oklch(66.15% 0.19 292.78deg);
  --color-primary-300: oklch(58.37% 0.24 290.13deg);
  --color-primary-400: oklch(52.28% 0.28 285.76deg);
  --color-primary-500: oklch(48.65% 0.3 279.02deg);
  --color-primary-700: oklch(41.55% 0.25 279.58deg);
  --color-secondary-300: oklch(91.37% 0.13 173.92deg);
  --color-secondary-400: oklch(90.21% 0.15 173.28deg);
  --color-secondary-500: oklch(89.36% 0.16 171.7deg);
  --color-secondary-950: oklch(52.82% 0.11 164.37deg);
  --color-success-400: oklch(90.21% 0.17 140.23deg);
  --color-success-500: oklch(88.75% 0.2 140.81deg);
  --color-success-700: oklch(73.66% 0.2 141.78deg);
  --color-success-800: oklch(66.03% 0.19 142.29deg);
  --color-warning-500: oklch(87.96% 0.08 341.98deg);
  --color-warning-950: oklch(45.55% 0.07 342.01deg);
  --color-error-400: oklch(68.41% 0.21 36.54deg);
  --color-error-500: oklch(65.28% 0.24 33.83deg);
  --color-error-700: oklch(57.6% 0.2 33.22deg);
  --color-surface-50:  oklch(99.11% 0 none);
  --color-surface-100: oklch(90.97% 0 none);
  --color-surface-200: oklch(82.97% 0 none);
  --color-surface-300: oklch(74.44% 0 none);
  --color-surface-400: oklch(66% 0 none);
  --color-surface-500: oklch(56.93% 0 none);
  --color-surface-600: oklch(49.97% 0 none);
  --color-surface-700: oklch(42.76% 0 none);
  --color-surface-800: oklch(35.23% 0 none);
  --color-surface-900: oklch(27.27% 0 none);
  --color-surface-950: oklch(18.67% 0 none);
}`;
  fs.writeFileSync(path.join(OUT, 'terminus.css'), themeCSS);
  fs.writeFileSync(path.join(OUT, 'style.css'), STYLE_CSS.trim());

  // Pages
  fs.writeFileSync(path.join(OUT, 'index.html'),   genIndex(modules));
  fs.writeFileSync(path.join(OUT, 'scaffold.html'), genScaffold(modules));
  fs.writeFileSync(path.join(OUT, 'modules.html'),  genModules(modules));
  fs.writeFileSync(path.join(OUT, 'cli.html'),      genCli(modules));
  for (const { name, mod } of modules) {
    fs.writeFileSync(path.join(OUT, 'modules', `${name}.html`), genModulePage(name, mod, modules));
  }

  const pageNames = ['index', 'scaffold', 'modules', 'cli', ...modules.map(m => m.name)];
  console.log(`Docs generated → ${OUT}/`);
  console.log(`  Pages: ${pageNames.join(', ')}`);
}

main();
