import { useState } from 'react';
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Repeat, BadgeDollarSign, Eye, EyeOff, Search, Wallet as WalletIco, History, Activity,
} from 'lucide-react';
import { COINS, COIN, NETWORKS, PROJECTS } from '../core/data.js';
import { L } from '../core/lang.js';
import { useApp, openModal, go, portfolio, valueOf, lendAmount } from '../core/store.js';
import { useMarket, price, change24 } from '../core/market.js';
import { fmt, usd, dateTime, shortAddr, adp } from '../core/fmt.js';
import { Btn, Tabs, CoinIcon, Donut, Delta, Pill, Empty, CopyBtn, cx } from '../ui/kit.jsx';
import { ConnectGate } from '../layout/Shell.jsx';
import { StatusPill } from '../layout/Modals.jsx';

const ACC_COLORS = { spot: 'var(--accent)', futures: 'var(--violet)', earn: '#4FD1C5', lend: '#5B8CFF' };

export function Wallet({ arg }) {
  useMarket();
  const s = useApp();
  const [tab, setTab] = useState(arg === 'records' ? 'records' : 'assets');
  const [hide, setHide] = useState(false);
  const [acc, setAcc] = useState('total');
  const pf = portfolio();
  const mask = (v) => (hide ? '••••••' : v);
  const pnlToday = Object.entries(s.spot).reduce((a, [k, v]) => a + (COIN[k] && !COIN[k].stable ? v * price(k) * (change24(k) / (1 + change24(k))) : 0), 0);
  const shown = acc === 'total' ? pf.total : pf[acc];
  const accName = { total: L('总资产', 'Total'), spot: L('现货', 'Spot'), futures: L('合约', 'Futures'), earn: L('质押', 'Staking'), lend: L('借贷', 'Lending') };

  if (!s.wallet.connected) {
    return (
      <div className="page">
        <div className="wallet-gate card">
          <WalletIco size={40} />
          <h2 className="display">{L('连接钱包查看资产', 'Connect to see your assets')}</h2>
          <p className="muted">{L('连接插件钱包并签名登录后，你可以充值、提币，并在各账户间划转资产。', 'Connect and sign in to deposit, withdraw and move funds between accounts.')}</p>
          <div style={{ maxWidth: 320, width: '100%' }}><ConnectGate /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="w-hero">
        <div className="w-hero-glow" />
        <div className="w-hero-top">
          <div>
            <div className="eyebrow light">{L('账户净值估算', 'Estimated net worth')} <button className="icon-btn xs ghosty" onClick={() => setHide(!hide)} aria-label={L('隐藏金额', 'Hide balances')}>{hide ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
            <div className="w-total mono">{mask(usd(shown))}</div>
            <div className="w-sub">
              <span>≈ {mask(fmt(shown / price('BTC'), 6))} BTC</span>
              <span>{L('今日盈亏', "Today's PnL")} <b className={pnlToday >= 0 ? 'up-light' : 'down-light'}>{mask((pnlToday >= 0 ? '+' : '') + usd(pnlToday))}</b></span>
            </div>
          </div>
          <div className="acc-switch">
            {['total', 'spot', 'futures', 'earn', 'lend'].map((k) => <button key={k} className={cx(acc === k && 'on')} onClick={() => setAcc(k)}>{accName[k]}</button>)}
          </div>
        </div>
        <div className="w-actions">
          <button onClick={() => openModal('deposit', {})}><ArrowDownToLine size={18} />{L('充币', 'Deposit')}</button>
          <button onClick={() => openModal('withdraw', {})}><ArrowUpFromLine size={18} />{L('提币', 'Withdraw')}</button>
          <button onClick={() => openModal('transfer', {})}><ArrowLeftRight size={18} />{L('划转', 'Transfer')}</button>
          <button onClick={() => openModal('convert', {})}><Repeat size={18} />{L('闪兑', 'Convert')}</button>
          <button onClick={() => go('otc')}><BadgeDollarSign size={18} />{L('买币', 'Buy')}</button>
        </div>
        <div className="w-addr"><span className="muted-light">{L('已连接地址', 'Connected')}</span><span className="mono">{shortAddr(s.wallet.address)}</span><CopyBtn text={s.wallet.address} /></div>
      </div>

      <div className="w-split">
        <div className="card w-alloc">
          <h3 className="sub-h">{L('资产分布', 'Allocation')}</h3>
          <div className="w-alloc-in">
            <Donut size={170} thick={20} data={['spot', 'futures', 'earn', 'lend'].map((k) => ({ label: accName[k], value: Math.max(0, pf[k]), color: ACC_COLORS[k] }))}
              center={<><b className="mono">{hide ? '••' : '$' + fmt(pf.total, 0)}</b><span>{L('总计', 'Total')}</span></>} />
            <div className="legend">
              {['spot', 'futures', 'earn', 'lend'].map((k) => (
                <button key={k} className="legend-row" onClick={() => go(k === 'earn' ? 'staking' : k === 'lend' ? 'lending' : k)}>
                  <i style={{ background: ACC_COLORS[k] }} /><span>{accName[k]}</span><b className="mono">{mask(usd(pf[k]))}</b>
                  <span className="muted small mono">{pf.total > 0 ? ((Math.max(0, pf[k]) / pf.total) * 100).toFixed(1) : '0.0'}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="card w-onchain">
          <h3 className="sub-h">{L('插件钱包（链上）', 'Browser wallet (on-chain)')}</h3>
          <p className="muted small">{L('这些资产还在你自己的钱包里，充值后才能在平台交易。', 'These funds are still in your own wallet. Deposit them to trade.')}</p>
          <div className="onchain-list">
            {Object.entries(s.wallet.onchain).filter(([, v]) => v > 0).map(([k, v]) => (
              <div key={k} className="onchain-row">
                <CoinIcon sym={k} size={22} /><b>{k}</b><span className="mono">{mask(fmt(v, adp(price(k))))}</span>
                <button className="mini-btn strong" onClick={() => openModal('deposit', { sym: k })}>{L('充值', 'Deposit')}</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sec-head">
        <Tabs value={tab} onChange={setTab} variant="line" items={[['assets', L('资产列表', 'Assets')], ['records', L('资金记录', 'Activity')]]} />
      </div>
      {tab === 'assets' ? <AssetList hide={hide} /> : <Records />}
    </div>
  );
}

function AssetList({ hide }) {
  useMarket();
  const s = useApp();
  const [q, setQ] = useState('');
  const [hideZero, setHideZero] = useState(false);
  const extra = PROJECTS.filter((p) => !COIN[p.sym]).map((p) => p.sym);
  const syms = [...COINS.map((c) => c.sym), ...extra];
  const rows = syms.map((k) => {
    const avail = s.spot[k] || 0;
    const frozen = s.frozen[k] || 0;
    const staked = s.stakes.filter((x) => x.status === 'active' && x.sym === k).reduce((a, x) => a + x.amount, 0);
    const supplied = lendAmount('supply', k);
    const fut = k === 'USDT' ? s.futures.USDT || 0 : 0;
    const total = avail + frozen + staked + supplied + fut;
    return { k, avail, frozen: frozen + staked + supplied + fut, total, value: valueOf(k, total) };
  }).filter((r) => (!hideZero || r.total > 1e-9) && (r.k.toLowerCase().includes(q.toLowerCase()) || (COIN[r.k]?.name || '').toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.value - a.value || a.k.localeCompare(b.k));
  const mask = (v) => (hide ? '••••' : v);
  return (
    <div className="card">
      <div className="asset-tools">
        <div className="search"><Search size={15} /><input placeholder={L('搜索币种', 'Search coins')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <span className="live-tag"><i className="live-dot" />{L('实时', 'Live')}</span>
        <label className="toggle-line"><button className={cx('switch', hideZero && 'on')} onClick={() => setHideZero(!hideZero)} aria-label={L('隐藏零余额', 'Hide zero balances')}><i /></button>{L('隐藏零余额', 'Hide zero balances')}</label>
      </div>
      <div className="table-wrap">
        <table className="tbl assets-tbl">
          <thead><tr><th>{L('币种', 'Coin')}</th><th>{L('总额', 'Total')}</th><th>{L('可用', 'Available')}</th><th>{L('占用', 'Locked / in use')}</th><th>{L('估值', 'Value')}</th><th>{L('24h', '24h')}</th><th>{L('操作', 'Actions')}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k}>
                <td><span className="row-gap"><CoinIcon sym={r.k} size={30} /><span><b>{r.k}</b><div className="small muted">{COIN[r.k]?.name || PROJECTS.find((p) => p.sym === r.k)?.name}</div></span></span></td>
                <td className="mono">{mask(fmt(r.total, 6))}</td>
                <td className="mono">{mask(fmt(r.avail, 6))}</td>
                <td className="mono muted">{mask(fmt(r.frozen, 6))}</td>
                <td className="mono">{mask(usd(r.value))}</td>
                <td>{COIN[r.k] ? <Delta v={change24(r.k)} /> : <Pill tone="violet">{L('未上线', 'Unlisted')}</Pill>}</td>
                <td>
                  <div className="row-gap">
                    {COIN[r.k] && <button className="link-btn" onClick={() => openModal('deposit', { sym: r.k })}>{L('充值', 'Deposit')}</button>}
                    {COIN[r.k] && r.avail > 0 && <button className="link-btn" onClick={() => openModal('withdraw', { sym: r.k })}>{L('提币', 'Withdraw')}</button>}
                    {COIN[r.k] && !COIN[r.k].stable && <button className="link-btn" onClick={() => go('spot', `${r.k}_USDT`)}>{L('交易', 'Trade')}</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Records() {
  const s = useApp();
  const [k, setK] = useState('all');
  const rows = s.records.filter((r) => k === 'all' || r.kind === k);
  const kind = { deposit: L('充值', 'Deposit'), withdraw: L('提币', 'Withdraw'), transfer: L('划转', 'Transfer'), convert: L('闪兑', 'Convert'), otc: 'OTC', lend: L('借贷', 'Lending') };
  const lendAct = { supply: L('存入', 'Supply'), withdraw: L('取出', 'Withdraw'), borrow: L('借出', 'Borrow'), repay: L('还款', 'Repay') };
  const accN = (x) => (x === 'spot' ? L('现货', 'Spot') : L('合约', 'Futures'));
  return (
    <div className="card">
      <Tabs size="sm" value={k} onChange={setK} items={[['all', L('全部', 'All')], ...Object.entries(kind)]} />
      {rows.length === 0 ? <Empty text={L('暂无记录', 'No activity yet')} /> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>{L('时间', 'Time')}</th><th>{L('类型', 'Type')}</th><th>{L('币种', 'Coin')}</th><th>{L('数量', 'Amount')}</th><th>{L('详情', 'Details')}</th><th>{L('状态', 'Status')}</th></tr></thead>
            <tbody>
              {rows.slice(0, 80).map((r) => (
                <tr key={r.id}>
                  <td className="mono muted">{dateTime(r.ts, true)}</td>
                  <td>{kind[r.kind]}{r.kind === 'lend' ? ' · ' + lendAct[r.action] : ''}{r.kind === 'otc' ? ' · ' + (r.side === 'buy' ? L('买入', 'Buy') : L('卖出', 'Sell')) : ''}</td>
                  <td><span className="row-gap"><CoinIcon sym={r.sym} size={18} />{r.sym}</span></td>
                  <td className={cx('mono', ['deposit', 'otc'].includes(r.kind) && r.side !== 'sell' ? 'up' : r.kind === 'withdraw' ? 'down' : '')}>
                    {r.kind === 'deposit' || (r.kind === 'otc' && r.side === 'buy') ? '+' : r.kind === 'withdraw' ? '-' : ''}{fmt(r.amount, 6)}
                  </td>
                  <td className="small muted">
                    {r.kind === 'deposit' && <>{NETWORKS[r.net]?.short}{r.txid && <> · <span className="mono">{shortAddr(r.txid)}</span></>}{r.demo && ' · ' + L('演示入金', 'demo')}</>}
                    {r.kind === 'withdraw' && <>{NETWORKS[r.net]?.short} → <span className="mono">{shortAddr(r.address)}</span> · {L('手续费', 'fee')} {r.fee}</>}
                    {r.kind === 'transfer' && <>{accN(r.from)} → {accN(r.to)}</>}
                    {r.kind === 'convert' && <>→ <span className="mono">{fmt(r.out, 6)} {r.to}</span></>}
                    {r.kind === 'otc' && <>{fmt(r.fiatAmt, 2)} {r.fiat}{r.via ? ' · ' + r.via : ''}</>}
                  </td>
                  <td><StatusPill r={r} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
