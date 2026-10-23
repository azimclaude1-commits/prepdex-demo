import { useEffect, useMemo, useState, useRef } from 'react';
import {
  BadgeDollarSign, BadgeCheck, Zap, CreditCard, Clock, ShieldCheck, MessageSquare, Send, CheckCircle2, Loader2, AlertTriangle, ChevronDown, Filter, Copy, ArrowRight, Lock,
} from 'lucide-react';
import { FIATS, FIAT, OTC_CRYPTOS, otcMerchants, PAY_METHODS, CARD_PROVIDERS, COIN, LANG_FIAT } from '../core/data.js';
import { L, getLang } from '../core/lang.js';
import { useApp, createOtc, otcMarkPaid, otcCancel, otcRelease, otcChat, cardBuy, toast, bal, openModal, go } from '../core/store.js';
import { useMarket } from '../core/market.js';
import { fmt, dateTime, pad2, floorTo, adp } from '../core/fmt.js';
import { Btn, Tabs, NumInput, CoinIcon, Modal, KV, Pill, Empty, CopyBtn, cx } from '../ui/kit.jsx';
import { PageHead, ConnectGate } from '../layout/Shell.jsx';

function PayTag({ m }) {
  const p = PAY_METHODS[m];
  return <span className="pay-tag" style={{ '--c': p.color }}><i />{L(...p.name)}</span>;
}

function FiatSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="csel csel-compact" ref={ref}>
      <button className="csel-btn" onClick={() => setOpen(!open)}><span className="flag">{FIAT[value].flag}</span><b>{value}</b><ChevronDown size={15} className="csel-caret" /></button>
      {open && (
        <div className="csel-pop">
          <div className="csel-list">
            {FIATS.map((f) => (
              <button key={f.code} className={cx('csel-item', f.code === value && 'on')} onClick={() => { onChange(f.code); setOpen(false); }}>
                <span className="flag">{f.flag}</span><span><b>{f.code}</b></span><span className="mono muted">{f.sym}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OTC() {
  const s = useApp();
  const [tab, setTab] = useState('card');
  const [orderId, setOrderId] = useState(null);
  const active = s.otc.filter((o) => ['unpaid', 'paid', 'waiting', 'buyerPaid'].includes(o.status)).length;
  return (
    <div className="page">
      <PageHead eyebrow={<><BadgeDollarSign size={14} />OTC</>} title={L('法币买卖加密货币', 'Buy and sell crypto with fiat')}
        sub={L('通过 MoonPay、Banxa 等第三方渠道用 Visa / Mastercard、Apple Pay 直接买币；也可以在 P2P 市场与认证商家交易。', 'Buy instantly with Visa / Mastercard or Apple Pay through MoonPay or Banxa, or trade with verified merchants on the P2P market.')}
        right={<Tabs value={tab} onChange={setTab} items={[['card', L('银行卡买币', 'Buy with card')], ['p2p', L('P2P 交易', 'P2P market')], ['orders', L('我的订单', 'My orders'), active || null]]} />} />
      {tab === 'card' && <CardBuy />}
      {tab === 'p2p' && <P2P onOrder={setOrderId} />}
      {tab === 'orders' && <MyOrders onOpen={setOrderId} />}
      {orderId && <OrderModal id={orderId} onClose={() => setOrderId(null)} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Card purchase through third-party on-ramps
// ----------------------------------------------------------------------------
function providerQuote(p, crypto, fiat, amount) {
  const mid = COIN[crypto].price * FIAT[fiat].rate;
  const rate = mid * (1 + p.spread);
  const fee = amount * p.fee;
  const minF = p.min * FIAT[fiat].rate;
  return { rate, fee, got: Math.max(0, (amount - fee) / rate), minF, ok: amount >= minF };
}

function CardBuy() {
  useMarket();
  const s = useApp();
  const [fiat, setFiat] = useState(LANG_FIAT[getLang()] || 'USD');
  const [crypto, setCrypto] = useState('USDT');
  const [fiatAmt, setFiatAmt] = useState(() => String(Math.round(300 * (FIAT[LANG_FIAT[getLang()] || 'USD'].rate))));
  const [method, setMethod] = useState('card');
  const [pick, setPick] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const f = parseFloat(fiatAmt) || 0;
  const quotes = CARD_PROVIDERS.filter((p) => p.methods.includes(method)).map((p) => ({ p, q: providerQuote(p, crypto, fiat, f) }));
  const best = [...quotes].sort((a, b) => b.q.got - a.q.got)[0];
  const chosen = quotes.find((x) => x.p.id === pick) || best;
  const methods = ['card', 'applepay', 'googlepay', 'bank', 'sepa'];
  const dp = crypto === 'BTC' || crypto === 'ETH' ? 6 : 2;

  return (
    <div className="otc-quick">
      <div className="card quick-card">
        <div className="swap-box">
          <div className="swap-top"><span>{L('我要支付', 'You pay')}</span></div>
          <div className="swap-mid">
            <input className="swap-input mono" inputMode="decimal" value={fiatAmt} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setFiatAmt(e.target.value)} aria-label={L('支付金额', 'Amount to pay')} />
            <FiatSelect value={fiat} onChange={(v) => { setFiat(v); setFiatAmt(String(Math.round(300 * FIAT[v].rate))); }} />
          </div>
        </div>
        <div className="swap-box">
          <div className="swap-top"><span>{L('我将收到（约）', 'You receive (est.)')}</span></div>
          <div className="swap-mid">
            <div className="swap-input mono out">{chosen ? fmt(chosen.q.got, dp) : '0'}</div>
            <div className="crypto-chips">
              {OTC_CRYPTOS.map((c) => <button key={c} className={cx('cc', c === crypto && 'on')} onClick={() => setCrypto(c)}><CoinIcon sym={c} size={18} />{c}</button>)}
            </div>
          </div>
        </div>
        <div>
          <div className="field-label">{L('支付方式', 'Payment method')}</div>
          <div className="net-chips">{methods.map((m) => <button key={m} className={cx('net-chip', m === method && 'on')} onClick={() => { setMethod(m); setPick(null); }}>{L(...PAY_METHODS[m].name)}</button>)}</div>
        </div>
        <div>
          <div className="field-label">{L('选择服务商', 'Choose a provider')}</div>
          <div className="prov-quotes">
            {quotes.length === 0 && <div className="hint-box">{L('暂无服务商支持该支付方式', 'No provider supports this method')}</div>}
            {quotes.map(({ p, q }) => (
              <button key={p.id} className={cx('prov-quote', chosen?.p.id === p.id && 'on')} onClick={() => setPick(p.id)}>
                <span className="radio" />
                <span className="prov-logo" style={{ background: p.color }}>{p.name[0]}</span>
                <span className="pq-main">
                  <b>{p.name}{best?.p.id === p.id && <Pill tone="up">{L('最优价', 'Best rate')}</Pill>}</b>
                  <small>{L('手续费', 'Fee')} {(p.fee * 100).toFixed(2)}% · {L(...p.eta)}</small>
                </span>
                <span className="pq-out">
                  <b className="mono">{fmt(q.got, dp)} {crypto}</b>
                  <small className="mono">1 {crypto} ≈ {fmt(q.rate, crypto === 'BTC' || crypto === 'ETH' ? 0 : 3)} {fiat}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
        {chosen && !chosen.q.ok && f > 0 && <div className="warn-box"><AlertTriangle size={15} />{L(`${chosen.p.name} 最低购买 ${fmt(chosen.q.minF, 0)} ${fiat}`, `${chosen.p.name} minimum is ${fmt(chosen.q.minF, 0)} ${fiat}`)}</div>}
        {!s.wallet.connected ? <ConnectGate /> : (
          <Btn block size="lg" disabled={!chosen || !chosen.q.ok} onClick={() => setCheckout(chosen)}>
            {chosen ? L(`通过 ${chosen.p.name} 购买 ${crypto}`, `Buy ${crypto} with ${chosen.p.name}`) : L('购买', 'Buy')}<ArrowRight size={16} />
          </Btn>
        )}
        <div className="assure"><ShieldCheck size={14} />{L('支付与身份验证（KYC）由第三方服务商完成，币直接到账你的现货账户。', 'Payment and identity checks (KYC) are handled by the provider. Crypto goes straight to your spot account.')}</div>
      </div>

      <div className="otc-side">
        <div className="card">
          <h3 className="sub-h"><CreditCard size={16} />{L('合作服务商', 'Partner providers')}</h3>
          <div className="provider-list">
            {CARD_PROVIDERS.map((p) => (
              <div key={p.id} className="provider static">
                <span className="prov-logo" style={{ background: p.color }}>{p.name[0]}</span>
                <span><b>{p.name}</b><small>{L('参考手续费', 'Ref. fee')} {(p.fee * 100).toFixed(2)}% · {L('最低', 'Min')} ${p.min}</small></span>
                <span className="pay-tags">{p.methods.map((m) => <PayTag key={m} m={m} />)}</span>
              </div>
            ))}
          </div>
          <p className="fine">{L('报价为演示数据，实际以服务商结算页为准。', 'Quotes are demo figures; the provider checkout shows the final price.')}</p>
        </div>
        <div className="card steps-card">
          <h3 className="sub-h">{L('购买流程', 'How it works')}</h3>
          <ol className="steps">
            <li><b>{L('选择金额与服务商', 'Pick amount and provider')}</b><span>{L('对比两家报价，自动标出到账最多的一家', 'We compare quotes and flag the best one')}</span></li>
            <li><b>{L('完成支付', 'Pay')}</b><span>{L('在服务商页面填写卡信息并完成 3-D Secure 验证', 'Enter card details and pass 3-D Secure')}</span></li>
            <li><b>{L('自动到账', 'Receive')}</b><span>{L('服务商处理完成后，币到账现货账户', 'Crypto lands in your spot account')}</span></li>
          </ol>
        </div>
      </div>
      {checkout && <CardCheckout p={checkout.p} q={checkout.q} fiat={fiat} crypto={crypto} amount={f} method={method} onClose={() => setCheckout(null)} />}
    </div>
  );
}

function CardCheckout({ p, q, fiat, crypto, amount, method, onClose }) {
  const [step, setStep] = useState('form');
  const [num, setNum] = useState('4242 4242 4242 4242');
  const [exp, setExp] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const wallet = method === 'applepay' || method === 'googlepay';
  const got = q.got;
  const pay = () => {
    setStep('3ds');
    setTimeout(() => setStep('processing'), 1600);
    setTimeout(() => { cardBuy(p.name, crypto, fiat, amount, floorTo(got, 6)); setStep('done'); }, 3600);
  };
  return (
    <Modal title={<span className="row-gap"><span className="prov-logo sm" style={{ background: p.color }}>{p.name[0]}</span>{p.name}</span>} onClose={onClose} width={420}>
      {step === 'form' && (
        <div className="stack">
          <div className="summary">
            <KV k={L('支付', 'You pay')} v={`${fmt(amount, 2)} ${fiat}`} />
            <KV k={L('服务商手续费', 'Provider fee')} v={`${fmt(q.fee, 2)} ${fiat}`} />
            <KV k={L('汇率', 'Rate')} v={`1 ${crypto} ≈ ${fmt(q.rate, 3)} ${fiat}`} />
            <KV k={L('预计到账', 'You get')} v={<b className="accent-text">{fmt(got, 6)} {crypto}</b>} />
          </div>
          {wallet ? (
            <div className="wallet-pay"><b>{L(...PAY_METHODS[method].name)}</b><span className="muted small">{L('将调起设备上的钱包完成支付', 'Your device wallet will open to confirm')}</span></div>
          ) : method === 'bank' || method === 'sepa' ? (
            <div className="summary">
              <KV k={L('收款方', 'Beneficiary')} v={`${p.name} Payments Ltd.`} mono={false} />
              <KV k="IBAN" v="GB82 •••• •••• 4432" />
              <KV k={L('付款备注', 'Reference')} v={'NVX' + Math.floor(100000 + amount)} />
            </div>
          ) : (
            <>
              <label className="txt" htmlFor="cc-num"><span className="num-label">{L('卡号', 'Card number')}</span><input id="cc-num" className="mono" value={num} onChange={(e) => setNum(e.target.value)} /></label>
              <div className="grid2">
                <label className="txt" htmlFor="cc-exp"><span className="num-label">{L('有效期', 'Expiry')}</span><input id="cc-exp" className="mono" value={exp} onChange={(e) => setExp(e.target.value)} /></label>
                <label className="txt" htmlFor="cc-cvc"><span className="num-label">CVC</span><input id="cc-cvc" className="mono" value={cvc} onChange={(e) => setCvc(e.target.value)} /></label>
              </div>
            </>
          )}
          <p className="fine"><Lock size={12} /> {L('演示环境：不会产生真实扣款。', 'Demo only: no real charge is made.')}</p>
          <Btn block size="lg" onClick={pay}>{L(`支付 ${fmt(amount, 2)} ${fiat}`, `Pay ${fmt(amount, 2)} ${fiat}`)}</Btn>
        </div>
      )}
      {step === '3ds' && <div className="stack center"><ShieldCheck size={40} className="accent-text" /><h3>{L('银行安全验证', 'Bank verification (3-D Secure)')}</h3><p className="muted">{L('正在跳转发卡行验证…', 'Redirecting to your bank…')}</p><Loader2 className="spin" size={22} /></div>}
      {step === 'processing' && <div className="stack center"><Loader2 className="spin big-spin" size={36} /><h3>{L('支付处理中', 'Processing payment')}</h3><p className="muted">{L('服务商正在为你购买加密货币', 'The provider is buying your crypto')}</p></div>}
      {step === 'done' && (
        <div className="stack center">
          <div className="tracker-ring ok"><CheckCircle2 size={40} /></div>
          <h3>{L('购买成功', 'Purchase complete')}</h3>
          <div className="tracker-amt mono">+{fmt(got, 6)} {crypto}</div>
          <div className="btn-row"><Btn variant="ghost" onClick={onClose}>{L('完成', 'Done')}</Btn><Btn onClick={() => { onClose(); go('wallet'); }}>{L('查看钱包', 'View wallet')}</Btn></div>
        </div>
      )}
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// P2P market
// ----------------------------------------------------------------------------
function P2P({ onOrder }) {
  const s = useApp();
  const [side, setSide] = useState('buy');
  const [crypto, setCrypto] = useState('USDT');
  const [fiat, setFiat] = useState(LANG_FIAT[getLang()] || 'USD');
  const [pay, setPay] = useState('all');
  const [amtFilter, setAmtFilter] = useState('');
  const [openId, setOpenId] = useState(null);
  const list = useMemo(() => otcMerchants(side, crypto, fiat), [side, crypto, fiat]);
  const af = parseFloat(amtFilter) || 0;
  const rows = list.filter((m) => (pay === 'all' || m.methods.includes(pay)) && (!af || (af >= m.minF && af <= m.maxF)));
  const methods = [...new Set(list.flatMap((m) => m.methods))];
  return (
    <div className="card p2p">
      <div className="p2p-filters">
        <div className={cx('side-toggle sm', side)}>
          <button className={cx(side === 'buy' && 'on')} onClick={() => setSide('buy')}>{L('购买', 'Buy')}</button>
          <button className={cx(side === 'sell' && 'on')} onClick={() => setSide('sell')}>{L('出售', 'Sell')}</button>
        </div>
        <div className="crypto-chips">{OTC_CRYPTOS.map((c) => <button key={c} className={cx('cc', c === crypto && 'on')} onClick={() => setCrypto(c)}><CoinIcon sym={c} size={18} />{c}</button>)}</div>
        <span className="sp" />
        <div className="num mini"><input placeholder={L('输入金额筛选', 'Filter by amount')} value={amtFilter} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setAmtFilter(e.target.value)} /><span className="num-suffix">{fiat}</span></div>
        <FiatSelect value={fiat} onChange={setFiat} />
        <select className="sel" value={pay} onChange={(e) => setPay(e.target.value)} aria-label={L('支付方式', 'Payment')}>
          <option value="all">{L('全部支付方式', 'All payments')}</option>
          {methods.map((m) => <option key={m} value={m}>{L(...PAY_METHODS[m].name)}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table className="tbl p2p-tbl">
          <thead><tr><th>{L('商家', 'Merchant')}</th><th>{L('单价', 'Price')}</th><th>{L('数量 / 限额', 'Available / limits')}</th><th>{L('支付方式', 'Payment')}</th><th /></tr></thead>
          <tbody>
            {rows.map((m) => (
              <React.Fragment key={m.id}>
                <tr className={cx(openId === m.id && 'row-open')}>
                  <td>
                    <div className="merchant">
                      <span className="m-ava">{m.name[0]}<i className={cx('m-online', m.online && 'on')} /></span>
                      <div><b>{m.name}{m.verified && <BadgeCheck size={14} className="accent-text" />}</b><small className="muted">{fmt(m.orders, 0)} {L('单', 'orders')} · {(m.rate * 100).toFixed(1)}% · <Clock size={11} /> {m.release} {L('分钟', 'min')}</small></div>
                    </div>
                  </td>
                  <td><b className="mono p2p-price">{fmt(m.price, crypto === 'BTC' || crypto === 'ETH' ? 0 : 3)}</b> <span className="muted small">{fiat}</span></td>
                  <td className="small"><div><span className="muted">{L('数量', 'Avail.')}</span> <span className="mono">{fmt(m.avail, crypto === 'BTC' || crypto === 'ETH' ? 4 : 2)} {crypto}</span></div><div><span className="muted">{L('限额', 'Limit')}</span> <span className="mono">{fmt(m.minF, 0)} – {fmt(m.maxF, 0)} {fiat}</span></div></td>
                  <td><div className="pay-tags">{m.methods.map((x) => <PayTag key={x} m={x} />)}</div></td>
                  <td>{s.wallet.connected
                    ? <Btn size="sm" variant={side === 'buy' ? 'up' : 'down'} onClick={() => setOpenId(openId === m.id ? null : m.id)}>{side === 'buy' ? L(`购买 ${crypto}`, `Buy ${crypto}`) : L(`出售 ${crypto}`, `Sell ${crypto}`)}</Btn>
                    : <Btn size="sm" variant="soft" onClick={() => openModal('connect')}>{L('连接钱包', 'Connect')}</Btn>}</td>
                </tr>
                {openId === m.id && (
                  <tr className="row-expand"><td colSpan={5}><P2PForm m={m} side={side} crypto={crypto} fiat={fiat} onDone={(id) => { setOpenId(null); onOrder(id); }} /></td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty text={L('没有符合条件的广告', 'No ads match your filters')} />}
      </div>
    </div>
  );
}

function P2PForm({ m, side, crypto, fiat, onDone }) {
  const [fv, setFv] = useState('');
  const [method, setMethod] = useState(m.methods[0]);
  const f = parseFloat(fv) || 0;
  const c = f / m.price;
  const err = f && (f < m.minF || f > m.maxF) ? L(`限额 ${fmt(m.minF, 0)} – ${fmt(m.maxF, 0)} ${fiat}`, `Limit ${fmt(m.minF, 0)} – ${fmt(m.maxF, 0)} ${fiat}`) : null;
  const submit = () => {
    const r = createOtc({ side, crypto, fiat, merchant: m, fiatAmt: f, cryptoAmt: floorTo(c, 6), method });
    if (r.err) { toast(r.err, 'err'); return; }
    onDone(r.id);
  };
  return (
    <div className="p2p-form">
      <div className="p2p-terms">
        <b>{L('商家条款', 'Merchant terms')}</b>
        <p className="muted small">{L('请使用本人实名账户付款，付款备注只填订单参考号，不要备注“USDT”“加密货币”等字样。', 'Pay from an account in your own name. Put only the order reference in the memo.')}</p>
      </div>
      <div className="p2p-inputs">
        <NumInput id={'p2p-' + m.id} label={side === 'buy' ? L('我要支付', 'I pay') : L('我将收到', 'I receive')} value={fv} onChange={setFv} suffix={fiat} error={err}
          right={<button className="max-btn" onClick={() => setFv(String(m.maxF))}>{L('最大', 'Max')}</button>} hint={err} />
        <div className="row-between small"><span className="muted">{side === 'buy' ? L('我将收到', 'I receive') : L('我要出售', 'I sell')}</span><b className="mono">{fmt(c, 6)} {crypto}</b></div>
        <div className="net-chips">{m.methods.map((x) => <button key={x} className={cx('net-chip', x === method && 'on')} onClick={() => setMethod(x)}>{L(...PAY_METHODS[x].name)}</button>)}</div>
        <Btn block variant={side === 'buy' ? 'up' : 'down'} disabled={!f || !!err} onClick={submit}>{L('下单', 'Place order')}</Btn>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Orders
// ----------------------------------------------------------------------------
const STATUS = {
  unpaid: ['accent', ['待付款', 'Awaiting payment']],
  paid: ['accent', ['待放币', 'Awaiting release']],
  waiting: ['accent', ['等待买家付款', 'Awaiting buyer']],
  buyerPaid: ['warn', ['买家已付款', 'Buyer paid']],
  completed: ['up', ['已完成', 'Completed']],
  cancelled: ['muted', ['已取消', 'Cancelled']],
};

function MyOrders({ onOpen }) {
  const s = useApp();
  if (!s.otc.length) return <div className="card"><Empty text={L('还没有 OTC 订单', 'No OTC orders yet')} /></div>;
  return (
    <div className="card">
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>{L('时间', 'Time')}</th><th>{L('类型', 'Type')}</th><th>{L('商家', 'Merchant')}</th><th>{L('金额', 'Amount')}</th><th>{L('数量', 'Crypto')}</th><th>{L('状态', 'Status')}</th><th /></tr></thead>
          <tbody>
            {s.otc.map((o) => (
              <tr key={o.id} className="clickable" onClick={() => onOpen(o.id)}>
                <td className="mono muted">{dateTime(o.ts)}</td>
                <td className={o.side === 'buy' ? 'up' : 'down'}>{o.side === 'buy' ? L('购买', 'Buy') : L('出售', 'Sell')} {o.crypto}</td>
                <td>{o.mname}</td>
                <td className="mono">{fmt(o.fiatAmt, 2)} {o.fiat}</td>
                <td className="mono">{fmt(o.cryptoAmt, 6)} {o.crypto}</td>
                <td><Pill tone={STATUS[o.status][0]} dot={['unpaid', 'paid', 'waiting', 'buyerPaid'].includes(o.status)}>{L(...STATUS[o.status][1])}</Pill></td>
                <td><button className="link-btn">{L('详情', 'Details')}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderModal({ id, onClose }) {
  useMarket();
  const s = useApp();
  const o = s.otc.find((x) => x.id === id);
  const [msg, setMsg] = useState('');
  const [confirmRelease, setConfirmRelease] = useState(false);
  const chatRef = useRef(null);
  useEffect(() => { chatRef.current?.scrollTo({ top: 99999 }); }, [o?.chat.length]);
  if (!o) return null;
  const left = Math.max(0, o.payBy - Date.now());
  const stepIdx = o.side === 'buy'
    ? { unpaid: 1, paid: 2, completed: 3, cancelled: 0 }[o.status]
    : { waiting: 1, buyerPaid: 2, completed: 3, cancelled: 0 }[o.status];
  const steps = o.side === 'buy' ? [L('下单', 'Ordered'), L('付款', 'Pay'), L('放币', 'Release')] : [L('下单', 'Ordered'), L('买家付款', 'Buyer pays'), L('确认放币', 'Release')];
  const acct = { bank: ['DBS Bank · 尾号 8812', 'DBS Bank · ending 8812'], sepa: ['IBAN DE89 •••• 3000', 'IBAN DE89 •••• 3000'], wise: ['Wise · GB29 •••• 6011', 'Wise · GB29 •••• 6011'], revolut: ['Revolut · @harbordesk', 'Revolut · @harbordesk'] }[o.method] || ['--', '--'];
  return (
    <Modal title={<span className="row-gap">{o.side === 'buy' ? L('购买', 'Buy') : L('出售', 'Sell')} {o.crypto}<Pill tone={STATUS[o.status][0]}>{L(...STATUS[o.status][1])}</Pill></span>} onClose={onClose} width={760}>
      <div className="otc-order">
        <div className="oo-main">
          <div className="oo-steps">
            {steps.map((t, i) => <div key={i} className={cx('oo-step', stepIdx > i && 'done', stepIdx === i + 1 && o.status !== 'completed' && 'cur')}><i>{stepIdx > i ? <CheckCircle2 size={14} /> : i + 1}</i>{t}</div>)}
          </div>
          {o.status === 'unpaid' && (
            <div className="oo-timer"><Clock size={16} />{L('请在', 'Pay within')} <b className="mono">{pad2(left / 60000)}:{pad2((left % 60000) / 1000)}</b> {L('内付款，超时订单自动取消', '; the order cancels after that')}</div>
          )}
          <div className="summary">
            <KV k={L('金额', 'Amount')} v={<b className="accent-text">{fmt(o.fiatAmt, 2)} {o.fiat}</b>} />
            <KV k={L('单价', 'Price')} v={`${fmt(o.price, 3)} ${o.fiat}`} />
            <KV k={L('数量', 'Quantity')} v={`${fmt(o.cryptoAmt, 6)} ${o.crypto}`} />
            <KV k={L('订单号', 'Order no.')} v={<span className="row-gap">{o.id.toUpperCase()}<CopyBtn text={o.id.toUpperCase()} /></span>} />
          </div>
          {o.side === 'buy' && ['unpaid', 'paid'].includes(o.status) && (
            <div className="pay-info">
              <div className="field-label">{L('商家收款信息', 'Merchant payment details')} · <PayTag m={o.method} /></div>
              <KV k={L('收款人', 'Name')} v={<span className="row-gap">J. Tan<CopyBtn text="J. Tan" /></span>} />
              <KV k={L('账户', 'Account')} v={<span className="row-gap">{L(...acct)}<CopyBtn text={acct[0]} /></span>} />
              <KV k={L('付款备注（参考号）', 'Reference')} v={<span className="row-gap accent-text">{o.ref}<CopyBtn text={o.ref} /></span>} />
            </div>
          )}
          {o.status === 'unpaid' && (
            <div className="btn-row">
              <Btn variant="ghost" onClick={() => { otcCancel(o.id); toast(L('订单已取消', 'Order cancelled')); }}>{L('取消订单', 'Cancel order')}</Btn>
              <Btn onClick={() => { otcMarkPaid(o.id); toast(L('已通知商家', 'Merchant notified')); }}>{L('我已付款，通知商家', 'I have paid')}</Btn>
            </div>
          )}
          {o.status === 'paid' && <div className="wait-box"><Loader2 className="spin" size={18} />{L('商家正在核对收款，通常 1–5 分钟内放币…', 'The merchant is checking the payment, usually within 1–5 minutes…')}</div>}
          {o.status === 'waiting' && (
            <>
              <div className="wait-box"><Lock size={16} />{L(`你的 ${fmt(o.cryptoAmt, 6)} ${o.crypto} 已托管，等待买家付款…`, `${fmt(o.cryptoAmt, 6)} ${o.crypto} is in escrow. Waiting for the buyer to pay…`)}</div>
              <Btn variant="ghost" onClick={() => { otcCancel(o.id); toast(L('订单已取消', 'Order cancelled')); }}>{L('取消订单', 'Cancel order')}</Btn>
            </>
          )}
          {o.status === 'buyerPaid' && (
            confirmRelease ? (
              <div className="stack">
                <div className="warn-box"><AlertTriangle size={16} />{L('请登录收款账户确认已到账，放币后无法撤回。', 'Confirm the money is in your account. Releasing cannot be undone.')}</div>
                <div className="btn-row"><Btn variant="ghost" onClick={() => setConfirmRelease(false)}>{L('再等等', 'Not yet')}</Btn><Btn onClick={() => { otcRelease(o.id); toast(L('已放币，订单完成', 'Released. Order complete')); }}>{L('确认收款并放币', 'Confirm & release')}</Btn></div>
              </div>
            ) : <Btn block onClick={() => setConfirmRelease(true)}>{L('我已收到付款', 'I have received payment')}</Btn>
          )}
          {o.status === 'completed' && (
            <div className="done-box"><CheckCircle2 size={22} />{o.side === 'buy' ? L(`${fmt(o.cryptoAmt, 6)} ${o.crypto} 已到账现货账户`, `${fmt(o.cryptoAmt, 6)} ${o.crypto} is in your spot account`) : L('交易完成', 'Trade complete')}
              {o.side === 'buy' && <Btn size="sm" onClick={() => { onClose(); go('spot'); }}>{L('去交易', 'Trade')}</Btn>}</div>
          )}
        </div>
        <div className="oo-chat">
          <div className="chat-head"><span className="m-ava sm">{o.mname[0]}<i className="m-online on" /></span><b>{o.mname}</b><BadgeCheck size={14} className="accent-text" /></div>
          <div className="chat-body" ref={chatRef}>
            {o.chat.map((c, i) => <div key={i} className={cx('bubble', c.from)}>{c.text}</div>)}
          </div>
          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); if (msg.trim()) { otcChat(o.id, msg.trim()); setMsg(''); } }}>
            <input id="chat-msg" placeholder={L('发送消息', 'Message')} value={msg} onChange={(e) => setMsg(e.target.value)} />
            <button className="icon-btn" type="submit" aria-label={L('发送', 'Send')}><Send size={16} /></button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
