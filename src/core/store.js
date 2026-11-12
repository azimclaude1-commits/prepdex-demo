// App state, persistence and all user actions for the Novarix prototype.
import { useSyncExternalStore } from 'react';
import {
  COIN, ONCHAIN_START, PROJECTS, PROJECT, TIERS, STAKE_PRODUCTS, EARLY_REDEEM_PENALTY,
  LEND_MARKETS, borrowRate, supplyRate, NETWORKS, netFee, PLATFORM_TOKEN, WALLETS,
  FREE_DROP, REWARD_SYM, INVITE_REWARD, INVITE_MILESTONES, CHECKIN_REWARDS, SOCIAL_TASKS, SOCIAL_BONUS, QUIZ, QUIZ_REWARD,
} from './data.js';
import { price, pairPrice, volume24, subscribe as subscribeMarket } from './market.js';
import { uid, randHex } from './fmt.js';
import { L } from './lang.js';

const KEY = 'novarix-demo-v2';
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;
export const SPOT_FEE = 0.001;
export const FUT_TAKER = 0.0005;
export const FUT_MAKER = 0.0002;
export const MMR = 0.005;

function fresh() {
  return {
    v: 1,
    epoch: Date.now(),
    clockOffset: 0,
    lang: 'zht',
    langChosen: false,
    theme: null,
    wallet: { connected: false, address: '', provider: '', chain: 'ethereum', onchain: { ...ONCHAIN_START } },
    spot: {},
    frozen: {},
    futures: { USDT: 0 },
    orders: [],
    fills: [],
    positions: [],
    futOrders: [],
    futHistory: [],
    subs: [],
    reminders: {},
    stakes: [],
    lend: { supply: {}, borrow: {}, coll: { USDT: true, USDC: true, ETH: true, BTC: true, SOL: true, NVX: false } },
    otc: [],
    records: [],
    favs: ['BTC', 'ETH', 'SOL'],
    camp: freshCamp(),
  };
}

function freshCamp() {
  return {
    drop: null,
    invites: [],
    inviteClaimed: 0,
    msClaimed: [],
    checkin: { last: null, streak: 0, total: 0, count: 0 },
    social: {},
    socialBonus: false,
    quiz: { passed: false, claimed: false, tries: 0, best: 0 },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      // a language the visitor never picked follows the current default
      if (s && s.v === 1) return { ...fresh(), ...s, ...(s.langChosen ? {} : { lang: fresh().lang }) };
    }
  } catch (e) { /* storage unavailable */ }
  return fresh();
}

let state = load();
const listeners = new Set();
let saveTimer = null;

function save() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}
function emit() {
  for (const fn of listeners) fn();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 300);
}
// write pending changes before the page is closed or reloaded
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => saveTimer && save());
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && saveTimer && save());
}

export function getState() { return state; }
export function set(fn) {
  const draft = structuredClone(state);
  fn(draft);
  state = draft;
  emit();
}
export function useApp() {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn); }, () => state);
}

export function resetAll() {
  const keep = { lang: state.lang, theme: state.theme };
  state = { ...fresh(), ...keep };
  emit();
}

// ----------------------------------------------------------------------------
// Time (the demo panel can fast-forward the clock)
// ----------------------------------------------------------------------------
export const now = () => Date.now() + (state.clockOffset || 0);
export function fastForward(ms) {
  set((s) => { s.clockOffset = (s.clockOffset || 0) + ms; });
}

// ----------------------------------------------------------------------------
// UI store (not persisted): route, modals, toasts
// ----------------------------------------------------------------------------
let ui = { route: parseHash(), modal: null, toasts: [] };
const uiListeners = new Set();
function uiEmit() { for (const fn of uiListeners) fn(); }
export function useUI() {
  return useSyncExternalStore((fn) => { uiListeners.add(fn); return () => uiListeners.delete(fn); }, () => ui);
}

function parseHash() {
  const h = (typeof location !== 'undefined' ? location.hash : '').replace(/^#/, '');
  if (!h) return { page: 'home' };
  const [page, arg] = h.split('-');
  return { page, arg: arg || undefined };
}

export function go(page, arg) {
  ui = { ...ui, route: { page, arg } };
  try {
    const hash = arg ? `${page}-${arg}` : page;
    if (location.hash !== '#' + hash) history.replaceState(null, '', '#' + hash);
  } catch (e) { /* ignore */ }
  uiEmit();
  try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
}
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => { ui = { ...ui, route: parseHash() }; uiEmit(); });
}

export function openModal(name, props = {}) {
  ui = { ...ui, modal: { name, props } };
  uiEmit();
}
export function closeModal() {
  ui = { ...ui, modal: null };
  uiEmit();
}

export function toast(msg, kind = 'ok', sub) {
  const id = uid('t');
  ui = { ...ui, toasts: [...ui.toasts, { id, msg, kind, sub }].slice(-4) };
  uiEmit();
  setTimeout(() => {
    ui = { ...ui, toasts: ui.toasts.filter((t) => t.id !== id) };
    uiEmit();
  }, 4200);
}

// ----------------------------------------------------------------------------
// Preferences
// ----------------------------------------------------------------------------
export function setLangPref(l) {
  // notifications already on screen are in the old language, so clear them
  ui = { ...ui, toasts: [] };
  uiEmit();
  set((s) => { s.lang = l; s.langChosen = true; });
}
export const setTheme = (t) => set((s) => { s.theme = t; });
export const toggleFav = (sym) => set((s) => {
  s.favs = s.favs.includes(sym) ? s.favs.filter((x) => x !== sym) : [...s.favs, sym];
});

// ----------------------------------------------------------------------------
// Wallet connection
// ----------------------------------------------------------------------------
export function prepareAddress() {
  if (!state.wallet.address) set((s) => { s.wallet.address = '0x' + randHex(40); });
  return state.wallet.address;
}
export function connectWallet(provider) {
  set((s) => {
    s.wallet.connected = true;
    s.wallet.provider = provider;
    if (!s.wallet.address) s.wallet.address = '0x' + randHex(40);
  });
}
export function disconnectWallet() {
  set((s) => { s.wallet.connected = false; });
}
// Real wallet via WalletConnect: the app follows the wallet's connection state and address.
// Returns 'connected' when a new connection (or a different account) was picked up.
export function syncWallet({ address, isConnected, walletName, walletIcon }) {
  const w = state.wallet;
  if (isConnected && address) {
    const first = (walletName || '').toLowerCase().split(' ')[0];
    const known = first ? WALLETS.find((x) => x.name.toLowerCase().split(' ')[0] === first) : null;
    const provider = known ? known.id : 'external';
    const fresh = !w.connected || w.address.toLowerCase() !== address.toLowerCase();
    if (!fresh && w.provider === provider && w.providerName === walletName && w.providerIcon === walletIcon) return null;
    set((s) => {
      s.wallet.connected = true;
      s.wallet.address = address;
      s.wallet.provider = provider;
      s.wallet.providerName = walletName || '';
      s.wallet.providerIcon = walletIcon || '';
    });
    return fresh ? 'connected' : null;
  }
  if (w.connected) set((s) => { s.wallet.connected = false; });
  return null;
}
export function switchChain(chain) {
  set((s) => { s.wallet.chain = chain; });
}
export function faucet() {
  set((s) => {
    for (const [k, v] of Object.entries(ONCHAIN_START)) s.wallet.onchain[k] = (s.wallet.onchain[k] || 0) + v;
  });
}

// Deterministic per-user deposit address for each network
export function depositAddress(net) {
  const seed = (state.wallet.address || '0x0') + net;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  const pick = (chars, n) => Array.from({ length: n }, () => chars[Math.floor(rnd() * chars.length)]).join('');
  const b58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  switch (NETWORKS[net].kind) {
    case 'tron': return 'T' + pick(b58, 33);
    case 'sol': return pick(b58, 44);
    case 'btc': return 'bc1q' + pick('023456789acdefghjklmnpqrstuvwxyz', 38);
    case 'ton': return 'UQ' + pick(b58 + '-_', 46);
    default: return '0x' + pick('0123456789abcdef', 40);
  }
}

// ----------------------------------------------------------------------------
// Balances
// ----------------------------------------------------------------------------
const add = (map, sym, amt) => { map[sym] = +((map[sym] || 0) + amt).toFixed(10); if (Math.abs(map[sym]) < 1e-10) map[sym] = 0; };
export const bal = (sym) => state.spot[sym] || 0;
export const frozenBal = (sym) => state.frozen[sym] || 0;

export function quickFund() {
  set((s) => {
    add(s.spot, 'USDT', 10000);
    add(s.spot, 'USDC', 5000);
    add(s.spot, PLATFORM_TOKEN, 25000);
    s.records.unshift({ id: uid('r'), kind: 'deposit', sym: 'USDT', amount: 10000, net: 'TRC20', status: 'done', ts: now(), txid: randHex(64), demo: true });
  });
}

// ----------------------------------------------------------------------------
// Deposits & withdrawals
// ----------------------------------------------------------------------------
export function depositFromWallet(sym, net, amount) {
  if (!state.wallet.connected) return { err: L('請先連接錢包', 'Connect your wallet first') };
  if (!(amount > 0)) return { err: L('請輸入金額', 'Enter an amount') };
  if ((state.wallet.onchain[sym] || 0) < amount) return { err: L('錢包餘額不足', 'Insufficient wallet balance') };
  const id = uid('r');
  set((s) => {
    add(s.wallet.onchain, sym, -amount);
    s.records.unshift({ id, kind: 'deposit', sym, net, amount, address: depositAddress(net), status: 'confirming', conf: 0, need: NETWORKS[net].conf, ts: now(), txid: (NETWORKS[net].kind === 'evm' ? '0x' : '') + randHex(64), started: Date.now() });
  });
  return { ok: true, id };
}

// Simulates an external transfer arriving at the deposit address (for users without the plugin wallet)
export function simulateIncoming(sym, net, amount) {
  const id = uid('r');
  set((s) => {
    s.records.unshift({ id, kind: 'deposit', sym, net, amount, address: depositAddress(net), status: 'confirming', conf: 0, need: NETWORKS[net].conf, ts: now(), txid: randHex(64), started: Date.now(), external: true });
  });
  return { ok: true, id };
}

export function withdraw(sym, net, address, amount) {
  const fee = netFee(net, sym);
  if (!address || address.length < 20) return { err: L('請輸入有效的提幣地址', 'Enter a valid address') };
  if (!(amount > fee)) return { err: L('提幣數量需大於手續費', 'Amount must exceed the network fee') };
  if (bal(sym) < amount) return { err: L('可用餘額不足', 'Insufficient available balance') };
  const id = uid('r');
  set((s) => {
    add(s.spot, sym, -amount);
    s.records.unshift({ id, kind: 'withdraw', sym, net, amount, fee, address, status: 'processing', conf: 0, need: NETWORKS[net].conf, ts: now(), started: Date.now(), toSelf: address.toLowerCase() === s.wallet.address.toLowerCase() });
  });
  return { ok: true, id };
}

export function transfer(sym, from, to, amount) {
  const src = from === 'spot' ? state.spot : state.futures;
  if (!(amount > 0)) return { err: L('請輸入金額', 'Enter an amount') };
  if ((src[sym] || 0) < amount) return { err: L('餘額不足', 'Insufficient balance') };
  set((s) => {
    add(from === 'spot' ? s.spot : s.futures, sym, -amount);
    add(to === 'spot' ? s.spot : s.futures, sym, amount);
    s.records.unshift({ id: uid('r'), kind: 'transfer', sym, amount, from, to, status: 'done', ts: now() });
  });
  return { ok: true };
}

export function convert(from, to, amount, rate) {
  if (!(amount > 0)) return { err: L('請輸入金額', 'Enter an amount') };
  if (bal(from) < amount) return { err: L('餘額不足', 'Insufficient balance') };
  const out = amount * rate;
  set((s) => {
    add(s.spot, from, -amount);
    add(s.spot, to, out);
    s.records.unshift({ id: uid('r'), kind: 'convert', sym: from, to, amount, out, rate, status: 'done', ts: now() });
  });
  return { ok: true, out };
}

// ----------------------------------------------------------------------------
// Swap (spot balances, routed through USDT when neither side is a stablecoin)
// ----------------------------------------------------------------------------
export const SWAP_FEE = 0.001;
export const SWAP_TOKENS = ['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'TON', 'ADA', 'AVAX', 'LINK', 'TRX', 'DOT', 'ARB', 'NVX', 'ORBX', 'HALO', 'TESS', 'LUMN', 'ZEPH'];
export const swapFee = () => SWAP_FEE * (1 - tier().fee);
export function swapRoute(from, to) {
  if (COIN[from].stable || COIN[to].stable) return [from, to];
  return [from, 'USDT', to];
}
// Quote at the current market price; price impact grows with trade size versus each hop's pool depth
export function swapQuote(from, to, amount) {
  const route = swapRoute(from, to);
  const usdIn = (amount || 0) * price(from);
  let impact = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const sym = COIN[route[i]].stable ? route[i + 1] : route[i];
    const depth = Math.max(150000, volume24(sym) * 0.004);
    impact += usdIn / (usdIn + depth);
  }
  const fee = swapFee();
  const mid = price(from) / price(to);
  const out = (amount || 0) * mid * (1 - fee) * (1 - impact);
  return { route, mid, out, fee, feeAmt: (amount || 0) * fee, impact, usdIn, rate: amount ? out / amount : mid };
}
export function swapTokens(from, to, amount, minOut) {
  if (!state.wallet.connected) return { err: L('請先連接錢包', 'Connect your wallet first') };
  if (!(amount > 0)) return { err: L('請輸入金額', 'Enter an amount') };
  if (bal(from) < amount) return { err: L(`${from} 餘額不足`, `Insufficient ${from}`) };
  const q = swapQuote(from, to, amount);
  if (q.out < minOut) return { err: L('價格變動超過滑點設定，請重新報價', 'The price moved beyond your slippage. Get a new quote.'), slipped: true };
  set((s) => {
    add(s.spot, from, -amount);
    add(s.spot, to, q.out);
    s.records.unshift({ id: uid('r'), kind: 'swap', sym: from, to, amount, out: q.out, rate: q.rate, route: q.route, fee: q.feeAmt, impact: q.impact, status: 'done', ts: now() });
  });
  return { ok: true, out: q.out };
}

// ----------------------------------------------------------------------------
// Spot trading
// ----------------------------------------------------------------------------
export function tier() {
  const staked = state.stakes.filter((x) => x.sym === PLATFORM_TOKEN && x.status === 'active').reduce((a, x) => a + x.amount, 0);
  let t = TIERS[0];
  for (const x of TIERS) if (staked >= x.min) t = x;
  const idx = TIERS.indexOf(t);
  return { ...t, staked, next: TIERS[idx + 1] || null };
}
export const spotFee = () => SPOT_FEE * (1 - tier().fee);

export function placeSpot({ base, quote, side, type, price: px, amount }) {
  if (!state.wallet.connected) return { err: L('請先連接錢包', 'Connect your wallet first') };
  if (!(amount > 0)) return { err: L('請輸入數量', 'Enter an amount') };
  const mkt = pairPrice(base, quote);
  const fee = spotFee();
  if (type === 'market') {
    const fillPx = mkt * (side === 'buy' ? 1.0004 : 0.9996);
    const cost = fillPx * amount;
    if (side === 'buy' && bal(quote) < cost) return { err: L(`${quote} 餘額不足`, `Insufficient ${quote}`) };
    if (side === 'sell' && bal(base) < amount) return { err: L(`${base} 餘額不足`, `Insufficient ${base}`) };
    const id = uid('o');
    set((s) => {
      if (side === 'buy') { add(s.spot, quote, -cost); add(s.spot, base, amount * (1 - fee)); }
      else { add(s.spot, base, -amount); add(s.spot, quote, cost * (1 - fee)); }
      const o = { id, base, quote, side, type, price: fillPx, amount, filled: amount, avg: fillPx, status: 'filled', ts: now(), fee: side === 'buy' ? amount * fee : cost * fee };
      s.orders.unshift(o);
      s.fills.unshift({ id: uid('f'), oid: id, base, quote, side, price: fillPx, amount, fee: o.fee, feeSym: side === 'buy' ? base : quote, ts: now(), role: 'taker' });
    });
    return { ok: true, filled: true, price: fillPx };
  }
  if (!(px > 0)) return { err: L('請輸入價格', 'Enter a price') };
  const lock = side === 'buy' ? px * amount : amount;
  const lockSym = side === 'buy' ? quote : base;
  if (bal(lockSym) < lock) return { err: L(`${lockSym} 餘額不足`, `Insufficient ${lockSym}`) };
  const id = uid('o');
  set((s) => {
    add(s.spot, lockSym, -lock);
    add(s.frozen, lockSym, lock);
    s.orders.unshift({ id, base, quote, side, type: 'limit', price: px, amount, filled: 0, status: 'open', ts: now() });
  });
  return { ok: true, id };
}

export function cancelSpot(id) {
  set((s) => {
    const o = s.orders.find((x) => x.id === id && x.status === 'open');
    if (!o) return;
    const lockSym = o.side === 'buy' ? o.quote : o.base;
    const lock = o.side === 'buy' ? o.price * o.amount : o.amount;
    add(s.frozen, lockSym, -lock);
    add(s.spot, lockSym, lock);
    o.status = 'cancelled';
  });
}
export function cancelAllSpot() {
  for (const o of state.orders.filter((x) => x.status === 'open')) cancelSpot(o.id);
}

function matchSpot(s, events) {
  const fee = spotFee();
  for (const o of s.orders) {
    if (o.status !== 'open') continue;
    const mkt = pairPrice(o.base, o.quote);
    const hit = o.side === 'buy' ? mkt <= o.price : mkt >= o.price;
    if (!hit) continue;
    if (o.side === 'buy') {
      add(s.frozen, o.quote, -o.price * o.amount);
      add(s.spot, o.base, o.amount * (1 - fee));
    } else {
      add(s.frozen, o.base, -o.amount);
      add(s.spot, o.quote, o.price * o.amount * (1 - fee));
    }
    o.status = 'filled';
    o.filled = o.amount;
    o.avg = o.price;
    s.fills.unshift({ id: uid('f'), oid: o.id, base: o.base, quote: o.quote, side: o.side, price: o.price, amount: o.amount, fee: o.side === 'buy' ? o.amount * fee : o.price * o.amount * fee, feeSym: o.side === 'buy' ? o.base : o.quote, ts: now(), role: 'maker' });
    events.push([L('限價單已成交', 'Limit order filled'), `${o.side === 'buy' ? L('買入', 'Buy') : L('賣出', 'Sell')} ${o.amount} ${o.base} @ ${o.price}`]);
  }
}

// ----------------------------------------------------------------------------
// Futures (USDT-margined perpetuals, one-way mode)
// ----------------------------------------------------------------------------
export const futBal = () => state.futures.USDT || 0;

export function liqPrice(p, avail = 0) {
  const extra = p.mode === 'cross' ? avail : 0;
  const notional = p.size * p.entry;
  const buffer = (p.margin + extra - MMR * notional) / p.size;
  return p.side === 'long' ? Math.max(0, p.entry - buffer) : p.entry + buffer;
}
export function pnl(p, mark = price(p.sym)) {
  return (p.side === 'long' ? mark - p.entry : p.entry - mark) * p.size;
}

function openPosition(s, { sym, side, size, px, lev, mode, tp, sl, fee }) {
  const events = [];
  // reduce an opposite position first (one-way mode)
  let remaining = size;
  const opp = s.positions.find((p) => p.sym === sym && p.side !== side);
  if (opp) {
    const closeSize = Math.min(opp.size, remaining);
    const realized = (opp.side === 'long' ? px - opp.entry : opp.entry - px) * closeSize;
    const marginBack = opp.margin * (closeSize / opp.size);
    add(s.futures, 'USDT', marginBack + realized - closeSize * px * fee);
    s.futHistory.unshift({ id: uid('h'), sym, side: opp.side, size: closeSize, entry: opp.entry, exit: px, pnl: realized, lev: opp.lev, ts: now(), kind: 'close' });
    opp.margin -= marginBack;
    opp.size -= closeSize;
    remaining -= closeSize;
    if (opp.size <= 1e-12) s.positions = s.positions.filter((p) => p !== opp);
  }
  if (remaining > 1e-12) {
    const margin = (remaining * px) / lev;
    add(s.futures, 'USDT', -(margin + remaining * px * fee));
    const same = s.positions.find((p) => p.sym === sym && p.side === side);
    if (same) {
      same.entry = (same.entry * same.size + px * remaining) / (same.size + remaining);
      same.size += remaining;
      same.margin += margin;
      if (tp) same.tp = tp;
      if (sl) same.sl = sl;
    } else {
      s.positions.push({ id: uid('p'), sym, side, size: remaining, entry: px, lev, margin, mode, tp: tp || null, sl: sl || null, ts: now() });
    }
    s.futHistory.unshift({ id: uid('h'), sym, side, size: remaining, entry: px, exit: null, pnl: 0, lev, ts: now(), kind: 'open' });
  }
  return events;
}

export function placeFutures({ sym, side, type, price: px, size, lev, mode, tp, sl }) {
  if (!state.wallet.connected) return { err: L('請先連接錢包', 'Connect your wallet first') };
  if (!(size > 0)) return { err: L('請輸入數量', 'Enter a size') };
  const mark = price(sym);
  const fillPx = type === 'market' ? mark * (side === 'long' ? 1.0003 : 0.9997) : px;
  if (!(fillPx > 0)) return { err: L('請輸入價格', 'Enter a price') };
  const opp = state.positions.find((p) => p.sym === sym && p.side !== side);
  const netOpen = Math.max(0, size - (opp ? opp.size : 0));
  const need = (netOpen * fillPx) / lev + size * fillPx * FUT_TAKER;
  if (futBal() < need) return { err: L('合約帳戶保證金不足，請先劃轉', 'Not enough margin. Transfer funds to futures first.') };
  if (type === 'market') {
    set((s) => openPosition(s, { sym, side, size, px: fillPx, lev, mode, tp, sl, fee: FUT_TAKER }));
    return { ok: true, filled: true, price: fillPx };
  }
  const id = uid('fo');
  set((s) => {
    const lock = (size * px) / lev;
    add(s.futures, 'USDT', -lock);
    s.futOrders.unshift({ id, sym, side, price: px, size, lev, mode, tp, sl, lock, ts: now(), status: 'open' });
  });
  return { ok: true, id };
}

export function cancelFutOrder(id) {
  set((s) => {
    const o = s.futOrders.find((x) => x.id === id);
    if (!o) return;
    add(s.futures, 'USDT', o.lock);
    s.futOrders = s.futOrders.filter((x) => x.id !== id);
  });
}

export function closePosition(id, frac = 1) {
  set((s) => {
    const p = s.positions.find((x) => x.id === id);
    if (!p) return;
    const mark = price(p.sym);
    const size = p.size * frac;
    const realized = (p.side === 'long' ? mark - p.entry : p.entry - mark) * size;
    const marginBack = p.margin * frac;
    add(s.futures, 'USDT', marginBack + realized - size * mark * FUT_TAKER);
    s.futHistory.unshift({ id: uid('h'), sym: p.sym, side: p.side, size, entry: p.entry, exit: mark, pnl: realized, lev: p.lev, ts: now(), kind: 'close' });
    p.size -= size;
    p.margin -= marginBack;
    if (frac >= 1 || p.size <= 1e-12) s.positions = s.positions.filter((x) => x.id !== id);
  });
}
export function closeAll() {
  for (const p of state.positions) closePosition(p.id, 1);
}
export function setTpSl(id, tp, sl) {
  set((s) => {
    const p = s.positions.find((x) => x.id === id);
    if (p) { p.tp = tp || null; p.sl = sl || null; }
  });
}
export function addMargin(id, amt) {
  if (!(amt > 0) || futBal() < amt) return { err: L('可用保證金不足', 'Not enough available margin') };
  set((s) => {
    const p = s.positions.find((x) => x.id === id);
    if (!p) return;
    add(s.futures, 'USDT', -amt);
    p.margin += amt;
  });
  return { ok: true };
}

function matchFutures(s, events) {
  // pending limit orders
  for (const o of [...s.futOrders]) {
    const mark = price(o.sym);
    const hit = o.side === 'long' ? mark <= o.price : mark >= o.price;
    if (!hit) continue;
    add(s.futures, 'USDT', o.lock);
    s.futOrders = s.futOrders.filter((x) => x.id !== o.id);
    openPosition(s, { sym: o.sym, side: o.side, size: o.size, px: o.price, lev: o.lev, mode: o.mode, tp: o.tp, sl: o.sl, fee: FUT_MAKER });
    events.push([L('合約限價單已成交', 'Futures limit order filled'), `${o.sym} ${o.side === 'long' ? L('開多', 'Long') : L('開空', 'Short')} ${o.size}`]);
  }
  // TP / SL / liquidation
  for (const p of [...s.positions]) {
    const mark = price(p.sym);
    const avail = s.futures.USDT || 0;
    const liq = liqPrice(p, avail);
    const liquidated = p.side === 'long' ? mark <= liq : mark >= liq;
    if (liquidated) {
      const loss = p.mode === 'cross' ? Math.max(0, -pnl(p, mark) - p.margin) : 0;
      add(s.futures, 'USDT', -Math.min(loss, s.futures.USDT || 0));
      s.futHistory.unshift({ id: uid('h'), sym: p.sym, side: p.side, size: p.size, entry: p.entry, exit: mark, pnl: -p.margin - loss, lev: p.lev, ts: now(), kind: 'liq' });
      s.positions = s.positions.filter((x) => x !== p);
      events.push([L('倉位已被強平', 'Position liquidated'), `${p.sym} ${p.lev}x`, 'err']);
      continue;
    }
    const tpHit = p.tp && (p.side === 'long' ? mark >= p.tp : mark <= p.tp);
    const slHit = p.sl && (p.side === 'long' ? mark <= p.sl : mark >= p.sl);
    if (tpHit || slHit) {
      const realized = pnl(p, mark);
      add(s.futures, 'USDT', p.margin + realized - p.size * mark * FUT_TAKER);
      s.futHistory.unshift({ id: uid('h'), sym: p.sym, side: p.side, size: p.size, entry: p.entry, exit: mark, pnl: realized, lev: p.lev, ts: now(), kind: tpHit ? 'tp' : 'sl' });
      s.positions = s.positions.filter((x) => x !== p);
      events.push([tpHit ? L('止盈觸發', 'Take-profit hit') : L('止損觸發', 'Stop-loss hit'), `${p.sym} PnL ${realized.toFixed(2)} USDT`, tpHit ? 'ok' : 'warn']);
    }
  }
}

// ----------------------------------------------------------------------------
// Launchpad
// ----------------------------------------------------------------------------
export function projTimes(p) {
  return { start: state.epoch + p.start * HOUR, end: state.epoch + p.end * HOUR };
}
export function phase(p, t = now()) {
  if (p.status === 'ended') return 'ended';
  const { start, end } = projTimes(p);
  if (t < start) return 'upcoming';
  if (t < end) return 'live';
  return 'ended';
}
export function userSubTotal(pid) {
  return state.subs.filter((x) => x.pid === pid).reduce((a, x) => a + x.amount, 0);
}
export function raised(p, t = now()) {
  if (p.status === 'ended') return p.hardCap * p.finalRatio;
  const { start, end } = projTimes(p);
  const f = Math.max(0, Math.min(1, (t - start) / (end - start)));
  if (t < start) return 0;
  const [c0, c1] = p.raiseCurve;
  const eased = 1 - Math.pow(1 - f, 1.6);
  return p.hardCap * (c0 + (c1 - c0) * eased) + userSubTotal(p.id);
}
export const participants = (p) => Math.round(raised(p) / 412) + (p.status === 'ended' ? 0 : 37);
export const maxAlloc = (p) => p.baseMax * tier().mult;

export function subscribeSale(pid, amount) {
  const p = PROJECT[pid];
  if (!state.wallet.connected) return { err: L('請先連接錢包', 'Connect your wallet first') };
  if (phase(p) !== 'live') return { err: L('當前不在認購期', 'The sale is not open') };
  if (!(amount >= p.minBuy)) return { err: L(`最低認購 ${p.minBuy} USDC`, `Minimum is ${p.minBuy} USDC`) };
  if (userSubTotal(pid) + amount > maxAlloc(p) + 1e-9) return { err: L('超過你的等級可認購上限', 'Exceeds your tier cap') };
  if (bal('USDC') < amount) return { err: L('USDC 餘額不足，請先充值或閃兌', 'Not enough USDC. Deposit or convert first.') };
  set((s) => {
    add(s.spot, 'USDC', -amount);
    s.subs.push({ id: uid('s'), pid, amount, ts: now(), status: 'pending' });
  });
  return { ok: true };
}

export function toggleReminder(pid) {
  set((s) => { s.reminders[pid] = !s.reminders[pid]; });
}

export function vestUnlocked(p, sub, t = now()) {
  if (sub.status !== 'settled') return 0;
  const { end } = projTimes(p);
  const v = p.vesting;
  const startVest = end + v.cliff * 30 * DAY;
  const lin = Math.max(0, Math.min(1, (t - startVest) / (v.months * 30 * DAY)));
  return sub.tokens * (v.tge + (1 - v.tge) * lin);
}

export function claimVested(subId) {
  let got = 0;
  set((s) => {
    const sub = s.subs.find((x) => x.id === subId);
    if (!sub) return;
    const p = PROJECT[sub.pid];
    const unlocked = vestUnlocked(p, sub);
    got = unlocked - sub.claimed;
    if (got <= 1e-9) { got = 0; return; }
    sub.claimed = unlocked;
    add(s.spot, p.sym, got);
  });
  return got;
}

function settleSales(s, events) {
  for (const sub of s.subs) {
    if (sub.status !== 'pending') continue;
    const p = PROJECT[sub.pid];
    if (phase(p) !== 'ended') continue;
    const ratio = Math.max(1, raised(p, projTimes(p).end + 1) / p.hardCap);
    const used = sub.amount / ratio;
    const refund = sub.amount - used;
    const tokens = used / p.price;
    sub.status = 'settled';
    sub.ratio = ratio;
    sub.used = used;
    sub.refund = refund;
    sub.tokens = tokens;
    sub.claimed = tokens * p.vesting.tge;
    add(s.spot, 'USDC', refund);
    add(s.spot, p.sym, sub.claimed);
    events.push([L(`${p.sym} 認購已結算`, `${p.sym} sale settled`), L(`獲配 ${tokens.toFixed(2)} ${p.sym}，退還 ${refund.toFixed(2)} USDC`, `Allocated ${tokens.toFixed(2)} ${p.sym}, refunded ${refund.toFixed(2)} USDC`)]);
  }
}

// ----------------------------------------------------------------------------
// Staking
// ----------------------------------------------------------------------------
export function stakeReward(x, t = now()) {
  if (x.status !== 'active') return 0;
  const endT = x.days ? Math.min(t, x.start + x.days * DAY) : t;
  return x.amount * x.apr * Math.max(0, endT - x.lastClaim) / YEAR;
}
export const matured = (x, t = now()) => x.days > 0 && t >= x.start + x.days * DAY;

export function stake(pid, amount) {
  const prod = STAKE_PRODUCTS.find((x) => x.id === pid);
  if (!state.wallet.connected) return { err: L('請先連接錢包', 'Connect your wallet first') };
  if (!(amount >= prod.min)) return { err: L(`最低 ${prod.min} ${prod.sym}`, `Minimum ${prod.min} ${prod.sym}`) };
  if (bal(prod.sym) < amount) return { err: L(`${prod.sym} 餘額不足`, `Insufficient ${prod.sym}`) };
  set((s) => {
    add(s.spot, prod.sym, -amount);
    const t = now();
    s.stakes.unshift({ id: uid('k'), pid, sym: prod.sym, amount, apr: prod.apr, days: prod.days, start: t, lastClaim: t, earned: 0, status: 'active' });
  });
  return { ok: true };
}

export function claimStake(id) {
  let got = 0;
  set((s) => {
    const x = s.stakes.find((k) => k.id === id);
    if (!x) return;
    got = stakeReward(x);
    const t = now();
    x.lastClaim = x.days ? Math.min(t, x.start + x.days * DAY) : t;
    x.earned += got;
    add(s.spot, x.sym, got);
  });
  return got;
}

export function redeemStake(id) {
  let out = null;
  set((s) => {
    const x = s.stakes.find((k) => k.id === id);
    if (!x || x.status !== 'active') return;
    const early = x.days > 0 && !matured(x);
    let r = stakeReward(x);
    if (early) r *= 1 - EARLY_REDEEM_PENALTY;
    add(s.spot, x.sym, x.amount + r);
    x.earned += r;
    x.status = 'redeemed';
    x.redeemedAt = now();
    out = { principal: x.amount, reward: r, early };
  });
  return out;
}

// ----------------------------------------------------------------------------
// Lending
// ----------------------------------------------------------------------------
export const LMKT = Object.fromEntries(LEND_MARKETS.map((x) => [x.sym, x]));

function rawPos(kind, sym) { return state.lend[kind][sym]; }
export function poolStats(sym) {
  const mk = LMKT[sym];
  const us = lendAmount('supply', sym);
  const ub = lendAmount('borrow', sym);
  const supply = mk.supply + us;
  const borrow = mk.borrow + ub;
  const u = Math.min(0.99, borrow / supply);
  return { supply, borrow, u, bApr: borrowRate(mk, u), sApr: supplyRate(mk, u), avail: supply - borrow };
}
export function lendAmount(kind, sym, t = now()) {
  const p = rawPos(kind, sym);
  if (!p || !p.amt) return 0;
  const mk = LMKT[sym];
  const u = Math.min(0.99, (mk.borrow + (state.lend.borrow[sym]?.amt || 0)) / (mk.supply + (state.lend.supply[sym]?.amt || 0)));
  const r = kind === 'supply' ? supplyRate(mk, u) : borrowRate(mk, u);
  return p.amt * (1 + r * Math.max(0, t - p.ts) / YEAR);
}
export function lendSummary(t = now()) {
  let supplied = 0, borrowed = 0, power = 0, liqLimit = 0, earnY = 0, costY = 0;
  for (const mk of LEND_MARKETS) {
    const sp = lendAmount('supply', mk.sym, t) * price(mk.sym);
    const bp = lendAmount('borrow', mk.sym, t) * price(mk.sym);
    const st = poolStats(mk.sym);
    supplied += sp;
    borrowed += bp;
    earnY += sp * st.sApr;
    costY += bp * st.bApr;
    if (state.lend.coll[mk.sym]) { power += sp * mk.ltv; liqLimit += sp * mk.lt; }
  }
  const hf = borrowed > 0 ? liqLimit / borrowed : Infinity;
  const netApy = supplied > 0 ? (earnY - costY) / supplied : 0;
  return { supplied, borrowed, power, liqLimit, hf, used: power > 0 ? borrowed / power : 0, netApy, avail: Math.max(0, power - borrowed) };
}

function settleLend(s, kind, sym) {
  const cur = lendAmountFrom(s, kind, sym);
  s.lend[kind][sym] = { amt: cur, ts: now() };
}
function lendAmountFrom(s, kind, sym) {
  const prev = state;
  state = s;
  const v = lendAmount(kind, sym);
  state = prev;
  return v;
}

export function lendAction(action, sym, amount) {
  if (!state.wallet.connected) return { err: L('請先連接錢包', 'Connect your wallet first') };
  if (!(amount > 0)) return { err: L('請輸入金額', 'Enter an amount') };
  const mk = LMKT[sym];
  const pxv = price(sym);
  const sum = lendSummary();
  if (action === 'supply' && bal(sym) < amount) return { err: L('錢包可用餘額不足', 'Insufficient balance') };
  if (action === 'withdraw') {
    const have = lendAmount('supply', sym);
    if (amount > have + 1e-9) return { err: L('超過已存入數量', 'More than supplied') };
    if (state.lend.coll[sym] && sum.borrowed > 0) {
      const newLiq = sum.liqLimit - amount * pxv * mk.lt;
      if (newLiq / sum.borrowed < 1.05) return { err: L('取出後健康度過低', 'Health factor would be too low') };
    }
  }
  if (action === 'borrow') {
    if (amount * pxv > sum.avail + 1e-6) return { err: L('超過可借額度', 'Exceeds borrow limit') };
    if (amount > poolStats(sym).avail) return { err: L('資金池流動性不足', 'Not enough pool liquidity') };
  }
  if (action === 'repay') {
    const owe = lendAmount('borrow', sym);
    if (amount > owe + 1e-9) amount = owe;
    if (bal(sym) < amount) return { err: L('餘額不足以還款', 'Insufficient balance to repay') };
  }
  set((s) => {
    const kind = action === 'supply' || action === 'withdraw' ? 'supply' : 'borrow';
    settleLend(s, kind, sym);
    const pos = s.lend[kind][sym];
    if (action === 'supply') { add(s.spot, sym, -amount); pos.amt += amount; }
    if (action === 'withdraw') { pos.amt = Math.max(0, pos.amt - amount); add(s.spot, sym, amount); }
    if (action === 'borrow') { pos.amt += amount; add(s.spot, sym, amount); }
    if (action === 'repay') { pos.amt = Math.max(0, pos.amt - amount); add(s.spot, sym, -amount); if (pos.amt < 1e-9) pos.amt = 0; }
    s.records.unshift({ id: uid('r'), kind: 'lend', action, sym, amount, status: 'done', ts: now() });
  });
  return { ok: true };
}
export function toggleCollateral(sym) {
  const sum = lendSummary();
  const on = state.lend.coll[sym];
  if (on && sum.borrowed > 0) {
    const sp = lendAmount('supply', sym) * price(sym);
    if ((sum.liqLimit - sp * LMKT[sym].lt) / sum.borrowed < 1.05) return { err: L('關閉後健康度過低', 'Health factor would be too low') };
  }
  set((s) => { s.lend.coll[sym] = !on; });
  return { ok: true };
}

function liquidateLend(s, events) {
  const prev = state;
  state = s;
  const sum = lendSummary();
  state = prev;
  if (!(sum.borrowed > 0) || sum.hf >= 1) return;
  // repay half the debt with collateral plus a 5% bonus to the liquidator
  let toRepayUsd = sum.borrowed * 0.5;
  for (const mk of LEND_MARKETS) {
    const b = s.lend.borrow[mk.sym];
    if (!b?.amt) continue;
    settleLend(s, 'borrow', mk.sym);
    const repayUsd = Math.min(toRepayUsd, s.lend.borrow[mk.sym].amt * price(mk.sym));
    s.lend.borrow[mk.sym].amt -= repayUsd / price(mk.sym);
    toRepayUsd -= repayUsd;
    let seizeUsd = repayUsd * 1.05;
    for (const ck of LEND_MARKETS) {
      const c = s.lend.supply[ck.sym];
      if (!c?.amt || !s.lend.coll[ck.sym]) continue;
      settleLend(s, 'supply', ck.sym);
      const take = Math.min(seizeUsd, s.lend.supply[ck.sym].amt * price(ck.sym));
      s.lend.supply[ck.sym].amt -= take / price(ck.sym);
      seizeUsd -= take;
      if (seizeUsd <= 0) break;
    }
    if (toRepayUsd <= 0) break;
  }
  events.push([L('借貸倉位被部分清算', 'Loan partially liquidated'), L('健康度低於 1，已清算 50% 債務', 'Health factor fell below 1; 50% of debt was liquidated'), 'err']);
}

// ----------------------------------------------------------------------------
// OTC
// ----------------------------------------------------------------------------
export function createOtc({ side, crypto, fiat, merchant, fiatAmt, cryptoAmt, method }) {
  if (!state.wallet.connected) return { err: L('請先連接錢包', 'Connect your wallet first') };
  if (side === 'sell' && bal(crypto) < cryptoAmt) return { err: L(`${crypto} 餘額不足`, `Insufficient ${crypto}`) };
  const id = uid('otc');
  const ref = String(Math.floor(100000 + Math.random() * 899999));
  set((s) => {
    if (side === 'sell') { add(s.spot, crypto, -cryptoAmt); add(s.frozen, crypto, cryptoAmt); }
    s.otc.unshift({
      id, ref, side, crypto, fiat, mid: merchant.id, mname: merchant.name, price: merchant.price, fiatAmt, cryptoAmt, method,
      status: side === 'buy' ? 'unpaid' : 'waiting', ts: now(), created: Date.now(), payBy: Date.now() + 15 * 60e3,
      chat: [{ from: 'm', text: side === 'buy' ? L('你好，請按訂單金額付款，備註填寫參考號，付款後點擊“我已付款”。', 'Hi! Please pay the exact amount with the reference code, then tap "I have paid".') : L('你好，我馬上付款，請稍等。', 'Hi, paying now. One moment.'), ts: Date.now() }],
    });
  });
  return { ok: true, id };
}
export function otcMarkPaid(id) {
  set((s) => {
    const o = s.otc.find((x) => x.id === id);
    if (o && o.status === 'unpaid') { o.status = 'paid'; o.paidAt = Date.now(); o.chat.push({ from: 'sys', text: L('買家已標記付款，等待商家放幣', 'Marked as paid. Waiting for the merchant to release.'), ts: Date.now() }); }
  });
}
export function otcCancel(id) {
  set((s) => {
    const o = s.otc.find((x) => x.id === id);
    if (!o || !['unpaid', 'waiting'].includes(o.status)) return;
    if (o.side === 'sell') { add(s.frozen, o.crypto, -o.cryptoAmt); add(s.spot, o.crypto, o.cryptoAmt); }
    o.status = 'cancelled';
  });
}
export function otcRelease(id) {
  set((s) => {
    const o = s.otc.find((x) => x.id === id);
    if (!o || o.status !== 'buyerPaid') return;
    add(s.frozen, o.crypto, -o.cryptoAmt);
    o.status = 'completed';
    o.doneAt = Date.now();
    s.records.unshift({ id: uid('r'), kind: 'otc', side: 'sell', sym: o.crypto, amount: o.cryptoAmt, fiat: o.fiat, fiatAmt: o.fiatAmt, status: 'done', ts: now() });
  });
}
export function otcChat(id, text) {
  set((s) => {
    const o = s.otc.find((x) => x.id === id);
    if (o) o.chat.push({ from: 'me', text, ts: Date.now() });
  });
  setTimeout(() => {
    set((s) => {
      const o = s.otc.find((x) => x.id === id);
      if (o) o.chat.push({ from: 'm', text: L('收到，正在處理。', 'Got it, on it.'), ts: Date.now() });
    });
  }, 1400);
}

export function cardBuy(provider, crypto, fiat, fiatAmt, cryptoAmt) {
  set((s) => {
    add(s.spot, crypto, cryptoAmt);
    s.records.unshift({ id: uid('r'), kind: 'otc', side: 'buy', via: provider, sym: crypto, amount: cryptoAmt, fiat, fiatAmt, status: 'done', ts: now() });
  });
}

function processOtc(s, events) {
  const t = Date.now();
  for (const o of s.otc) {
    if (o.status === 'paid' && t - o.paidAt > 4500) {
      o.status = 'completed';
      o.doneAt = t;
      add(s.spot, o.crypto, o.cryptoAmt);
      o.chat.push({ from: 'sys', text: L('商家已放幣，資產已到帳現貨帳戶', 'Released. Funds are in your spot account.'), ts: t });
      s.records.unshift({ id: uid('r'), kind: 'otc', side: 'buy', sym: o.crypto, amount: o.cryptoAmt, fiat: o.fiat, fiatAmt: o.fiatAmt, status: 'done', ts: now() });
      events.push([L('OTC 訂單完成', 'OTC order completed'), `+${o.cryptoAmt.toFixed(4)} ${o.crypto}`]);
    }
    if (o.status === 'waiting' && t - o.created > 5000) {
      o.status = 'buyerPaid';
      o.chat.push({ from: 'm', text: L('已付款，請查收並放幣。', 'Paid. Please check and release.'), ts: t });
      events.push([L('買家已付款', 'Buyer has paid'), L('請確認收款後放幣', 'Confirm receipt, then release'), 'warn']);
    }
    if (o.status === 'unpaid' && t > o.payBy) {
      o.status = 'cancelled';
    }
  }
}

// ----------------------------------------------------------------------------
// Rewards hub. Every claim is airdropped to the user's exchange deposit address
// and credited to the spot account after a few confirmations.
// ----------------------------------------------------------------------------
const AIRDROP_NET = 'BEP20';
export const airdropNet = (sym) => (sym === FREE_DROP.sym ? FREE_DROP.net : AIRDROP_NET);
export const airdropAddress = (sym = 'USDT') => depositAddress(airdropNet(sym));
let lastDrop = null;
// Centralised credit (all campaign rewards): booked straight to the user's exchange account, nothing on-chain
function credit(s, sym, amount, source) {
  lastDrop = uid('r');
  const net = airdropNet(sym);
  const ref = 'NVX' + new Date(now()).toISOString().slice(2, 10).replace(/-/g, '') + randHex(8).toUpperCase();
  s.records.unshift({ id: lastDrop, kind: 'airdrop', internal: true, ref, sym, amount, net, source, address: depositAddress(net), status: 'done', ts: now(), doneAt: now() });
  add(s.spot, sym, amount);
}
const needWallet = () => (!state.wallet.connected ? { err: L('請先連接錢包', 'Connect your wallet first') } : null);

// Free launch: subscribe with a signature, claim after the window closes
// The subscription window repeats in back-to-back rounds, so a visitor who has not subscribed
// always finds one open (even after days away or a demo fast-forward). Signing pins the round.
const DROP_ROUND = (FREE_DROP.end - FREE_DROP.start) * HOUR;
function dropAnchor(t = now()) {
  const d = state.camp.drop;
  if (d) return d.anchor ?? state.epoch;
  const k = Math.max(0, Math.floor((t - (state.epoch + FREE_DROP.start * HOUR)) / DROP_ROUND));
  return state.epoch + k * DROP_ROUND;
}
export function dropTimes(t = now()) {
  const a = dropAnchor(t);
  const end = a + FREE_DROP.end * HOUR;
  return { start: a + FREE_DROP.start * HOUR, end, claim: end + FREE_DROP.claimDelay * HOUR };
}
// upcoming → live (sign to subscribe) → allocating (results being computed) → ended (claim open)
export function dropPhase(t = now()) {
  const { start, end, claim } = dropTimes(t);
  return t < start ? 'upcoming' : t < end ? 'live' : t < claim ? 'allocating' : 'ended';
}
// Subscribed spots: the published count, plus the user's own once they sign
export function dropTaken() {
  return Math.min(FREE_DROP.slots, FREE_DROP.taken + (state.camp.drop ? 1 : 0));
}
export function signDrop({ sig, nonce, provider }) {
  const e = needWallet();
  if (e) return e;
  if (dropPhase() !== 'live') return { err: L('當前不在申購期', 'The subscription window is closed') };
  if (state.camp.drop) return { err: L('你已完成申購', 'You have already subscribed') };
  if (dropTaken() >= FREE_DROP.slots) return { err: L('申購名額已滿', 'All spots are taken') };
  const id = 'FS' + new Date(now()).toISOString().slice(2, 10).replace(/-/g, '') + randHex(6).toUpperCase();
  set((s) => {
    s.camp.drop = {
      id, sig, nonce, provider, ts: now(), anchor: dropAnchor(), wallet: s.wallet.address, to: depositAddress(FREE_DROP.net),
      amount: FREE_DROP.perUser, queue: FREE_DROP.taken + 1, claimed: false,
    };
  });
  return { ok: true, id };
}
export function claimDrop() {
  const e = needWallet();
  if (e) return e;
  const d = state.camp.drop;
  if (!d) return { err: L('你沒有參與本次申購', 'You did not subscribe') };
  if (dropPhase() !== 'ended') return { err: L('分配結果公佈後才能領取', 'Claim opens once allocations are published') };
  if (d.claimed) return { err: L('已領取', 'Already claimed') };
  set((s) => {
    credit(s, FREE_DROP.sym, d.amount || FREE_DROP.perUser, 'drop');
    s.camp.drop.claimed = true;
    s.camp.drop.claimedAt = now();
    s.camp.drop.rid = lastDrop;
  });
  return { ok: true, amt: d.amount || FREE_DROP.perUser, rid: lastDrop };
}
export const dropAirdrop = () => (state.camp.drop?.rid ? state.records.find((r) => r.id === state.camp.drop.rid) : null);

// Invites
export function inviteCode() {
  return 'NVX' + (state.wallet.address || '0x000000').slice(2, 8).toUpperCase();
}
export function simulateInvite() {
  set((s) => { s.camp.invites.unshift({ id: uid('i'), addr: '0x' + randHex(40), ts: now(), deposited: Math.random() < 0.55 }); });
}
export function inviteClaimable() {
  const c = state.camp;
  const n = c.invites.length;
  const ms = INVITE_MILESTONES.filter(([k]) => n >= k && !c.msClaimed.includes(k));
  const friends = Math.max(0, n - c.inviteClaimed) * INVITE_REWARD;
  return { amt: friends + ms.reduce((a, [, r]) => a + r, 0), friends, ms };
}
export function claimInvite() {
  const e = needWallet();
  if (e) return e;
  const { amt, ms } = inviteClaimable();
  if (!(amt > 0)) return { err: L('暫無可領取的獎勵', 'Nothing to claim yet') };
  set((s) => { s.camp.inviteClaimed = s.camp.invites.length; s.camp.msClaimed.push(...ms.map((m) => m[0])); credit(s, REWARD_SYM, amt, 'invite'); });
  return { ok: true, amt, rid: lastDrop };
}

// Daily check-in: a 7-day week paying 10 USDT; a missed day restarts the week
const tzOff = (t) => new Date(t).getTimezoneOffset() * 60e3;
export const dayKey = (t = now()) => Math.floor((t - tzOff(t)) / DAY);
export function checkinState(t = now()) {
  const c = state.camp.checkin;
  const today = dayKey(t);
  const doneToday = c.last === today;
  const alive = doneToday || c.last === today - 1;
  const streak = alive ? c.streak || 0 : 0;
  const pos = streak === 0 ? 0 : ((streak - 1) % 7) + 1; // days done in the current week
  const filled = doneToday ? pos : pos === 7 ? 0 : pos;
  const nextIdx = doneToday ? pos % 7 : filled;
  const msToNext = DAY - (((t - tzOff(t)) % DAY) + DAY) % DAY;
  const week = CHECKIN_REWARDS.slice(0, filled).reduce((a, b) => a + b, 0);
  return { doneToday, streak, filled, nextIdx, nextReward: CHECKIN_REWARDS[nextIdx], week, total: c.total || 0, count: c.count || 0, msToNext };
}
export function checkIn() {
  const e = needWallet();
  if (e) return e;
  const st = checkinState();
  if (st.doneToday) return { err: L('今天已簽到', 'Already checked in today') };
  const reward = CHECKIN_REWARDS[st.filled];
  set((s) => {
    const c = s.camp.checkin;
    c.streak = st.streak + 1;
    c.last = dayKey();
    c.total = (c.total || 0) + reward;
    c.count = (c.count || 0) + 1;
    credit(s, REWARD_SYM, reward, 'checkin');
  });
  return { ok: true, reward, day: st.filled + 1, rid: lastDrop };
}

// Social tasks: open the link, a short verification, then claim
export function socialStatus(id, t = Date.now()) {
  const x = state.camp.social[id];
  if (!x) return 'todo';
  if (x.claimed) return 'claimed';
  return t - x.at < 2600 ? 'verifying' : 'done';
}
export function startSocial(id) {
  const e = needWallet();
  if (e) return e;
  set((s) => { if (!s.camp.social[id]) s.camp.social[id] = { at: Date.now() }; });
  return { ok: true };
}
export const socialAllDone = () => SOCIAL_TASKS.every((x) => ['done', 'claimed'].includes(socialStatus(x.id)));
// Claims every verified task (plus the bonus once all five are done) in one airdrop
export function claimSocial() {
  const e = needWallet();
  if (e) return e;
  const ready = SOCIAL_TASKS.filter((x) => socialStatus(x.id) === 'done');
  const bonus = !state.camp.socialBonus && socialAllDone();
  const amt = +(ready.reduce((a, x) => a + x.reward, 0) + (bonus ? SOCIAL_BONUS : 0)).toFixed(2);
  if (!(amt > 0)) return { err: L('暫無可領取的獎勵', 'Nothing to claim yet') };
  set((s) => {
    for (const x of ready) s.camp.social[x.id].claimed = true;
    if (bonus) s.camp.socialBonus = true;
    credit(s, REWARD_SYM, amt, 'social');
  });
  return { ok: true, amt, rid: lastDrop };
}

// Quiz
export function submitQuiz(answers) {
  const correct = QUIZ.filter((x, i) => answers[i] === x.a).length;
  set((s) => {
    const q = s.camp.quiz;
    q.tries += 1;
    q.best = Math.max(q.best, correct);
    if (correct === QUIZ.length) q.passed = true;
  });
  return correct;
}
export function claimQuiz() {
  const e = needWallet();
  if (e) return e;
  const q = state.camp.quiz;
  if (!q.passed) return { err: L('全部答對後才能領取', 'Answer every question correctly first') };
  if (q.claimed) return { err: L('已領取', 'Already claimed') };
  set((s) => { s.camp.quiz.claimed = true; credit(s, REWARD_SYM, QUIZ_REWARD, 'quiz'); });
  return { ok: true, amt: QUIZ_REWARD, rid: lastDrop };
}

// What each campaign has ready to claim right now
export function claimables() {
  const c = state.camp;
  const out = {};
  if (!state.wallet.connected) return out;
  if (c.drop && !c.drop.claimed && dropPhase() === 'ended') out.drop = [[FREE_DROP.sym, FREE_DROP.perUser]];
  const inv = inviteClaimable().amt;
  if (inv > 0) out.invite = [[REWARD_SYM, inv]];
  const ck = checkinState();
  if (!ck.doneToday) out.checkin = [[REWARD_SYM, CHECKIN_REWARDS[ck.filled]]];
  let soc = SOCIAL_TASKS.filter((x) => socialStatus(x.id) === 'done').reduce((a, x) => a + x.reward, 0);
  if (socialAllDone() && !c.socialBonus) soc += SOCIAL_BONUS;
  if (soc > 0) out.social = [[REWARD_SYM, +soc.toFixed(2)]];
  if (c.quiz.passed && !c.quiz.claimed) out.quiz = [[REWARD_SYM, QUIZ_REWARD]];
  return out;
}
export function claimableUsd() {
  return Object.values(claimables()).flat().reduce((a, [sym, amt]) => a + valueOf(sym, amt), 0);
}
export function airdropTotals() {
  const by = {};
  for (const r of state.records) if (r.kind === 'airdrop') by[r.sym] = (by[r.sym] || 0) + r.amount;
  return by;
}

// ----------------------------------------------------------------------------
// Background engine: runs once per market tick
// ----------------------------------------------------------------------------
function processRecords(s, events) {
  const t = Date.now();
  for (const r of s.records) {
    if ((r.kind === 'deposit' || r.kind === 'airdrop') && r.status === 'confirming') {
      const conf = Math.min(r.need, Math.floor((t - r.started) / 420));
      if (conf !== r.conf) r.conf = conf;
      if (conf >= r.need) {
        r.status = 'done';
        r.doneAt = now();
        add(s.spot, r.sym, r.amount);
        if (r.kind === 'airdrop') events.push([L('空投已到帳', 'Airdrop received'), `+${r.amount} ${r.sym} · ${L('現貨帳戶', 'Spot account')}`]);
        else events.push([L('充值到帳', 'Deposit credited'), `+${r.amount} ${r.sym} · ${NETWORKS[r.net].short}`]);
      }
    }
    if (r.kind === 'withdraw' && r.status === 'processing' && t - r.started > 2500) {
      r.status = 'sent';
      r.txid = (NETWORKS[r.net].kind === 'evm' ? '0x' : '') + randHex(64);
    }
    if (r.kind === 'withdraw' && r.status === 'sent') {
      r.conf = Math.min(r.need, Math.floor((t - r.started - 2500) / 420));
      if (r.conf >= r.need) {
        r.status = 'done';
        if (r.toSelf) add(s.wallet.onchain, r.sym, r.amount - r.fee);
        events.push([L('提幣完成', 'Withdrawal complete'), `${(r.amount - r.fee).toFixed(4)} ${r.sym} → ${r.address.slice(0, 8)}…`]);
      }
    }
  }
}

let running = false;
export function startEngine() {
  if (running) return;
  running = true;
  subscribeMarket(() => {
    const s0 = state;
    const pending = s0.records.some((r) => ['confirming', 'processing', 'sent'].includes(r.status))
      || s0.orders.some((o) => o.status === 'open')
      || s0.positions.length || s0.futOrders.length
      || s0.subs.some((x) => x.status === 'pending')
      || s0.otc.some((o) => ['paid', 'waiting', 'unpaid'].includes(o.status))
      || Object.values(s0.lend.borrow).some((b) => b?.amt > 0);
    if (!pending) return;
    const events = [];
    const draft = structuredClone(s0);
    processRecords(draft, events);
    matchSpot(draft, events);
    matchFutures(draft, events);
    settleSales(draft, events);
    processOtc(draft, events);
    liquidateLend(draft, events);
    if (JSON.stringify(draft) !== JSON.stringify(s0)) {
      state = draft;
      emit();
    }
    for (const [msg, sub, kind] of events) toast(msg, kind || 'ok', sub);
  });
}

// ----------------------------------------------------------------------------
// Portfolio valuation
// ----------------------------------------------------------------------------
export function valueOf(sym, amt) {
  if (!amt) return 0;
  if (COIN[sym]) return amt * price(sym);
  if (sym === FREE_DROP.sym) return amt * FREE_DROP.refPrice;
  const p = PROJECTS.find((x) => x.sym === sym);
  return p ? amt * p.price : 0;
}
export function portfolio() {
  const s = state;
  let spotV = 0;
  const syms = new Set([...Object.keys(s.spot), ...Object.keys(s.frozen)]);
  for (const k of syms) spotV += valueOf(k, (s.spot[k] || 0) + (s.frozen[k] || 0));
  const subV = s.subs.filter((x) => x.status === 'pending').reduce((a, x) => a + x.amount, 0);
  let futV = s.futures.USDT || 0;
  for (const p of s.positions) futV += p.margin + pnl(p);
  for (const o of s.futOrders) futV += o.lock;
  let earnV = 0;
  for (const x of s.stakes) if (x.status === 'active') earnV += valueOf(x.sym, x.amount + stakeReward(x));
  const ls = lendSummary();
  const lendV = ls.supplied - ls.borrowed;
  return { spot: spotV + subV, futures: futV, earn: earnV, lend: lendV, total: spotV + subV + futV + earnV + lendV };
}
