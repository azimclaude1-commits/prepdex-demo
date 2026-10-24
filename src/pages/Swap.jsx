import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Settings2, RefreshCw, Route, Info, CheckCircle2, AlertTriangle, ArrowRight, Wallet as WalletIco, History, Repeat } from 'lucide-react';
import { COIN } from '../core/data.js';
import { L } from '../core/lang.js';
import { useApp, swapQuote, swapTokens, SWAP_TOKENS, bal, toast, openModal, go, tier } from '../core/store.js';
import { useMarket, price, getCandles } from '../core/market.js';
import { fmt, usd, pdp, adp, floorTo, dateTime } from '../core/fmt.js';
import { Btn, CoinSelect, CoinIcon, Modal, KV, Spark, Pill, Empty, cx } from '../ui/kit.jsx';
import { PageHead, ConnectGate } from '../layout/Shell.jsx';

const SLIPPAGES = [0.001, 0.005, 0.01];
const QUOTE_SECONDS = 15;
const POPULAR = [['ETH', 'USDT'], ['BTC', 'USDC'], ['SOL', 'ETH'], ['NVX', 'USDT'], ['ORBX', 'USDC']];

function impactTone(i) {
  if (i < 0.01) return 'up';
  if (i < 0.03) return 'warn';
  return 'down';
}
const amtDp = (sym) => adp(price(sym)) + (COIN[sym].stable ? 0 : 1);
// Show the rate the readable way round (1 ETH = 3,480 USDT rather than 1 USDT = 0.000287 ETH)
function rateLabel(from, to, rate, invert = false) {
  const flip = (rate < 0.01) !== invert;
  return flip ? `1 ${to} = ${fmt(1 / rate, pdp(1 / rate))} ${from}` : `1 ${from} = ${fmt(rate, pdp(rate))} ${to}`;
}

export function Swap() {
  useMarket();
  const s = useApp();
  const [from, setFrom] = useState('USDT');
  const [to, setTo] = useState('ETH');
  const [amt, setAmt] = useState('');
  const [slip, setSlip] = useState(0.005);
  const [custom, setCustom] = useState('');
  const [settings, setSettings] = useState(false);
  const [invert, setInvert] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const a = parseFloat(amt) || 0;
  const q = swapQuote(from, to, a);
  const minOut = q.out * (1 - slip);
  const have = bal(from);
  const t = tier();

  const pick = (side, sym) => {
    if (side === 'from') { if (sym === to) setTo(from); setFrom(sym); } else { if (sym === from) setFrom(to); setTo(sym); }
    setAmt('');
  };
  const flip = () => { setFrom(to); setTo(from); setAmt(q.out ? String(floorTo(q.out, amtDp(to))) : ''); };

  let block = null;
  if (!a) block = L('輸入數量', 'Enter an amount');
  else if (a > have + 1e-12) block = L(`${from} 餘額不足`, `Insufficient ${from}`);
  else if (q.impact > 0.15) block = L('價格影響過大', 'Price impact too high');

  const rateText = rateLabel(from, to, q.rate, invert);

  return (
    <div className="page">
      <PageHead eyebrow={<><Repeat size={14} />Swap</>} title={L('一鍵兌換', 'Swap tokens')}
        sub={L('用現貨帳戶中的資產直接兌換，自動選擇最優路徑，成交即時到帳。', 'Swap straight from your spot balance. We pick the best route and settle instantly.')} />
      <div className="swap-layout">
        <div className="card swap-card">
          <div className="swap-head">
            <b>{L('兌換', 'Swap')}</b>
            <div className="swap-tools">
              <span className="muted small">{L('滑點', 'Slippage')} {(slip * 100).toFixed(slip < 0.01 ? 1 : 2)}%</span>
              <button className={cx('icon-btn', settings && 'on')} onClick={() => setSettings(!settings)} aria-label={L('設定', 'Settings')}><Settings2 size={17} /></button>
            </div>
            {settings && (
              <div className="swap-settings">
                <div className="field-label">{L('最大滑點', 'Max slippage')}</div>
                <div className="slip-row">
                  {SLIPPAGES.map((x) => <button key={x} className={cx('slip', slip === x && !custom && 'on')} onClick={() => { setSlip(x); setCustom(''); }}>{(x * 100).toFixed(1)}%</button>)}
                  <label className={cx('slip custom', custom && 'on')}>
                    <input id="slip-custom" inputMode="decimal" placeholder={L('自訂', 'Custom')} value={custom}
                      onChange={(e) => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) { setCustom(v); const n = parseFloat(v); if (n > 0 && n <= 50) setSlip(n / 100); } }} />%
                  </label>
                </div>
                {slip > 0.03 && <div className="warn-box"><AlertTriangle size={14} />{L('滑點較高，成交價可能明顯偏離報價', 'High slippage: the fill can differ noticeably from the quote')}</div>}
                <p className="fine">{L('若成交時價格變動超過滑點，兌換將自動取消，資產不會扣除。', 'If the price moves more than this before execution, the swap is cancelled and nothing is deducted.')}</p>
              </div>
            )}
          </div>

          <div className="swap-box">
            <div className="swap-top">
              <span>{L('支付', 'You pay')}</span>
              <span className="muted small">{L('可用', 'Avail.')} <span className="mono">{fmt(have, amtDp(from))}</span></span>
            </div>
            <div className="swap-mid">
              <input id="swap-in" className="swap-input mono" inputMode="decimal" placeholder="0" value={amt} aria-label={L('支付數量', 'Amount to pay')}
                onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setAmt(e.target.value)} />
              <CoinSelect compact value={from} options={SWAP_TOKENS} onChange={(v) => pick('from', v)} balances={(k) => fmt(bal(k), 4)} />
            </div>
            <div className="swap-foot">
              <span className="muted small mono">≈ {usd(q.usdIn)}</span>
              <div className="quick-pct">
                {[[0.25, '25%'], [0.5, '50%'], [1, 'MAX']].map(([f, lbl]) => (
                  <button key={lbl} onClick={() => setAmt(String(floorTo(have * f, amtDp(from))))} disabled={!have}>{lbl}</button>
                ))}
              </div>
            </div>
          </div>
          <button className="swap-flip" onClick={flip} aria-label={L('交換方向', 'Flip')}><ArrowDownUp size={18} /></button>
          <div className="swap-box">
            <div className="swap-top">
              <span>{L('收到（預估）', 'You receive (est.)')}</span>
              <span className="muted small">{L('餘額', 'Bal.')} <span className="mono">{fmt(bal(to), amtDp(to))}</span></span>
            </div>
            <div className="swap-mid">
              <div className="swap-input mono out">{a ? fmt(q.out, amtDp(to)) : '0'}</div>
              <CoinSelect compact value={to} options={SWAP_TOKENS} onChange={(v) => pick('to', v)} balances={(k) => fmt(bal(k), 4)} />
            </div>
            <div className="swap-foot"><span className="muted small mono">≈ {usd(q.out * price(to))}</span></div>
          </div>

          <div className="summary swap-info">
            <div className="kv"><span>{L('匯率', 'Rate')}</span><button className="rate-btn mono" onClick={() => setInvert(!invert)}>{rateText}<RefreshCw size={12} /></button></div>
            <KV k={L('價格影響', 'Price impact')} v={<span className={'tone-text-' + impactTone(q.impact)}>{a ? (q.impact * 100).toFixed(2) + '%' : '--'}</span>} />
            <KV k={L('最少收到', 'Minimum received')} v={a ? `${fmt(minOut, amtDp(to))} ${to}` : '--'} />
            <KV k={L('手續費', 'Fee')} v={<span>{(q.fee * 100).toFixed(3)}%{t.fee > 0 && <Pill tone="accent" className="ml">-{t.fee * 100}%</Pill>}</span>} />
            <div className="kv"><span>{L('路徑', 'Route')}</span>
              <span className="route">
                {q.route.map((r, i) => <span key={r + i} className="route-hop"><CoinIcon sym={r} size={16} />{r}{i < q.route.length - 1 && <ArrowRight size={12} className="muted" />}</span>)}
              </span>
            </div>
          </div>

          {!s.wallet.connected ? <ConnectGate /> : (
            <Btn block size="lg" disabled={!!block} onClick={() => setConfirm(true)}>{block || L('兌換', 'Swap')}</Btn>
          )}
          {s.wallet.connected && have <= 0 && (
            <div className="hint-box"><Info size={14} />{L(`現貨帳戶沒有 ${from}。`, `No ${from} in your spot account.`)}<button className="link-btn" onClick={() => openModal('deposit', { sym: from })}>{L('去充值', 'Deposit')}</button></div>
          )}
        </div>

        <div className="swap-side">
          <PairChart from={from} to={to} />
          <SpotBalances onPick={(sym) => pick('from', sym)} />
          <RecentSwaps />
        </div>
      </div>

      <div className="popular">
        <span className="muted small">{L('熱門兌換', 'Popular pairs')}</span>
        {POPULAR.map(([f, tt]) => (
          <button key={f + tt} className="pop-pair" onClick={() => { setFrom(f); setTo(tt); setAmt(''); }}>
            <CoinIcon sym={f} size={18} />{f}<ArrowRight size={12} /><CoinIcon sym={tt} size={18} />{tt}
          </button>
        ))}
      </div>

      {confirm && <ConfirmSwap from={from} to={to} amount={a} slip={slip} onClose={() => setConfirm(false)} onDone={() => setAmt('')} />}
    </div>
  );
}

function PairChart({ from, to }) {
  useMarket();
  const series = useMemo(() => {
    const A = getCandles(from, '15m');
    const B = getCandles(to, '15m');
    const n = Math.min(A.length, B.length, 96);
    const out = [];
    for (let i = n; i > 0; i--) out.push(A[A.length - i].close / B[B.length - i].close);
    return out;
  }, [from, to, Math.floor(Date.now() / 60000)]);
  const now = price(from) / price(to);
  const chg = series.length ? now / series[0] - 1 : 0;
  return (
    <div className="card pair-chart">
      <div className="row-between">
        <span className="row-gap"><CoinIcon sym={from} size={22} /><CoinIcon sym={to} size={22} /><b>{from}/{to}</b></span>
        <span className={cx('mono small', chg >= 0 ? 'up' : 'down')}>{chg >= 0 ? '+' : ''}{(chg * 100).toFixed(2)}% · 24h</span>
      </div>
      <div className="pc-price mono">{fmt(now, pdp(now))} <span className="muted small">{to}</span></div>
      <div className="pc-spark"><Spark values={[...series, now]} w={560} h={120} color={chg >= 0 ? 'var(--up)' : 'var(--down)'} /></div>
    </div>
  );
}

function SpotBalances({ onPick }) {
  useMarket();
  const s = useApp();
  const rows = SWAP_TOKENS.map((k) => [k, s.spot[k] || 0]).filter(([, v]) => v > 1e-9).sort((a, b) => b[1] * price(b[0]) - a[1] * price(a[0]));
  return (
    <div className="card">
      <h3 className="sub-h"><WalletIco size={16} />{L('可兌換資產', 'Available to swap')}</h3>
      {rows.length === 0 ? (
        <Empty text={L('現貨帳戶暫無資產，先充值後即可兌換', 'Your spot account is empty. Deposit to start swapping.')}>
          {s.wallet.connected && <Btn size="sm" onClick={() => openModal('deposit', {})}>{L('充值', 'Deposit')}</Btn>}
        </Empty>
      ) : (
        <div className="bal-list">
          {rows.map(([k, v]) => (
            <button key={k} className="bal-row" onClick={() => onPick(k)}>
              <CoinIcon sym={k} size={22} /><b>{k}</b>
              <span className="mono">{fmt(v, amtDp(k))}</span>
              <span className="mono muted small">{usd(v * price(k))}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentSwaps() {
  const s = useApp();
  const rows = s.records.filter((r) => r.kind === 'swap').slice(0, 6);
  return (
    <div className="card">
      <div className="row-between"><h3 className="sub-h"><History size={16} />{L('我的兌換', 'My swaps')}</h3>{rows.length > 0 && <button className="link-btn" onClick={() => go('wallet', 'records')}>{L('全部記錄', 'All activity')}</button>}</div>
      {rows.length === 0 ? <Empty text={L('還沒有兌換記錄', 'No swaps yet')} /> : (
        <div className="swap-hist">
          {rows.map((r) => (
            <div key={r.id} className="sh-row">
              <span className="row-gap"><CoinIcon sym={r.sym} size={18} /><span className="mono">{fmt(r.amount, amtDp(r.sym))} {r.sym}</span></span>
              <ArrowRight size={13} className="muted" />
              <span className="row-gap"><CoinIcon sym={r.to} size={18} /><span className="mono">{fmt(r.out, amtDp(r.to))} {r.to}</span></span>
              <span className="muted small mono">{dateTime(r.ts)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmSwap({ from, to, amount, slip, onClose, onDone }) {
  useMarket();
  const [locked, setLocked] = useState(() => ({ q: swapQuote(from, to, amount), at: Date.now() }));
  const [left, setLeft] = useState(QUOTE_SECONDS);
  const [step, setStep] = useState('review');
  const [result, setResult] = useState(null);
  const [refreshed, setRefreshed] = useState(false);
  useEffect(() => {
    if (step !== 'review') return;
    const id = setInterval(() => {
      const l = QUOTE_SECONDS - Math.floor((Date.now() - locked.at) / 1000);
      if (l <= 0) { setLocked({ q: swapQuote(from, to, amount), at: Date.now() }); setRefreshed(true); setLeft(QUOTE_SECONDS); }
      else setLeft(l);
    }, 250);
    return () => clearInterval(id);
  }, [locked, step]);
  const q = locked.q;
  const minOut = q.out * (1 - slip);
  const submit = () => {
    setStep('pending');
    setTimeout(() => {
      const r = swapTokens(from, to, amount, minOut);
      if (r.err) {
        toast(r.err, 'err');
        if (r.slipped) { setLocked({ q: swapQuote(from, to, amount), at: Date.now() }); setRefreshed(true); setStep('review'); } else onClose();
        return;
      }
      setResult(r.out);
      setStep('done');
      onDone();
      toast(L('兌換成功', 'Swapped'), 'ok', `${fmt(amount, amtDp(from))} ${from} → ${fmt(r.out, amtDp(to))} ${to}`);
    }, 900);
  };
  return (
    <Modal title={step === 'done' ? null : L('確認兌換', 'Confirm swap')} onClose={onClose} width={440}>
      {step === 'done' ? (
        <div className="stack center">
          <div className="tracker-ring ok"><CheckCircle2 size={40} /></div>
          <h3>{L('兌換成功', 'Swap complete')}</h3>
          <div className="tracker-amt mono">+{fmt(result, amtDp(to))} {to}</div>
          <p className="muted small">{L('已到帳現貨帳戶', 'Added to your spot account')}</p>
          <div className="btn-row"><Btn variant="ghost" onClick={onClose}>{L('完成', 'Done')}</Btn><Btn onClick={() => { onClose(); go('wallet'); }}>{L('查看資產', 'View assets')}</Btn></div>
        </div>
      ) : (
        <div className="stack">
          <div className="confirm-legs">
            <div className="leg"><CoinIcon sym={from} size={32} /><div><span className="muted small">{L('支付', 'You pay')}</span><b className="mono">{fmt(amount, amtDp(from))} {from}</b></div></div>
            <ArrowDownUp size={18} className="muted" />
            <div className="leg"><CoinIcon sym={to} size={32} /><div><span className="muted small">{L('預計收到', 'You receive')}</span><b className="mono accent-text">{fmt(q.out, amtDp(to))} {to}</b></div></div>
          </div>
          {refreshed && <div className="hint-box"><RefreshCw size={14} />{L('報價已按最新行情更新', 'Quote updated to the latest price')}</div>}
          <div className="summary">
            <KV k={L('匯率', 'Rate')} v={rateLabel(from, to, q.rate)} />
            <KV k={L('價格影響', 'Price impact')} v={<span className={'tone-text-' + impactTone(q.impact)}>{(q.impact * 100).toFixed(2)}%</span>} />
            <KV k={L('最少收到', 'Minimum received')} v={`${fmt(minOut, amtDp(to))} ${to}`} />
            <KV k={L('手續費', 'Fee')} v={`${fmt(q.feeAmt, amtDp(from))} ${from}`} />
            <KV k={L('路徑', 'Route')} v={q.route.join(' → ')} />
          </div>
          <div className="quote-timer"><span style={{ width: (left / QUOTE_SECONDS) * 100 + '%' }} /></div>
          <p className="fine center">{L(`報價將在 ${left} 秒後刷新`, `Quote refreshes in ${left}s`)}</p>
          <Btn block size="lg" loading={step === 'pending'} onClick={submit}>{L('確認兌換', 'Confirm swap')}</Btn>
        </div>
      )}
    </Modal>
  );
}
