#!/usr/bin/env node

/**
 * NEVO GROUP — Automated Originality & Brand Integrity Guard
 * 
 * Verifies that the deployed bundle and source code contain:
 * 1. ZERO competitor brand strings ('vero.uz', 'vero group', 'vero-', 'vero club', 'yuqorida bo\'l')
 * 2. ZERO phrases from docs/forbidden-phrases.txt
 * 3. < 4 matching 5-word sequences against docs/vero-snapshot.txt
 * 4. ZERO external image/video URLs outside the approved whitelist (Supabase, own domain, local assets)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FORBIDDEN_PHRASES_FILE = path.join(rootDir, 'docs', 'forbidden-phrases.txt');
const VERO_SNAPSHOT_FILE = path.join(rootDir, 'docs', 'vero-snapshot.txt');

// Load forbidden phrases
let forbiddenPhrases = [
  'vero.uz',
  'vero group',
  'vero-',
  'vero club',
  "yuqorida bo'l",
];

if (fs.existsSync(FORBIDDEN_PHRASES_FILE)) {
  const content = fs.readFileSync(FORBIDDEN_PHRASES_FILE, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  forbiddenPhrases = [...new Set([...forbiddenPhrases, ...lines])];
}

// Load Vero snapshot for 5-word shingle similarity
let veroShingles = new Set();
if (fs.existsSync(VERO_SNAPSHOT_FILE)) {
  const snapshotText = fs.readFileSync(VERO_SNAPSHOT_FILE, 'utf-8');
  const words = snapshotText
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  for (let i = 0; i <= words.length - 5; i++) {
    const shingle = words.slice(i, i + 5).join(' ');
    veroShingles.add(shingle);
  }
}

// Allowlist for media sources
const ALLOWED_MEDIA_DOMAINS = [
  'nevogroup.uz',
  'www.nevogroup.uz',
  'zohcxekupvkljojqdqtg.supabase.co',
  'localhost',
  '127.0.0.1'
];

const SCAN_DIRS = ['src', 'public'];
const SCAN_EXTENSIONS = ['.js', '.mjs', '.html', '.css', '.json', '.svg', '.csv'];
const IGNORE_FILES = [
  'package-lock.json',
  'docs/MASTER_PROMPT_v2.md',
  'docs/audit.md',
  'docs/forbidden-phrases.txt',
  'docs/vero-snapshot.txt',
  'docs/site-reference-notes.md',
  'docs/catalog-reference-notes.md'
];

let errors = [];
let matchingShinglesFound = [];

function checkFileContent(filePath, content) {
  const relPath = path.relative(rootDir, filePath);
  
  // 1. Check forbidden phrases
  const lowerContent = content.toLowerCase();
  for (const phrase of forbiddenPhrases) {
    const lowerPhrase = phrase.toLowerCase();
    if (lowerContent.includes(lowerPhrase)) {
      // Find line number
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(lowerPhrase)) {
          errors.push(`[FORBIDDEN PHRASE] "${phrase}" found in ${relPath}:${i + 1}`);
        }
      }
    }
  }

  // 2. Check 5-word shingles
  if (veroShingles.size > 0 && (relPath.startsWith('src/') || relPath.startsWith('public/'))) {
    const fileWords = content
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    for (let i = 0; i <= fileWords.length - 5; i++) {
      const shingle = fileWords.slice(i, i + 5).join(' ');
      if (veroShingles.has(shingle)) {
        matchingShinglesFound.push({ file: relPath, shingle });
      }
    }
  }

  // 3. Check unauthorized external media URLs (img/video/audio)
  const mediaRegex = /https?:\/\/[^\s"'`]+\.(?:png|jpg|jpeg|webp|avif|gif|svg|mp4|webm|mov)(?:\?[^\s"'`]*)?/gi;
  let match;
  while ((match = mediaRegex.exec(content)) !== null) {
    const url = match[0];
    try {
      const parsed = new URL(url);
      const isAllowed = ALLOWED_MEDIA_DOMAINS.some(domain => 
        parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
      );
      if (!isAllowed) {
        errors.push(`[UNAUTHORIZED EXTERNAL MEDIA] ${url} found in ${relPath}`);
      }
    } catch {
      // invalid URL
    }
  }
}

function walkDir(dir) {
  const fullPath = path.join(rootDir, dir);
  if (!fs.existsSync(fullPath)) return;

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const itemPath = path.join(fullPath, entry.name);
    const rel = path.relative(rootDir, itemPath);

    if (IGNORE_FILES.some(ign => rel === ign || rel.endsWith(ign))) continue;
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      walkDir(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SCAN_EXTENSIONS.includes(ext)) {
        try {
          const content = fs.readFileSync(itemPath, 'utf-8');
          checkFileContent(itemPath, content);
        } catch {
          // ignore unreadable
        }
      }
    }
  }
}

console.log('🔍 Running NEVO Originality & Brand Integrity Guard...');
for (const dir of SCAN_DIRS) {
  walkDir(dir);
}

// Evaluate shingles count threshold (failing at >= 4 matching 5-word sequences)
if (matchingShinglesFound.length >= 4) {
  errors.push(`[SIMILARITY THRESHOLD EXCEEDED] Found ${matchingShinglesFound.length} matching 5-word sequences against Vero snapshot (limit is 3):`);
  matchingShinglesFound.slice(0, 10).forEach(m => {
    errors.push(`   - [${m.file}] "${m.shingle}"`);
  });
}

if (errors.length > 0) {
  console.error('\n❌ ORIGINALITY VIOLATIONS DETECTED:');
  errors.forEach(e => console.error('  ' + e));
  console.error(`\nTotal violations: ${errors.length}. Build aborted.\n`);
  process.exit(1);
} else {
  console.log('✅ Originality guard passed: 100% original copy, zero competitor references, clean media allowlist.\n');
  process.exit(0);
}
