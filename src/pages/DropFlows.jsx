// Free ORIA launch: subscribe by wallet signature, claim, and the airdrop receipt.
// Also the generic airdrop progress/receipt used by every campaign and the wallet records.
import { useEffect, useMemo, useState } from 'react';
import {
  Check, CheckCircle2, Loader2, Clock, ShieldCheck, PenLine, FlaskConical, FastForward, ArrowLeft, XCircle, Gift, Wallet,
  ArrowDownToLine, FileSignature, ChevronDown, Hourglass, Calculator, Coins, Receipt, ArrowRight,
} from 'lucide-react';
import { FREE_DROP, NETWORKS, WALLETS, CHAINS, BRAND } from '../core/data.js';
import { L } from '../core/lang.js';
import {
  useApp, go, toast, now, fastForward, valueOf, bal, dropTimes, dropPhase, dropTaken, signDrop, claimDrop, dropAirdrop, depositAddress,
} from '../core/store.js';
import { useMarket } from '../core/market.js';
import { fmt, amt, usd, countdown, dateTime, shortAddr, randHex } from '../core/fmt.js';
import { Btn, Progress, Pill, ProjLogo, BrandMark, CoinIcon, CopyBtn, Modal, Portal, Empty, cx } from '../ui/kit.jsx';
import { orbStyle } from '../layout/Shell.jsx';
import { WalletGlyph, ChainIcon } from '../layout/Modals.jsx';

// Where campaign rewards are sent from (display only)
export const POOL_ADDRESS = '0x7a2c5b19e04f6d3a8c71b2e9f05d4c3a6b8e1f90';
const BASE = CHAINS.find((c) => c.id === 'base');

const sourceLabel = (src) => ({
  drop: L(`${FREE_DROP.sym} 免費申購`, `Free ${FREE_DROP.sym} launch`),
  invite: L('邀請好友', 'Invite friends'),
  checkin: L('每日簽到', 'Daily check-in'),
  social: L('關注社媒', 'Follow us'),
  quiz: L('答題學院', 'Learn & earn'),
}[src] || src);

function walletOf(s) {
  return WALLETS.find((x) => x.id === s.wallet.provider) || WALLETS[0];
}

// The typed data the user signs to subscribe
function typedData(wallet, receiver, nonce, deadline) {
  return [
    ['Primary type', 'FreeSubscription'],
    ['Project', `${FREE_DROP.name} (${FREE_DROP.sym})`],
    ['Amount', `${FREE_DROP.perUser} ${FREE_DROP.sym}`],
    ['Payment', '0 USDC'],
    ['Wallet', wallet],
    ['Receiver', receiver],
    ['Chain ID', '8453 (Base)'],
    ['Nonce', nonce],
    ['Deadline', new Date(deadline).toISOString()],
  ];
}

// Row of label / value used in receipts
function Line({ k, children, copy }) {
  return (
    <div className="rc-line">
      <span>{k}</span>
      <b>{children}{copy && <CopyBtn text={copy} />}</b>
    </div>
  );
}

function FlowSteps({ cur }) {
  const steps = [L('確認申購', 'Review'), L('錢包簽名', 'Sign'), L('驗證', 'Verify'), L('完成', 'Done')];
  return (
    <div className="flow-steps">
      {steps.map((x, i) => (
        <div key={i} className={cx('fs', i < cur && 'done', i === cur && 'cur')}>
          <i>{i < cur ? <Check size={12} /> : i + 1}</i><span>{x}</span>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Browser-wallet style signature request
// ----------------------------------------------------------------------------
export function WalletPrompt({ fields, onSigned, onReject, onClose }) {
  const s = useApp();
  const w = walletOf(s);
  const [stage, setStage] = useState('opening');
  useEffect(() => {
    const t = setTimeout(() => setStage('review'), 900);
    return () => clearTimeout(t);
  }, []);
  const sign = () => {
    setStage('signing');
    setTimeout(() => { onSigned('0x' + randHex(130)); onClose(); }, 1100);
  };
  const reject = () => { onReject?.(); onClose(); };
  return (
    <Portal>
      <div className="wp-veil" onClick={stage === 'review' ? reject : undefined} />
      <div className="wp" role="dialog" aria-label={w.name}>
        <div className="wp-bar">
          <WalletGlyph w={w} size={22} />
          <b>{w.name}</b>
          <span className="wp-chain"><ChainIcon c={BASE} size={14} />Base</span>
        </div>
        {stage === 'opening' ? (
          <div className="wp-opening"><Loader2 size={28} className="spin" /><span>{L(`正在喚起 ${w.name}…`, `Opening ${w.name}…`)}</span></div>
        ) : (
          <>
            <div className="wp-acct"><span className="orb" style={orbStyle(s.wallet.address)} /><span className="mono">{shortAddr(s.wallet.address)}</span></div>
            <div className="wp-body">
              <div className="wp-site"><BrandMark size={20} /><span className="mono">https://{BRAND.toLowerCase()}.app</span></div>
              <h3>{L('簽名請求', 'Signature request')}</h3>
              <p className="muted small">{L('只有在你信任此網站時才簽名。', 'Only sign if you trust this site.')}</p>
              <div className="wp-data">
                {fields.map(([k, v]) => <div key={k}><span>{k}</span><b className="mono">{v}</b></div>)}
              </div>
              <div className="wp-safe"><ShieldCheck size={15} />{L('此簽名不會發起交易，也不消耗 Gas。', 'This signature sends no transaction and costs no gas.')}</div>
            </div>
            <div className="wp-foot">
              <Btn variant="ghost" onClick={reject} disabled={stage === 'signing'}>{L('拒絕', 'Reject')}</Btn>
              <Btn onClick={sign} loading={stage === 'signing'}>{L('簽名', 'Sign')}</Btn>
            </div>
          </>
        )}
      </div>
    </Portal>
  );
}

// ----------------------------------------------------------------------------
// Subscribe: review → wallet signature → verification → result
// ----------------------------------------------------------------------------
export function SubscribeFlow({ onClose }) {
  const s = useApp();
  const w = walletOf(s);
  const { claim, end } = dropTimes();
  const nonce = useMemo(() => randHex(16), []);
  const to = depositAddress(FREE_DROP.net);
  const [step, setStep] = useState('review');
  const [agree, setAgree] = useState(false);
  const [sig, setSig] = useState('');
  const [checks, setChecks] = useState(0);
  const [err, setErr] = useState('');
  const verify = [
    L('驗證簽名與錢包地址一致', 'Signature matches the wallet address'),
    L('檢查申購資格（每個錢包限 1 次）', 'Eligibility check (one per wallet)'),
    L('鎖定申購名額', 'Reserving your spot'),
    L('生成申購憑證', 'Issuing your receipt'),
  ];
  useEffect(() => {
    if (step !== 'verify') return;
    if (checks < verify.length) {
      const t = setTimeout(() => setChecks((c) => c + 1), 550);
      return () => clearTimeout(t);
    }
    const r = signDrop({ sig, nonce, provider: w.id });
    if (r.err) { setErr(r.err); setStep('error'); } else setStep('done');
  }, [step, checks]);
  const d = s.camp.drop;
  const cur = { review: 0, wallet: 1, rejected: 1, verify: 2, error: 2, done: 4 }[step];
  const title = { review: L('確認申購', 'Review subscription'), wallet: L('等待錢包簽名', 'Waiting for signature'), rejected: L('簽名已取消', 'Signature cancelled'), verify: L('正在驗證', 'Verifying'), error: L('申購失敗', 'Subscription failed'), done: L('申購成功', 'Subscribed') }[step];
  const busy = step === 'wallet' || step === 'verify';
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose} width={480} icon={<FileSignature size={18} />} className="flow-modal">
      <FlowSteps cur={cur} />

      {step === 'review' && (
        <>
          <div className="fl-proj">
            <ProjLogo p={FREE_DROP} size={44} ring />
            <div><b>{FREE_DROP.name}</b><span className="muted small">{L(...FREE_DROP.tagline)}</span></div>
            <span className="free-badge">{L('免費', 'FREE')}</span>
          </div>
          <div className="rc">
            <Line k={L('申購數量', 'Amount')}><span className="mono">{FREE_DROP.perUser} {FREE_DROP.sym}</span></Line>
            <Line k={L('需支付', 'You pay')}><span className="mono up">0 USDC</span></Line>
            <Line k={L('簽名錢包', 'Signing wallet')}><span className="row-gap"><WalletGlyph w={w} size={16} /><span className="mono">{shortAddr(s.wallet.address)}</span></span></Line>
            <Line k={L('接收地址', 'Receiving address')}><span className="row-gap"><ChainIcon c={BASE} size={14} /><span className="mono">{shortAddr(to)}</span></span></Line>
            <Line k={L('已申購 / 總名額', 'Subscribed / spots')}><span className="mono">{fmt(dropTaken(), 0)} / {fmt(FREE_DROP.slots, 0)}</span></Line>
            <Line k={L('分配公佈', 'Allocations published')}><span className="mono">{dateTime(claim)}</span></Line>
          </div>
          <p className="fine">{L('接收地址是你在 Novarix 的交易所地址。領取後 ORIA 會空投到這個地址，並計入現貨帳戶。', 'The receiving address is your Novarix exchange address. When you claim, ORIA is airdropped there and added to your spot account.')}</p>
          <label className="check check-line">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>{L('我已閱讀並同意申購規則，了解簽名不會發起交易。', 'I have read the rules and understand the signature sends no transaction.')}</span>
          </label>
          <div className="btn-row">
            <Btn variant="ghost" onClick={onClose}>{L('取消', 'Cancel')}</Btn>
            <Btn disabled={!agree} onClick={() => setStep('wallet')}><PenLine size={16} />{L('喚起錢包簽名', 'Sign in wallet')}</Btn>
          </div>
        </>
      )}

      {step === 'wallet' && (
        <div className="fl-wait">
          <span className="fl-pulse"><WalletGlyph w={w} size={56} /></span>
          <h3>{L(`請在 ${w.name} 中確認簽名`, `Confirm the signature in ${w.name}`)}</h3>
          <p className="muted small">{L('簽名請求已發送到你的錢包。簽名僅用於確認申購，不會轉走任何資產。', 'The request is in your wallet. The signature only confirms the subscription and cannot move your funds.')}</p>
          <span className="fl-wait-line"><Loader2 size={15} className="spin" />{L('等待確認…', 'Waiting…')}</span>
          <WalletPrompt
            fields={typedData(s.wallet.address, to, nonce, end)}
            onSigned={(x) => { setSig(x); setChecks(0); setStep('verify'); }}
            onReject={() => setStep('rejected')}
            onClose={() => {}}
          />
        </div>
      )}

      {step === 'rejected' && (
        <div className="fl-result">
          <span className="fl-ico warn"><XCircle size={38} /></span>
          <h3>{L('你取消了簽名', 'You cancelled the signature')}</h3>
          <p className="muted small">{L('申購尚未完成，名額沒有被鎖定。可以重新喚起錢包簽名。', 'You are not subscribed yet and no spot is reserved. You can sign again.')}</p>
          <div className="btn-row">
            <Btn variant="ghost" onClick={onClose}>{L('關閉', 'Close')}</Btn>
            <Btn onClick={() => setStep('wallet')}><PenLine size={16} />{L('重新簽名', 'Sign again')}</Btn>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="fl-verify">
          <div className="fl-sig"><span className="muted small">{L('簽名', 'Signature')}</span><span className="mono">{sig.slice(0, 18)}…{sig.slice(-8)}</span></div>
          {verify.map((x, i) => (
            <div key={i} className={cx('fv', i < checks && 'done', i === checks && 'cur')}>
              {i < checks ? <CheckCircle2 size={18} /> : i === checks ? <Loader2 size={18} className="spin" /> : <Clock size={18} />}
              <span>{x}</span>
            </div>
          ))}
          <Progress value={checks / verify.length} glow />
        </div>
      )}

      {step === 'error' && (
        <div className="fl-result">
          <span className="fl-ico warn"><XCircle size={38} /></span>
          <h3>{err}</h3>
          <div className="btn-row"><Btn onClick={onClose}>{L('關閉', 'Close')}</Btn></div>
        </div>
      )}

      {step === 'done' && d && (
        <div className="fl-result">
          <span className="fl-ico ok"><CheckCircle2 size={40} /></span>
          <h3>{L(`已為你鎖定 ${d.amount} ${FREE_DROP.sym}`, `${d.amount} ${FREE_DROP.sym} reserved for you`)}</h3>
          <p className="muted small">{L('分配結果公佈後即可領取，ORIA 會空投到你的交易所地址。', 'Claim once allocations are published; ORIA will be airdropped to your exchange address.')}</p>
          <div className="rc">
            <Line k={L('申購編號', 'Subscription ID')} copy={d.id}><span className="mono">{d.id}</span></Line>
            <Line k={L('名額序號', 'Spot number')}><span className="mono">#{fmt(d.queue, 0)}</span></Line>
            <Line k={L('簽名哈希', 'Signature')} copy={d.sig}><span className="mono">{shortAddr(d.sig)}</span></Line>
            <Line k={L('接收地址', 'Receiving address')} copy={d.to}><span className="mono">{shortAddr(d.to)}</span></Line>
            <Line k={L('申購時間', 'Subscribed at')}><span className="mono">{dateTime(d.ts, true)}</span></Line>
            <Line k={L('開放領取', 'Claim opens')}><span className="mono">{dateTime(claim)}</span></Line>
          </div>
          <div className="btn-row">
            <Btn variant="ghost" onClick={() => { onClose(); go('rewards', 'record'); }}><Receipt size={16} />{L('查看申購詳情', 'View subscription')}</Btn>
            <Btn onClick={onClose}>{L('完成', 'Done')}</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Claim the ORIA allocation: review, then the airdrop progress and receipt
// ----------------------------------------------------------------------------
export function ClaimFlow({ onClose }) {
  useMarket();
  const s = useApp();
  const d = s.camp.drop;
  const [rid, setRid] = useState(d?.claimed ? d.rid : null);
  if (!d) return null;
  const amt = d.amount || FREE_DROP.perUser;
  const claim = () => {
    const r = claimDrop();
    if (r.err) { toast(r.err, 'err'); return; }
    setRid(r.rid);
  };
  if (rid) return <AirdropModal rid={rid} onClose={onClose} />;
  return (
    <Modal title={L(`領取 ${FREE_DROP.sym} 空投`, `Claim your ${FREE_DROP.sym}`)} onClose={onClose} width={460} icon={<Gift size={18} />} className="flow-modal">
      <div className="cl-amt">
        <ProjLogo p={FREE_DROP} size={52} ring />
        <div><b className="mono">{amt} {FREE_DROP.sym}</b><span className="muted small mono">≈ {usd(valueOf(FREE_DROP.sym, amt))}</span></div>
      </div>
      <div className="cl-route">
        <div><BrandMark size={30} /><span>{L('獎勵池', 'Reward pool')}</span><small className="mono">{shortAddr(POOL_ADDRESS)}</small></div>
        <ArrowRight size={18} />
        <div><span className="orb" style={orbStyle(s.wallet.address)} /><span>{L('你的交易所地址', 'Your exchange address')}</span><small className="mono">{shortAddr(d.to)}</small></div>
      </div>
      <div className="rc">
        <Line k={L('分配結果', 'Allocation')}><span className="up">{L(`全額獲配 ${amt} ${FREE_DROP.sym}`, `Full allocation: ${amt} ${FREE_DROP.sym}`)}</span></Line>
        <Line k={L('接收地址', 'Receiving address')} copy={d.to}><span className="mono">{shortAddr(d.to)}</span></Line>
        <Line k={L('網路', 'Network')}><span className="row-gap"><ChainIcon c={BASE} size={14} />Base</span></Line>
        <Line k={L('網路手續費', 'Network fee')}><span>{L('0（由平台承擔）', '0 (paid by the platform)')}</span></Line>
        <Line k={L('到帳帳戶', 'Credited to')}><span>{L('現貨帳戶', 'Spot account')}</span></Line>
      </div>
      <div className="btn-row">
        <Btn variant="ghost" onClick={onClose}>{L('取消', 'Cancel')}</Btn>
        <Btn onClick={claim}><Gift size={16} />{L('確認領取', 'Confirm claim')}</Btn>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Airdrop progress, then the receipt (all campaigns, and wallet records)
// ----------------------------------------------------------------------------
export function AirdropModal({ rid, onClose }) {
  const s = useApp();
  const r = s.records.find((x) => x.id === rid);
  if (!r) return null;
  if (r.internal) return <CreditReceipt r={r} onClose={onClose} />;
  const done = r.status === 'done';
  const net = NETWORKS[r.net];
  return (
    <Modal title={done ? L('空投已到帳', 'Airdrop received') : L('正在空投', 'Airdropping')} onClose={onClose} width={460} icon={<Gift size={18} />} className="flow-modal">
      {!done ? (
        <>
          <div className="ad-flow">
            <div className="ad-node"><BrandMark size={44} /><span>{L('獎勵池', 'Reward pool')}</span></div>
            <div className="ad-line"><span className="ad-coin"><CoinIcon sym={r.sym} size={26} /></span></div>
            <div className="ad-node"><span className="orb big" style={orbStyle(s.wallet.address)} /><span>{L('你的交易所地址', 'Your exchange address')}</span></div>
          </div>
          <div className="ad-amt mono">+{amt(r.amount)} {r.sym}</div>
          <div className="ad-sub muted small mono">{net.short} · {shortAddr(r.address)}</div>
          <Progress value={r.conf} max={r.need} glow />
          <div className="ad-vsteps">
            <div className="done"><CheckCircle2 size={17} /><span>{L('領取請求已提交', 'Claim submitted')}</span><small className="mono">{dateTime(r.ts, true)}</small></div>
            <div className="done"><CheckCircle2 size={17} /><span>{L('鏈上發放', 'Sent on-chain')}</span><small className="mono">Tx {shortAddr(r.txid)}</small></div>
            <div className="cur"><Loader2 size={17} className="spin" /><span>{L('區塊確認', 'Confirmations')}</span><small className="mono">{r.conf}/{r.need}</small></div>
            <div><Clock size={17} /><span>{L('存入現貨帳戶', 'Credit to spot account')}</span><small /></div>
          </div>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <Btn variant="ghost" onClick={onClose}>{L('後台處理', 'Run in background')}</Btn>
          </div>
        </>
      ) : (
        <div className="fl-result">
          <span className="fl-ico ok"><CoinIcon sym={r.sym} size={46} /><i><Check size={14} /></i></span>
          <div className="ad-amt mono">+{amt(r.amount)} {r.sym}</div>
          <p className="muted small">{L('已空投到你的交易所地址，並存入現貨帳戶。', 'Airdropped to your exchange address and added to your spot account.')}</p>
          <div className="rc">
            <Line k={L('來源', 'Source')}>{sourceLabel(r.source)}</Line>
            <Line k={L('交易哈希', 'Transaction hash')} copy={r.txid}><span className="mono">{shortAddr(r.txid)}</span></Line>
            <Line k={L('發送方', 'From')}><span className="mono">{L('獎勵池', 'Reward pool')} {shortAddr(POOL_ADDRESS)}</span></Line>
            <Line k={L('接收地址', 'Receiving address')} copy={r.address}><span className="mono">{shortAddr(r.address)}</span></Line>
            <Line k={L('網路', 'Network')}>{net.name}</Line>
            <Line k={L('區塊確認', 'Confirmations')}><span className="mono up">{r.conf}/{r.need}</span></Line>
            <Line k={L('到帳時間', 'Received at')}><span className="mono">{dateTime(r.doneAt || r.ts, true)}</span></Line>
            <Line k={L('現貨餘額', 'Spot balance')}><span className="mono">{fmt(bal(r.sym), 2)} {r.sym}</span></Line>
          </div>
          <div className="btn-row">
            <Btn variant="ghost" onClick={() => { onClose(); go('wallet'); }}><Wallet size={16} />{L('查看資產', 'View assets')}</Btn>
            {r.source === 'drop'
              ? <Btn onClick={() => { onClose(); go('rewards', 'record'); }}><Receipt size={16} />{L('申購詳情', 'Subscription details')}</Btn>
              : <Btn onClick={onClose}>{L('完成', 'Done')}</Btn>}
          </div>
        </div>
      )}
    </Modal>
  );
}

// Centralised reward (check-in): booked to the exchange account, no chain involved
function CreditReceipt({ r, onClose }) {
  return (
    <Modal title={L('獎勵已到帳', 'Reward received')} onClose={onClose} width={440} icon={<Gift size={18} />} className="flow-modal">
      <div className="fl-result">
        <span className="fl-ico ok"><CoinIcon sym={r.sym} size={46} /><i><Check size={14} /></i></span>
        <div className="ad-amt mono">+{amt(r.amount)} {r.sym}</div>
        <p className="muted small">{L('已記入你的交易所帳戶，即時到帳，不需要上鏈。', 'Booked to your exchange account instantly, with nothing on-chain.')}</p>
        <div className="cr-steps">
          <span><CheckCircle2 size={15} />{L('錢包簽名登入', 'Wallet sign-in')}</span>
          <span><CheckCircle2 size={15} />{sourceLabel(r.source)}</span>
          <span><CheckCircle2 size={15} />{L('記入現貨帳戶', 'Credited to spot')}</span>
        </div>
        <div className="rc">
          <Line k={L('來源', 'Source')}>{sourceLabel(r.source)}</Line>
          <Line k={L('流水號', 'Reference')} copy={r.ref}><span className="mono">{r.ref}</span></Line>
          <Line k={L('到帳方式', 'Method')}>{L('平台內部入帳', 'Platform credit')}</Line>
          <Line k={L('到帳帳戶', 'Credited to')}>{L('現貨帳戶', 'Spot account')}</Line>
          <Line k={L('交易所地址', 'Exchange address')} copy={r.address}><span className="mono">{shortAddr(r.address)}</span></Line>
          <Line k={L('到帳時間', 'Received at')}><span className="mono">{dateTime(r.doneAt || r.ts, true)}</span></Line>
          <Line k={L('現貨餘額', 'Spot balance')}><span className="mono">{fmt(bal(r.sym), 2)} {r.sym}</span></Line>
        </div>
        <div className="btn-row">
          <Btn variant="ghost" onClick={() => { onClose(); go('wallet'); }}><Wallet size={16} />{L('查看資產', 'View assets')}</Btn>
          <Btn onClick={onClose}>{L('完成', 'Done')}</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// My ORIA subscription: timeline from signature to credit, plus the receipt
// ----------------------------------------------------------------------------
export function DropRecord() {
  useMarket();
  const s = useApp();
  const d = s.camp.drop;
  const [claimOpen, setClaimOpen] = useState(false);
  const [showData, setShowData] = useState(false);
  const { end, claim } = dropTimes();
  const ph = dropPhase();
  const t = now();
  const rec = dropAirdrop();
  const back = <button className="back" onClick={() => go('rewards', 'drop')}><ArrowLeft size={16} />{L(`返回 ${FREE_DROP.sym} 免費申購`, `Back to the free ${FREE_DROP.sym} launch`)}</button>;
  if (!s.wallet.connected || !d) {
    return (
      <div className="page">
        {back}
        <div className="card"><Empty icon={<FileSignature size={22} />} text={L(`你還沒有參與 ${FREE_DROP.sym} 免費申購`, `You have not joined the free ${FREE_DROP.sym} launch`)}><Btn size="sm" onClick={() => go('rewards', 'drop')}>{L('去申購', 'Subscribe')}</Btn></Empty></div>
      </div>
    );
  }
  const amt = d.amount || FREE_DROP.perUser;
  const status = rec?.status === 'done' ? ['up', L('已到帳', 'Received')]
    : rec ? ['accent', L('空投中', 'Airdropping')]
    : ph === 'ended' ? ['accent', L('待領取', 'Ready to claim')]
    : ph === 'allocating' ? ['violet', L('分配計算中', 'Allocating')]
    : ['muted', L('已申購 · 等待結束', 'Subscribed · window open')];
  const items = [
    { icon: FileSignature, title: L('錢包簽名申購', 'Signed to subscribe'), done: true, time: d.ts, sub: <>{WALLETS.find((x) => x.id === d.provider)?.name || 'Wallet'} · <span className="mono">{shortAddr(d.sig)}</span></> },
    { icon: Hourglass, title: L('申購期結束', 'Subscription window closes'), done: t >= end, cur: ph === 'live', time: end, sub: ph === 'live' ? L(`還有 ${countdown(end - t)}`, `${countdown(end - t)} left`) : L(`共 ${fmt(dropTaken(), 0)} 個錢包參與`, `${fmt(dropTaken(), 0)} wallets joined`) },
    { icon: Calculator, title: L('分配結果公佈', 'Allocations published'), done: t >= claim, cur: ph === 'allocating', time: claim, sub: t >= claim ? L(`名額未滿，全額獲配 ${amt} ${FREE_DROP.sym}`, `Undersubscribed: full ${amt} ${FREE_DROP.sym} allocated`) : ph === 'allocating' ? L(`分配計算中，${countdown(claim - t)} 後公佈`, `Calculating; published in ${countdown(claim - t)}`) : L('申購結束後 1 小時公佈', 'Published 1 hour after the window closes') },
    { icon: Gift, title: L('領取空投', 'Claim'), done: d.claimed, cur: ph === 'ended' && !d.claimed, time: d.claimedAt, sub: d.claimed ? L('已提交領取請求', 'Claim submitted') : ph === 'ended' ? L('現在可以領取', 'You can claim now') : L('分配結果公佈後開放', 'Opens when allocations are published'), action: ph === 'ended' && !d.claimed && <Btn size="sm" onClick={() => setClaimOpen(true)}><Gift size={14} />{L('領取', 'Claim')} {amt} {FREE_DROP.sym}</Btn> },
    { icon: Coins, title: L('鏈上發放', 'Sent on-chain'), done: !!rec && rec.conf >= rec.need, cur: !!rec && rec.conf < rec.need, time: rec?.ts, sub: rec ? <>Tx <span className="mono">{shortAddr(rec.txid)}</span> · {L('區塊確認', 'Confirmations')} {rec.conf}/{rec.need}</> : L(`發送到 ${shortAddr(d.to)}（Base）`, `To ${shortAddr(d.to)} (Base)`) },
    { icon: Wallet, title: L('到帳現貨帳戶', 'Credited to spot'), done: rec?.status === 'done', time: rec?.doneAt, sub: rec?.status === 'done' ? L(`現貨餘額 ${fmt(bal(FREE_DROP.sym), 2)} ${FREE_DROP.sym}`, `Spot balance ${fmt(bal(FREE_DROP.sym), 2)} ${FREE_DROP.sym}`) : L('確認完成後自動計入', 'Added automatically after confirmations'), action: rec?.status === 'done' && <Btn size="sm" variant="soft" onClick={() => go('wallet')}><Wallet size={14} />{L('查看資產', 'View assets')}</Btn> },
  ];
  return (
    <div className="page">
      {back}
      <div className="rec-head">
        <ProjLogo p={FREE_DROP} size={56} ring />
        <div className="rec-head-txt">
          <h1 className="display">{L(`我的 ${FREE_DROP.sym} 申購`, `My ${FREE_DROP.sym} subscription`)}</h1>
          <span className="muted small mono">{d.id}</span>
        </div>
        <Pill tone={status[0]} dot={status[0] !== 'up' && status[0] !== 'muted'}>{status[1]}</Pill>
        <div className="rec-amt"><span>{L('獲配數量', 'Allocation')}</span><b className="mono">{amt} {FREE_DROP.sym}</b></div>
      </div>
      <div className="camp-layout">
        <div className="camp-main">
          <div className="card">
            <h3 className="sub-h"><Clock size={16} />{L('申購進度', 'Progress')}</h3>
            <div className="tl">
              {items.map((x, i) => {
                const Icon = x.icon;
                return (
                  <div key={i} className={cx('tl-item', x.done && 'done', x.cur && 'cur')}>
                    <span className="tl-ico">{x.done ? <Check size={16} /> : x.cur ? <Loader2 size={16} className="spin" /> : <Icon size={16} />}</span>
                    <div className="tl-body">
                      <div className="tl-top"><b>{x.title}</b>{x.time && <span className="mono muted small">{dateTime(x.time)}</span>}</div>
                      <span className="muted small">{x.sub}</span>
                      {x.action && <div className="tl-act">{x.action}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            {ph === 'live' && (
              <button className="demo-link" onClick={() => { fastForward(end - now() + 60e3); toast(L('時間已快進', 'Clock moved forward'), 'ok', L('申購已結束，正在計算分配', 'The window has closed; allocations are being calculated')); }}>
                <FlaskConical size={14} />{L('演示：快進到申購結束', 'Demo: skip to the end of the window')}<FastForward size={14} />
              </button>
            )}
            {ph === 'allocating' && (
              <button className="demo-link" onClick={() => { fastForward(claim - now() + 60e3); toast(L('時間已快進', 'Clock moved forward'), 'ok', L('分配結果已公佈，可以領取了', 'Allocations are out. You can claim now.')); }}>
                <FlaskConical size={14} />{L('演示：快進到分配公佈', 'Demo: skip to allocations')}<FastForward size={14} />
              </button>
            )}
          </div>
        </div>
        <aside className="camp-side">
          <div className="card">
            <h3 className="sub-h"><Receipt size={16} />{L('申購憑證', 'Subscription receipt')}</h3>
            <div className="rc flat">
              <Line k={L('申購編號', 'Subscription ID')} copy={d.id}><span className="mono">{d.id}</span></Line>
              <Line k={L('名額序號', 'Spot number')}><span className="mono">#{fmt(d.queue, 0)}</span></Line>
              <Line k={L('項目', 'Project')}>{FREE_DROP.name}</Line>
              <Line k={L('申購數量', 'Amount')}><span className="mono">{amt} {FREE_DROP.sym}</span></Line>
              <Line k={L('支付金額', 'Paid')}><span className="mono up">0 USDC</span></Line>
              <Line k={L('簽名錢包', 'Signing wallet')} copy={d.wallet}><span className="mono">{shortAddr(d.wallet)}</span></Line>
              <Line k={L('簽名哈希', 'Signature')} copy={d.sig}><span className="mono">{shortAddr(d.sig)}</span></Line>
              <Line k={L('接收地址', 'Receiving address')} copy={d.to}><span className="mono">{shortAddr(d.to)}</span></Line>
              <Line k={L('申購時間', 'Subscribed at')}><span className="mono">{dateTime(d.ts, true)}</span></Line>
            </div>
            <button className="link-btn rc-toggle" onClick={() => setShowData(!showData)}>{L('查看簽名內容', 'Show signed message')}<ChevronDown size={14} style={{ transform: showData ? 'rotate(180deg)' : 'none' }} /></button>
            {showData && (
              <div className="wp-data rc-data">
                {typedData(d.wallet, d.to, d.nonce, end).map(([k, v]) => <div key={k}><span>{k}</span><b className="mono">{v}</b></div>)}
              </div>
            )}
          </div>
        </aside>
      </div>
      {claimOpen && <ClaimFlow onClose={() => setClaimOpen(false)} />}
    </div>
  );
}
