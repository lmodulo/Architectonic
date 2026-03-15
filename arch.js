#!/usr/bin/env node
/**
 * arch.js — Architectonic project scaffold CLI
 *
 * Usage:
 *   node arch.js create <project-name> [--modules mod1,mod2] [--no-install]
 *   node arch.js list
 *   node arch.js info <module-name>
 */

import fs   from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCAFFOLD = path.join(__dirname, 'example');
const MODULES  = path.join(__dirname, 'modules');
const PROJECTS = path.join(__dirname, 'projects');

// ── Arg parsing ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const cmd  = args[0];

if (cmd === 'list') {
  cmdList();
  process.exit(0);
}

if (cmd === 'info') {
  if (!args[1]) { console.error('Usage: node arch.js info <module-name>'); process.exit(1); }
  cmdInfo(args[1]);
  process.exit(0);
}

if (cmd !== 'create' || !args[1]) {
  console.error([
    'Usage:',
    '  node arch.js create <project-name> [--modules mod1,mod2] [--no-install]',
    '  node arch.js list',
    '  node arch.js info <module-name>',
  ].join('\n'));
  process.exit(1);
}

const projectName = args[1];

// Prevent path traversal
if (projectName.includes('/') || projectName.includes('\\') || projectName.includes('..')) {
  console.error('Error: project name must not contain path separators');
  process.exit(1);
}

const modulesArg  = args.indexOf('--modules');
const moduleNames = modulesArg !== -1 && args[modulesArg + 1]
  ? args[modulesArg + 1].split(',').map(s => s.trim()).filter(Boolean)
  : [];

const noInstall = args.includes('--no-install');

// ── Guard ─────────────────────────────────────────────────────────────────────

const dest = path.join(PROJECTS, projectName);

if (fs.existsSync(dest)) {
  console.error(`Error: projects/${projectName} already exists`);
  process.exit(1);
}

// ── Load + validate all modules upfront ──────────────────────────────────────

const loadedModules = moduleNames.map(modName => {
  const modDir      = path.join(MODULES, modName);
  const modJsonPath = path.join(modDir, 'module.json');

  if (!fs.existsSync(modDir))      { console.error(`Error: module '${modName}' not found in modules/`); process.exit(1); }
  if (!fs.existsSync(modJsonPath)) { console.error(`Error: modules/${modName}/module.json not found`);  process.exit(1); }

  return { name: modName, dir: modDir, mod: JSON.parse(fs.readFileSync(modJsonPath, 'utf8')) };
});

// ── Collision check (scaffold + module-vs-module) ─────────────────────────────

// Collect all files that will be written: scaffold files + each module's files
const scaffoldFiles = new Set();
walkDir(SCAFFOLD, f => scaffoldFiles.add(path.relative(SCAFFOLD, f)));

// For each module, check against scaffold AND previously-seen module files
const seenModuleFiles = new Set();
for (const { name: modName, dir: modDir } of loadedModules) {
  for (const sub of ['api', 'frontend']) {
    const srcSub = path.join(modDir, sub);
    if (!fs.existsSync(srcSub)) continue;
    walkDir(srcSub, (srcFile) => {
      const rel = path.join(sub, path.relative(srcSub, srcFile));
      if (scaffoldFiles.has(rel)) {
        console.error(`Error: module '${modName}' would overwrite scaffold file: ${rel}`);
        process.exit(1);
      }
      if (seenModuleFiles.has(rel)) {
        console.error(`Error: module '${modName}' collides with another module on file: ${rel}`);
        process.exit(1);
      }
      seenModuleFiles.add(rel);
    });
  }
}

// ── Copy scaffold ─────────────────────────────────────────────────────────────

console.log(`Creating projects/${projectName}…`);
fs.cpSync(SCAFFOLD, dest, { recursive: true });

// ── Update MONGO_DB name ──────────────────────────────────────────────────────

const dbName = projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

for (const rel of ['docker-compose.yml', '.env', '.env.example']) {
  const file = path.join(dest, rel);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const updated = content.replace(/(mongodb:\/\/[^/]+\/)(\w+)/g, `$1${dbName}`);
  if (updated !== content) fs.writeFileSync(file, updated);
}

// ── Process modules ───────────────────────────────────────────────────────────

for (const { name: modName, dir: modDir, mod } of loadedModules) {
  console.log(`  Merging module: ${modName}`);

  // ── Copy files ─────────────────────────────────────────────────────────────

  for (const sub of ['api', 'frontend']) {
    const srcSub = path.join(modDir, sub);
    if (!fs.existsSync(srcSub)) continue;
    fs.cpSync(srcSub, path.join(dest, sub), { recursive: true });
  }

  // ── Merge nav ──────────────────────────────────────────────────────────────

  if (mod.nav && mod.nav.length > 0) {
    const navPath = path.join(dest, 'frontend', 'src', 'lib', 'config', 'nav.ts');
    let navContent = fs.readFileSync(navPath, 'utf8');

    for (const item of mod.nav) {
      const icon = item.icon;

      // Check if icon is already imported from lucide-svelte (any import line)
      const alreadyImported = new RegExp(`\\b${icon}\\b`).test(navContent);

      if (!alreadyImported) {
        // Find last lucide-svelte import line and insert after it
        const lucideMatches = [...navContent.matchAll(/^import \{[^}]+\} from 'lucide-svelte';/gm)];
        if (lucideMatches.length > 0) {
          const lastMatch = lucideMatches[lucideMatches.length - 1];
          const insertAt = lastMatch.index + lastMatch[0].length;
          navContent = navContent.slice(0, insertAt) +
            `\nimport { ${icon} } from 'lucide-svelte';` +
            navContent.slice(insertAt);
        } else {
          navContent = `import { ${icon} } from 'lucide-svelte';\n` + navContent;
        }
      }

      // Build array entry
      let permStr = '';
      if (item.permission) {
        const [resource, action] = item.permission.split('.');
        permStr = `, permission: { resource: '${resource}', action: '${action}' }`;
      }
      const entry = `  { label: '${item.label}', href: '${item.href}', icon: ${icon}${permStr} },`;

      // Insert before closing ];
      navContent = navContent.replace(/^(\s*\];)/m, `${entry}\n$1`);
    }

    fs.writeFileSync(navPath, navContent);
  }

  // ── Merge permissions ──────────────────────────────────────────────────────

  if (mod.permissions && mod.permissions.length > 0) {
    const permsPath = path.join(dest, 'api', 'src', 'data', 'permissions.json');
    const perms = JSON.parse(fs.readFileSync(permsPath, 'utf8'));

    for (const { resource, actions } of mod.permissions) {
      perms.admin[resource] = {};
      for (const action of ['create', 'read', 'update', 'delete']) {
        perms.admin[resource][action] = actions.includes(action);
      }

      perms.viewer[resource] = {};
      for (const action of ['create', 'read', 'update', 'delete']) {
        perms.viewer[resource][action] = action === 'read' && actions.includes('read');
      }
    }

    fs.writeFileSync(permsPath, JSON.stringify(perms, null, 2) + '\n');
  }

  // ── Merge package.json deps ────────────────────────────────────────────────

  for (const side of ['frontend', 'api']) {
    const deps = mod.dependencies?.[side];
    if (!deps || Object.keys(deps).length === 0) continue;

    const pkgPath = path.join(dest, side, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.dependencies = pkg.dependencies ?? {};

    for (const [name, version] of Object.entries(deps)) {
      if (pkg.dependencies[name]) {
        if (pkg.dependencies[name] !== version) {
          console.warn(`  Warning: ${side}/package.json already has ${name}@${pkg.dependencies[name]}, keeping existing (module wants ${version})`);
        }
      } else {
        pkg.dependencies[name] = version;
      }
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  // ── Append env vars ────────────────────────────────────────────────────────

  if (mod.env && mod.env.length > 0) {
    for (const rel of ['.env', '.env.example']) {
      const envPath = path.join(dest, rel);
      if (!fs.existsSync(envPath)) continue;

      let envContent = fs.readFileSync(envPath, 'utf8');
      for (const { key, default: defaultVal = '', description = '' } of mod.env) {
        const keyPattern = new RegExp(`^${key}=`, 'm');
        if (keyPattern.test(envContent)) {
          // Key exists — warn if default differs from what's already there
          const existingMatch = envContent.match(new RegExp(`^${key}=(.*)`, 'm'));
          const existingVal = existingMatch ? existingMatch[1].replace(/\s*#.*$/, '').trim() : '';
          if (existingVal !== String(defaultVal)) {
            console.warn(`  Warning: ${rel} already has ${key}=${existingVal}, keeping existing (module default: ${defaultVal})`);
          }
        } else {
          const comment = description ? ` # ${description}` : '';
          envContent += `\n${key}=${defaultVal}${comment}`;
        }
      }
      fs.writeFileSync(envPath, envContent);
    }
  }
}

// ── npm install ───────────────────────────────────────────────────────────────

if (!noInstall) {
  for (const side of ['frontend', 'api']) {
    const cwd = path.join(dest, side);
    if (!fs.existsSync(path.join(cwd, 'package.json'))) continue;
    console.log(`  npm install (${side})…`);
    try {
      execSync('npm install', { cwd, stdio: 'inherit' });
    } catch {
      console.warn(`  Warning: npm install failed in ${side} — run it manually`);
    }
  }
} else {
  console.log('  Skipping npm install (--no-install)');
}

console.log(`\nDone! Project created at: projects/${projectName}`);
if (moduleNames.length > 0) console.log(`Modules merged: ${moduleNames.join(', ')}`);
console.log(`\nNext steps:\n  cd projects/${projectName}\n  docker compose build\n  docker compose up`);

// ── Subcommands ───────────────────────────────────────────────────────────────

function cmdList() {
  if (!fs.existsSync(MODULES)) { console.log('No modules directory found.'); return; }
  const entries = fs.readdirSync(MODULES, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(MODULES, e.name, 'module.json')));
  if (entries.length === 0) { console.log('No modules available.'); return; }
  console.log('Available modules:');
  for (const e of entries) {
    const mod = JSON.parse(fs.readFileSync(path.join(MODULES, e.name, 'module.json'), 'utf8'));
    const desc = mod.description ? `  — ${mod.description}` : '';
    console.log(`  ${e.name}${desc}`);
  }
}

function cmdInfo(modName) {
  const modJsonPath = path.join(MODULES, modName, 'module.json');
  if (!fs.existsSync(modJsonPath)) { console.error(`Module '${modName}' not found.`); process.exit(1); }
  const mod = JSON.parse(fs.readFileSync(modJsonPath, 'utf8'));
  console.log(JSON.stringify(mod, null, 2));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function walkDir(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, cb);
    } else {
      cb(full);
    }
  }
}
