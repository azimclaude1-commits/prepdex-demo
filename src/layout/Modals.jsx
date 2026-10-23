import { useEffect, useMemo, useState } from 'react';
import {
  Wallet, ShieldCheck, Copy, LogOut, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Repeat, Droplets, History,
  ChevronRight, Info, CheckCircle2, Loader2, ArrowDown, Link2, ChevronDown, Clock, PenLine, QrCode, Fingerprint,
} from 'lucide-react';
import {
  WALLETS, CHAINS, COIN, NETWORKS, networksFor, netFee, minDeposit, BRAND,
} from '../core/data.js';
import { L } from '../core/lang.js';
import {
  useApp, useUI, closeModal, openModal, connectWallet, disconnectWallet, switchChain, faucet, prepareAddress, depositAddress,
  depositFromWallet, simulateIncoming, withdraw, transfer, convert, bal, go, toast, now,
} from '../core/store.js';
import { useMarket, price } from '../core/market.js';
import { fmt, usd, shortAddr, dateTime, floorTo, adp, pdp, randHex } from '../core/fmt.js';
import { Modal, Btn, Tabs, NumInput, CoinIcon, CoinSelect, QR, CopyBtn, KV, cx, Progress, Pill, BrandMark } from '../ui/kit.jsx';
import { orbStyle } from './Shell.jsx';

export function ModalHost() {
  const { modal } = useUI();
  if (!modal) return null;
  const P = modal.props || {};
  switch (modal.name) {
    case 'connect': return <ConnectModal {...P} />;
    case 'account': return <AccountModal {...P} />;
    case 'deposit': return <DepositModal {...P} />;
    case 'withdraw': return <WithdrawModal {...P} />;
    case 'transfer': return <TransferModal {...P} />;
    case 'convert': return <ConvertModal {...P} />;
    default: return null;
  }
}

function WalletGlyph({ w, size = 36 }) {
  const letter = w.name[0];
  return (
    <span className="wglyph" style={{ width: size, height: size, background: `linear-gradient(140deg, ${w.color}, ${w.color}99)` }}>
      {w.id === 'walletconnect' ? <Link2 size={size * 0.5} /> : <b style={{ fontSize: size * 0.42 }}>{letter}</b>}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Connect + sign-in
// ----------------------------------------------------------------------------
function ConnectModal() {
  const [step, setStep] = useState('pick');
  const [w, setW] = useState(null);
  const [addr, setAddr] = useState('');
  const nonce = useMemo(() => randHex(16), []);
  const pick = (wallet) => {
    setW(wallet);
    setStep('connecting');
    setTimeout(() => { setAddr(prepareAddress()); setStep('sign'); }, 1300);
  };
  const sign = () => {
    setStep('signing');
    setTimeout(() => {
      connectWallet(w.id);
      closeModal();
      toast(L('已连接并登录', 'Connected and signed in'), 'ok', `${w.name} · ${shortAddr(addr)}`);
    }, 1100);
  };
  return (
    <Modal title={step === 'pick' ? L('连接钱包', 'Connect a wallet') : w?.name} onClose={closeModal} width={440}>
      {step === 'pick' && (
        <>
          <div className="wallet-list">
            {WALLETS.map((x) => (
              <button key={x.id} className="wallet-item" onClick={() => pick(x)}>
                <WalletGlyph w={x} />
                <span className="wallet-meta"><b>{x.name}</b><small>{L(...x.hint)}</small></span>
                {x.installed && <Pill tone="up">{L('已检测到', 'Detected')}</Pill>}
                <ChevronRight size={16} className="muted" />
              </button>
            ))}
          </div>
          <p className="fine">{L('连接即表示你同意《服务条款》与《隐私政策》。本原型不会读取任何真实钱包。', 'By connecting you accept the Terms and Privacy Policy. This prototype never touches a real wallet.')}</p>
        </>
      )}
      {(step === 'connecting' || step === 'sign' || step === 'signing') && (
        <div className="connect-flow">
          <div className="connect-orbit">
            <WalletGlyph w={w} size={58} />
            <span className="connect-line" />
            <BrandMark size={58} />
          </div>
          {step === 'connecting' && (
            <>
              <h3>{L(`在 ${w.name} 中确认连接`, `Approve the connection in ${w.name}`)}</h3>
              <p className="muted">{L('请在弹出的钱包窗口中选择账户并授权', 'Pick an account and approve in the wallet pop-up')}</p>
              <Loader2 className="spin big-spin" size={26} />
            </>
          )}
          {(step === 'sign' || step === 'signing') && (
            <>
              <h3>{L('签名登录', 'Sign in with your wallet')}</h3>
              <p className="muted">{L('签名用于验证你拥有该地址，不会发起交易，也不消耗 Gas。', 'Signing proves you own this address. It sends no transaction and costs no gas.')}</p>
              <pre className="sign-msg">{`${BRAND.toLowerCase()}.app wants you to sign in with your Ethereum account:
${addr}

Sign in to ${BRAND}.

URI: https://${BRAND.toLowerCase()}.app
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date(now()).toISOString()}`}</pre>
              <div className="btn-row">
                <Btn variant="ghost" onClick={closeModal}>{L('取消', 'Cancel')}</Btn>
                <Btn onClick={sign} loading={step === 'signing'}><PenLine size={16} />{L('签名', 'Sign')}</Btn>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Wallet account sheet (the browser wallet, i.e. on-chain funds)
// ----------------------------------------------------------------------------
function AccountModal() {
  useMarket();
  const s = useApp();
  const [chainOpen, setChainOpen] = useState(false);
  const chain = CHAINS.find((c) => c.id === s.wallet.chain) || CHAINS[0];
  const entries = Object.entries(s.wallet.onchain).filter(([, v]) => v > 0);
  const total = entries.reduce((a, [k, v]) => a + v * price(k), 0);
  const wallet = WALLETS.find((w) => w.id === s.wallet.provider) || WALLETS[0];
  return (
    <Modal onClose={closeModal} width={400} className="acct" title={null}>
      <div className="acct-top">
        <div className="chain-pick">
          <button className="chip-btn" onClick={() => setChainOpen(!chainOpen)}><i className="dot" style={{ background: chain.color }} />{chain.name}<ChevronDown size={14} /></button>
          {chainOpen && (
            <div className="lang-pop">
              {CHAINS.map((c) => (
                <button key={c.id} className={cx(c.id === chain.id && 'on')} onClick={() => { switchChain(c.id); setChainOpen(false); toast(L('已切换网络', 'Network switched'), 'ok', c.name); }}>
                  <i className="dot" style={{ background: c.color }} />{c.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={closeModal}>✕</button>
      </div>
      <div className="acct-hero">
        <span className="orb big" style={orbStyle(s.wallet.address)} />
        <div className="acct-addr"><WalletGlyph w={wallet} size={20} /><span className="mono">{shortAddr(s.wallet.address)}</span><CopyBtn text={s.wallet.address} /></div>
        <div className="acct-total mono">{usd(total)}</div>
        <div className="muted small">{L('插件钱包链上资产（演示）', 'On-chain wallet balance (demo)')}</div>
      </div>
      <div className="acct-tokens">
        {entries.map(([k, v]) => (
          <div key={k} className="acct-token">
            <CoinIcon sym={k} size={22} /><b>{k}</b>
            <span className="mono">{fmt(v, adp(price(k)))}</span>
            <span className="mono muted">{usd(v * price(k))}</span>
          </div>
        ))}
      </div>
      <div className="acct-actions">
        <button onClick={() => openModal('deposit', { sym: 'USDT' })}><span><ArrowDownToLine size={17} /></span>{L('充值到交易账户', 'Deposit to exchange')}<ChevronRight size={16} /></button>
        <button onClick={() => { faucet(); toast(L('已领取测试币', 'Test tokens received')); }}><span><Droplets size={17} /></span>{L('领取测试币', 'Get test tokens')}<ChevronRight size={16} /></button>
        <button onClick={() => { closeModal(); go('wallet', 'records'); }}><span><History size={17} /></span>{L('资金记录', 'Activity')}<ChevronRight size={16} /></button>
        <button className="danger" onClick={() => { disconnectWallet(); closeModal(); toast(L('已断开连接', 'Disconnected')); }}><span><LogOut size={17} /></span>{L('断开连接', 'Disconnect')}</button>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Deposit
// ----------------------------------------------------------------------------
const DEPOSIT_COINS = ['USDT', 'USDC', 'ETH', 'BTC', 'SOL', 'BNB', 'TON', 'TRX', 'ARB', 'LINK', 'DOGE', 'PDX'];

function DepositModal({ sym: initSym = 'USDT' }) {
  useMarket();
  const s = useApp();
  const [sym, setSym] = useState(initSym);
  const nets = networksFor(sym);
  const [net, setNet] = useState(nets[0]);
  const [mode, setMode] = useState(s.wallet.connected ? 'wallet' : 'address');
  const [amt, setAmt] = useState('');
  const [phase, setPhase] = useState('form');
  const [recId, setRecId] = useState(null);
  useEffect(() => { setNet(networksFor(sym)[0]); setAmt(''); }, [sym]);
  const n = NETWORKS[net];
  const addr = s.wallet.address ? depositAddress(net) : '';
  const onchain = s.wallet.onchain[sym] || 0;
  const rec = recId && s.records.find((r) => r.id === recId);
  const recent = s.records.filter((r) => r.kind === 'deposit' && r.sym === sym).slice(0, 3);

  if (!s.wallet.connected) {
    return (
      <Modal title={L('充值', 'Deposit')} onClose={closeModal} icon={<ArrowDownToLine size={18} />}>
        <div className="gate-box">
          <ShieldCheck size={34} />
          <p>{L('请先连接钱包并登录，系统会为你的账户分配专属充值地址。', 'Connect and sign in first. We will assign deposit addresses to your account.')}</p>
          <Btn block onClick={() => openModal('connect')}><Wallet size={16} />{L('连接钱包', 'Connect wallet')}</Btn>
        </div>
      </Modal>
    );
  }

  const submit = () => {
    const a = parseFloat(amt);
    if (a < minDeposit(sym)) { toast(L(`最小充值 ${minDeposit(sym)} ${sym}`, `Minimum deposit ${minDeposit(sym)} ${sym}`), 'err'); return; }
    setPhase('signing');
    setTimeout(() => {
      const r = depositFromWallet(sym, net, a);
      if (r.err) { toast(r.err, 'err'); setPhase('form'); return; }
      setRecId(r.id);
      setPhase('track');
    }, 1200);
  };

  return (
    <Modal title={L('充值', 'Deposit')} onClose={closeModal} width={560} icon={<ArrowDownToLine size={18} />}>
      {phase === 'track' && rec ? (
        <DepositTracker rec={rec} onAgain={() => { setPhase('form'); setAmt(''); setRecId(null); }} />
      ) : (
        <div className="stack">
          <div className="grid2">
            <CoinSelect value={sym} options={DEPOSIT_COINS} onChange={setSym} label={L('选择币种', 'Coin')} />
            <div>
              <div className="field-label">{L('充值网络', 'Network')}</div>
              <div className="net-chips">
                {nets.map((k) => (
                  <button key={k} className={cx('net-chip', k === net && 'on')} onClick={() => setNet(k)}>{NETWORKS[k].short}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="net-info">
            <span><Clock size={13} />{L('预计到账', 'Arrives')} {n.arrive}</span>
            <span><ShieldCheck size={13} />{n.conf} {L('次网络确认', 'confirmations')}</span>
            <span>{L('最小充值', 'Min')} {minDeposit(sym)} {sym}</span>
          </div>
          <Tabs value={mode} onChange={setMode} variant="line" items={[['wallet', L('从已连接钱包转入', 'From connected wallet')], ['address', L('转账到充值地址', 'Send to address')]]} />
          {mode === 'wallet' ? (
            <div className="stack">
              <NumInput id="dep-amt" label={L('转入数量', 'Amount')} value={amt} onChange={setAmt} suffix={sym}
                right={<button className="max-btn" onClick={() => setAmt(String(floorTo(onchain, 6)))}>MAX</button>} />
              <div className="row-between small"><span className="muted">{L('钱包余额', 'Wallet balance')}</span><span className="mono">{fmt(onchain, 6)} {sym}</span></div>
              <div className="summary">
                <KV k={L('目标地址（平台分配）', 'To (your deposit address)')} v={shortAddr(addr)} />
                <KV k={L('网络', 'Network')} v={n.name} mono={false} />
                <KV k={L('预估 Gas', 'Est. gas')} v={n.kind === 'evm' ? `≈ $${(0.4 + Math.random() * 0.01).toFixed(2)}` : '≈ $0.01'} />
              </div>
              <Btn block size="lg" onClick={submit} loading={phase === 'signing'} disabled={!(parseFloat(amt) > 0)}>
                {phase === 'signing' ? L('请在钱包中确认…', 'Confirm in your wallet…') : L('确认转入', 'Deposit')}
              </Btn>
            </div>
          ) : (
            <div className="dep-addr">
              <QR text={addr} size={150} />
              <div className="dep-addr-info">
                <div className="field-label">{L(`你的 ${sym} 充值地址`, `Your ${sym} deposit address`)} · {n.short}</div>
                <div className="addr-box mono">{addr}<CopyBtn text={addr} /></div>
                <ul className="warn-list">
                  <li>{L(`只能向此地址充值 ${sym}（${n.name}），充入其他资产将无法找回。`, `Only send ${sym} on ${n.name}. Other assets sent here are lost.`)}</li>
                  <li>{L(`${n.conf} 次确认后自动到账现货账户。`, `Credited to spot after ${n.conf} confirmations.`)}</li>
                </ul>
                <Btn variant="soft" size="sm" onClick={() => { const r = simulateIncoming(sym, net, sym === 'BTC' ? 0.05 : sym === 'ETH' ? 0.5 : 1000); setRecId(r.id); setPhase('track'); }}>
                  <QrCode size={14} />{L('模拟一笔外部转入', 'Simulate an incoming transfer')}
                </Btn>
              </div>
            </div>
          )}
          {recent.length > 0 && (
            <div className="mini-recs">
              <div className="field-label">{L('最近充值', 'Recent deposits')}</div>
              {recent.map((r) => (
                <div key={r.id} className="mini-rec">
                  <CoinIcon sym={r.sym} size={18} /><span className="mono">+{fmt(r.amount, 6)} {r.sym}</span>
                  <span className="muted small">{NETWORKS[r.net]?.short}</span>
                  <span className="muted small">{dateTime(r.ts)}</span>
                  <StatusPill r={r} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function StatusPill({ r }) {
  if (r.status === 'done') return <Pill tone="up">{L('已完成', 'Done')}</Pill>;
  if (r.status === 'confirming') return <Pill tone="accent" dot>{L('确认中', 'Confirming')} {r.conf}/{r.need}</Pill>;
  if (r.status === 'processing') return <Pill tone="accent" dot>{L('处理中', 'Processing')}</Pill>;
  if (r.status === 'sent') return <Pill tone="accent" dot>{L('链上确认', 'On-chain')} {r.conf}/{r.need}</Pill>;
  return <Pill>{r.status}</Pill>;
}

function DepositTracker({ rec, onAgain }) {
  const done = rec.status === 'done';
  const steps = [
    [L('交易已广播', 'Broadcast'), true],
    [L('区块确认', 'Confirmations') + ` ${rec.conf}/${rec.need}`, rec.conf > 0],
    [L('到账现货账户', 'Credited to spot'), done],
  ];
  return (
    <div className="tracker">
      <div className={cx('tracker-ring', done && 'ok')}>
        {done ? <CheckCircle2 size={40} /> : <Loader2 size={38} className="spin" />}
      </div>
      <h3>{done ? L('充值成功', 'Deposit complete') : L('正在等待区块确认', 'Waiting for confirmations')}</h3>
      <div className="tracker-amt mono">+{fmt(rec.amount, 6)} {rec.sym}</div>
      <Progress value={rec.conf} max={rec.need} glow />
      <div className="tracker-steps">
        {steps.map(([t, ok], i) => (<div key={i} className={cx('tstep', ok && 'ok')}><i />{t}</div>))}
      </div>
      <div className="summary">
        <KV k={L('网络', 'Network')} v={NETWORKS[rec.net].name} mono={false} />
        <KV k="TxID" v={<span className="row-gap">{shortAddr(rec.txid)}<CopyBtn text={rec.txid} /></span>} />
      </div>
      <div className="btn-row">
        <Btn variant="ghost" onClick={onAgain}>{L('继续充值', 'Deposit more')}</Btn>
        <Btn onClick={() => { closeModal(); go('spot'); }} disabled={!done}>{L('去交易', 'Trade now')}</Btn>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Withdraw
// ----------------------------------------------------------------------------
function WithdrawModal({ sym: initSym = 'USDT' }) {
  useMarket();
  const s = useApp();
  const options = Array.from(new Set(['USDT', 'USDC', ...Object.keys(s.spot).filter((k) => s.spot[k] > 0 && COIN[k])]));
  const [sym, setSym] = useState(options.includes(initSym) ? initSym : 'USDT');
  const [net, setNet] = useState(networksFor(sym)[0]);
  const [address, setAddress] = useState('');
  const [amt, setAmt] = useState('');
  const [step, setStep] = useState('form');
  const [code, setCode] = useState('');
  useEffect(() => { setNet(networksFor(sym)[0]); setAmt(''); }, [sym]);
  const fee = netFee(net, sym);
  const a = parseFloat(amt) || 0;
  const avail = bal(sym);
  const n = NETWORKS[net];
  const selfOk = n.kind === 'evm';

  const go2fa = () => {
    if (!address || address.length < 20) { toast(L('请输入有效的提币地址', 'Enter a valid address'), 'err'); return; }
    if (a <= fee) { toast(L('提币数量需大于手续费', 'Amount must exceed the fee'), 'err'); return; }
    if (a > avail) { toast(L('可用余额不足', 'Insufficient balance'), 'err'); return; }
    setStep('verify');
    setCode('');
    setTimeout(() => setCode('482913'), 900);
  };
  const submit = () => {
    const r = withdraw(sym, net, address, a);
    if (r.err) { toast(r.err, 'err'); return; }
    setStep('done');
  };

  return (
    <Modal title={L('提币', 'Withdraw')} onClose={closeModal} width={520} icon={<ArrowUpFromLine size={18} />}>
      {step === 'form' && (
        <div className="stack">
          <CoinSelect value={sym} options={options} onChange={setSym} label={L('币种', 'Coin')} balances={(k) => fmt(bal(k), 4)} />
          <div>
            <div className="field-label">{L('提币网络', 'Network')}</div>
            <div className="net-chips">
              {networksFor(sym).map((k) => (
                <button key={k} className={cx('net-chip', k === net && 'on')} onClick={() => setNet(k)}>
                  {NETWORKS[k].short}<small>{L('手续费', 'Fee')} {netFee(k, sym)}</small>
                </button>
              ))}
            </div>
          </div>
          <label className="txt" htmlFor="wd-addr">
            <span className="num-label">{L('提币地址', 'Address')}</span>
            <input id="wd-addr" className="mono" placeholder={L('粘贴或输入地址', 'Paste or type an address')} value={address} onChange={(e) => setAddress(e.target.value.trim())} />
          </label>
          {selfOk && s.wallet.address && (
            <button className="link-btn" onClick={() => setAddress(s.wallet.address)}><Wallet size={14} />{L('提到我已连接的钱包', 'Use my connected wallet')} · {shortAddr(s.wallet.address)}</button>
          )}
          <NumInput id="wd-amt" label={L('数量', 'Amount')} value={amt} onChange={setAmt} suffix={sym}
            right={<button className="max-btn" onClick={() => setAmt(String(floorTo(avail, 6)))}>MAX</button>} />
          <div className="summary">
            <KV k={L('可用', 'Available')} v={`${fmt(avail, 6)} ${sym}`} />
            <KV k={L('网络手续费', 'Network fee')} v={`${fee} ${sym}`} />
            <KV k={L('实际到账', 'You receive')} v={<b className="accent-text">{fmt(Math.max(0, a - fee), 6)} {sym}</b>} />
            <KV k={L('预计到账时间', 'Arrival')} v={n.arrive} />
          </div>
          <Btn block size="lg" onClick={go2fa} disabled={!a}>{L('提币', 'Withdraw')}</Btn>
        </div>
      )}
      {step === 'verify' && (
        <div className="stack center">
          <div className="verify-ico"><Fingerprint size={34} /></div>
          <h3>{L('安全验证', 'Security check')}</h3>
          <p className="muted">{L('验证码已发送至绑定邮箱 a***@mail.com（演示环境自动填充）', 'A code was sent to a***@mail.com (auto-filled in this demo)')}</p>
          <div className="otp">
            {Array.from({ length: 6 }).map((_, i) => <span key={i} className={cx(code[i] && 'on')}>{code[i] || ''}</span>)}
          </div>
          <div className="summary">
            <KV k={L('提币', 'Withdraw')} v={`${fmt(a, 6)} ${sym}`} />
            <KV k={L('到', 'To')} v={shortAddr(address)} />
            <KV k={L('网络', 'Network')} v={n.name} mono={false} />
          </div>
          <div className="btn-row">
            <Btn variant="ghost" onClick={() => setStep('form')}>{L('返回', 'Back')}</Btn>
            <Btn onClick={submit} disabled={code.length < 6}>{L('确认提币', 'Confirm')}</Btn>
          </div>
        </div>
      )}
      {step === 'done' && (
        <div className="stack center">
          <div className="tracker-ring ok"><CheckCircle2 size={40} /></div>
          <h3>{L('提币申请已提交', 'Withdrawal submitted')}</h3>
          <p className="muted">{L('风控审核通过后将广播上链，可在钱包资金记录中查看进度。', 'It will be broadcast after risk review. Track it under wallet activity.')}</p>
          <div className="btn-row">
            <Btn variant="ghost" onClick={closeModal}>{L('完成', 'Done')}</Btn>
            <Btn onClick={() => { closeModal(); go('wallet', 'records'); }}>{L('查看记录', 'View activity')}</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Transfer between accounts
// ----------------------------------------------------------------------------
function TransferModal({ from: f0 = 'spot' }) {
  const s = useApp();
  const [from, setFrom] = useState(f0);
  const [amt, setAmt] = useState('');
  const to = from === 'spot' ? 'futures' : 'spot';
  const sym = 'USDT';
  const avail = from === 'spot' ? (s.spot.USDT || 0) : (s.futures.USDT || 0);
  const name = (k) => (k === 'spot' ? L('现货账户', 'Spot') : L('合约账户', 'Futures'));
  const submit = () => {
    const r = transfer(sym, from, to, parseFloat(amt));
    if (r.err) { toast(r.err, 'err'); return; }
    toast(L('划转成功', 'Transferred'), 'ok', `${amt} USDT · ${name(from)} → ${name(to)}`);
    closeModal();
  };
  return (
    <Modal title={L('资金划转', 'Transfer')} onClose={closeModal} icon={<ArrowLeftRight size={18} />}>
      <div className="stack">
        <div className="xfer">
          <div className="xfer-row"><span className="muted">{L('从', 'From')}</span><b>{name(from)}</b></div>
          <button className="xfer-swap" onClick={() => setFrom(to)} aria-label={L('交换', 'Swap')}><ArrowLeftRight size={16} /></button>
          <div className="xfer-row"><span className="muted">{L('到', 'To')}</span><b>{name(to)}</b></div>
        </div>
        <div className="csel-static"><CoinIcon sym={sym} size={22} /><b>{sym}</b><span className="muted">{L('合约保证金币种', 'Margin asset')}</span></div>
        <NumInput id="xf-amt" label={L('数量', 'Amount')} value={amt} onChange={setAmt} suffix={sym}
          right={<button className="max-btn" onClick={() => setAmt(String(floorTo(avail, 4)))}>MAX</button>} />
        <div className="row-between small"><span className="muted">{L('可划转', 'Available')}</span><span className="mono">{fmt(avail, 4)} {sym}</span></div>
        <Btn block size="lg" onClick={submit} disabled={!(parseFloat(amt) > 0)}>{L('确认划转', 'Transfer')}</Btn>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Convert (flash swap)
// ----------------------------------------------------------------------------
const CONVERT_COINS = ['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'TON', 'ADA', 'AVAX', 'LINK', 'TRX', 'DOT', 'ARB', 'PDX', 'ORBX', 'HALO', 'TESS', 'LUMN', 'ZEPH'];

export function ConvertBox({ initFrom = 'USDT', initTo = 'USDC', onDone, compactMode }) {
  useMarket();
  const s = useApp();
  const [from, setFrom] = useState(initFrom);
  const [to, setTo] = useState(initTo);
  const [amt, setAmt] = useState('');
  const [quote, setQuote] = useState(null);
  const [left, setLeft] = useState(0);
  const a = parseFloat(amt) || 0;
  const liveRate = (price(from) / price(to)) * 0.999;
  const rate = quote ? quote.rate : liveRate;
  useEffect(() => {
    if (!quote) return;
    const t = setInterval(() => {
      const l = Math.max(0, Math.ceil((quote.exp - Date.now()) / 1000));
      setLeft(l);
      if (l <= 0) setQuote(null);
    }, 250);
    return () => clearInterval(t);
  }, [quote]);
  const getQuote = () => {
    if (!s.wallet.connected) { openModal('connect'); return; }
    if (a > bal(from)) { toast(L(`${from} 余额不足`, `Insufficient ${from}`), 'err'); return; }
    setQuote({ rate: liveRate, exp: Date.now() + 8000 });
    setLeft(8);
  };
  const confirm = () => {
    const r = convert(from, to, a, quote.rate);
    if (r.err) { toast(r.err, 'err'); return; }
    toast(L('闪兑成功', 'Converted'), 'ok', `${fmt(a, 6)} ${from} → ${fmt(r.out, 6)} ${to}`);
    setAmt('');
    setQuote(null);
    onDone?.();
  };
  return (
    <div className={cx('convert', compactMode && 'convert-compact')}>
      <div className="swap-box">
        <div className="swap-top"><span>{L('支付', 'You pay')}</span><span className="muted small">{L('可用', 'Avail.')} <span className="mono">{fmt(bal(from), adp(price(from)))}</span> <button className="max-btn" onClick={() => setAmt(String(floorTo(bal(from), adp(price(from)))))}>MAX</button></span></div>
        <div className="swap-mid">
          <input className="swap-input mono" inputMode="decimal" placeholder="0" value={amt} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && (setAmt(e.target.value), setQuote(null))} />
          <CoinSelect compact value={from} options={CONVERT_COINS.filter((x) => x !== to)} onChange={(v) => { setFrom(v); setQuote(null); }} balances={(k) => fmt(bal(k), 4)} />
        </div>
        <div className="muted small mono">≈ {usd(a * price(from))}</div>
      </div>
      <button className="swap-flip" onClick={() => { setFrom(to); setTo(from); setQuote(null); }} aria-label={L('交换方向', 'Flip')}><ArrowDown size={18} /></button>
      <div className="swap-box">
        <div className="swap-top"><span>{L('收到', 'You receive')}</span><span className="muted small">{L('余额', 'Bal.')} <span className="mono">{fmt(bal(to), adp(price(to)))}</span></span></div>
        <div className="swap-mid">
          <div className="swap-input mono out">{a ? fmt(a * rate, adp(price(to))) : '0'}</div>
          <CoinSelect compact value={to} options={CONVERT_COINS.filter((x) => x !== from)} onChange={(v) => { setTo(v); setQuote(null); }} />
        </div>
        <div className="muted small mono">≈ {usd(a * rate * price(to))}</div>
      </div>
      <div className="summary">
        <KV k={L('参考汇率', 'Rate')} v={`1 ${from} ≈ ${fmt(rate, pdp(rate))} ${to}`} />
        <KV k={L('手续费', 'Fee')} v={L('0（已含在报价中）', '0 (included in quote)')} />
      </div>
      {!s.wallet.connected ? (
        <Btn block size="lg" onClick={() => openModal('connect')}><Wallet size={16} />{L('连接钱包并登录', 'Connect wallet & sign in')}</Btn>
      ) : quote ? (
        <Btn block size="lg" onClick={confirm}>{L('确认兑换', 'Confirm')} · {left}s</Btn>
      ) : (
        <Btn block size="lg" onClick={getQuote} disabled={!a}><Repeat size={16} />{L('获取报价', 'Get quote')}</Btn>
      )}
    </div>
  );
}

function ConvertModal({ from, to }) {
  return (
    <Modal title={L('闪兑', 'Convert')} onClose={closeModal} icon={<Repeat size={18} />}>
      <ConvertBox initFrom={from} initTo={to} />
    </Modal>
  );
}
