import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const UZ_MARKERS = ["o'", "g'", 'ta ', ' va ', ' uchun ', "bo'ylab"];

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

if (errors > 0) {
  console.error(`\n❌ i18n Guard failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(`✅ i18n Guard passed: ${uzKeys.length} keys with 100% parity across UZ, RU, and EN.`);
