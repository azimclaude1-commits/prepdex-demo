import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { getBook, getTrades, price, prevPrice, useMarket } from '../core/market.js';
import { fmt, pdp, adp, timeOnly, usd } from '../core/fmt.js';
import { L } from '../core/lang.js';
import { cx } from './kit.jsx';

function BookIcon({ mode }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      {(mode === 'both' || mode === 'asks') && <rect x="1" y="1" width="12" height={mode === 'both' ? 5 : 12} rx="1" fill="var(--down)" opacity="0.85" />}
      {(mode === 'both' || mode === 'bids') && <rect x="1" y={mode === 'both' ? 8 : 1} width="12" height={mode === 'both' ? 5 : 12} rx="1" fill="var(--up)" opacity="0.85" />}
    </svg>
  );
}

export function OrderBook({ sym, quote = 'USDT', base, onPick, levels = 12 }) {
  useMarket();
  const [mode, setMode] = useState('both');
  const qp = quote === 'USDT' ? 1 : price(quote) / price('USDT');
  const book = getBook(sym, qp, levels * 2);
  const dp = pdp(book.mid);
  const adpv = adp(book.mid);
  const n = mode === 'both' ? levels : levels * 2;
  const asks = book.asks.slice(0, n).reverse();
  const bids = book.bids.slice(0, n);
  const up = price(sym) >= prevPrice(sym);
  const spread = book.asks[0].price - book.bids[0].price;
  const Row = ({ r, side }) => (
    <button className={cx('ob-row', side)} onClick={() => onPick?.(+r.price.toFixed(dp))}>
      <i className="ob-depth" style={{ width: (r.total / book.max) * 100 + '%' }} />
      <span className={cx('mono', side === 'ask' ? 'down' : 'up')}>{fmt(r.price, dp)}</span>
      <span className="mono">{fmt(r.size, adpv)}</span>
      <span className="mono muted">{fmt(r.total, adpv > 2 ? 3 : 1)}</span>
    </button>
  );
  return (
    <div className="ob">
      <div className="ob-head">
        <b>{L('订单簿', 'Order book')}</b>
        <div className="ob-modes">
          {['both', 'bids', 'asks'].map((m) => (
            <button key={m} className={cx(mode === m && 'on')} onClick={() => setMode(m)} aria-label={m}><BookIcon mode={m} /></button>
          ))}
        </div>
      </div>
      <div className="ob-cols"><span>{L('价格', 'Price')}({quote})</span><span>{L('数量', 'Size')}({base || sym})</span><span>{L('累计', 'Total')}</span></div>
      {mode !== 'bids' && <div className="ob-side">{asks.map((r, i) => <Row key={'a' + i} r={r} side="ask" />)}</div>}
      <div className="ob-mid">
        <span className={cx('mono ob-last', up ? 'up' : 'down')}>{fmt(price(sym) / qp, dp)}{up ? <ArrowUp size={15} /> : <ArrowDown size={15} />}</span>
        <span className="muted mono small">≈ {usd(price(sym), dp)}</span>
        <span className="muted small ob-spread">{L('价差', 'Spread')} <span className="mono">{fmt(spread, dp)}</span></span>
      </div>
      {mode !== 'asks' && <div className="ob-side">{bids.map((r, i) => <Row key={'b' + i} r={r} side="bid" />)}</div>}
    </div>
  );
}

export function Trades({ sym, quote = 'USDT', base, max = 18 }) {
  useMarket();
  const qp = quote === 'USDT' ? 1 : price(quote) / price('USDT');
  const list = getTrades(sym).slice(0, max);
  const dp = pdp(price(sym));
  const adpv = adp(price(sym));
  return (
    <div className="trades">
      <div className="ob-head"><b>{L('最新成交', 'Trades')}</b><span className="live-tag"><i className="live-dot" />{L('实时', 'Live')}</span></div>
      <div className="ob-cols"><span>{L('价格', 'Price')}({quote})</span><span>{L('数量', 'Size')}({base || sym})</span><span>{L('时间', 'Time')}</span></div>
      <div className="trades-list">
        {list.map((t) => (
          <div key={t.id} className="tr-row">
            <span className={cx('mono', t.side === 'buy' ? 'up' : 'down')}>{fmt(t.price / qp, dp)}</span>
            <span className="mono">{fmt(t.size, adpv)}</span>
            <span className="mono muted">{timeOnly(t.ts)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
