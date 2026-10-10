import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './lib/catalog-csv.mjs';
import { getLocalizedProductName, getLocalizedProductDescription } from '../src/lib/catalog.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = path.join(ROOT, 'src', 'locales');

console.log('🔍 Running NEVO i18n Dictionary Parity & Quality Guard...');

const uzFile = path.join(LOCALES_DIR, 'uz.json');
const ruFile = path.join(LOCALES_DIR, 'ru.json');
const enFile = path.join(LOCALES_DIR, 'en.json');

if (!fs.existsSync(uzFile) || !fs.existsSync(ruFile) || !fs.existsSync(enFile)) {
  console.error('❌ Missing locale JSON files in src/locales/');
  process.exit(1);
}

const uz = JSON.parse(fs.readFileSync(uzFile, 'utf-8'));
const ru = JSON.parse(fs.readFileSync(ruFile, 'utf-8'));
const en = JSON.parse(fs.readFileSync(enFile, 'utf-8'));

const uzKeys = Object.keys(uz);
const ruKeys = Object.keys(ru);
const enKeys = Object.keys(en);

let errors = 0;

// 1. Key Parity Check
const missingInRu = uzKeys.filter((k) => !(k in ru));
const missingInEn = uzKeys.filter((k) => !(k in en));
const extraInRu = ruKeys.filter((k) => !(k in uz));
const extraInEn = enKeys.filter((k) => !(k in uz));

if (missingInRu.length) {
  console.error(`❌ Keys missing in ru.json (${missingInRu.length}):`, missingInRu);
  errors++;
}
if (missingInEn.length) {
  console.error(`❌ Keys missing in en.json (${missingInEn.length}):`, missingInEn);
  errors++;
}
if (extraInRu.length) {
  console.error(`❌ Extra keys in ru.json not in uz.json (${extraInRu.length}):`, extraInRu);
  errors++;
}
if (extraInEn.length) {
  console.error(`❌ Extra keys in en.json not in uz.json (${extraInEn.length}):`, extraInEn);
  errors++;
}

// 2. Empty values check
for (const [k, v] of Object.entries(uz)) {
  if (!v || !String(v).trim()) {
    console.error(`❌ Empty value in uz.json for key: ${k}`);
    errors++;
  }
}
for (const [k, v] of Object.entries(ru)) {
  if (!v || !String(v).trim()) {
    console.error(`❌ Empty value in ru.json for key: ${k}`);
    errors++;
  }
}
for (const [k, v] of Object.entries(en)) {
  if (!v || !String(v).trim()) {
    console.error(`❌ Empty value in en.json for key: ${k}`);
    errors++;
  }
}

// 3. Uzbek markers in Russian/English values
// Allowed technical abbreviations/words or keys can be exempt (like brandName)
const EXEMPT_KEYS = new Set(['brandName', 'aboutCorpBrand', 'skuLabel']);
const UZ_MARKERS = ["o'", "g'", ' ta ', ' va ', ' uchun ', "bo'ylab"];

for (const [k, v] of Object.entries(ru)) {
  if (EXEMPT_KEYS.has(k)) continue;
  for (const marker of UZ_MARKERS) {
    if (String(v).toLowerCase().includes(marker)) {
      console.error(`❌ Untranslated Uzbek marker "${marker}" detected in ru.json for key "${k}": "${v}"`);
      errors++;
    }
  }
}

for (const [k, v] of Object.entries(en)) {
  if (EXEMPT_KEYS.has(k)) continue;
  for (const marker of UZ_MARKERS) {
    if (String(v).toLowerCase().includes(marker)) {
      console.error(`❌ Untranslated Uzbek marker "${marker}" detected in en.json for key "${k}": "${v}"`);
      errors++;
    }
  }
}

// 4. Uzbek Catalog Products & Descriptions Cyrillic Audit
const csvPath = path.join(ROOT, 'scripts', 'seed-data', 'nevo-katalog.csv');
if (fs.existsSync(csvPath)) {
  const csvText = fs.readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
  const [, ...rows] = parseCsv(csvText);
  let cyrillicProducts = 0;

  for (const r of rows) {
    const rawName = r[2] || '';
    const rawGroup = r[3] || '';
    const uzName = getLocalizedProductName(rawName, rawGroup, 'uz');
    const uzDesc = getLocalizedProductDescription(uzName, '', 'uz');

    if (/[\u0400-\u04FF]/.test(uzName)) {
      console.error(`❌ Cyrillic character detected in Uzbek product name: "${uzName}" (raw: "${rawName}")`);
      cyrillicProducts++;
      errors++;
    }
    if (/[\u0400-\u04FF]/.test(uzDesc)) {
      console.error(`❌ Cyrillic character detected in Uzbek product description: "${uzDesc}"`);
      cyrillicProducts++;
      errors++;
    }
  }

  if (cyrillicProducts === 0) {
    console.log(`✅ Product i18n Guard passed: ${rows.length} products validated with 0 Cyrillic characters in Uzbek.`);
  }
}

// 5. Hardcoded Uzbek text guard in home and core components
const CORE_FILES = [
  'src/pages/HomePage.js',
  'src/components/MobileBottomNav.js',
  'src/components/Header.js',
  'src/components/Footer.js'
];

const FORBIDDEN_WORDS = [
  'Mahsulot', 'Ombor', 'Katalog', 'Savat', 'Narx',
  'Yetkazib', 'Qanday', 'Tezkor', 'Ommabop', 'Nega', 'Savol'
];

let hardcodedFound = 0;

for (const relPath of CORE_FILES) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) continue;

  const rawCode = fs.readFileSync(fullPath, 'utf-8');
  // Strip comments
  const strippedCode = rawCode
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  const lines = strippedCode.split('\n');
  lines.forEach((line, lineIdx) => {
    // Ignore import lines, routing paths, and URL literals
    const cleanLine = line
      .replace(/import\s+[^;]+;/g, '')
      .replace(/href=["'][^"']*["']/g, '')
      .replace(/startsWith\([^)]*\)/g, '')
      .replace(/\/katalog[^\s"'\`]*/g, '')
      .replace(/\/savat[^\s"'\`]*/g, '')
      .replace(/\/aloqa[^\s"'\`]*/g, '')
      .replace(/['"]\.\.?\/[a-zA-Z0-9_\-\.\/]+['"]/g, '');

    for (const word of FORBIDDEN_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(cleanLine)) {
        console.error(`❌ Hardcoded Uzbek term "${word}" found in ${relPath}:${lineIdx + 1}: ${line.trim()}`);
        hardcodedFound++;
        errors++;
      }
    }
  });
}

if (hardcodedFound === 0) {
  console.log(`✅ Hardcoded Text Guard passed: 0 untranslated Uzbek terms in core home files.`);
}

if (errors > 0) {
  console.error(`\n❌ i18n Guard failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(`✅ i18n Guard passed: ${uzKeys.length} keys with 100% parity across UZ, RU, and EN.`);

