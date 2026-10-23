// Simulated market engine: random-walk prices, candles, order books and trade prints.
import { useSyncExternalStore } from 'react';
import { COINS, COIN } from './data.js';
import { pdp } from './fmt.js';

const TICK_MS = 1000;
const VOL_SCALE = 0.32;

const m = {
  price: {},
  open24: {},
  high24: {},
  low24: {},
  vol24: {},
  prev: {},
  funding: {},
  version: 0,
  latency: 62,
  gas: 12,
};

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

for (const c of COINS) {
  const p = c.price * (1 + (c.stable ? 0 : (Math.random() - 0.5) * 0.004));
  m.price[c.sym] = p;
  m.prev[c.sym] = p;
  m.open24[c.sym] = p / (1 + c.chg);
  m.high24[c.sym] = Math.max(p, m.open24[c.sym]) * (1 + Math.random() * 0.012 + 0.003);
  m.low24[c.sym] = Math.min(p, m.open24[c.sym]) * (1 - Math.random() * 0.012 - 0.003);
  m.vol24[c.sym] = c.v24;
  m.funding[c.sym] = (Math.random() * 0.00018 - 0.00004);
}

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const getVersion = () => m.version;
export function useMarket() {
  return useSyncExternalStore(subscribe, getVersion);
}

export const price = (sym) => m.price[sym] ?? 0;
export const prevPrice = (sym) => m.prev[sym] ?? 0;
export const pairPrice = (base, quote) => price(base) / price(quote);
export const change24 = (sym) => (m.price[sym] / m.open24[sym]) - 1;
export const high24 = (sym) => m.high24[sym];
export const low24 = (sym) => m.low24[sym];
export const volume24 = (sym) => m.vol24[sym];
export const fundingRate = (sym) => m.funding[sym];
export const netStats = () => ({ latency: m.latency, gas: m.gas, mcap: totalMcap() });

function totalMcap() {
  return 2.43e12 * (m.price.BTC / COIN.BTC.price) * 0.6 + 2.43e12 * 0.4 * (m.price.ETH / COIN.ETH.price);
}

// ----------------------------------------------------------------------------
// Candles
// ----------------------------------------------------------------------------
export const TF = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400 };
const series = new Map(); // key -> { tf, bars: [{time, open, high, low, close, volume}] }
const tzShift = -new Date().getTimezoneOffset() * 60; // show local time on the chart axis

function barVol(sym, sec) {
  const c = COIN[sym];
  if (c.stable) return 0.00005;
  return Math.min(0.06, c.vol * VOL_SCALE * Math.sqrt(sec) * 0.9);
}

export function getCandles(sym, tf) {
  const key = sym + '|' + tf;
  let s = series.get(key);
  if (s) return s.bars;
  const sec = TF[tf];
  const N = 320;
  const nowSec = Math.floor(Date.now() / 1000) + tzShift;
  const lastT = nowSec - (nowSec % sec);
  const sig = barVol(sym, sec);
  const bars = new Array(N);
  let close = m.price[sym];
  const baseVol = (m.vol24[sym] / m.price[sym]) * (sec / 86400);
  for (let i = N - 1; i >= 0; i--) {
    const t = lastT - (N - 1 - i) * sec;
    const drift = gauss() * sig;
    const open = close / Math.exp(drift);
    const wick = Math.abs(gauss()) * sig * 0.6;
    const high = Math.max(open, close) * (1 + wick * Math.random());
    const low = Math.min(open, close) * (1 - wick * Math.random());
    bars[i] = { time: t, open, high, low, close, volume: baseVol * (0.4 + Math.random() * 1.4) };
    close = open;
  }
  s = { tf, sec, bars };
  series.set(key, s);
  return bars;
}

function updateSeries() {
  const nowSec = Math.floor(Date.now() / 1000) + tzShift;
  for (const [key, s] of series) {
    const sym = key.split('|')[0];
    const p = m.price[sym];
    const last = s.bars[s.bars.length - 1];
    const bucket = nowSec - (nowSec % s.sec);
    if (bucket > last.time) {
      s.bars.push({ time: bucket, open: last.close, high: Math.max(last.close, p), low: Math.min(last.close, p), close: p, volume: 0 });
      if (s.bars.length > 600) s.bars.shift();
    } else {
      last.close = p;
      last.high = Math.max(last.high, p);
      last.low = Math.min(last.low, p);
      last.volume += (m.vol24[sym] / p) / 86400 * (0.5 + Math.random());
    }
  }
}

// ----------------------------------------------------------------------------
// Order book & trades
// ----------------------------------------------------------------------------
const books = new Map();
const trades = new Map();

export function tickSize(p) {
  return Math.pow(10, -pdp(p));
}

export function getBook(sym, quotePrice = 1, levels = 14) {
  const mid = m.price[sym] / quotePrice;
  const step = tickSize(mid) * Math.max(1, Math.round(mid * 0.00006 / tickSize(mid)));
  let b = books.get(sym);
  if (!b || b.levels !== levels) {
    b = { levels, asks: [], bids: [] };
    for (let i = 0; i < levels; i++) {
      b.asks.push(Math.exp(gauss() * 0.9) * sizeUnit(sym));
      b.bids.push(Math.exp(gauss() * 0.9) * sizeUnit(sym));
    }
    books.set(sym, b);
  }
  const best = Math.round(mid / step) * step;
  const asks = [], bids = [];
  let ca = 0, cb = 0;
  for (let i = 0; i < levels; i++) {
    ca += b.asks[i];
    cb += b.bids[i];
    asks.push({ price: best + step * (i + 1), size: b.asks[i], total: ca });
    bids.push({ price: best - step * i, size: b.bids[i], total: cb });
  }
  return { asks, bids, mid, step, max: Math.max(ca, cb) };
}

function sizeUnit(sym) {
  return 1800 / m.price[sym];
}

function mutateBooks() {
  for (const [sym, b] of books) {
    for (let i = 0; i < b.levels; i++) {
      if (Math.random() < 0.35) b.asks[i] = Math.exp(gauss() * 0.9) * sizeUnit(sym);
      if (Math.random() < 0.35) b.bids[i] = Math.exp(gauss() * 0.9) * sizeUnit(sym);
    }
  }
}

export function getTrades(sym) {
  let t = trades.get(sym);
  if (!t) {
    t = [];
    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      t.push({ id: Math.random(), price: m.price[sym] * (1 + gauss() * 0.0004), size: Math.exp(gauss()) * sizeUnit(sym) * 0.3, side: Math.random() > 0.5 ? 'buy' : 'sell', ts: now - i * 2100 });
    }
    trades.set(sym, t);
  }
  return t;
}

function pushTrades() {
  for (const [sym, t] of trades) {
    const n = Math.floor(Math.random() * 3) + (Math.random() < 0.6 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const up = m.price[sym] >= m.prev[sym];
      t.unshift({ id: Math.random(), price: m.price[sym], size: Math.exp(gauss()) * sizeUnit(sym) * 0.3, side: Math.random() < (up ? 0.65 : 0.35) ? 'buy' : 'sell', ts: Date.now() });
    }
    if (t.length > 40) t.length = 40;
  }
}

// ----------------------------------------------------------------------------
// Ticker
// ----------------------------------------------------------------------------
function step() {
  for (const c of COINS) {
    const s = c.sym;
    m.prev[s] = m.price[s];
    if (c.stable) {
      m.price[s] = 1 + (Math.random() - 0.5) * 0.0004;
      continue;
    }
    const p = m.price[s];
    const revert = 0.002 * Math.log(c.price / p);
    const next = p * Math.exp(gauss() * c.vol * VOL_SCALE + revert);
    m.price[s] = next;
    if (next > m.high24[s]) m.high24[s] = next;
    if (next < m.low24[s]) m.low24[s] = next;
    m.vol24[s] += c.v24 / 86400 * Math.random() * 2;
  }
  m.latency = Math.round(Math.max(28, Math.min(140, m.latency + gauss() * 6)));
  m.gas = Math.max(6, Math.min(40, +(m.gas + gauss() * 0.6).toFixed(1)));
  updateSeries();
  mutateBooks();
  pushTrades();
  m.version++;
  for (const fn of listeners) fn();
}

// Setting the price directly (used by the demo panel to trigger liquidations etc.)
export function shockPrice(sym, factor) {
  m.price[sym] *= factor;
  updateSeries();
  m.version++;
  for (const fn of listeners) fn();
}

let timer = null;
export function startMarket() {
  if (timer) return;
  timer = setInterval(step, TICK_MS);
}
