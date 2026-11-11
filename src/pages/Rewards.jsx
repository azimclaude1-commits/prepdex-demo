import { useEffect, useMemo, useState } from 'react';
import {
  Gift, Users, CalendarCheck, Megaphone, GraduationCap, ArrowLeft, Share2, QrCode, Send, AtSign, MessagesSquare, Repeat2,
  Youtube, Check, CheckCircle2, Loader2, Clock, Sparkles, ShieldCheck, PenLine, FlaskConical, FastForward, ChevronRight,
  Trophy, Wallet, Info, XCircle, UserPlus, Zap, ArrowUpRight, Lock, ArrowDownToLine, PartyPopper, ChevronDown,
} from 'lucide-react';
import {
  FREE_DROP, INVITE_REWARD, INVITEE_REWARD, INVITE_MILESTONES, CHECKIN_REWARDS, SOCIAL_TASKS, SOCIAL_BONUS, QUIZ, QUIZ_REWARD,
  NETWORKS, WALLETS, BRAND,
} from '../core/data.js';
import { SOCIAL_LOGOS } from '../core/logos.js';
import { L } from '../core/lang.js';
import {
  useApp, go, openModal, toast, now, fastForward, valueOf, airdropAddress, airdropNet, claimables, claimableUsd, airdropTotals,
  dropTimes, dropPhase, dropTaken, signDrop, claimDrop, inviteCode, simulateInvite, inviteClaimable, claimInvite,
  checkinState, checkIn, socialStatus, startSocial, claimSocial, socialAllDone, submitQuiz, claimQuiz,
} from '../core/store.js';
import { useMarket } from '../core/market.js';
import { fmt, usd, compact, countdown, dateTime, shortAddr, randHex } from '../core/fmt.js';
import { Btn, Progress, Pill, ProjLogo, BrandMark, CoinIcon, CopyBtn, KV, Modal, Portal, QR, Empty, cx } from '../ui/kit.jsx';
import { ConnectGate, orbStyle } from '../layout/Shell.jsx';
import { WalletGlyph } from '../layout/Modals.jsx';

const DAY = 86400e3;
export const CAMP_IDS = ['drop', 'invite', 'checkin', 'social', 'quiz'];

// Copy, colors and icons for each campaign
export function campMeta(id) {
  return {
    drop: {
      icon: Gift, tone: '#9B6BFF',
      title: L(`${FREE_DROP.sym} 免費申購`, `Free ${FREE_DROP.sym} launch`),
      desc: L('無需付款，連接錢包並簽名即可申購。', 'No payment. Connect your wallet and sign to subscribe.'),
      reward: L(`每個錢包 ${FREE_DROP.perUser} ${FREE_DROP.sym}`, `${FREE_DROP.perUser} ${FREE_DROP.sym} per wallet`),
    },
    invite: {
      icon: UserPlus, tone: '#FF9A3D',
      title: L('邀請好友', 'Invite friends'),
      desc: L(`好友連接錢包後，你得 ${INVITE_REWARD} NVX，好友得 ${INVITEE_REWARD} NVX。`, `When a friend connects a wallet, you get ${INVITE_REWARD} NVX and they get ${INVITEE_REWARD} NVX.`),
      reward: L(`每位好友 ${INVITE_REWARD} NVX`, `${INVITE_REWARD} NVX per friend`),
    },
    checkin: {
      icon: CalendarCheck, tone: '#22D39B',
      title: L('每日簽到', 'Daily check-in'),
      desc: L('連續簽到 7 天，獎勵逐日遞增。', 'Check in 7 days in a row. Rewards grow each day.'),
      reward: L(`7 天共 ${CHECKIN_REWARDS.reduce((a, b) => a + b, 0)} NVX`, `${CHECKIN_REWARDS.reduce((a, b) => a + b, 0)} NVX over 7 days`),
    },
    social: {
      icon: Megaphone, tone: '#5B8CFF',
      title: L('關注社媒', 'Follow us'),
      desc: L('關注 X、Telegram、Discord 等 5 個官方帳號。', 'Follow 5 official accounts, including X, Telegram and Discord.'),
      reward: L(`最高 ${SOCIAL_TASKS.reduce((a, x) => a + x.reward, 0) + SOCIAL_BONUS} NVX`, `Up to ${SOCIAL_TASKS.reduce((a, x) => a + x.reward, 0) + SOCIAL_BONUS} NVX`),
    },
    quiz: {
      icon: GraduationCap, tone: '#FFC24D',
      title: L('答題學院', 'Learn & earn'),
      desc: L(`答對 ${QUIZ.length} 道平台知識題即可領取。`, `Answer ${QUIZ.length} questions about the platform correctly.`),
      reward: `${QUIZ_REWARD} USDT`,
    },
  }[id];
}

// One-line progress for a campaign card: [text, 0..1]
function campProgress(id, s) {
  const c = s.camp;
  if (id === 'drop') {
    const ph = dropPhase();
    if (c.drop?.claimed) return [L('已領取', 'Claimed'), 1];
    if (c.drop) return [ph === 'ended' ? L('可以領取了', 'Ready to claim') : L('已申購，等待分發', 'Subscribed, waiting for distribution'), 1];
    if (ph === 'ended') return [L('申購已結束', 'Subscription closed'), 1];
    return [L(`剩餘名額 ${fmt(FREE_DROP.slots - dropTaken(), 0)}`, `${fmt(FREE_DROP.slots - dropTaken(), 0)} spots left`), dropTaken() / FREE_DROP.slots];
  }
  if (id === 'invite') {
    const n = c.invites.length;
    const next = INVITE_MILESTONES.find(([k]) => n < k);
    return [L(`已邀請 ${n} 位好友`, `${n} friends invited`), next ? n / next[0] : 1];
  }
  if (id === 'checkin') {
    const st = checkinState();
    return [L(`連續簽到 ${st.streak} 天`, `${st.streak}-day streak`), st.filled / 7];
  }
  if (id === 'social') {
    const k = SOCIAL_TASKS.filter((x) => socialStatus(x.id) !== 'todo').length;
    return [L(`已完成 ${k}/${SOCIAL_TASKS.length}`, `${k}/${SOCIAL_TASKS.length} done`), k / SOCIAL_TASKS.length];
  }
  const q = c.quiz;
  if (q.claimed) return [L('已領取', 'Claimed'), 1];
  if (q.passed) return [L('已全部答對', 'All correct'), 1];
  return [q.tries ? L(`最佳成績 ${q.best}/${QUIZ.length}`, `Best score ${q.best}/${QUIZ.length}`) : L('尚未作答', 'Not started'), q.best / QUIZ.length];
}

const amtLabel = (list) => list.map(([sym, amt]) => `${fmt(amt, 0)} ${sym}`).join(' + ');

// ----------------------------------------------------------------------------
// Entry: the hub, or one campaign
// ----------------------------------------------------------------------------
export function Rewards({ arg }) {
  return CAMP_IDS.includes(arg) ? <CampaignPage id={arg} /> : <Hub />;
}

function Hub() {
  useMarket();
  const s = useApp();
  const ready = claimables();
  return (
    <div className="page">
      <section className="rw-hero">
        <div className="rw-hero-copy">
          <div className="eyebrow"><Gift size={14} />Rewards Hub</div>
          <h1 className="display hero-title"><span className="grad-text">{L('活動中心', 'Rewards hub')}</span></h1>
          <p className="hero-sub">{L('5 個活動全部免費參與。完成任務後點擊領取，獎勵會空投到你在 Novarix 的交易所地址，並自動存入現貨帳戶。', 'All 5 campaigns are free. Finish a task and claim: rewards are airdropped to your Novarix exchange address and land in your spot account.')}</p>
          <div className="rw-points">
            <span><ShieldCheck size={15} />{L('無需付款', 'No payment')}</span>
            <span><PenLine size={15} />{L('簽名不消耗 Gas', 'Signing costs no gas')}</span>
            <span><Zap size={15} />{L('領取後即時空投', 'Airdropped on claim')}</span>
          </div>
          <PoolStats />
        </div>
        <RewardWallet />
      </section>

      <section className="lp-sec">
        <div className="sec-head">
          <h2 className="display sec-title">{L('全部活動', 'All campaigns')}</h2>
          <span className="count">{CAMP_IDS.length}</span>
        </div>
        <div className="camp-grid">
          <DropFeature ready={ready.drop} />
          {CAMP_IDS.slice(1).map((id) => <CampCard key={id} id={id} s={s} ready={ready[id]} />)}
        </div>
      </section>

      <HowItWorks />
      <div className="rw-duo">
        <Leaderboard />
        {s.wallet.connected ? <AirdropFeed /> : <RewardFaq />}
      </div>
      {s.wallet.connected && <RewardFaq />}
    </div>
  );
}

// Campaign-wide totals; they grow slowly with the clock so the page feels live
function PoolStats() {
  const s = useApp();
  const hrs = Math.max(0, (now() - s.epoch) / 3600e3);
  const people = Math.round(86420 + hrs * 37);
  const paid = 412300 + hrs * 1150;
  return (
    <div className="pool-stats">
      <div><span>{L('獎池總額', 'Reward pool')}</span><b className="mono">$1,250,000</b></div>
      <div><span>{L('參與人數', 'Participants')}</span><b className="mono">{fmt(people, 0)}</b></div>
      <div><span>{L('已發放', 'Paid out')}</span><b className="mono up">${compact(paid, 1)}</b></div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    [CheckCircle2, L('完成任務', 'Finish a task'), L('簽名申購、簽到、關注或邀請好友。', 'Sign up for the launch, check in, follow or invite.')],
    [Gift, L('點擊領取', 'Tap claim'), L('獎勵立即從獎勵池發出。', 'The reward leaves the pool right away.')],
    [ArrowDownToLine, L('空投到交易所地址', 'Airdrop to your address'), L('發送到你在 Novarix 的專屬地址。', 'It is sent to your own Novarix address.')],
    [Wallet, L('自動計入現貨帳戶', 'Lands in spot'), L('區塊確認後即可交易或提幣。', 'Trade or withdraw after confirmations.')],
  ];
  return (
    <section className="card how">
      <h2 className="display sec-title">{L('獎勵如何到帳', 'How rewards arrive')}</h2>
      <div className="how-grid">
        {steps.map(([Icon, t, d], i) => (
          <div key={i} className="how-step">
            <span className="how-ico"><Icon size={22} /><i className="mono">{i + 1}</i></span>
            <b>{t}</b>
            <span>{d}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Fixed demo leaderboard plus the user's own position
function Leaderboard() {
  const s = useApp();
  const rows = [['0x7a3f…91c2', 412], ['0x19be…0d4a', 365], ['0xc04e…7b13', 298], ['0x5d21…ee80', 251], ['0x88a9…3f6c', 204], ['0x2f7c…a915', 176], ['0xe631…58d7', 143], ['0x4b0d…c2a1', 121]];
  const mine = s.camp.invites.length;
  return (
    <section className="card lb">
      <div className="row-between">
        <h2 className="display sec-title"><Trophy size={19} className="accent-text" />{L('邀請排行榜', 'Invite leaderboard')}</h2>
        <button className="link-btn" onClick={() => go('rewards', 'invite')}>{L('去邀請', 'Invite')}<ChevronRight size={14} /></button>
      </div>
      <div className="lb-list">
        {rows.map(([addr, n], i) => (
          <div key={addr} className={cx('lb-row', i < 3 && 'top')}>
            <span className={cx('lb-rank mono', 'r' + (i + 1))}>{i + 1}</span>
            <span className="mono">{addr}</span>
            <span className="muted small">{L(`${n} 人`, `${n} friends`)}</span>
            <b className="mono up">{fmt(n * INVITE_REWARD + (n >= 30 ? 2600 : 0), 0)} NVX</b>
          </div>
        ))}
        {s.wallet.connected && (
          <div className="lb-row me">
            <span className="lb-rank mono">{mine >= rows[rows.length - 1][1] ? '8+' : '--'}</span>
            <span className="mono">{L('我', 'Me')} · {shortAddr(s.wallet.address)}</span>
            <span className="muted small">{L(`${mine} 人`, `${mine} friends`)}</span>
            <b className="mono">{fmt(mine * INVITE_REWARD, 0)} NVX</b>
          </div>
        )}
      </div>
    </section>
  );
}

function RewardFaq() {
  const [open, setOpen] = useState(0);
  const items = [
    [L('參加活動需要付費嗎？', 'Do campaigns cost anything?'), L('不需要。5 個活動全部免費，免費申購只需錢包簽名，簽名不發起交易，也不消耗 Gas。', 'No. All 5 are free. The free launch needs only a wallet signature, which sends no transaction and costs no gas.')],
    [L('獎勵多久到帳？', 'How fast do rewards arrive?'), L('點擊領取後立即空投，通常幾秒內完成區塊確認並計入現貨帳戶。', 'They are airdropped as soon as you claim and usually confirm into your spot account within seconds.')],
    [L('獎勵可以提幣嗎？', 'Can I withdraw rewards?'), L('可以。到帳後與充值的資產相同，可以交易、質押或提到外部錢包。', 'Yes. Once received they work like deposits: trade, stake or withdraw them.')],
    [L('空投地址是什麼？', 'What is the airdrop address?'), L('每個錢包在 Novarix 都有專屬的交易所地址，與充值地址相同，獎勵會直接發送到這裡。', 'Each wallet has its own Novarix exchange address, the same as its deposit address. Rewards are sent there.')],
  ];
  return (
    <section className="card faq">
      <h2 className="display sec-title">{L('常見問題', 'FAQ')}</h2>
      <div className="faq-list">
        {items.map(([q, a], i) => (
          <div key={i} className={cx('faq-item', open === i && 'open')}>
            <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>{q}<ChevronDown size={18} /></button>
            {open === i && <p className="faq-a">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function RewardWallet() {
  const s = useApp();
  const ready = claimables();
  const totals = airdropTotals();
  if (!s.wallet.connected) {
    return (
      <div className="card rw-wallet">
        <div className="rw-wallet-gift"><Gift size={30} /></div>
        <h3>{L('連接錢包，開始領獎勵', 'Connect a wallet to start earning')}</h3>
        <p className="muted">{L('每個錢包都會分配一個專屬的交易所地址，所有活動獎勵都會空投到這個地址。', 'Each wallet gets its own exchange address. Every campaign reward is airdropped there.')}</p>
        <ConnectGate />
      </div>
    );
  }
  const items = Object.entries(ready);
  return (
    <div className="card rw-wallet">
      <div className="muted small">{L('待領取獎勵', 'Ready to claim')}</div>
      <div className="rw-big mono">≈ {usd(claimableUsd())}</div>
      {items.length > 0 ? (
        <div className="rw-ready">
          {items.map(([id, list]) => (
            <button key={id} className="rw-ready-item" onClick={() => go('rewards', id)}>
              <CoinIcon sym={list[0][0]} size={18} />
              <span>{campMeta(id).title}</span>
              <b className="mono">{amtLabel(list)}</b>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      ) : <p className="muted small">{L('暫無可領取的獎勵，去完成下面的活動吧。', 'Nothing to claim yet. Try the campaigns below.')}</p>}
      <div className="rw-addr">
        <div className="row-between small">
          <span className="muted">{L('空投地址', 'Airdrop address')}</span>
          <Pill tone="accent">{NETWORKS[airdropNet('NVX')].short}</Pill>
        </div>
        <div className="rw-addr-line"><span className="mono">{shortAddr(airdropAddress())}</span><CopyBtn text={airdropAddress()} /></div>
        <p className="fine">{L('這是你在 Novarix 的專屬地址，獎勵到帳後自動計入現貨帳戶。', 'Your own Novarix address. Rewards are added to your spot account on arrival.')}</p>
      </div>
      <div className="row-between small">
        <span className="muted">{L('累計已領取', 'Claimed so far')}</span>
        <b className="mono">{Object.keys(totals).length ? Object.entries(totals).map(([k, v]) => `${fmt(v, 0)} ${k}`).join(' · ') : '--'}</b>
      </div>
    </div>
  );
}

function DropFeature({ ready }) {
  const s = useApp();
  const ph = dropPhase();
  const { start, end } = dropTimes();
  const taken = dropTaken();
  const [a, b, c] = FREE_DROP.colors;
  const [text] = campProgress('drop', s);
  return (
    <button className="camp-feature" style={{ '--b1': a, '--b2': b, '--b3': c }} onClick={() => go('rewards', 'drop')}>
      <div className="banner-grid" />
      <div className="banner-glow" />
      <div className="camp-feature-mark"><ProjLogo p={FREE_DROP} size={200} /></div>
      <div className="camp-feature-body">
        <div className="row-gap">
          <span className="free-badge">{L('免費', 'FREE')}</span>
          <span className="status-chip-inline">
            {ph === 'live' && <><i className="live-dot" />{L('申購中', 'Live')} · {L('距結束', 'ends in')} <b className="mono">{countdown(end - now())}</b></>}
            {ph === 'upcoming' && <><Clock size={12} />{L('距開始', 'starts in')} <b className="mono">{countdown(start - now())}</b></>}
            {ph === 'ended' && (s.camp.drop?.claimed ? L('已結束 · 已領取', 'Closed · claimed') : s.camp.drop ? L('已結束，可領取', 'Closed · claim open') : L('已結束', 'Closed'))}
          </span>
        </div>
        <div className="camp-feature-id">
          <ProjLogo p={FREE_DROP} size={52} ring />
          <div>
            <h3 className="display">{campMeta('drop').title}</h3>
            <p>{L(...FREE_DROP.tagline)}</p>
          </div>
        </div>
        <div className="camp-feature-reward">
          <div><span>{L('每個錢包可得', 'Per wallet')}</span><b className="mono">{FREE_DROP.perUser} {FREE_DROP.sym}</b></div>
          <div><span>{L('參考價值', 'Est. value')}</span><b className="mono">≈ {usd(FREE_DROP.perUser * FREE_DROP.refPrice)}</b></div>
          <div><span>{L('需支付', 'You pay')}</span><b className="mono">0 USDC</b></div>
        </div>
        <div className="camp-feature-prog">
          <div className="row-between small"><span>{text}</span><b className="mono">{fmt(taken, 0)} / {fmt(FREE_DROP.slots, 0)}</b></div>
          <Progress value={taken / FREE_DROP.slots} glow={ph === 'live'} />
        </div>
        <span className="camp-feature-cta">{ready ? L('立即領取', 'Claim now') : s.camp.drop ? L('查看申購', 'View subscription') : L('簽名免費申購', 'Sign to subscribe')}<ArrowUpRight size={16} /></span>
      </div>
    </button>
  );
}

function CampCard({ id, s, ready }) {
  const m = campMeta(id);
  const Icon = m.icon;
  const [text, prog] = campProgress(id, s);
  return (
    <button className="camp-card" style={{ '--tone': m.tone }} onClick={() => go('rewards', id)}>
      <span className="camp-card-bg" aria-hidden="true"><Icon size={140} strokeWidth={1.2} /></span>
      <div className="camp-card-top">
        <span className="camp-ico"><Icon size={22} /></span>
        {ready ? <Pill tone="up" dot>{L('可領取', 'Claimable')} {amtLabel(ready)}</Pill> : <span className="camp-reward"><Gift size={13} />{m.reward}</span>}
      </div>
      <h3>{m.title}</h3>
      <p>{m.desc}</p>
      <div className="camp-card-prog">
        <div className="row-between small"><span className="muted">{text}</span><ChevronRight size={15} className="muted" /></div>
        <Progress value={Math.min(1, prog)} thin />
      </div>
    </button>
  );
}

function AirdropFeed() {
  const s = useApp();
  const rows = s.records.filter((r) => r.kind === 'airdrop').slice(0, 8);
  const src = { drop: campMeta('drop').title, invite: campMeta('invite').title, checkin: campMeta('checkin').title, social: campMeta('social').title, quiz: campMeta('quiz').title };
  return (
    <section className="card">
      <div className="row-between">
        <h3 className="sub-h" style={{ margin: 0 }}><ArrowDownToLine size={17} />{L('空投記錄', 'Airdrops')}</h3>
        <button className="link-btn" onClick={() => go('wallet', 'records')}>{L('全部記錄', 'All records')}<ChevronRight size={14} /></button>
      </div>
      {rows.length === 0 ? <Empty text={L('還沒有空投記錄', 'No airdrops yet')} /> : (
        <div className="ad-list">
          {rows.map((r) => (
            <div key={r.id} className="ad-row">
              <CoinIcon sym={r.sym} size={30} />
              <div className="ad-row-main">
                <b>{src[r.source]}</b>
                <span className="muted small mono">{dateTime(r.ts)} · {NETWORKS[r.net]?.short} → {shortAddr(r.address)}</span>
              </div>
              <b className="mono up">+{fmt(r.amount, 0)} {r.sym}</b>
              {r.status === 'done' ? <Pill tone="up">{L('已到帳', 'Received')}</Pill> : <Pill tone="accent" dot>{L('確認中', 'Confirming')} {r.conf}/{r.need}</Pill>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------------
// Campaign detail
// ----------------------------------------------------------------------------
function CampaignPage({ id }) {
  useMarket();
  const s = useApp();
  const m = campMeta(id);
  const Icon = m.icon;
  const [drop, setDrop] = useState(null); // airdrop record being tracked
  const onClaim = (res) => {
    if (res.err) { toast(res.err, 'err'); return; }
    if (res.rid) setDrop(res.rid);
  };
  const body = {
    drop: <DropMain onClaim={onClaim} />,
    invite: <InviteMain />,
    checkin: <CheckinMain onClaim={onClaim} />,
    social: <SocialMain />,
    quiz: <QuizMain />,
  }[id];
  return (
    <div className="page">
      <button className="back" onClick={() => go('rewards')}><ArrowLeft size={16} />{L('返回活動中心', 'Rewards hub')}</button>
      <div className="camp-head" style={{ '--tone': m.tone }}>
        <span className="camp-ico big"><Icon size={30} /></span>
        <div className="camp-head-txt">
          <h1 className="display">{m.title}</h1>
          <p>{m.desc}</p>
        </div>
        <div className="camp-head-reward">
          <span>{L('活動獎勵', 'Reward')}</span>
          <b className="display">{m.reward}</b>
        </div>
      </div>
      <div className="camp-layout">
        <div className="camp-main">{body}</div>
        <aside className="camp-side">
          <ClaimCard id={id} onClaim={onClaim} />
          <RulesCard id={id} />
        </aside>
      </div>
      {drop && <AirdropModal rid={drop} onClose={() => setDrop(null)} />}
    </div>
  );
}

function doClaim(id) {
  return { drop: claimDrop, invite: claimInvite, checkin: checkIn, social: claimSocial, quiz: claimQuiz }[id]();
}

function ClaimCard({ id, onClaim }) {
  const s = useApp();
  const ready = claimables()[id];
  const m = campMeta(id);
  const last = s.records.find((r) => r.kind === 'airdrop' && r.source === id);
  const got = s.records.filter((r) => r.kind === 'airdrop' && r.source === id).reduce((a, r) => ({ ...a, [r.sym]: (a[r.sym] || 0) + r.amount }), {});
  const sym = id === 'drop' ? FREE_DROP.sym : id === 'quiz' ? 'USDT' : 'NVX';
  let hint = null;
  if (s.wallet.connected && !ready) {
    if (id === 'drop') hint = !s.camp.drop ? L('先在左側完成簽名申購', 'Sign to subscribe first') : s.camp.drop.claimed ? null : L(`申購結束後可領取，還有 ${countdown(dropTimes().end - now())}`, `Claim opens in ${countdown(dropTimes().end - now())}`);
    if (id === 'invite') hint = L('好友通過你的連結連接錢包後，這裡會出現獎勵。', 'Rewards show up here when a friend connects through your link.');
    if (id === 'checkin') hint = L(`今天已簽到，${countdown(checkinState().msToNext)} 後可再簽到`, `Checked in today. Next check-in in ${countdown(checkinState().msToNext)}`);
    if (id === 'social') hint = L('完成左側任務後即可領取。', 'Finish the tasks on the left to claim.');
    if (id === 'quiz') hint = s.camp.quiz.claimed ? null : L('全部答對後即可領取。', 'Answer everything correctly to claim.');
  }
  return (
    <div className="card claim-card" style={{ '--tone': m.tone }}>
      <div className="claim-top">
        <CoinIcon sym={sym} size={40} />
        <div>
          <div className="muted small">{ready ? L('現在可領取', 'Ready to claim') : L('活動獎勵', 'Reward')}</div>
          <div className="claim-amt mono">{ready ? amtLabel(ready) : m.reward}</div>
          {ready && <div className="muted small mono">≈ {usd(ready.reduce((a, [k, v]) => a + valueOf(k, v), 0))}</div>}
        </div>
      </div>
      {!s.wallet.connected ? <ConnectGate text={L('連接錢包參與活動', 'Connect wallet to join')} /> : (
        <>
          <Btn block size="lg" variant={ready ? 'primary' : 'ghost'} disabled={!ready} onClick={() => onClaim(doClaim(id))}>
            {id === 'checkin' ? <CalendarCheck size={17} /> : <Gift size={17} />}
            {ready ? (id === 'checkin' ? L(`簽到並領取 ${amtLabel(ready)}`, `Check in & claim ${amtLabel(ready)}`) : L(`領取 ${amtLabel(ready)}`, `Claim ${amtLabel(ready)}`)) : L('暫無可領取', 'Nothing to claim')}
          </Btn>
          {hint && <p className="fine">{hint}</p>}
        </>
      )}
      <div className="claim-dest">
        <ArrowDownToLine size={15} />
        <div>
          <div className="small">{L('空投到你的交易所地址', 'Airdropped to your exchange address')}</div>
          <div className="mono muted small">{s.wallet.connected ? `${NETWORKS[airdropNet(sym)].short} · ${shortAddr(airdropAddress(sym))}` : '--'}</div>
        </div>
      </div>
      {last && (
        <div className="claim-last">
          <span className="muted small">{L('最近一次空投', 'Latest airdrop')}</span>
          <span className="row-gap"><b className="mono up">+{fmt(last.amount, 0)} {last.sym}</b>{last.status === 'done' ? <Pill tone="up">{L('已到帳', 'Received')}</Pill> : <Pill tone="accent" dot>{last.conf}/{last.need}</Pill>}</span>
        </div>
      )}
      {Object.keys(got).length > 0 && <KV k={L('本活動累計領取', 'Claimed in this campaign')} v={Object.entries(got).map(([k, v]) => `${fmt(v, 0)} ${k}`).join(' · ')} />}
    </div>
  );
}

function RulesCard({ id }) {
  const rules = {
    drop: [
      L(`每個錢包可免費申購 ${FREE_DROP.perUser} ${FREE_DROP.sym}，無需支付任何費用。`, `Each wallet can subscribe to ${FREE_DROP.perUser} ${FREE_DROP.sym} for free.`),
      L('申購需要用已連接的錢包簽名一次，簽名不發起交易，不消耗 Gas。', 'Subscribing takes one signature from your connected wallet. It sends no transaction and costs no gas.'),
      L(`名額共 ${fmt(FREE_DROP.slots, 0)} 個，先到先得。`, `${fmt(FREE_DROP.slots, 0)} spots, first come first served.`),
      L('申購結束後點擊領取，代幣會空投到你在 Novarix 的交易所地址。', 'After the window closes, claim and the tokens are airdropped to your Novarix exchange address.'),
    ],
    invite: [
      L(`好友通過你的連結註冊並連接錢包，你獲得 ${INVITE_REWARD} NVX，好友獲得 ${INVITEE_REWARD} NVX。`, `When a friend signs up through your link and connects a wallet, you get ${INVITE_REWARD} NVX and they get ${INVITEE_REWARD} NVX.`),
      L(`邀請滿 ${INVITE_MILESTONES.map((x) => x[0]).join(' / ')} 人可額外獲得 ${INVITE_MILESTONES.map((x) => x[1]).join(' / ')} NVX。`, `Bonus ${INVITE_MILESTONES.map((x) => x[1]).join(' / ')} NVX at ${INVITE_MILESTONES.map((x) => x[0]).join(' / ')} friends.`),
      L('同一裝置或同一錢包重複註冊不計入邀請。', 'Repeat sign-ups from the same device or wallet do not count.'),
    ],
    checkin: [
      L(`每天可簽到一次，第 1–7 天分別獲得 ${CHECKIN_REWARDS.join(' / ')} NVX。`, `Check in once a day. Days 1–7 pay ${CHECKIN_REWARDS.join(' / ')} NVX.`),
      L('中斷一天後，連續天數從第 1 天重新計算。', 'Miss a day and the streak restarts from day 1.'),
      L('完成第 7 天後，下一輪從第 1 天開始。', 'After day 7 a new week starts from day 1.'),
    ],
    social: [
      L('點擊「前往」打開官方帳號並完成關注，系統會在幾秒內自動驗證。', 'Tap "Go" to open the official account and follow. Verification takes a few seconds.'),
      L(`完成全部 ${SOCIAL_TASKS.length} 個任務額外獎勵 ${SOCIAL_BONUS} NVX。`, `Finish all ${SOCIAL_TASKS.length} tasks for a ${SOCIAL_BONUS} NVX bonus.`),
      L('取消關注後，平台有權收回已發放的獎勵。', 'Unfollowing may void rewards already paid.'),
    ],
    quiz: [
      L(`共 ${QUIZ.length} 道題，全部答對才能領取 ${QUIZ_REWARD} USDT。`, `${QUIZ.length} questions. Answer all correctly to claim ${QUIZ_REWARD} USDT.`),
      L('答錯可以無限次重答。', 'You can retry as many times as you like.'),
      L('每個帳戶限領一次。', 'One reward per account.'),
    ],
  }[id];
  return (
    <div className="card">
      <h3 className="sub-h"><Info size={16} />{L('活動規則', 'Rules')}</h3>
      <ol className="camp-rules">{rules.map((r, i) => <li key={i}>{r}</li>)}</ol>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Free launch
// ----------------------------------------------------------------------------
function DropMain({ onClaim }) {
  const s = useApp();
  const [prompt, setPrompt] = useState(false);
  const ph = dropPhase();
  const { start, end } = dropTimes();
  const taken = dropTaken();
  const d = s.camp.drop;
  const t = now();
  const step = !s.wallet.connected ? 0 : !d ? 1 : 2;
  const nonce = useMemo(() => randHex(16), []);
  return (
    <>
      <div className="drop-hero" style={{ '--b1': FREE_DROP.colors[0], '--b2': FREE_DROP.colors[1], '--b3': FREE_DROP.colors[2] }}>
        <div className="banner-grid" />
        <div className="banner-glow" />
        <div className="drop-hero-in">
          <ProjLogo p={FREE_DROP} size={72} ring />
          <div>
            <div className="row-gap"><span className="free-badge">{L('免費', 'FREE')}</span><span className="tag glass">{FREE_DROP.chain}</span></div>
            <h2 className="display">{FREE_DROP.name} <span>{FREE_DROP.sym}</span></h2>
            <p>{L(...FREE_DROP.tagline)}</p>
          </div>
        </div>
        <div className="drop-stats">
          <div><span>{L('每個錢包可得', 'Per wallet')}</span><b className="mono">{FREE_DROP.perUser} {FREE_DROP.sym}</b></div>
          <div><span>{L('需支付', 'You pay')}</span><b className="mono">0 USDC</b></div>
          <div><span>{L('總名額', 'Spots')}</span><b className="mono">{fmt(FREE_DROP.slots, 0)}</b></div>
          <div><span>{ph === 'upcoming' ? L('距開始', 'Starts in') : ph === 'live' ? L('距結束', 'Ends in') : L('狀態', 'Status')}</span><b className="mono">{ph === 'upcoming' ? countdown(start - t) : ph === 'live' ? countdown(end - t) : L('已結束', 'Closed')}</b></div>
        </div>
        <div className="drop-prog">
          <div className="row-between small"><span>{L('已申購', 'Subscribed')}</span><b className="mono">{fmt(taken, 0)} / {fmt(FREE_DROP.slots, 0)} · {(taken / FREE_DROP.slots * 100).toFixed(1)}%</b></div>
          <Progress value={taken / FREE_DROP.slots} glow={ph === 'live'} />
        </div>
      </div>

      <div className="card">
        <h3 className="sub-h"><Sparkles size={16} />{L('三步完成申購', 'Three steps')}</h3>
        <div className="drop-steps">
          <Step n={1} done={step > 0} cur={step === 0} title={L('連接錢包', 'Connect wallet')} sub={s.wallet.connected ? <span className="mono">{shortAddr(s.wallet.address)}</span> : L('支援 MetaMask、OKX 等插件錢包', 'MetaMask, OKX and other extension wallets')}>
            {step === 0 && <Btn size="sm" onClick={() => openModal('connect')}><Wallet size={15} />{L('連接錢包', 'Connect')}</Btn>}
          </Step>
          <Step n={2} done={step > 1} cur={step === 1} title={L('錢包簽名申購', 'Sign to subscribe')} sub={d ? <span className="mono">{L('簽名', 'Signature')} {d.sig.slice(0, 10)}…{d.sig.slice(-6)} · {dateTime(d.ts)}</span> : L('喚起錢包確認簽名，不消耗 Gas', 'Confirm in your wallet. No gas.')}>
            {step === 1 && <Btn size="sm" disabled={ph !== 'live'} onClick={() => setPrompt(true)}><PenLine size={15} />{ph === 'live' ? L('簽名申購', 'Sign') : L('未開放', 'Closed')}</Btn>}
          </Step>
          <Step n={3} done={d?.claimed} cur={step === 2 && !d?.claimed} title={L('領取並空投到帳', 'Claim the airdrop')} sub={d?.claimed ? L('已空投到你的交易所地址', 'Airdropped to your exchange address') : ph === 'ended' ? L('申購已結束，現在可以領取', 'The window has closed. Claim now.') : L(`申購結束後開放領取 · ${dateTime(end)}`, `Opens when the window closes · ${dateTime(end)}`)}>
            {step === 2 && !d.claimed && ph === 'ended' && <Btn size="sm" onClick={() => onClaim(claimDrop())}><Gift size={15} />{L('領取', 'Claim')} {FREE_DROP.perUser} {FREE_DROP.sym}</Btn>}
          </Step>
        </div>
        {d && !d.claimed && ph === 'live' && (
          <button className="demo-link" onClick={() => { fastForward(end - now() + 60e3); toast(L('時間已快進', 'Clock moved forward'), 'ok', L('申購已結束，可以領取了', 'The window has closed. Claim is open.')); }}>
            <FlaskConical size={14} />{L('演示：快進到申購結束', 'Demo: skip to the end of the window')}<FastForward size={14} />
          </button>
        )}
      </div>

      <div className="card prose">
        <h3>{L('項目介紹', 'About the project')}</h3>
        {FREE_DROP.about.map((x, i) => <p key={i}>{L(...x)}</p>)}
        <div className="kd-grid">
          {FREE_DROP.facts.map(([k, v], i) => <div key={i}><span>{L(...k)}</span><b className="mono">{v}</b></div>)}
          <div><span>{L('總供應量', 'Total supply')}</span><b className="mono">{compact(FREE_DROP.totalSupply, 1)}</b></div>
          <div><span>{L('本次發放', 'This drop')}</span><b className="mono">{FREE_DROP.dropPct}%</b></div>
        </div>
      </div>

      {prompt && (
        <WalletPrompt
          onClose={() => setPrompt(false)}
          onSigned={(sig) => {
            const r = signDrop(sig);
            if (r.err) toast(r.err, 'err');
            else toast(L('申購成功', 'Subscribed'), 'ok', L(`已鎖定 ${FREE_DROP.perUser} ${FREE_DROP.sym}，申購結束後可領取`, `${FREE_DROP.perUser} ${FREE_DROP.sym} reserved. Claim when the window closes.`));
          }}
          fields={[
            ['Primary type', 'FreeSubscription'],
            ['Project', `${FREE_DROP.name} (${FREE_DROP.sym})`],
            ['Amount', `${FREE_DROP.perUser} ${FREE_DROP.sym}`],
            ['Payment', '0 USDC'],
            ['Wallet', s.wallet.address],
            ['Chain ID', '8453 (Base)'],
            ['Nonce', nonce],
            ['Deadline', new Date(end).toISOString()],
          ]}
        />
      )}
    </>
  );
}

function Step({ n, done, cur, title, sub, children }) {
  return (
    <div className={cx('step', done && 'done', cur && 'cur')}>
      <i>{done ? <Check size={15} /> : n}</i>
      <div className="step-txt"><b>{title}</b><span className="muted small">{sub}</span></div>
      {children && <div className="step-act">{children}</div>}
    </div>
  );
}

// A browser-wallet style signature request
function WalletPrompt({ fields, onSigned, onClose }) {
  const s = useApp();
  const w = WALLETS.find((x) => x.id === s.wallet.provider) || WALLETS[0];
  const [stage, setStage] = useState('opening');
  useEffect(() => {
    const t = setTimeout(() => setStage('review'), 900);
    return () => clearTimeout(t);
  }, []);
  const sign = () => {
    setStage('signing');
    setTimeout(() => { onSigned('0x' + randHex(130)); onClose(); }, 1100);
  };
  const reject = () => { toast(L('你已拒絕簽名', 'Signature rejected'), 'warn'); onClose(); };
  return (
    <Portal>
      <div className="wp-veil" onClick={stage === 'review' ? reject : undefined} />
      <div className="wp" role="dialog" aria-label={w.name}>
        <div className="wp-bar">
          <WalletGlyph w={w} size={22} />
          <b>{w.name}</b>
          <span className="wp-chain"><i style={{ background: '#0052FF' }} />Base</span>
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
// Invite
// ----------------------------------------------------------------------------
function InviteMain() {
  const s = useApp();
  const [poster, setPoster] = useState(false);
  const c = s.camp;
  const n = c.invites.length;
  const code = inviteCode();
  const link = `https://${BRAND.toLowerCase()}.app/r/${code}`;
  const earned = c.inviteClaimed * INVITE_REWARD + INVITE_MILESTONES.filter(([k]) => c.msClaimed.includes(k)).reduce((a, [, r]) => a + r, 0);
  const deposited = c.invites.filter((x) => x.deposited).length;
  const last = INVITE_MILESTONES[INVITE_MILESTONES.length - 1][0];
  const share = (where) => toast(L(`已打開 ${where} 分享（演示）`, `Opened ${where} share (demo)`), 'ok', link);
  if (!s.wallet.connected) {
    return <div className="card"><Empty icon={<UserPlus size={22} />} text={L('連接錢包後生成你的專屬邀請連結', 'Connect a wallet to get your invite link')}><ConnectGate /></Empty></div>;
  }
  return (
    <>
      <div className="card invite-card">
        <div className="invite-code">
          <span className="muted small">{L('我的邀請碼', 'My invite code')}</span>
          <div className="row-gap"><b className="display mono">{code}</b><CopyBtn text={code} /></div>
        </div>
        <div className="invite-link">
          <span className="muted small">{L('邀請連結', 'Invite link')}</span>
          <div className="invite-link-box"><span className="mono">{link}</span><CopyBtn text={link} label={L('複製', 'Copy')} /></div>
        </div>
        <div className="invite-share">
          <Btn variant="ghost" size="sm" onClick={() => share('X')}><img className="share-logo" src={SOCIAL_LOGOS.x} alt="" width={14} height={14} />X</Btn>
          <Btn variant="ghost" size="sm" onClick={() => share('Telegram')}><img className="share-logo tg" src={SOCIAL_LOGOS.telegram} alt="" width={14} height={14} />Telegram</Btn>
          <Btn variant="soft" size="sm" onClick={() => setPoster(true)}><QrCode size={15} />{L('生成海報', 'Poster')}</Btn>
        </div>
      </div>

      <div className="mini-stats">
        <div><span>{L('已邀請', 'Invited')}</span><b className="mono">{n}</b></div>
        <div><span>{L('已入金好友', 'Funded friends')}</span><b className="mono">{deposited}</b></div>
        <div><span>{L('累計獲得', 'Earned')}</span><b className="mono">{fmt(earned, 0)} NVX</b></div>
        <div><span>{L('待領取', 'To claim')}</span><b className="mono accent-text">{fmt(inviteClaimable().amt, 0)} NVX</b></div>
      </div>

      <div className="card">
        <h3 className="sub-h"><Trophy size={16} />{L('邀請里程碑', 'Milestones')}</h3>
        <div className="ms-track">
          <Progress value={Math.min(1, n / last)} />
          <div className="ms-points">
            {INVITE_MILESTONES.map(([k, r]) => (
              <div key={k} className={cx('ms-pt', n >= k && 'on')} style={{ left: `${(k / last) * 100}%` }}>
                <i>{n >= k ? <Check size={12} /> : k}</i>
                <span className="mono">+{r} NVX</span>
                <small>{L(`${k} 人`, `${k} friends`)}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row-between">
          <h3 className="sub-h" style={{ margin: 0 }}><Users size={16} />{L('我邀請的好友', 'My friends')}</h3>
          <button className="demo-link" onClick={() => { simulateInvite(); toast(L('一位好友通過你的連結註冊了', 'A friend signed up with your link'), 'ok', L(`你獲得 ${INVITE_REWARD} NVX 待領取`, `${INVITE_REWARD} NVX added to claim`)); }}>
            <FlaskConical size={14} />{L('演示：模擬好友註冊', 'Demo: simulate a sign-up')}
          </button>
        </div>
        {n === 0 ? <Empty text={L('還沒有好友加入，分享你的連結吧', 'No friends yet. Share your link.')} /> : (
          <div className="table-wrap">
            <table className="tbl stack">
              <thead><tr><th>{L('好友地址', 'Friend')}</th><th>{L('註冊時間', 'Joined')}</th><th>{L('狀態', 'Status')}</th><th>{L('你的獎勵', 'Your reward')}</th></tr></thead>
              <tbody>
                {c.invites.map((x) => (
                  <tr key={x.id}>
                    <td className="mono">{shortAddr(x.addr)}</td>
                    <td className="mono muted">{dateTime(x.ts)}</td>
                    <td>{x.deposited ? <Pill tone="up">{L('已入金', 'Funded')}</Pill> : <Pill tone="accent">{L('已連接錢包', 'Connected')}</Pill>}</td>
                    <td className="mono up">+{INVITE_REWARD} NVX</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {poster && <PosterModal code={code} link={link} onClose={() => setPoster(false)} />}
    </>
  );
}

function PosterModal({ code, link, onClose }) {
  return (
    <Modal title={L('邀請海報', 'Invite poster')} onClose={onClose} width={400} icon={<QrCode size={18} />}>
      <div className="poster">
        <div className="poster-top"><BrandMark size={34} /><b className="display">Nova<span>rix</span></b></div>
        <h3 className="display">{L(`註冊即領 ${INVITEE_REWARD} NVX`, `Sign up, get ${INVITEE_REWARD} NVX`)}</h3>
        <p>{L('連接錢包即可領取，還有免費申購、每日簽到等活動。', 'Connect a wallet to claim, plus free launches, daily check-ins and more.')}</p>
        <div className="poster-qr"><QR text={link} size={150} /></div>
        <div className="poster-code"><span>{L('邀請碼', 'Invite code')}</span><b className="mono">{code}</b></div>
      </div>
      <div className="btn-row" style={{ marginTop: 14 }}>
        <Btn variant="ghost" onClick={onClose}>{L('關閉', 'Close')}</Btn>
        <Btn onClick={() => { toast(L('海報已保存到相冊（演示）', 'Poster saved (demo)')); onClose(); }}><ArrowDownToLine size={16} />{L('保存海報', 'Save poster')}</Btn>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Check-in
// ----------------------------------------------------------------------------
function CheckinMain({ onClaim }) {
  const s = useApp();
  const st = checkinState();
  return (
    <>
      <div className="card">
        <div className="row-between">
          <h3 className="sub-h" style={{ margin: 0 }}><CalendarCheck size={16} />{L('本週簽到', 'This week')}</h3>
          <span className="muted small">{L(`連續 ${st.streak} 天`, `${st.streak}-day streak`)}</span>
        </div>
        <div className="ck-grid">
          {CHECKIN_REWARDS.map((r, i) => {
            const done = i < st.filled;
            const today = !st.doneToday && i === st.filled;
            return (
              <div key={i} className={cx('ck-day', done && 'done', today && 'today', i === 6 && 'big')}>
                <span className="ck-label">{L(`第 ${i + 1} 天`, `Day ${i + 1}`)}</span>
                <span className="ck-ico">{done ? <CheckCircle2 size={22} /> : i === 6 ? <Gift size={24} /> : <CoinIcon sym="NVX" size={24} />}</span>
                <b className="mono">+{r}</b>
              </div>
            );
          })}
        </div>
        {s.wallet.connected ? (
          st.doneToday ? (
            <div className="ck-done"><CheckCircle2 size={18} />{L(`今日已簽到 · 明天可得 ${st.nextReward} NVX`, `Checked in today · ${st.nextReward} NVX tomorrow`)}<span className="mono muted">{countdown(st.msToNext)}</span></div>
          ) : (
            <Btn block size="lg" onClick={() => onClaim(checkIn())}><CalendarCheck size={17} />{L(`立即簽到 +${CHECKIN_REWARDS[st.filled]} NVX`, `Check in +${CHECKIN_REWARDS[st.filled]} NVX`)}</Btn>
          )
        ) : <ConnectGate text={L('連接錢包後簽到', 'Connect wallet to check in')} />}
        {s.wallet.connected && st.doneToday && (
          <button className="demo-link" onClick={() => { fastForward(st.msToNext + 60e3); toast(L('時間已快進', 'Clock moved forward'), 'ok', L('已進入第二天', 'It is now the next day')); }}>
            <FlaskConical size={14} />{L('演示：快進到明天', 'Demo: skip to tomorrow')}<FastForward size={14} />
          </button>
        )}
      </div>
      <div className="mini-stats three">
        <div><span>{L('連續簽到', 'Streak')}</span><b className="mono">{st.streak} {L('天', 'days')}</b></div>
        <div><span>{L('累計簽到', 'Check-ins')}</span><b className="mono">{st.count} {L('次', 'times')}</b></div>
        <div><span>{L('累計獲得', 'Earned')}</span><b className="mono">{fmt(st.total, 0)} NVX</b></div>
      </div>
    </>
  );
}

// ----------------------------------------------------------------------------
// Social tasks
// ----------------------------------------------------------------------------
const SOCIAL_LOGO = { x: 'x', tg: 'telegram', dc: 'discord', rt: 'x', yt: 'youtube' };
const SOCIAL_BG = { x: '#000000', tg: '#26A5E4', dc: '#5865F2', rt: '#000000', yt: '#FF0000' };

function SocialMain() {
  const s = useApp();
  const done = SOCIAL_TASKS.filter((x) => socialStatus(x.id) !== 'todo' && socialStatus(x.id) !== 'verifying').length;
  const go1 = (x) => {
    const r = startSocial(x.id);
    if (r.err) { toast(r.err, 'err'); return; }
    toast(L(`已在新視窗打開 ${x.handle}（演示）`, `Opened ${x.handle} in a new window (demo)`), 'ok', L('正在驗證關注狀態…', 'Checking that you followed…'));
  };
  return (
    <>
      <div className="card">
        <h3 className="sub-h"><Megaphone size={16} />{L('社媒任務', 'Social tasks')}</h3>
        <div className="soc-list">
          {SOCIAL_TASKS.map((x) => {

            const st = socialStatus(x.id);
            return (
              <div key={x.id} className={cx('soc-row', st)}>
                <span className="soc-ico real" style={{ background: SOCIAL_BG[x.icon] }}><img src={SOCIAL_LOGOS[SOCIAL_LOGO[x.icon]]} alt="" width={20} height={20} />{x.icon === 'rt' && <i className="soc-badge"><Repeat2 size={11} /></i>}</span>
                <div className="soc-txt"><b>{L(...x.name)}</b><span className="mono muted small">{x.handle}</span></div>
                <span className="soc-reward mono">+{x.reward} NVX</span>
                <div className="soc-act">
                  {st === 'todo' && <Btn size="sm" variant="soft" disabled={!s.wallet.connected} onClick={() => go1(x)}>{L('前往', 'Go')}<ArrowUpRight size={14} /></Btn>}
                  {st === 'verifying' && <span className="soc-state"><Loader2 size={15} className="spin" />{L('驗證中', 'Verifying')}</span>}
                  {st === 'done' && <span className="soc-state up"><CheckCircle2 size={15} />{L('已完成', 'Done')}</span>}
                  {st === 'claimed' && <span className="soc-state muted"><Check size={15} />{L('已領取', 'Claimed')}</span>}
                </div>
              </div>
            );
          })}
        </div>
        {!s.wallet.connected && <div style={{ marginTop: 14 }}><ConnectGate text={L('連接錢包後開始任務', 'Connect wallet to start')} /></div>}
      </div>
      <div className={cx('card soc-bonus', socialAllDone() && 'on')}>
        <span className="soc-bonus-ico">{s.camp.socialBonus ? <PartyPopper size={22} /> : socialAllDone() ? <Gift size={22} /> : <Lock size={20} />}</span>
        <div className="soc-bonus-txt">
          <b>{L(`全部完成額外獎勵 ${SOCIAL_BONUS} NVX`, `${SOCIAL_BONUS} NVX bonus for finishing all`)}</b>
          <Progress value={done / SOCIAL_TASKS.length} thin />
        </div>
        <b className="mono">{done}/{SOCIAL_TASKS.length}</b>
      </div>
    </>
  );
}

// ----------------------------------------------------------------------------
// Quiz
// ----------------------------------------------------------------------------
function QuizMain() {
  const s = useApp();
  const q = s.camp.quiz;
  const [ans, setAns] = useState(() => (q.passed ? QUIZ.map((x) => x.a) : Array(QUIZ.length).fill(null)));
  const [result, setResult] = useState(null); // indexes answered wrong after a submit
  const all = ans.every((x) => x !== null);
  const submit = () => {
    const n = submitQuiz(ans);
    const wrong = QUIZ.map((x, i) => (ans[i] === x.a ? null : i)).filter((x) => x !== null);
    setResult(wrong);
    if (n === QUIZ.length) toast(L('全部答對！', 'All correct!'), 'ok', L(`可以領取 ${QUIZ_REWARD} USDT 了`, `You can now claim ${QUIZ_REWARD} USDT`));
    else toast(L(`答對 ${n}/${QUIZ.length} 題`, `${n}/${QUIZ.length} correct`), 'warn', L('答錯的題目已標出，修改後再提交', 'Wrong answers are marked. Fix them and submit again.'));
  };
  return (
    <div className="card">
      <div className="row-between">
        <h3 className="sub-h" style={{ margin: 0 }}><GraduationCap size={16} />{L('平台知識測驗', 'Platform quiz')}</h3>
        {q.passed ? <Pill tone="up">{L('已通過', 'Passed')}</Pill> : <span className="muted small">{L(`已作答 ${ans.filter((x) => x !== null).length}/${QUIZ.length}`, `${ans.filter((x) => x !== null).length}/${QUIZ.length} answered`)}</span>}
      </div>
      <div className="quiz">
        {QUIZ.map((x, i) => {
          const wrong = result?.includes(i);
          return (
            <div key={i} className={cx('quiz-q', wrong && 'wrong', q.passed && 'ok')}>
              <b><span className="mono">{i + 1}.</span> {L(...x.q)}</b>
              <div className="quiz-opts">
                {x.opts.map((o, j) => (
                  <button key={j} disabled={q.passed} className={cx('quiz-opt', ans[i] === j && 'on')} onClick={() => { setAns(ans.map((v, k) => (k === i ? j : v))); setResult(result?.filter((k) => k !== i) || null); }}>
                    <i>{String.fromCharCode(65 + j)}</i>{L(...o)}
                  </button>
                ))}
              </div>
              {wrong && <span className="quiz-wrong"><XCircle size={14} />{L('答案不正確，再想想', 'Not quite. Try again.')}</span>}
            </div>
          );
        })}
      </div>
      {!q.passed && (s.wallet.connected
        ? <Btn block size="lg" disabled={!all} onClick={submit}>{all ? L('提交答案', 'Submit answers') : L('請回答全部題目', 'Answer every question')}</Btn>
        : <ConnectGate text={L('連接錢包後作答', 'Connect wallet to answer')} />)}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Airdrop in progress: reward pool → the user's exchange address → spot account
// ----------------------------------------------------------------------------
function AirdropModal({ rid, onClose }) {
  const s = useApp();
  const r = s.records.find((x) => x.id === rid);
  if (!r) return null;
  const done = r.status === 'done';
  return (
    <Modal title={done ? L('空投已到帳', 'Airdrop received') : L('正在空投', 'Airdropping')} onClose={onClose} width={440} icon={<Gift size={18} />}>
      <div className="ad-flow">
        <div className="ad-node"><BrandMark size={44} /><span>{L('獎勵池', 'Reward pool')}</span></div>
        <div className={cx('ad-line', done && 'done')}><span className="ad-coin"><CoinIcon sym={r.sym} size={26} /></span></div>
        <div className="ad-node"><span className="orb big" style={orbStyle(s.wallet.address)} /><span>{L('你的交易所地址', 'Your exchange address')}</span></div>
      </div>
      <div className="ad-amt mono">+{fmt(r.amount, 0)} {r.sym}</div>
      <div className="ad-sub muted small mono">{NETWORKS[r.net].short} · {shortAddr(r.address)}</div>
      <Progress value={r.conf} max={r.need} glow={!done} tone={done ? 'up' : undefined} />
      <div className="ad-steps">
        <span className="on"><Check size={13} />{L('獎勵已發出', 'Sent')}</span>
        <span className={cx(r.conf > 0 && 'on')}>{r.conf > 0 ? <Check size={13} /> : <Clock size={13} />}{L('區塊確認', 'Confirmations')} {r.conf}/{r.need}</span>
        <span className={cx(done && 'on')}>{done ? <Check size={13} /> : <Clock size={13} />}{L('存入現貨帳戶', 'In spot account')}</span>
      </div>
      <div className="ad-tx muted small">Tx <span className="mono">{shortAddr(r.txid)}</span></div>
      <div className="btn-row" style={{ marginTop: 16 }}>
        <Btn variant="ghost" onClick={() => { onClose(); go('wallet'); }}>{L('查看資產', 'View assets')}</Btn>
        <Btn onClick={onClose}>{done ? L('完成', 'Done') : L('後台處理', 'Run in background')}</Btn>
      </div>
    </Modal>
  );
}
