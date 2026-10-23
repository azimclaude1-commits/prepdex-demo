import { useState } from 'react';
import { Landmark, ShieldCheck, AlertTriangle, Info, HeartPulse, ArrowDownToLine, ArrowUpFromLine, HandCoins, Undo2 } from 'lucide-react';
import { LEND_MARKETS, COIN, borrowRate, KINK } from '../core/data.js';
import { L } from '../core/lang.js';
import { useApp, lendAction, toggleCollateral, lendAmount, lendSummary, poolStats, LMKT, toast, bal, getState } from '../core/store.js';
import { useMarket, price } from '../core/market.js';
import { fmt, usd, compact, floorTo, adp } from '../core/fmt.js';
import { Btn, Tabs, NumInput, Progress, Pill, CoinIcon, Modal, KV, Empty, cx } from '../ui/kit.jsx';
import { PageHead, ConnectGate } from '../layout/Shell.jsx';

function hfTone(hf) {
  if (!isFinite(hf)) return 'up';
  if (hf < 1.1) return 'down';
  if (hf < 1.5) return 'warn';
  return 'up';
}
const hfText = (hf) => (isFinite(hf) ? hf.toFixed(2) : '∞');

function HealthGauge({ hf }) {
  const a = (x) => Math.PI * (1 - (x - 1) / 2); // 1.0 at the left end, 3.0 at the right end
  const v = isFinite(hf) ? Math.max(1, Math.min(hf, 3)) : 3;
  const clamped = a(v);
  const cx0 = 110, cy0 = 104, R = 86;
  const nx = cx0 + Math.cos(clamped) * (R - 18);
  const ny = cy0 - Math.sin(clamped) * (R - 18);
  const arc = (a0, a1, color) => {
    const x0 = cx0 + Math.cos(a0) * R, y0 = cy0 - Math.sin(a0) * R;
    const x1 = cx0 + Math.cos(a1) * R, y1 = cy0 - Math.sin(a1) * R;
    return <path d={`M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`} stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" />;
  };
  return (
    <svg viewBox="0 0 220 124" className="gauge" role="img" aria-label={L('健康度', 'Health factor')}>
      {arc(a(1), a(1.1), 'var(--down)')}
      {arc(a(1.12), a(1.5), 'var(--warn)')}
      {arc(a(1.52), a(3), 'var(--up)')}
      <line x1={cx0} y1={cy0} x2={nx} y2={ny} stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx0} cy={cy0} r="6" fill="var(--fg)" />
      <text x="22" y="122" fontSize="10" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">1.0</text>
      <text x="180" y="122" fontSize="10" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">3.0+</text>
    </svg>
  );
}

export function Lending() {
  useMarket();
  const s = useApp();
  const [act, setAct] = useState(null);
  const sum = lendSummary();
  const supplies = LEND_MARKETS.filter((m) => lendAmount('supply', m.sym) > 1e-9);
  const borrows = LEND_MARKETS.filter((m) => lendAmount('borrow', m.sym) > 1e-9);
  const tone = hfTone(sum.hf);
  return (
    <div className="page">
      <PageHead eyebrow={<><Landmark size={14} />{L('借貸', 'Lending')}</>} title={L('存幣生息，抵押借幣', 'Supply to earn, borrow against it')}
        sub={L('存入資產賺取浮動利息，並可作為抵押品借出其他資產。利率隨資金利用率即時變化。', 'Supply assets to earn variable interest and use them as collateral to borrow. Rates move with pool utilisation.')} />

      <div className="lend-dash">
        <div className="card lend-net">
          <div className="lend-kpis">
            <div><span>{L('淨資產', 'Net worth')}</span><b className="mono">{usd(sum.supplied - sum.borrowed)}</b></div>
            <div><span>{L('淨年化', 'Net APY')}</span><b className={cx('mono', sum.netApy >= 0 ? 'up' : 'down')}>{(sum.netApy * 100).toFixed(2)}%</b></div>
            <div><span>{L('存款總額', 'Supplied')}</span><b className="mono">{usd(sum.supplied)}</b></div>
            <div><span>{L('借款總額', 'Borrowed')}</span><b className="mono">{usd(sum.borrowed)}</b></div>
          </div>
          <div className="lend-limit">
            <div className="row-between small"><span className="muted">{L('借款額度已用', 'Borrow limit used')}</span><b className="mono">{(sum.used * 100).toFixed(1)}%</b></div>
            <Progress value={sum.used} tone={sum.used > 0.85 ? 'down' : sum.used > 0.6 ? 'warn' : 'up'} />
            <div className="row-between small muted"><span>{L('可借', 'Available to borrow')} <b className="mono">{usd(sum.avail)}</b></span><span>{L('額度', 'Limit')} <b className="mono">{usd(sum.power)}</b></span></div>
          </div>
        </div>
        <div className={cx('card lend-hf', 'tone-' + tone)}>
          <div className="row-between"><b><HeartPulse size={16} />{L('健康度', 'Health factor')}</b><Pill tone={tone === 'warn' ? 'warn' : tone}>{tone === 'up' ? L('安全', 'Safe') : tone === 'warn' ? L('注意', 'Watch') : L('危險', 'At risk')}</Pill></div>
          <HealthGauge hf={sum.hf} />
          <div className="hf-val mono">{hfText(sum.hf)}</div>
          <p className="fine">{L('健康度 = 抵押品 × 清算閾值 ÷ 借款。低於 1 時將觸發清算，清算罰金 5%。', 'Health factor = collateral × liquidation threshold ÷ debt. Below 1 the position is liquidated with a 5% penalty.')}</p>
        </div>
      </div>

      <div className="grid2 lend-pos">
        <div className="card">
          <div className="row-between"><h3 className="sub-h"><ArrowDownToLine size={16} />{L('我的存款', 'My supplies')}</h3></div>
          {supplies.length === 0 ? <Empty text={L('暫無存款', 'Nothing supplied')} /> : (
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>{L('資產', 'Asset')}</th><th>{L('數量', 'Balance')}</th><th>APY</th><th>{L('抵押', 'Collateral')}</th><th /></tr></thead>
                <tbody>
                  {supplies.map((m) => {
                    const v = lendAmount('supply', m.sym);
                    return (
                      <tr key={m.sym}>
                        <td><span className="row-gap"><CoinIcon sym={m.sym} size={20} />{m.sym}</span></td>
                        <td className="mono">{fmt(v, adp(price(m.sym)) + 2)}<div className="small muted">{usd(v * price(m.sym))}</div></td>
                        <td className="mono up">{(poolStats(m.sym).sApr * 100).toFixed(2)}%</td>
                        <td><button className={cx('switch', s.lend.coll[m.sym] && 'on')} onClick={() => { const r = toggleCollateral(m.sym); if (r.err) toast(r.err, 'err'); }} aria-label={L('作為抵押品', 'Use as collateral')}><i /></button></td>
                        <td><div className="row-gap"><button className="mini-btn" onClick={() => setAct({ sym: m.sym, tab: 'withdraw' })}>{L('取出', 'Withdraw')}</button><button className="mini-btn strong" onClick={() => setAct({ sym: m.sym, tab: 'supply' })}>{L('存入', 'Supply')}</button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card">
          <div className="row-between"><h3 className="sub-h"><HandCoins size={16} />{L('我的借款', 'My borrows')}</h3></div>
          {borrows.length === 0 ? <Empty text={L('暫無借款', 'No borrows')} /> : (
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>{L('資產', 'Asset')}</th><th>{L('債務', 'Debt')}</th><th>APR</th><th /></tr></thead>
                <tbody>
                  {borrows.map((m) => {
                    const v = lendAmount('borrow', m.sym);
                    return (
                      <tr key={m.sym}>
                        <td><span className="row-gap"><CoinIcon sym={m.sym} size={20} />{m.sym}</span></td>
                        <td className="mono">{fmt(v, adp(price(m.sym)) + 2)}<div className="small muted">{usd(v * price(m.sym))}</div></td>
                        <td className="mono down">{(poolStats(m.sym).bApr * 100).toFixed(2)}%</td>
                        <td><div className="row-gap"><button className="mini-btn" onClick={() => setAct({ sym: m.sym, tab: 'borrow' })}>{L('借出', 'Borrow')}</button><button className="mini-btn strong" onClick={() => setAct({ sym: m.sym, tab: 'repay' })}>{L('還款', 'Repay')}</button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="sec-head"><h2 className="display sec-title">{L('借貸市場', 'Markets')}</h2></div>
      <div className="card">
        <div className="table-wrap">
          <table className="tbl tbl-markets">
            <thead><tr><th>{L('資產', 'Asset')}</th><th>{L('總存款', 'Total supplied')}</th><th>{L('存款年化', 'Supply APY')}</th><th>{L('總借款', 'Total borrowed')}</th><th>{L('借款年化', 'Borrow APR')}</th><th>{L('利用率', 'Utilisation')}</th><th>{L('抵押率 / 清算線', 'LTV / Liq.')}</th><th>{L('可用餘額', 'In spot')}</th><th /></tr></thead>
            <tbody>
              {LEND_MARKETS.map((m) => {
                const st = poolStats(m.sym);
                return (
                  <tr key={m.sym}>
                    <td><span className="row-gap"><CoinIcon sym={m.sym} size={26} /><span><b>{m.sym}</b><div className="small muted">{COIN[m.sym].name}</div></span></span></td>
                    <td className="mono">{compact(st.supply, 2)}<div className="small muted">${compact(st.supply * price(m.sym), 2)}</div></td>
                    <td className="mono up">{(st.sApr * 100).toFixed(2)}%</td>
                    <td className="mono">{compact(st.borrow, 2)}<div className="small muted">${compact(st.borrow * price(m.sym), 2)}</div></td>
                    <td className="mono down">{(st.bApr * 100).toFixed(2)}%</td>
                    <td><div className="util"><Progress value={st.u} thin tone={st.u > KINK ? 'warn' : 'accent'} /><span className="mono small">{(st.u * 100).toFixed(1)}%</span></div></td>
                    <td className="mono">{m.ltv * 100}% / {m.lt * 100}%</td>
                    <td className="mono">{fmt(bal(m.sym), 4)}</td>
                    <td><div className="row-gap"><button className="mini-btn strong" onClick={() => setAct({ sym: m.sym, tab: 'supply' })}>{L('存入', 'Supply')}</button><button className="mini-btn" onClick={() => setAct({ sym: m.sym, tab: 'borrow' })}>{L('借出', 'Borrow')}</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {act && <LendModal sym={act.sym} tab0={act.tab} onClose={() => setAct(null)} />}
    </div>
  );
}

function RateCurve({ sym }) {
  const m = LMKT[sym];
  const st = poolStats(sym);
  const W = 300, H = 120, pad = 22;
  const maxR = borrowRate(m, 1);
  const x = (u) => pad + u * (W - pad * 2);
  const y = (r) => H - pad - (r / maxR) * (H - pad * 1.6);
  let d = '';
  for (let i = 0; i <= 50; i++) { const u = i / 50; d += (i ? 'L' : 'M') + x(u).toFixed(1) + ' ' + y(borrowRate(m, u)).toFixed(1); }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rate-curve" role="img" aria-label={L('利率模型', 'Rate model')}>
      <line x1={x(KINK)} x2={x(KINK)} y1={pad / 2} y2={H - pad} stroke="var(--grid)" strokeDasharray="3 3" />
      <text x={x(KINK)} y={pad / 2 + 2} fontSize="9" fill="var(--muted)" textAnchor="middle">{L('拐點', 'Kink')} 80%</text>
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="var(--line)" />
      <path d={d} fill="none" stroke="var(--down)" strokeWidth="2" />
      <circle cx={x(st.u)} cy={y(st.bApr)} r="4.5" fill="var(--accent)" />
      <text x={x(st.u) + 8} y={y(st.bApr) - 6} fontSize="10" fill="var(--fg)" fontFamily="JetBrains Mono, monospace">{(st.bApr * 100).toFixed(2)}%</text>
      <text x={pad} y={H - 6} fontSize="9" fill="var(--muted)">0%</text>
      <text x={W - pad} y={H - 6} fontSize="9" fill="var(--muted)" textAnchor="end">{L('利用率', 'Utilisation')} 100%</text>
    </svg>
  );
}

function LendModal({ sym, tab0, onClose }) {
  useMarket();
  const s = useApp();
  const [tab, setTab] = useState(tab0);
  const [amt, setAmt] = useState('');
  const m = LMKT[sym];
  const px = price(sym);
  const a = parseFloat(amt) || 0;
  const sum = lendSummary();
  const st = poolStats(sym);
  const supplied = lendAmount('supply', sym);
  const owed = lendAmount('borrow', sym);
  const coll = s.lend.coll[sym];

  let max = 0;
  if (tab === 'supply') max = bal(sym);
  if (tab === 'withdraw') max = supplied;
  if (tab === 'borrow') max = Math.min(st.avail, (sum.avail / px) * 0.99);
  if (tab === 'repay') max = Math.min(owed, bal(sym));

  // projected health factor after the action
  let liq = sum.liqLimit, debt = sum.borrowed, power = sum.power;
  const usdv = a * px;
  if (tab === 'supply' && coll) { liq += usdv * m.lt; power += usdv * m.ltv; }
  if (tab === 'withdraw' && coll) { liq -= usdv * m.lt; power -= usdv * m.ltv; }
  if (tab === 'borrow') debt += usdv;
  if (tab === 'repay') debt = Math.max(0, debt - usdv);
  const hfAfter = debt > 0 ? liq / debt : Infinity;

  const labels = { supply: L('存入', 'Supply'), withdraw: L('取出', 'Withdraw'), borrow: L('借出', 'Borrow'), repay: L('還款', 'Repay') };
  const submit = () => {
    const r = lendAction(tab, sym, a);
    if (r.err) { toast(r.err, 'err'); return; }
    toast(L(`${labels[tab]}成功`, `${labels[tab]} done`), 'ok', `${fmt(a, 6)} ${sym}`);
    onClose();
  };
  return (
    <Modal title={<span className="row-gap"><CoinIcon sym={sym} size={22} />{sym}</span>} onClose={onClose} width={480}>
      <div className="stack">
        <Tabs value={tab} onChange={(t) => { setTab(t); setAmt(''); }} items={[['supply', labels.supply], ['withdraw', labels.withdraw], ['borrow', labels.borrow], ['repay', labels.repay]]} />
        <NumInput id="ld-amt" label={L('數量', 'Amount')} value={amt} onChange={setAmt} suffix={sym}
          right={<button className="max-btn" onClick={() => setAmt(String(floorTo(max, adp(px) + 2)))}>MAX</button>} />
        <div className="row-between small muted">
          <span>{tab === 'supply' ? L('現貨可用', 'In spot') : tab === 'withdraw' ? L('已存入', 'Supplied') : tab === 'borrow' ? L('最多可借', 'Max borrow') : L('當前債務', 'Debt')}</span>
          <span className="mono">{fmt(tab === 'repay' ? owed : max, adp(px) + 2)} {sym}</span>
        </div>
        <div className="summary">
          <KV k={tab === 'supply' || tab === 'withdraw' ? L('存款年化', 'Supply APY') : L('借款年化', 'Borrow APR')} v={<span className={tab === 'supply' || tab === 'withdraw' ? 'up' : 'down'}>{((tab === 'supply' || tab === 'withdraw' ? st.sApr : st.bApr) * 100).toFixed(2)}%</span>} />
          <KV k={L('健康度', 'Health factor')} v={<span><span className={'tone-text-' + hfTone(sum.hf)}>{hfText(sum.hf)}</span> → <b className={'tone-text-' + hfTone(hfAfter)}>{hfText(hfAfter)}</b></span>} />
          <KV k={L('借款額度已用', 'Limit used')} v={`${(sum.used * 100).toFixed(1)}% → ${power > 0 ? ((debt / power) * 100).toFixed(1) : '0.0'}%`} />
          <KV k={L('抵押率 / 清算線', 'LTV / Liq. threshold')} v={`${m.ltv * 100}% / ${m.lt * 100}%`} />
          {(tab === 'supply' || tab === 'withdraw') && <KV k={L('用作抵押品', 'Used as collateral')} v={coll ? L('是', 'Yes') : L('否', 'No')} />}
        </div>
        {hfAfter < 1.2 && a > 0 && <div className="warn-box"><AlertTriangle size={15} />{L('操作後健康度偏低，價格波動可能導致清算。', 'Health factor will be low; price moves could trigger liquidation.')}</div>}
        <div className="curve-box"><div className="field-label">{L('利率模型（借款利率 vs 利用率）', 'Rate model (borrow APR vs utilisation)')}</div><RateCurve sym={sym} /></div>
        {!s.wallet.connected ? <ConnectGate /> : <Btn block size="lg" disabled={!a} onClick={submit}>{labels[tab]} {sym}</Btn>}
      </div>
    </Modal>
  );
}
