// Rebuilds src/core/i18n-dict.js from i18n/translations.json and lists strings that still need translating.
// Usage: node scripts/build-i18n.mjs
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const dict = JSON.parse(fs.readFileSync('i18n/translations.json', 'utf8'));
fs.writeFileSync('src/core/i18n-dict.js', '// Generated from i18n/translations.json by scripts/build-i18n.mjs. Columns: ko, ja, ms, es, fil.\nexport default ' + JSON.stringify(dict) + ';\n');
execFileSync('node', ['scripts/extract-i18n.mjs', 'i18n/keys.json']);
const keys = JSON.parse(fs.readFileSync('i18n/keys.json', 'utf8'));
const missing = keys.filter((k) => !dict[k]);
console.log(`${Object.keys(dict).length} translated, ${missing.length} missing`);
for (const m of missing) console.log('  ' + JSON.stringify(m));
