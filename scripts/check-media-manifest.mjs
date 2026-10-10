import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'src', 'config', 'media-manifest.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SRC_DIR = path.join(ROOT, 'src');

console.log('🔍 Running NEVO Media Manifest & Asset Budget Guard...');

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('❌ Missing media manifest at src/config/media-manifest.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
const { budgets, slots } = manifest;

let errors = 0;
const seenIds = new Set();

// 1. Verify every declared slot
for (const slot of slots) {
  if (seenIds.has(slot.id)) {
    console.error(`❌ Duplicate slot id detected: "${slot.id}"`);
    errors++;
  }
  seenIds.add(slot.id);

  const filePath = path.join(PUBLIC_DIR, slot.path.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File declared in slot "${slot.id}" not found: ${slot.path}`);
    errors++;
    continue;
  }

  const stat = fs.statSync(filePath);
  const size = stat.size;

  if (slot.type.startsWith('image/')) {
    if (slot.id.includes('poster') && size > budgets.heroPosterMaxBytes) {
      console.error(`❌ Hero poster "${slot.id}" exceeds budget: ${size} > ${budgets.heroPosterMaxBytes} bytes`);
      errors++;
    } else if (size > budgets.imageMaxBytes) {
      console.error(`❌ Image "${slot.id}" exceeds budget: ${size} > ${budgets.imageMaxBytes} bytes`);
      errors++;
    }
  } else if (slot.type.startsWith('video/')) {
    if (size > budgets.videoMaxBytes) {
      console.error(`❌ Video "${slot.id}" exceeds budget: ${size} > ${budgets.videoMaxBytes} bytes`);
      errors++;
    }
  }
}

// 2. Scan src/ for <img> tags without alt attribute
function scanDirForImages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirForImages(full);
    } else if (entry.name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf-8');
      const imgRegex = /<img\s+([^>]*?)>/gi;
      let match;
      while ((match = imgRegex.exec(content)) !== null) {
        const attrs = match[1];
        if (!/alt\s*=\s*["']/i.test(attrs)) {
          console.error(`❌ <img> missing alt attribute in ${path.relative(ROOT, full)}: ${match[0].slice(0, 50)}...`);
          errors++;
        }
      }
    }
  }
}

scanDirForImages(SRC_DIR);

if (errors > 0) {
  console.error(`\n❌ Media Manifest Guard failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(`✅ Media Manifest Guard passed: ${slots.length} media slots verified and within budgets.`);
