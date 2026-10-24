import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Star, X, ArrowDownToLine, Repeat, Info } from 'lucide-react';
import { COIN, SPOT_BASES, QUOTES } from '../core/data.js';
import { L } from '../core/lang.js';
import { useApp, placeSpot, cancelSpot, cancelAllSpot, toast, toggleFav, openModal, go, spotFee, tier, bal } from '../core/store.js';
import { useMarket, price, pairPrice, change24, high24, low24, volume24 } from '../core/market.js';
import { fmt, pdp, adp, compact, dateTime, floorTo, usd } from '../core/fmt.js';
import { Btn, Tabs, NumInput, Slider, CoinIcon, Empty, Pill, Delta, Flash, cx, useMedia, PHONE } from '../ui/kit.jsx';
import Kline from '../ui/Kline.jsx';
import { OrderBook, Trades } from '../ui/Book.jsx';
import { ConnectGate } from '../layout/Shell.jsx';
import { ConvertBox } from '../layout/Modals.jsx';

export function PairPicker({ base, quote, bases, quotes, onPick, suffix = '' }) {
  useMarket();
  const s = useApp();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [qt, setQt] = useState(quote);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const list = (qt === 'fav' ? bases.filter((b) => s.favs.includes(b)) : bases)
    .filter((b) => b.toLowerCase().includes(q.toLowerCase()) || COIN[b].name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => volume24(b) - volume24(a));
  const listQuote = qt === 'fav' ? quote : qt;
  return (
    <div className="pair" ref={ref}>
      <button className="pair-btn" onClick={() => setOpen(!open)}>
        <CoinIcon sym={base} size={30} />
        <span className="pair-name">{base}<span>/{quote}{suffix}</span></span>
        <ChevronDown size={16} className={cx('caret', open && 'up')} />
      </button>
      {open && (
        <div className="pair-pop">
          <div className="search"><Search size={15} /><input autoFocus placeholder={L('搜尋幣種', 'Search')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Tabs size="sm" value={qt} onChange={setQt} items={[['fav', <Star size={13} key="s" />], ...quotes.map((x) => [x, x])]} />
          <div className="pair-cols"><span>{L('交易對', 'Pair')}</span><span>{L('最新價', 'Price')}</span><span>{L('24h 漲跌', '24h')}</span></div>
          <div className="pair-list">
            {list.length === 0 && <div className="muted small pad">{L('暫無自選，點星標添加', 'No favourites yet. Tap a star to add.')}</div>}
            {list.map((b) => (
              <div key={b} className={cx('pair-item', b === base && listQuote === quote && 'on')} onClick={() => { onPick(b, listQuote); setOpen(false); }}>
                <button className={cx('star', s.favs.includes(b) && 'on')} onClick={(e) => { e.stopPropagation(); toggleFav(b); }} aria-label="fav"><Star size={13} /></button>
                <CoinIcon sym={b} size={20} />
                <span><b>{b}</b><small>/{listQuote}{suffix}</small></span>
                <span className="mono">{fmt(pairPrice(b, listQuote), pdp(price(b)))}</span>
                <Delta v={change24(b)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TickerBar({ base, quote, children, extra }) {
  useMarket();
  const p = pairPrice(base, quote);
  const dp = pdp(p);
  const qp = price(quote);
  return (
    <div className="ticker card">
      {children}
      <div className="tk-price">
        <Flash value={p}><b className={cx('mono', change24(base) >= 0 ? 'up' : 'down')}>{fmt(p, dp)}</b></Flash>
        <span className="muted small mono">≈ {usd(price(base), dp)}</span>
      </div>
      <div className="tk-stats">
        <div><span>{L('24h 漲跌', '24h change')}</span><Delta v={change24(base)} /></div>
        <div><span>{L('24h 最高', '24h high')}</span><b className="mono">{fmt(high24(base) / qp, dp)}</b></div>
        <div><span>{L('24h 最低', '24h low')}</span><b className="mono">{fmt(low24(base) / qp, dp)}</b></div>
        <div><span>{L(`24h 成交量(${base})`, `24h vol (${base})`)}</span><b className="mono">{compact(volume24(base) / price(base), 2)}</b></div>
        <div><span>{L(`24h 成交額(${quote})`, `24h turnover (${quote})`)}</span><b className="mono">{compact(volume24(base), 2)}</b></div>
        {extra}
      </div>
    </div>
  );
}

function themeKey() {
  return document.documentElement.dataset.resolved || 'dark';
}

export function Spot({ arg }) {
  useMarket();
  const s = useApp();
  const [b0, q0] = (arg || 'BTC_USDT').split('_');
  const base = COIN[b0] && !COIN[b0].stable ? b0 : 'BTC';
  const quote = QUOTES.includes(q0) ? q0 : 'USDT';
  const [pickPrice, setPickPrice] = useState(null);
  const phone = useMedia(PHONE);
  const [tab, setTab] = useState('open');
  const open = s.orders.filter((o) => o.status === 'open');
  const hist = s.orders.filter((o) => o.status !== 'open');
  const pairKey = base + '_' + quote;
  const lines = open.filter((o) => o.base === base && o.quote === quote).map((o) => ({ price: o.price, color: o.side === 'buy' ? '#22D39B' : '#FF4D6A', title: o.side === 'buy' ? L('買單', 'Buy') : L('賣單', 'Sell') }));

  return (
    <div className="page page-wide">
      <TickerBar base={base} quote={quote}>
        <PairPicker base={base} quote={quote} bases={SPOT_BASES} quotes={QUOTES} onPick={(b, q) => go('spot', `${b}_${q}`)} />
      </TickerBar>
      <div className="trade-grid">
        <div className="tg-chart card"><Kline sym={base} quote={quote} label={`${base}${quote}`} themeKey={themeKey()} lines={lines} /></div>
        <div className="tg-book card"><OrderBook sym={base} quote={quote} base={base} onPick={setPickPrice} levels={phone ? 8 : 11} compact={phone} /></div>
        <div className="tg-form card"><SpotForm key={pairKey} base={base} quote={quote} pickPrice={pickPrice} /></div>
        <div className="tg-orders card">
          <div className="orders-head">
            <Tabs variant="line" value={tab} onChange={setTab} items={[
              ['open', L('當前委託', 'Open orders'), open.length],
              ['hist', L('歷史委託', 'Order history')],
              ['fills', L('成交記錄', 'Trade history')],
              ['assets', L('資產', 'Assets')],
            ]} />
            {tab === 'open' && open.length > 0 && <button className="link-btn" onClick={() => { cancelAllSpot(); toast(L('已全部撤單', 'All orders cancelled')); }}>{L('全部撤單', 'Cancel all')}</button>}
          </div>
          {tab === 'open' && <OrderTable rows={open} canCancel />}
          {tab === 'hist' && <OrderTable rows={hist.slice(0, 30)} />}
          {tab === 'fills' && <FillTable rows={s.fills.slice(0, 30)} />}
          {tab === 'assets' && <SpotAssets />}
        </div>
        <div className="tg-trades card"><Trades sym={base} quote={quote} base={base} max={16} /></div>
      </div>
    </div>
  );
}

function SpotForm({ base, quote, pickPrice }) {
  useMarket();
  const s = useApp();
  const [mode, setMode] = useState('limit');
  const [side, setSide] = useState('buy');
  const mkt = pairPrice(base, quote);
  const dp = pdp(mkt);
  const ad = adp(price(base));
  const [px, setPx] = useState(() => mkt.toFixed(dp));
  const [amt, setAmt] = useState('');
  const [pctv, setPctv] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (pickPrice) { setPx(String(pickPrice)); setMode('limit'); } }, [pickPrice]);
  const usePx = mode === 'market' ? mkt : parseFloat(px) || 0;
  const a = parseFloat(amt) || 0;
  const total = a * usePx;
  const availQ = bal(quote);
  const availB = bal(base);
  const fee = spotFee();
  const t = tier();

  const setByPct = (p) => {
    setPctv(p);
    if (!usePx) return;
    if (side === 'buy') setAmt(String(floorTo((availQ * p) / 100 / usePx / (mode === 'market' ? 1.0005 : 1), ad)));
    else setAmt(String(floorTo((availB * p) / 100, ad)));
  };
  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      const r = placeSpot({ base, quote, side, type: mode, price: parseFloat(px), amount: a });
      if (r.err) { toast(r.err, 'err'); return; }
      toast(r.filled ? L('市價單已成交', 'Market order filled') : L('限價單已提交', 'Limit order placed'), 'ok', `${side === 'buy' ? L('買入', 'Buy') : L('賣出', 'Sell')} ${a} ${base}${r.filled ? ' @ ' + fmt(r.price, dp) : ''}`);
      setAmt('');
      setPctv(0);
    }, 350);
  };

  return (
    <div className="oform">
      <Tabs value={mode} onChange={setMode} variant="line" items={[['limit', L('限價', 'Limit')], ['market', L('市價', 'Market')], ['convert', L('閃兌', 'Convert')]]} />
      {mode === 'convert' ? (
        <ConvertBox initFrom={quote} initTo={base} compactMode />
      ) : (
        <>
          <div className={cx('side-toggle', side)}>
            <button className={cx(side === 'buy' && 'on')} onClick={() => { setSide('buy'); setPctv(0); setAmt(''); }}>{L('買入', 'Buy')}</button>
            <button className={cx(side === 'sell' && 'on')} onClick={() => { setSide('sell'); setPctv(0); setAmt(''); }}>{L('賣出', 'Sell')}</button>
          </div>
          <div className="row-between small"><span className="muted">{L('可用', 'Available')}</span><span className="row-gap"><b className="mono">{fmt(side === 'buy' ? availQ : availB, side === 'buy' ? 2 : ad)} {side === 'buy' ? quote : base}</b>{s.wallet.connected && <button className="icon-btn xs" onClick={() => openModal('deposit', { sym: side === 'buy' ? quote : base })} aria-label={L('充值', 'Deposit')}><ArrowDownToLine size={13} /></button>}</span></div>
          {mode === 'limit'
            ? <NumInput id="sp-px" label={L('價格', 'Price')} value={px} onChange={setPx} suffix={quote} right={<button className="max-btn" onClick={() => setPx(mkt.toFixed(dp))}>{L('最新', 'Last')}</button>} />
            : <div className="num num-dis"><span className="num-label">{L('價格', 'Price')}</span><input disabled value={L('以市場最優價成交', 'Best market price')} /><span className="num-suffix">{quote}</span></div>}
          <NumInput id="sp-amt" label={L('數量', 'Amount')} value={amt} onChange={(v) => { setAmt(v); setPctv(0); }} suffix={base} />
          <Slider id="sp-pct" value={pctv} onChange={setByPct} />
          <NumInput id="sp-total" label={L('成交額', 'Total')} value={total ? total.toFixed(2) : ''} onChange={(v) => { const x = parseFloat(v) || 0; setAmt(usePx ? String(floorTo(x / usePx, ad)) : ''); }} suffix={quote} />
          <div className="row-between small muted">
            <span>{L('手續費率', 'Fee rate')} <span className="mono">{(fee * 100).toFixed(3)}%</span>{t.fee > 0 && <Pill tone="accent" className="ml">{L(`${L(...t.name)} -${t.fee * 100}%`, `${t.name[1]} -${t.fee * 100}%`)}</Pill>}</span>
            <span className="mono">≈ {fmt(side === 'buy' ? a * fee : total * fee, side === 'buy' ? ad : 2)} {side === 'buy' ? base : quote}</span>
          </div>
          {!s.wallet.connected ? <ConnectGate /> : (
            <Btn block size="lg" variant={side === 'buy' ? 'up' : 'down'} onClick={submit} loading={busy} disabled={!a || !usePx}>
              {side === 'buy' ? L(`買入 ${base}`, `Buy ${base}`) : L(`賣出 ${base}`, `Sell ${base}`)}
            </Btn>
          )}
          {s.wallet.connected && availQ < 1 && availB <= 0 && (
            <div className="hint-box"><Info size={14} />{L('現貨帳戶還沒有資金。', 'Your spot account is empty.')}<button className="link-btn" onClick={() => openModal('deposit', { sym: quote })}>{L('去充值', 'Deposit')}</button></div>
          )}
        </>
      )}
    </div>
  );
}

function OrderTable({ rows, canCancel }) {
  if (!rows.length) return <Empty text={L('暫無委託', 'No orders')} />;
  return (
    <div className="table-wrap">
      <table className="tbl stack">
        <thead><tr><th>{L('時間', 'Time')}</th><th>{L('交易對', 'Pair')}</th><th>{L('類型', 'Type')}</th><th>{L('方向', 'Side')}</th><th>{L('價格', 'Price')}</th><th>{L('數量', 'Amount')}</th><th>{L('已成交', 'Filled')}</th><th>{L('狀態', 'Status')}</th>{canCancel && <th />}</tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td className="mono muted">{dateTime(o.ts, true)}</td>
              <td><span className="row-gap"><CoinIcon sym={o.base} size={18} />{o.base}/{o.quote}</span></td>
              <td>{o.type === 'limit' ? L('限價', 'Limit') : L('市價', 'Market')}</td>
              <td className={o.side === 'buy' ? 'up' : 'down'}>{o.side === 'buy' ? L('買入', 'Buy') : L('賣出', 'Sell')}</td>
              <td className="mono">{fmt(o.avg || o.price, pdp(o.price))}</td>
              <td className="mono">{o.amount}</td>
              <td className="mono">{fmt((o.filled / o.amount) * 100, 0)}%</td>
              <td>{o.status === 'open' ? <Pill tone="accent" dot>{L('掛單中', 'Open')}</Pill> : o.status === 'filled' ? <Pill tone="up">{L('已成交', 'Filled')}</Pill> : <Pill>{L('已撤銷', 'Cancelled')}</Pill>}</td>
              {canCancel && <td><button className="link-btn danger" onClick={() => { cancelSpot(o.id); toast(L('已撤單', 'Order cancelled')); }}>{L('撤單', 'Cancel')}</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FillTable({ rows }) {
  if (!rows.length) return <Empty text={L('暫無成交', 'No trades yet')} />;
  return (
    <div className="table-wrap">
      <table className="tbl stack">
        <thead><tr><th>{L('時間', 'Time')}</th><th>{L('交易對', 'Pair')}</th><th>{L('方向', 'Side')}</th><th>{L('成交價', 'Price')}</th><th>{L('數量', 'Amount')}</th><th>{L('手續費', 'Fee')}</th><th>{L('角色', 'Role')}</th></tr></thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id}>
              <td className="mono muted">{dateTime(f.ts, true)}</td>
              <td>{f.base}/{f.quote}</td>
              <td className={f.side === 'buy' ? 'up' : 'down'}>{f.side === 'buy' ? L('買入', 'Buy') : L('賣出', 'Sell')}</td>
              <td className="mono">{fmt(f.price, pdp(f.price))}</td>
              <td className="mono">{f.amount}</td>
              <td className="mono">{fmt(f.fee, 6)} {f.feeSym}</td>
              <td>{f.role === 'maker' ? 'Maker' : 'Taker'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpotAssets() {
  useMarket();
  const s = useApp();
  const syms = Object.keys({ ...s.spot, ...s.frozen }).filter((k) => (s.spot[k] || 0) + (s.frozen[k] || 0) > 1e-9);
  if (!syms.length) return <Empty text={L('現貨帳戶暫無資產', 'No spot assets')}><Btn size="sm" onClick={() => openModal('deposit', {})}>{L('充值', 'Deposit')}</Btn></Empty>;
  return (
    <div className="table-wrap">
      <table className="tbl stack">
        <thead><tr><th>{L('幣種', 'Coin')}</th><th>{L('可用', 'Available')}</th><th>{L('凍結', 'In orders')}</th><th>{L('估值', 'Value')}</th></tr></thead>
        <tbody>
          {syms.map((k) => (
            <tr key={k}>
              <td><span className="row-gap"><CoinIcon sym={k} size={18} />{k}</span></td>
              <td className="mono">{fmt(s.spot[k] || 0, 6)}</td>
              <td className="mono muted">{fmt(s.frozen[k] || 0, 6)}</td>
              <td className="mono">{usd(((s.spot[k] || 0) + (s.frozen[k] || 0)) * (COIN[k] ? price(k) : 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
