import { getLang } from './lang.js';

export function fmt(n, dp = 2, opts = {}) {
  if (n == null || !isFinite(n)) return '--';
  const { min = dp, sign = false } = opts;
  const s = Number(n).toLocaleString('en-US', { minimumFractionDigits: Math.min(min, dp), maximumFractionDigits: dp });
  return sign && n > 0 ? '+' + s : s;
}

// Picks sensible decimals for a price.
export function pdp(p) {
  const a = Math.abs(p);
  if (a >= 1000) return 2;
  if (a >= 10) return 3;
  if (a >= 1) return 4;
  if (a >= 0.01) return 5;
  return 6;
}
export const fp = (p) => fmt(p, pdp(p));

// Amount decimals by unit price: expensive coins need more decimals.
export function adp(price) {
  if (price >= 10000) return 6;
  if (price >= 100) return 4;
  if (price >= 1) return 3;
  return 2;
}

export function usd(n, dp = 2) {
  if (n == null || !isFinite(n)) return '--';
  return (n < 0 ? '-$' : '$') + fmt(Math.abs(n), dp);
}

export function compact(n, dp = 2) {
  if (n == null || !isFinite(n)) return '--';
  const a = Math.abs(n);
  const units = { zhs: ['万亿', '亿', '万'], zht: ['兆', '億', '萬'], ja: ['兆', '億', '万'] }[getLang()];
  if (units) {
    if (a >= 1e12) return fmt(n / 1e12, dp) + units[0];
    if (a >= 1e8) return fmt(n / 1e8, dp) + units[1];
    if (a >= 1e4) return fmt(n / 1e4, dp) + units[2];
    return fmt(n, dp);
  }
  if (a >= 1e12) return fmt(n / 1e12, dp) + 'T';
  if (a >= 1e9) return fmt(n / 1e9, dp) + 'B';
  if (a >= 1e6) return fmt(n / 1e6, dp) + 'M';
  if (a >= 1e3) return fmt(n / 1e3, dp) + 'K';
  return fmt(n, dp);
}

export const pct = (n, dp = 2, sign = true) => (n == null || !isFinite(n) ? '--' : fmt(n * 100, dp, { sign }) + '%');

export function pad2(n) { return String(Math.floor(n)).padStart(2, '0'); }

export function countdown(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const unit = { zhs: '天 ', zht: '天 ', ja: '日 ', ko: '일 ', ms: 'h ', es: 'd ', fil: 'a ' }[getLang()] || 'd ';
  return (d > 0 ? d + unit : '') + pad2(h) + ':' + pad2(m) + ':' + pad2(sec);
}

export function dateTime(ts, withSec = false) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}${withSec ? ':' + pad2(d.getSeconds()) : ''}`;
}
export function dateOnly(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function timeOnly(ts) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export const shortAddr = (a) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '');

export function uid(prefix = '') {
  return prefix + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 7);
}

export function randHex(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  return s;
}

// Rounds down to dp decimals (used for "max" amounts so we never exceed a balance).
export function floorTo(n, dp) {
  const f = Math.pow(10, dp);
  return Math.floor(n * f + 1e-9) / f;
}
