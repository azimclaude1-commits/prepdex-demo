// Language helper. Call sites pass Traditional Chinese and English: L('繁體中文', 'English').
// Simplified Chinese comes from i18n-hans.js (generated from the Traditional strings at build time).
// Other languages are looked up by the English string in the generated dictionary;
// strings with interpolated values are matched against "{0}" templates.
import DICT from './i18n-dict.js';
import HANS from './i18n-hans.js';

export const LANGS = [
  { code: 'zht', label: '繁體中文', short: '繁中', html: 'zh-Hant' },
  { code: 'zhs', label: '简体中文', short: '简中', html: 'zh-CN' },
  { code: 'ja', label: '日本語', short: 'JA', html: 'ja' },
  { code: 'en', label: 'English', short: 'EN', html: 'en' },
  { code: 'ko', label: '한국어', short: 'KO', html: 'ko' },
  { code: 'ms', label: 'Bahasa Melayu', short: 'MS', html: 'ms' },
  { code: 'es', label: 'Español', short: 'ES', html: 'es' },
  { code: 'fil', label: 'Filipino', short: 'FIL', html: 'fil' },
];
const COL = { ko: 0, ja: 1, ms: 2, es: 3, fil: 4 };

export const DEFAULT_LANG = 'zht';
let current = DEFAULT_LANG;
export const setLang = (l) => { current = LANGS.some((x) => x.code === l) ? l : DEFAULT_LANG; };
export const getLang = () => current;

const esc = (s) => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
const TEMPLATES = Object.keys(DICT)
  .filter((k) => /\{\d\}/.test(k))
  .map((k) => ({ k, re: new RegExp('^' + esc(k).replace(/\{(\d)\}/g, '([\\s\\S]+?)') + '$'), order: [...k.matchAll(/\{(\d)\}/g)].map((m) => +m[1]) }))
  .sort((a, b) => b.k.length - a.k.length);

// Simplified Chinese is derived from the Traditional source strings
const HANS_TEMPLATES = Object.keys(HANS)
  .filter((k) => /\{\d\}/.test(k))
  .map((k) => ({ k, re: new RegExp('^' + esc(k).replace(/\{(\d)\}/g, '([\\s\\S]+?)') + '$'), order: [...k.matchAll(/\{(\d)\}/g)].map((m) => +m[1]) }))
  .sort((a, b) => b.k.length - a.k.length);
function toHans(zh) {
  if (HANS[zh]) return HANS[zh];
  for (const t of HANS_TEMPLATES) {
    const m = t.re.exec(zh);
    if (!m) continue;
    const vals = {};
    t.order.forEach((n, i) => { const v = m[i + 1]; vals[n] = HANS[v] ?? v; });
    return HANS[t.k].replace(/\{(\d)\}/g, (_, n) => vals[n] ?? '');
  }
  return zh;
}

const cache = new Map();
function translate(en, col) {
  const hit = DICT[en];
  if (hit) return hit[col];
  for (const t of TEMPLATES) {
    const m = t.re.exec(en);
    if (!m) continue;
    const vals = {};
    t.order.forEach((n, i) => { const v = m[i + 1]; vals[n] = DICT[v] ? DICT[v][col] : v; });
    return DICT[t.k][col].replace(/\{(\d)\}/g, (_, n) => vals[n] ?? '');
  }
  return en;
}

function hans(zh) {
  const key = 'zhs\u0000' + zh;
  let v = cache.get(key);
  if (v === undefined) {
    v = toHans(zh);
    if (cache.size > 4000) cache.clear();
    cache.set(key, v);
  }
  return v;
}

export function L(zh, en) {
  if (current === 'zht' || en == null) return current === 'zhs' ? hans(zh) : zh;
  if (current === 'zhs') return hans(zh);
  if (current === 'en') return en;
  const col = COL[current];
  const key = current + '\u0000' + en;
  let v = cache.get(key);
  if (v === undefined) {
    v = translate(en, col);
    if (cache.size > 4000) cache.clear();
    cache.set(key, v);
  }
  return v;
}
