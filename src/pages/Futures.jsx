import { useEffect, useState } from 'react';
import { ArrowLeftRight, AlertTriangle, Pencil, Plus, Info } from 'lucide-react';
import { FUTURES, MAX_LEV } from '../core/data.js';
import { L } from '../core/lang.js';
import {
  useApp, placeFutures, cancelFutOrder, closePosition, closeAll, setTpSl, addMargin, toast, openModal, go, futBal, liqPrice, pnl, FUT_TAKER, MMR,
} from '../core/store.js';
import { useMarket, price, fundingRate } from '../core/market.js';
import { fmt, pdp, adp, dateTime, floorTo, usd, pad2 } from '../core/fmt.js';
import { Btn, Tabs, NumInput, Slider, CoinIcon, Empty, Pill, Modal, KV, cx, useMedia, PHONE } from '../ui/kit.jsx';
import Kline from '../ui/Kline.jsx';
import { OrderBook, Trades } from '../ui/Book.jsx';
import { ConnectGate } from '../layout/Shell.jsx';
import { PairPicker, TickerBar } from './Spot.jsx';

function fundingCountdown() {
  const d = new Date();
  const h = d.getUTCHours();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), (Math.floor(h / 8) + 1) * 8));
  const ms = next - d;
  return `${pad2(ms / 3600e3)}:${pad2((ms % 3600e3) / 60e3)}:${pad2((ms % 60e3) / 1000)}`;
}

export function Futures({ arg }) {
  useMarket();
  const s = useApp();
  const sym = FUTURES.includes(arg) ? arg : 'BTC';
  const [tab, setTab] = useState('pos');
  const [pick, setPick] = useState(null);
  const phone = useMedia(PHONE);
  const theme = document.documentElement.dataset.resolved || 'dark';
  const avail = futBal();
  const lines = [];
  for (const p of s.positions.filter((x) => x.sym === sym)) {
    lines.push({ price: p.entry, color: p.side === 'long' ? '#22D39B' : '#FF4D6A', title: L('開倉', 'Entry') });
    lines.push({ price: liqPrice(p, avail), color: '#FF9A3D', title: L('強平', 'Liq.') });
  }
  for (const o of s.futOrders.filter((x) => x.sym === sym)) lines.push({ price: o.price, color: '#9AA6B8', title: L('委託', 'Order') });

  const fr = fundingRate(sym);
  return (
    <div className="page page-wide">
      <TickerBar base={sym} quote="USDT" extra={
        <>
          <div><span>{L('標記價格', 'Mark')}</span><b className="mono">{fmt(price(sym) * 1.00004, pdp(price(sym)))}</b></div>
          <div><span>{L('資金費率 / 倒計時', 'Funding / next')}</span><b className="mono"><span className={fr >= 0 ? 'up' : 'down'}>{(fr * 100).toFixed(4)}%</span> / {fundingCountdown()}</b></div>
        </>
      }>
        <PairPicker base={sym} quote="USDT" bases={FUTURES} quotes={['USDT']} onPick={(b) => go('futures', b)} suffix={L(' 永續', ' Perp')} />
      </TickerBar>
      <div className="trade-grid">
        <div className="tg-chart card"><Kline sym={sym} label={`${sym}USDT ${L('永續', 'PERP')}`} themeKey={theme} lines={lines} /></div>
        <div className="tg-book card"><OrderBook sym={sym} base={sym} onPick={setPick} levels={phone ? 8 : 11} compact={phone} /></div>
        <div className="tg-form card">
          <FuturesForm key={sym} sym={sym} pickPrice={pick} />
          <AccountBox />
        </div>
        <div className="tg-orders card">
          <div className="orders-head">
            <Tabs variant="line" value={tab} onChange={setTab} items={[
              ['pos', L('當前倉位', 'Positions'), s.positions.length],
              ['ord', L('當前委託', 'Open orders'), s.futOrders.length],
              ['hist', L('歷史記錄', 'History')],
            ]} />
            {tab === 'pos' && s.positions.length > 0 && <button className="link-btn danger" onClick={() => { closeAll(); toast(L('已全部市價平倉', 'All positions closed')); }}>{L('一鍵平倉', 'Close all')}</button>}
          </div>
          {tab === 'pos' && <Positions />}
          {tab === 'ord' && <FutOrders />}
          {tab === 'hist' && <FutHistory />}
        </div>
        <div className="tg-trades card"><Trades sym={sym} base={sym} max={16} /></div>
      </div>
    </div>
  );
}

function FuturesForm({ sym, pickPrice }) {
  useMarket();
  const s = useApp();
  const maxLev = MAX_LEV[sym];
  const [mode, setMode] = useState('cross');
  const [lev, setLev] = useState(Math.min(20, maxLev));
  const [type, setType] = useState('limit');
  const mark = price(sym);
  const dp = pdp(mark);
  const ad = adp(mark);
  const [px, setPx] = useState(() => mark.toFixed(dp));
  const [size, setSize] = useState('');
  const [pctv, setPctv] = useState(0);
  const [tpsl, setTpslOn] = useState(false);
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [levOpen, setLevOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  useEffect(() => { if (pickPrice) { setPx(String(pickPrice)); setType('limit'); } }, [pickPrice]);

  const usePx = type === 'market' ? mark : parseFloat(px) || 0;
  const sz = parseFloat(size) || 0;
  const avail = futBal();
  const maxSize = usePx ? (avail * lev) / usePx / (1 + FUT_TAKER * lev) : 0;
  const margin = (sz * usePx) / lev;
  const fee = sz * usePx * FUT_TAKER;
  const est = (side) => sz && usePx ? liqPrice({ side, size: sz, entry: usePx, margin, mode }, mode === 'cross' ? avail - margin : 0) : null;

  const setByPct = (p) => { setPctv(p); setSize(String(floorTo((maxSize * p) / 100, ad))); };
  const submit = (side) => {
    setBusy(side);
    setTimeout(() => {
      setBusy(null);
      const r = placeFutures({ sym, side, type, price: parseFloat(px), size: sz, lev, mode, tp: tpsl ? parseFloat(tp) || null : null, sl: tpsl ? parseFloat(sl) || null : null });
      if (r.err) { toast(r.err, 'err'); return; }
      toast(r.filled ? (side === 'long' ? L('開多成功', 'Long opened') : L('開空成功', 'Short opened')) : L('委託已提交', 'Order placed'), 'ok', `${sym} ${sz} · ${lev}x${r.filled ? ' @ ' + fmt(r.price, dp) : ''}`);
      setSize('');
      setPctv(0);
    }, 350);
  };

  return (
    <div className="oform">
      <div className="fut-top">
        <button className="seg-btn" onClick={() => setMode(mode === 'cross' ? 'isolated' : 'cross')}>{mode === 'cross' ? L('全倉', 'Cross') : L('逐倉', 'Isolated')}</button>
        <button className="seg-btn lev" onClick={() => setLevOpen(true)} aria-label={L('槓桿', 'Leverage')}><span className="lev-label">{L('槓桿', 'Leverage')}</span> <b className="mono">{lev}x</b><Pencil size={12} /></button>
      </div>
      <Tabs value={type} onChange={setType} variant="line" items={[['limit', L('限價', 'Limit')], ['market', L('市價', 'Market')]]} />
      <div className="row-between small"><span className="muted">{L('可用', 'Available')}</span><span className="row-gap"><b className="mono">{fmt(avail, 2)} USDT</b>{s.wallet.connected && <button className="icon-btn xs" onClick={() => openModal('transfer', { from: 'spot' })} aria-label={L('劃轉', 'Transfer')}><ArrowLeftRight size={13} /></button>}</span></div>
      {type === 'limit'
        ? <NumInput id="fu-px" label={L('價格', 'Price')} value={px} onChange={setPx} suffix="USDT" right={<button className="max-btn" onClick={() => setPx(mark.toFixed(dp))}>{L('最新', 'Last')}</button>} />
        : <div className="num num-dis"><span className="num-label">{L('價格', 'Price')}</span><input disabled value={L('市價', 'Market')} /><span className="num-suffix">USDT</span></div>}
      <NumInput id="fu-sz" label={L('數量', 'Size')} value={size} onChange={(v) => { setSize(v); setPctv(0); }} suffix={sym} />
      <Slider id="fu-pct" value={pctv} onChange={setByPct} />
      <label className="check"><input type="checkbox" checked={tpsl} onChange={(e) => setTpslOn(e.target.checked)} />{L('止盈 / 止損', 'TP / SL')}</label>
      {tpsl && (
        <div className="grid2">
          <NumInput id="fu-tp" label={L('止盈價', 'TP')} value={tp} onChange={setTp} />
          <NumInput id="fu-sl" label={L('止損價', 'SL')} value={sl} onChange={setSl} />
        </div>
      )}
      <div className="summary tight">
        <KV k={L('所需保證金', 'Margin')} v={`${fmt(margin, 2)} USDT`} />
        <KV k={L('最大可開', 'Max size')} v={`${fmt(maxSize, ad)} ${sym}`} />
        <KV k={L('預估手續費', 'Est. fee')} v={`${fmt(fee, 3)} USDT`} />
      </div>
      {!s.wallet.connected ? <ConnectGate /> : (
        <>
          <div className="ls-btns">
            <Btn variant="up" size="lg" onClick={() => submit('long')} loading={busy === 'long'} disabled={!sz || !usePx}>{L('開多', 'Long')}</Btn>
            <Btn variant="down" size="lg" onClick={() => submit('short')} loading={busy === 'short'} disabled={!sz || !usePx}>{L('開空', 'Short')}</Btn>
          </div>
          <div className="ls-liq small">
            <span className="ls-liq-label">{L('預估強平價', 'Est. liquidation price')}</span>
            <b className="mono">{est('long') ? fmt(est('long'), dp) : '--'}</b>
            <b className="mono">{est('short') ? fmt(est('short'), dp) : '--'}</b>
          </div>
          {avail < 1 && (
            <div className="hint-box"><Info size={14} />{L('合約帳戶沒有保證金。', 'No margin in futures.')}<button className="link-btn" onClick={() => openModal('transfer', { from: 'spot' })}>{L('從現貨劃轉', 'Transfer from spot')}</button></div>
          )}
        </>
      )}
      {levOpen && <LeverageModal max={maxLev} value={lev} onClose={() => setLevOpen(false)} onSave={(v) => { setLev(v); setLevOpen(false); }} sym={sym} />}
    </div>
  );
}

function LeverageModal({ max, value, onClose, onSave, sym }) {
  const [v, setV] = useState(value);
  const marks = [1, Math.round(max * 0.2), Math.round(max * 0.4), Math.round(max * 0.6), Math.round(max * 0.8), max];
  return (
    <Modal title={L('調整槓桿', 'Adjust leverage')} onClose={onClose} width={420}>
      <div className="stack">
        <div className="lev-big mono">{v}x</div>
        <div className="lev-step">
          <button className="icon-btn ring" onClick={() => setV(Math.max(1, v - 1))}>−</button>
          <Slider value={v} min={1} max={max} marks={marks} suffix="x" onChange={(x) => setV(Math.max(1, x))} />
          <button className="icon-btn ring" onClick={() => setV(Math.min(max, v + 1))}>+</button>
        </div>
        <KV k={L(`${sym} 最大槓桿`, `${sym} max leverage`)} v={`${max}x`} />
        {v >= 50 && <div className="warn-box"><AlertTriangle size={16} />{L('高槓杆會顯著提高強平風險，請謹慎使用。', 'High leverage greatly raises liquidation risk.')}</div>}
        <Btn block onClick={() => onSave(v)}>{L('確認', 'Confirm')}</Btn>
      </div>
    </Modal>
  );
}

function AccountBox() {
  useMarket();
  const s = useApp();
  const upnl = s.positions.reduce((a, p) => a + pnl(p), 0);
  const used = s.positions.reduce((a, p) => a + p.margin, 0) + s.futOrders.reduce((a, o) => a + o.lock, 0);
  const equity = futBal() + used + upnl;
  const maint = s.positions.reduce((a, p) => a + p.size * price(p.sym) * MMR, 0);
  const ratio = equity > 0 ? maint / equity : 0;
  return (
    <div className="acct-box">
      <div className="row-between"><b>{L('合約帳戶', 'Futures account')}</b><button className="link-btn" onClick={() => openModal('transfer', { from: 'spot' })}><ArrowLeftRight size={13} />{L('劃轉', 'Transfer')}</button></div>
      <KV k={L('帳戶權益', 'Equity')} v={`${fmt(equity, 2)} USDT`} />
      <KV k={L('未實現盈虧', 'Unrealised PnL')} v={<span className={upnl >= 0 ? 'up' : 'down'}>{upnl >= 0 ? '+' : ''}{fmt(upnl, 2)}</span>} />
      <KV k={L('佔用保證金', 'Margin in use')} v={fmt(used, 2)} />
      <div className="row-between small"><span className="muted">{L('保證金率', 'Margin ratio')}</span><b className={cx('mono', ratio > 0.5 ? 'down' : 'up')}>{(ratio * 100).toFixed(2)}%</b></div>
    </div>
  );
}

function Positions() {
  useMarket();
  const s = useApp();
  const [edit, setEdit] = useState(null);
  const [addM, setAddM] = useState(null);
  if (!s.positions.length) return <Empty text={L('暫無持倉', 'No open positions')} />;
  const avail = futBal();
  return (
    <div className="table-wrap">
      <table className="tbl stack">
        <thead><tr><th>{L('合約', 'Contract')}</th><th>{L('數量', 'Size')}</th><th>{L('開倉價', 'Entry')}</th><th>{L('標記價', 'Mark')}</th><th>{L('強平價', 'Liq.')}</th><th>{L('保證金', 'Margin')}</th><th>{L('未實現盈虧(ROE)', 'uPnL (ROE)')}</th><th>{L('止盈/止損', 'TP/SL')}</th><th>{L('操作', 'Actions')}</th></tr></thead>
        <tbody>
          {s.positions.map((p) => {
            const u = pnl(p);
            const roe = u / p.margin;
            const dp = pdp(p.entry);
            return (
              <tr key={p.id}>
                <td>
                  <span className={cx('pos-side', p.side)} />
                  <span className="row-gap"><CoinIcon sym={p.sym} size={18} /><b>{p.sym}USDT</b></span>
                  <div className="small"><span className={p.side === 'long' ? 'up' : 'down'}>{p.side === 'long' ? L('多', 'Long') : L('空', 'Short')}</span> · {p.mode === 'cross' ? L('全倉', 'Cross') : L('逐倉', 'Isolated')} {p.lev}x</div>
                </td>
                <td className="mono">{fmt(p.size, adp(p.entry))}</td>
                <td className="mono">{fmt(p.entry, dp)}</td>
                <td className="mono">{fmt(price(p.sym), dp)}</td>
                <td className="mono accent-text">{fmt(liqPrice(p, avail), dp)}</td>
                <td className="mono">{fmt(p.margin, 2)} {p.mode === 'isolated' && <button className="icon-btn xs" onClick={() => setAddM(p)} aria-label={L('追加保證金', 'Add margin')}><Plus size={12} /></button>}</td>
                <td className={cx('mono', u >= 0 ? 'up' : 'down')}>{u >= 0 ? '+' : ''}{fmt(u, 2)}<div className="small">({roe >= 0 ? '+' : ''}{(roe * 100).toFixed(2)}%)</div></td>
                <td className="mono small">{p.tp ? fmt(p.tp, dp) : '--'} / {p.sl ? fmt(p.sl, dp) : '--'} <button className="icon-btn xs" onClick={() => setEdit(p)} aria-label="TP/SL"><Pencil size={12} /></button></td>
                <td>
                  <div className="row-gap">
                    <button className="mini-btn" onClick={() => { closePosition(p.id, 0.5); toast(L('已平倉 50%', 'Closed 50%')); }}>50%</button>
                    <button className="mini-btn strong" onClick={() => { closePosition(p.id, 1); toast(L('已市價平倉', 'Position closed'), 'ok', `${u >= 0 ? '+' : ''}${fmt(u, 2)} USDT`); }}>{L('市價平倉', 'Close')}</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {edit && <TpSlModal p={edit} onClose={() => setEdit(null)} />}
      {addM && <AddMarginModal p={addM} onClose={() => setAddM(null)} />}
    </div>
  );
}

function TpSlModal({ p, onClose }) {
  const [tp, setTp] = useState(p.tp ? String(p.tp) : '');
  const [sl, setSl] = useState(p.sl ? String(p.sl) : '');
  const dp = pdp(p.entry);
  const est = (x) => (x ? (p.side === 'long' ? x - p.entry : p.entry - x) * p.size : null);
  return (
    <Modal title={L('止盈止損', 'Take profit / stop loss')} onClose={onClose} width={420}>
      <div className="stack">
        <KV k={L('開倉價', 'Entry')} v={fmt(p.entry, dp)} />
        <KV k={L('標記價', 'Mark')} v={fmt(price(p.sym), dp)} />
        <NumInput id="tp-in" label={L('止盈觸發價', 'TP trigger')} value={tp} onChange={setTp} suffix="USDT" hint={tp ? L(`預計盈虧 ${fmt(est(+tp), 2)} USDT`, `Est. PnL ${fmt(est(+tp), 2)} USDT`) : null} />
        <NumInput id="sl-in" label={L('止損觸發價', 'SL trigger')} value={sl} onChange={setSl} suffix="USDT" hint={sl ? L(`預計盈虧 ${fmt(est(+sl), 2)} USDT`, `Est. PnL ${fmt(est(+sl), 2)} USDT`) : null} />
        <Btn block onClick={() => { setTpSl(p.id, parseFloat(tp), parseFloat(sl)); toast(L('止盈止損已設定', 'TP/SL saved')); onClose(); }}>{L('保存', 'Save')}</Btn>
      </div>
    </Modal>
  );
}

function AddMarginModal({ p, onClose }) {
  const [v, setV] = useState('');
  return (
    <Modal title={L('追加保證金', 'Add margin')} onClose={onClose} width={400}>
      <div className="stack">
        <NumInput id="am-in" label={L('數量', 'Amount')} value={v} onChange={setV} suffix="USDT" right={<button className="max-btn" onClick={() => setV(String(floorTo(futBal(), 2)))}>MAX</button>} />
        <KV k={L('可用', 'Available')} v={`${fmt(futBal(), 2)} USDT`} />
        <Btn block onClick={() => { const r = addMargin(p.id, parseFloat(v)); if (r.err) toast(r.err, 'err'); else { toast(L('保證金已追加', 'Margin added')); onClose(); } }}>{L('確認', 'Confirm')}</Btn>
      </div>
    </Modal>
  );
}

function FutOrders() {
  const s = useApp();
  if (!s.futOrders.length) return <Empty text={L('暫無委託', 'No open orders')} />;
  return (
    <div className="table-wrap">
      <table className="tbl stack">
        <thead><tr><th>{L('時間', 'Time')}</th><th>{L('合約', 'Contract')}</th><th>{L('方向', 'Side')}</th><th>{L('價格', 'Price')}</th><th>{L('數量', 'Size')}</th><th>{L('槓桿', 'Lev.')}</th><th>{L('凍結保證金', 'Margin')}</th><th /></tr></thead>
        <tbody>
          {s.futOrders.map((o) => (
            <tr key={o.id}>
              <td className="mono muted">{dateTime(o.ts, true)}</td>
              <td>{o.sym}USDT</td>
              <td className={o.side === 'long' ? 'up' : 'down'}>{o.side === 'long' ? L('開多', 'Long') : L('開空', 'Short')}</td>
              <td className="mono">{fmt(o.price, pdp(o.price))}</td>
              <td className="mono">{o.size}</td>
              <td className="mono">{o.lev}x</td>
              <td className="mono">{fmt(o.lock, 2)}</td>
              <td><button className="link-btn danger" onClick={() => { cancelFutOrder(o.id); toast(L('已撤單', 'Order cancelled')); }}>{L('撤單', 'Cancel')}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FutHistory() {
  const s = useApp();
  if (!s.futHistory.length) return <Empty text={L('暫無記錄', 'No history')} />;
  const kindName = { open: L('開倉', 'Open'), close: L('平倉', 'Close'), liq: L('強平', 'Liquidated'), tp: L('止盈', 'TP'), sl: L('止損', 'SL') };
  return (
    <div className="table-wrap">
      <table className="tbl stack">
        <thead><tr><th>{L('時間', 'Time')}</th><th>{L('合約', 'Contract')}</th><th>{L('類型', 'Type')}</th><th>{L('方向', 'Side')}</th><th>{L('數量', 'Size')}</th><th>{L('開倉價', 'Entry')}</th><th>{L('平倉價', 'Exit')}</th><th>{L('已實現盈虧', 'Realised PnL')}</th></tr></thead>
        <tbody>
          {s.futHistory.slice(0, 40).map((h) => (
            <tr key={h.id}>
              <td className="mono muted">{dateTime(h.ts, true)}</td>
              <td>{h.sym}USDT · {h.lev}x</td>
              <td>{h.kind === 'liq' ? <Pill tone="down">{kindName.liq}</Pill> : kindName[h.kind]}</td>
              <td className={h.side === 'long' ? 'up' : 'down'}>{h.side === 'long' ? L('多', 'Long') : L('空', 'Short')}</td>
              <td className="mono">{fmt(h.size, adp(h.entry))}</td>
              <td className="mono">{fmt(h.entry, pdp(h.entry))}</td>
              <td className="mono">{h.exit ? fmt(h.exit, pdp(h.exit)) : '--'}</td>
              <td className={cx('mono', h.kind === 'open' ? 'muted' : h.pnl >= 0 ? 'up' : 'down')}>{h.kind === 'open' ? '--' : (h.pnl >= 0 ? '+' : '') + fmt(h.pnl, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
