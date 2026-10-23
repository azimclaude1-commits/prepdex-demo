import { useMemo, useState, useRef } from 'react';
import {
  ArrowLeft, Clock, Users, Flame, Bell, BellRing, Globe2, Send, FileText, AtSign, ShieldCheck, ChevronRight, Trophy,
  Layers, Sparkles, TrendingUp, Gift, CheckCircle2, Info, Repeat, ArrowDownToLine, ChevronDown, Lock, Coins, Target, Calendar, Receipt,
} from 'lucide-react';
import { PROJECTS, PROJECT, TIERS, COIN } from '../core/data.js';
import { L } from '../core/lang.js';
import {
  useApp, go, openModal, toast, phase, raised, participants, projTimes, maxAlloc, userSubTotal, subscribeSale, tier,
  toggleReminder, vestUnlocked, claimVested, now, bal,
} from '../core/store.js';
import { useMarket, price, change24, getCandles } from '../core/market.js';
import { fmt, usd, compact, countdown, dateTime, dateOnly, pct, floorTo } from '../core/fmt.js';
import { Btn, Tabs, NumInput, Progress, Pill, ProjLogo, BrandMark, Donut, Spark, KV, cx, Empty, CoinIcon, Modal } from '../ui/kit.jsx';
import { ConnectGate } from '../layout/Shell.jsx';

const DAY = 86400e3;

// ----------------------------------------------------------------------------
// Banner art: layered gradient + grid + oversized glyph, generated per project
// ----------------------------------------------------------------------------
function Banner({ p, big, children }) {
  const [a, b, c] = p.colors;
  return (
    <div className={cx('banner', big && 'banner-big')} style={{ '--b1': a, '--b2': b, '--b3': c }}>
      <div className="banner-grid" />
      <div className="banner-glow" />
      <div className="banner-mark"><ProjLogo p={p} size={big ? 260 : 150} /></div>
      <div className="banner-word">{p.name}</div>
      {children}
    </div>
  );
}

function StatusChip({ p }) {
  const ph = phase(p);
  const { start, end } = projTimes(p);
  const t = now();
  if (ph === 'live') return <span className="status-chip live"><i />{L('进行中', 'Live')} · {L('距结束', 'ends in')} <b className="mono">{countdown(end - t)}</b></span>;
  if (ph === 'upcoming') return <span className="status-chip soon"><Clock size={12} />{L('距开始', 'starts in')} <b className="mono">{countdown(start - t)}</b></span>;
  return <span className="status-chip done">{L('已完成', 'Completed')}</span>;
}

function athRoi(p) {
  const cur = COIN[p.sym] ? price(p.sym) : p.price;
  return cur / p.price;
}

function ProjectCard({ p }) {
  const ref = useRef(null);
  const ph = phase(p);
  const r = raised(p);
  const ratio = r / p.hardCap;
  const listed = !!COIN[p.sym];
  const spark = useMemo(() => (listed ? getCandles(p.sym, '4h').slice(-60).map((x) => x.close) : null), [p.sym, listed]);
  const onMove = (e) => {
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
    el.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
  };
  return (
    <button ref={ref} className={cx('pcard', ph)} onClick={() => go('project', p.id)} onMouseMove={onMove}>
      <Banner p={p}><StatusChip p={p} /></Banner>
      <div className="pcard-body">
        <div className="pcard-id">
          <ProjLogo p={p} size={46} ring />
          <div>
            <div className="pcard-name">{p.sym}<span>{p.name}</span></div>
            <div className="pcard-price mono">1 {p.sym} = {p.price} USDC</div>
          </div>
          {ph === 'ended' && listed && (
            <div className="pcard-roi">
              <span className="muted small">{L('较认购价', 'vs. sale')}</span>
              <b className={cx('mono', athRoi(p) >= 1 ? 'up' : 'down')}>{fmt(athRoi(p), 2)}x</b>
            </div>
          )}
        </div>
        <p className="pcard-tag">{L(...p.tagline)}</p>
        <div className="pcard-tags">{p.tags.map((t, i) => <span key={i} className="tag">{L(...t)}</span>)}</div>
        {ph === 'upcoming' ? (
          <div className="pcard-stats">
            <KV k={L('硬顶', 'Hard cap')} v={`${compact(p.hardCap)} USDC`} />
            <KV k={L('开始时间', 'Starts')} v={dateTime(projTimes(p).start)} />
          </div>
        ) : (
          <>
            <div className="pcard-prog">
              <div className="row-between small"><span className="muted">{L('募集进度', 'Raised')}</span><b className={cx('mono', ratio > 1 && 'accent-text')}>{(ratio * 100).toFixed(1)}%</b></div>
              <Progress value={Math.min(ratio, 1)} tone={ratio >= 1 ? 'up' : 'accent'} glow={ph === 'live'} />
            </div>
            <div className="pcard-stats">
              <KV k={L('已募集', 'Raised')} v={`${compact(r)} / ${compact(p.hardCap)}`} />
              <KV k={L('参与人数', 'Participants')} v={fmt(participants(p), 0)} />
            </div>
          </>
        )}
        {spark && <div className="pcard-spark"><Spark values={spark} w={280} h={34} color={change24(p.sym) >= 0 ? 'var(--up)' : 'var(--down)'} /></div>}
      </div>
    </button>
  );
}

function HeroOrbit() {
  const live = PROJECTS.slice(0, 8);
  return (
    <div className="orbit" aria-hidden="true">
      <div className="orbit-core"><BrandMark size={84} /></div>
      {[0, 1, 2].map((ring) => (
        <div key={ring} className={`orbit-ring r${ring}`}>
          {live.filter((_, i) => i % 3 === ring).map((p, i, arr) => (
            <div key={p.id} className="orbit-node" style={{ '--a': (360 / arr.length) * i + ring * 40 + 'deg' }}>
              <div className="orbit-node-in"><ProjLogo p={p} size={ring === 0 ? 44 : ring === 1 ? 52 : 40} /></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TierCard() {
  const s = useApp();
  const t = tier();
  const next = t.next;
  const prog = next ? (t.staked - t.min) / (next.min - t.min) : 1;
  return (
    <div className="tier-card" style={{ '--tier': t.color }}>
      <div className="tier-top">
        <div className="tier-badge"><Trophy size={18} /></div>
        <div>
          <div className="muted small">{L('我的认购等级', 'My launchpad tier')}</div>
          <div className="tier-name">{L(...t.name)} <span className="mono">×{t.mult}</span></div>
        </div>
        <Btn variant="soft" size="sm" onClick={() => go('staking')}>{L('质押 PDX 升级', 'Stake PDX')}<ChevronRight size={14} /></Btn>
      </div>
      <div className="tier-ladder">
        {TIERS.slice(1).map((x) => (
          <div key={x.id} className={cx('tier-step', t.staked >= x.min && 'on')} style={{ '--c': x.color }}>
            <i /><span>{L(...x.name)}</span><small className="mono">{compact(x.min, 0)}</small>
          </div>
        ))}
      </div>
      <Progress value={prog} thin />
      <div className="row-between small muted">
        <span>{L('已质押', 'Staked')} <b className="mono">{fmt(t.staked, 0)} PDX</b></span>
        <span>{next ? L(`距 ${next.name[0]} 还差 ${fmt(next.min - t.staked, 0)} PDX`, `${fmt(next.min - t.staked, 0)} PDX to ${next.name[1]}`) : L('已达最高等级', 'Top tier')}</span>
      </div>
      {!s.wallet.connected && <p className="fine">{L('连接钱包后显示你的等级与认购上限。', 'Connect to see your tier and caps.')}</p>}
    </div>
  );
}

export function Launchpad() {
  useMarket();
  const s = useApp();
  const [mine, setMine] = useState(false);
  const groups = { live: [], upcoming: [], ended: [] };
  for (const p of PROJECTS) groups[phase(p)].push(p);
  const totalRaised = PROJECTS.filter((p) => phase(p) !== 'upcoming').reduce((a, p) => a + Math.min(raised(p), p.hardCap), 0) + 46.8e6;
  const ended = PROJECTS.filter((p) => p.status === 'ended');
  const avgRoi = ended.reduce((a, p) => a + athRoi(p), 0) / ended.length;
  const people = PROJECTS.reduce((a, p) => a + participants(p), 0) + 182000;
  return (
    <div className="page">
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <div className="eyebrow"><Sparkles size={14} />PrepDEX Launchpad</div>
          <h1 className="display hero-title">{L('抢先认购', 'Get in early on')}<br /><span className="grad-text">{L('下一代链上资产', 'the next on-chain assets')}</span></h1>
          <p className="hero-sub">{L('经过尽调的早期项目，统一以 USDC 认购。超募按比例分配并自动退款，TGE 后直接在现货交易。', 'Vetted early-stage projects, subscribed in USDC. Oversubscribed sales allocate pro rata with automatic refunds, and tokens trade on spot right after TGE.')}</p>
          <div className="hero-cta">
            <Btn size="lg" onClick={() => document.getElementById('lp-live')?.scrollIntoView({ behavior: 'smooth' })}><Flame size={17} />{L('查看进行中项目', 'See live sales')}</Btn>
            <Btn size="lg" variant="ghost" onClick={() => setMine(true)}><Receipt size={17} />{L('我的认购', 'My subscriptions')}{s.subs.length > 0 && <span className="tab-badge">{s.subs.length}</span>}</Btn>
          </div>
          <div className="hero-stats">
            <div><b className="mono">${compact(totalRaised, 1)}</b><span>{L('累计募资', 'Total raised')}</span></div>
            <div><b className="mono">{PROJECTS.length + 41}</b><span>{L('已上线项目', 'Projects launched')}</span></div>
            <div><b className="mono">{compact(people, 1)}</b><span>{L('参与用户', 'Participants')}</span></div>
            <div><b className="mono up">{fmt(avgRoi, 2)}x</b><span>{L('平均回报（现价/认购价）', 'Avg. return (now / sale)')}</span></div>
          </div>
        </div>
        <HeroOrbit />
      </section>

      <TierCard />

      {[
        ['live', L('进行中', 'Live now'), groups.live],
        ['upcoming', L('即将开始', 'Upcoming'), groups.upcoming],
        ['ended', L('已完成', 'Completed'), groups.ended],
      ].map(([k, title, list]) => list.length > 0 && (
        <section key={k} id={'lp-' + k} className="lp-sec">
          <div className="sec-head">
            <h2 className="display sec-title">{title}</h2>
            <span className="count">{list.length}</span>
          </div>
          <div className="pgrid">{list.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
        </section>
      ))}

      {mine && <MySubsModal onClose={() => setMine(false)} />}
    </div>
  );
}

function MySubsModal({ onClose }) {
  useMarket();
  const s = useApp();
  return (
    <Modal title={L('我的认购', 'My subscriptions')} onClose={onClose} width={640} icon={<Receipt size={18} />}>
      {s.subs.length === 0 ? (
        <Empty text={L('还没有认购记录', 'No subscriptions yet')}><Btn size="sm" onClick={() => { onClose(); go('project', 'vela'); }}>{L('去认购 VELA', 'Subscribe to VELA')}</Btn></Empty>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>{L('项目', 'Project')}</th><th>{L('认购金额', 'Committed')}</th><th>{L('状态', 'Status')}</th><th>{L('获配', 'Allocated')}</th><th>{L('时间', 'Time')}</th></tr></thead>
            <tbody>
              {[...s.subs].reverse().map((x) => {
                const p = PROJECT[x.pid];
                return (
                  <tr key={x.id} className="clickable" onClick={() => { onClose(); go('project', p.id); }}>
                    <td><span className="row-gap"><ProjLogo p={p} size={22} />{p.sym}</span></td>
                    <td className="mono">{fmt(x.amount, 2)} USDC</td>
                    <td>{x.status === 'pending' ? <Pill tone="accent" dot>{L('待结算', 'Pending')}</Pill> : <Pill tone="up">{L('已结算', 'Settled')}</Pill>}</td>
                    <td className="mono">{x.status === 'settled' ? `${fmt(x.tokens, 2)} ${p.sym}` : '--'}</td>
                    <td className="mono muted">{dateTime(x.ts)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Project detail
// ----------------------------------------------------------------------------
const TOK_COLORS = ['var(--accent)', 'var(--violet)', '#4FD1C5', '#5B8CFF', '#FFC94D', '#FF6B8B', '#9AA6B8'];

export function ProjectPage({ id }) {
  useMarket();
  const p = PROJECT[id] || PROJECTS[0];
  const [tab, setTab] = useState('overview');
  const ph = phase(p);
  const { start, end } = projTimes(p);
  const saleTokens = p.hardCap / p.price;
  const fdv = p.price * p.totalSupply;
  const pubPct = (p.tokenomics.find((t) => /公开|Public/.test(t[0]))?.[2] || 10) / 100;
  const initMcap = fdv * pubPct * p.vesting.tge * 1.6;
  const ext = () => toast(L('演示环境不打开外部链接', 'External links are disabled in this demo'), 'warn');

  const stages = [
    [L('预热', 'Preview'), start - 3 * DAY],
    [L('认购', 'Subscription'), start],
    [L('分配计算', 'Allocation'), end],
    [L('TGE 发放', 'TGE'), end + 2 * 3600e3],
    [L('线性解锁', 'Vesting'), end + p.vesting.cliff * 30 * DAY],
  ];
  const t = now();
  const curStage = stages.reduce((acc, [, ts], i) => (t >= ts ? i : acc), -1);

  return (
    <div className="page">
      <button className="back" onClick={() => go('launchpad')}><ArrowLeft size={16} />{L('返回认购列表', 'All sales')}</button>
      <Banner p={p} big>
        <div className="pd-hero">
          <ProjLogo p={p} size={92} ring />
          <div className="pd-hero-txt">
            <div className="pd-tags"><StatusChip p={p} />{p.tags.map((x, i) => <span key={i} className="tag glass">{L(...x)}</span>)}<span className="tag glass">{p.chain}</span></div>
            <h1 className="display pd-title">{p.name} <span>{p.sym}</span></h1>
            <p className="pd-tagline">{L(...p.tagline)}</p>
            <div className="pd-links">
              <button onClick={ext}><Globe2 size={15} />{L('官网', 'Website')}</button>
              <button onClick={ext}><AtSign size={15} />X</button>
              <button onClick={ext}><Send size={15} />Telegram</button>
              <button onClick={ext}><FileText size={15} />{L('白皮书', 'Whitepaper')}</button>
            </div>
          </div>
        </div>
      </Banner>

      <div className="pd-metrics">
        <Metric icon={<Coins size={16} />} k={L('认购价', 'Sale price')} v={`${p.price} USDC`} />
        <Metric icon={<Target size={16} />} k={L('硬顶', 'Hard cap')} v={`${fmt(p.hardCap, 0)} USDC`} />
        <Metric icon={<Layers size={16} />} k={L('公售数量', 'Tokens for sale')} v={`${compact(saleTokens, 2)} ${p.sym}`} />
        <Metric icon={<TrendingUp size={16} />} k={L('完全稀释估值', 'FDV')} v={`$${compact(fdv, 2)}`} />
        <Metric icon={<Sparkles size={16} />} k={L('初始流通市值', 'Initial mcap')} v={`$${compact(initMcap, 2)}`} />
        <Metric icon={<Lock size={16} />} k={L('TGE 解锁', 'TGE unlock')} v={`${p.vesting.tge * 100}%`} />
      </div>

      <div className="pd-layout">
        <div className="pd-main">
          <div className="card stages">
            {stages.map(([name, ts], i) => (
              <div key={i} className={cx('stage', i < curStage && 'done', i === curStage && 'cur')}>
                <i>{i < curStage ? <CheckCircle2 size={14} /> : i + 1}</i>
                <b>{name}</b>
                <span className="mono">{dateTime(ts)}</span>
              </div>
            ))}
          </div>

          <Tabs value={tab} onChange={setTab} variant="line" className="pd-tabs" items={[
            ['overview', L('项目概览', 'Overview')],
            ['tokenomics', L('代币经济', 'Tokenomics')],
            ['vesting', L('释放计划', 'Vesting')],
            ['roadmap', L('路线图', 'Roadmap')],
            ['team', L('团队与投资方', 'Team & backers')],
            ['rules', L('认购规则', 'Rules')],
          ]} />

          {tab === 'overview' && (
            <div className="card prose">
              <h3>{L('项目愿景', 'Vision')}</h3>
              {p.vision.map((x, i) => <p key={i}>{L(...x)}</p>)}
              <h3>{L('核心亮点', 'Highlights')}</h3>
              <div className="hl-grid">
                {p.highlights.map((h, i) => (
                  <div key={i} className="hl"><Sparkles size={16} /><span>{L(...h)}</span></div>
                ))}
              </div>
              <h3>{L('关键数据', 'Key data')}</h3>
              <div className="kd-grid">
                <div><span>{L('协议锁仓/资产规模', 'TVL / AUM')}</span><b className="mono">${compact(p.metrics.tvl, 1)}</b></div>
                <div><span>{L('社区持有人', 'Community holders')}</span><b className="mono">{fmt(p.metrics.holders, 0)}</b></div>
                <div><span>{L('主网', 'Chain')}</span><b>{p.chain}</b></div>
                <div><span>{L('总供应量', 'Total supply')}</span><b className="mono">{compact(p.totalSupply, 1)}</b></div>
              </div>
            </div>
          )}

          {tab === 'tokenomics' && (
            <div className="card tok">
              <Donut size={220} thick={26} data={p.tokenomics.map((x, i) => ({ label: L(x[0], x[1]), value: x[2], color: TOK_COLORS[i % TOK_COLORS.length] }))}
                center={<><b className="mono">{compact(p.totalSupply, 1)}</b><span>{L('总供应量', 'Total supply')}</span></>} />
              <div className="table-wrap">
                <table className="tbl">
                  <thead><tr><th>{L('分配', 'Allocation')}</th><th>{L('占比', 'Share')}</th><th>{L('数量', 'Tokens')}</th></tr></thead>
                  <tbody>
                    {p.tokenomics.map((x, i) => (
                      <tr key={i}>
                        <td><span className="row-gap"><i className="sw" style={{ background: TOK_COLORS[i % TOK_COLORS.length] }} />{L(x[0], x[1])}</span></td>
                        <td className="mono">{x[2]}%</td>
                        <td className="mono">{compact((p.totalSupply * x[2]) / 100, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'vesting' && <VestingChart p={p} />}

          {tab === 'roadmap' && (
            <div className="card roadmap">
              {p.roadmap.map((r, i) => (
                <div key={i} className={cx('rm', r.done && 'done', r.now && 'now')}>
                  <div className="rm-dot" />
                  <div className="rm-q mono">{r.q}</div>
                  <div className="rm-body"><b>{L(...r.title)}</b><p>{L(...r.items)}</p></div>
                  {r.now && <Pill tone="accent" dot>{L('当前阶段', 'Now')}</Pill>}
                </div>
              ))}
            </div>
          )}

          {tab === 'team' && (
            <div className="card">
              <div className="team-grid">
                {p.team.map(([n, role, bio]) => (
                  <div key={n} className="member">
                    <span className="avatar">{n.split(' ').map((w) => w[0]).join('')}</span>
                    <div><b>{n}</b><small className="accent-text">{role}</small><p>{L(...bio)}</p></div>
                  </div>
                ))}
              </div>
              <h3 className="sub-h">{L('投资方', 'Backers')}</h3>
              <div className="backers">{p.investors.map((x) => <span key={x} className="backer">{x}</span>)}</div>
            </div>
          )}

          {tab === 'rules' && (
            <div className="card prose">
              <ul className="rules">
                <li><b>{L('认购资产', 'Currency')}</b>{L('仅支持现货账户中的 USDC。可通过闪兑把 USDT 换成 USDC。', 'USDC from your spot account only. Convert USDT to USDC with Convert.')}</li>
                <li><b>{L('认购上限', 'Caps')}</b>{L(`基础上限 ${p.baseMax} USDC，按 PDX 质押等级放大（最高 ×5）。最低 ${p.minBuy} USDC。`, `Base cap ${p.baseMax} USDC, multiplied by your PDX tier (up to ×5). Minimum ${p.minBuy} USDC.`)}</li>
                <li><b>{L('超募处理', 'Oversubscription')}</b>{L('若认购总额超过硬顶，按“个人认购额 ÷ 超募倍数”分配，剩余 USDC 在结算时自动退回现货账户。', 'If total commitments exceed the hard cap, each user gets commitment ÷ oversubscription ratio; the rest is refunded to spot at settlement.')}</li>
                <li><b>{L('代币发放', 'Distribution')}</b>{L(`TGE 时发放 ${p.vesting.tge * 100}%，锁定 ${p.vesting.cliff} 个月后在 ${p.vesting.months} 个月内线性解锁，可随时领取已解锁部分。`, `${p.vesting.tge * 100}% at TGE; after a ${p.vesting.cliff}-month cliff the rest unlocks linearly over ${p.vesting.months} months. Claim unlocked tokens any time.`)}</li>
                <li><b>{L('风险提示', 'Risk')}</b>{L('早期项目波动大，可能损失全部本金。认购前请阅读项目资料并独立判断。', 'Early-stage tokens are volatile and you can lose everything. Do your own research.')}</li>
              </ul>
            </div>
          )}
        </div>

        <aside className="pd-side">
          <SubscribePanel p={p} />
        </aside>
      </div>
    </div>
  );
}

function Metric({ icon, k, v }) {
  return (
    <div className="metric">
      <span className="metric-ico">{icon}</span>
      <span className="metric-k">{k}</span>
      <b className="metric-v mono">{v}</b>
    </div>
  );
}

function VestingChart({ p }) {
  const v = p.vesting;
  const months = v.cliff + v.months + 2;
  const W = 640, H = 220, padL = 40, padB = 28, padT = 14, padR = 12;
  const pts = [];
  for (let m = 0; m <= months; m++) {
    const lin = Math.max(0, Math.min(1, (m - v.cliff) / v.months));
    pts.push([m, v.tge + (1 - v.tge) * lin]);
  }
  const x = (m) => padL + (m / months) * (W - padL - padR);
  const y = (f) => padT + (1 - f) * (H - padT - padB);
  const d = pts.map(([m, f], i) => `${i ? 'L' : 'M'}${x(m).toFixed(1)} ${y(f).toFixed(1)}`).join(' ');
  return (
    <div className="card">
      <div className="row-between"><h3 className="sub-h">{L('公售部分累计解锁', 'Public-sale tokens unlocked')}</h3><span className="muted small">{L('单位：月（自 TGE 起）', 'Months after TGE')}</span></div>
      <div className="chart-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="vest-svg" role="img" aria-label={L('释放曲线', 'Vesting curve')}>
          <defs>
            <linearGradient id="vest-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={padL} x2={W - padR} y1={y(f)} y2={y(f)} stroke="var(--grid)" />
              <text x={padL - 8} y={y(f) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">{f * 100}%</text>
            </g>
          ))}
          {pts.map(([m]) => m % 2 === 0 && (
            <text key={m} x={x(m)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">M{m}</text>
          ))}
          <path d={`${d} L${x(months)} ${y(0)} L${x(0)} ${y(0)} Z`} fill="url(#vest-g)" />
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.4" />
          <circle cx={x(0)} cy={y(v.tge)} r="4.5" fill="var(--accent)" />
          <text x={x(0) + 10} y={y(v.tge) - 8} fontSize="12" fill="var(--fg)" fontWeight="700">TGE {v.tge * 100}%</text>
          {v.cliff > 0 && <text x={x(v.cliff)} y={y(v.tge) + 18} fontSize="11" fill="var(--muted)" textAnchor="middle">{L('锁定期结束', 'Cliff ends')}</text>}
        </svg>
      </div>
      <div className="vest-legend">
        <KV k="TGE" v={`${v.tge * 100}%`} />
        <KV k={L('锁定期', 'Cliff')} v={`${v.cliff} ${L('个月', 'mo')}`} />
        <KV k={L('线性解锁', 'Linear vesting')} v={`${v.months} ${L('个月', 'mo')}`} />
      </div>
    </div>
  );
}

function Ring({ ratio }) {
  const R = 54, C = 2 * Math.PI * R;
  const p1 = Math.min(1, ratio);
  const over = Math.max(0, Math.min(1, ratio - 1));
  return (
    <svg width="136" height="136" viewBox="0 0 136 136" className="ring">
      <circle cx="68" cy="68" r={R} fill="none" stroke="var(--line)" strokeWidth="10" />
      <circle cx="68" cy="68" r={R} fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${p1 * C} ${C}`} transform="rotate(-90 68 68)" />
      {over > 0 && <circle cx="68" cy="68" r={R - 13} fill="none" stroke="var(--up)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${over * 2 * Math.PI * (R - 13)} ${C}`} transform="rotate(-90 68 68)" />}
      <text x="68" y="66" textAnchor="middle" fontSize={ratio >= 1 ? 17 : 21} fontWeight="800" fill="var(--fg)" fontFamily="JetBrains Mono, monospace">{(ratio * 100).toFixed(1)}%</text>
      <text x="68" y="86" textAnchor="middle" fontSize="11" fill="var(--muted)">{ratio > 1 ? L('已超募', 'oversubscribed') : L('认购进度', 'subscribed')}</text>
    </svg>
  );
}

function SubscribePanel({ p }) {
  const s = useApp();
  const [amt, setAmt] = useState('');
  const [agree, setAgree] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(0);
  const ph = phase(p);
  const { start, end } = projTimes(p);
  const r = raised(p);
  const ratio = r / p.hardCap;
  const t = tier();
  const cap = maxAlloc(p);
  const used = userSubTotal(p.id);
  const room = Math.max(0, cap - used);
  const usdc = bal('USDC');
  const a = parseFloat(amt) || 0;
  const estRatio = Math.max(1, (r + a) / p.hardCap);
  const mySubs = s.subs.filter((x) => x.pid === p.id);
  const listed = !!COIN[p.sym];

  const doSub = () => {
    setBusy(true);
    setTimeout(() => {
      const res = subscribeSale(p.id, a);
      setBusy(false);
      if (res.err) { toast(res.err, 'err'); return; }
      setConfirm(false);
      setAmt('');
      setBurst((x) => x + 1);
      toast(L('认购成功', 'Subscribed'), 'ok', `${fmt(a, 2)} USDC → ${p.sym}`);
    }, 900);
  };

  return (
    <div className="card sub-panel">
      {burst > 0 && <Confetti key={burst} />}
      <div className="row-between">
        <b>{L('认购', 'Subscribe')} {p.sym}</b>
        {ph === 'live' && <span className="mono small accent-text"><Clock size={13} /> {countdown(end - now())}</span>}
        {ph === 'upcoming' && <span className="mono small"><Clock size={13} /> {countdown(start - now())}</span>}
        {ph === 'ended' && <Pill tone="up">{L('已完成', 'Completed')}</Pill>}
      </div>

      {ph !== 'upcoming' && (
        <div className="sub-ring">
          <Ring ratio={ratio} />
          <div className="sub-ring-kv">
            <KV k={L('已募集', 'Raised')} v={`${fmt(r, 0)} USDC`} />
            <KV k={L('硬顶', 'Hard cap')} v={`${fmt(p.hardCap, 0)} USDC`} />
            <KV k={L('参与人数', 'Participants')} v={fmt(participants(p), 0)} />
            {ratio > 1 && <KV k={L('预计获配比例', 'Est. fill rate')} v={`${(100 / ratio).toFixed(2)}%`} />}
          </div>
        </div>
      )}

      {ph === 'upcoming' && (
        <div className="stack">
          <div className="soon-box">
            <div className="muted small">{L('认购开始倒计时', 'Sale opens in')}</div>
            <div className="soon-cd mono">{countdown(start - now())}</div>
            <div className="muted small">{dateTime(start)} – {dateTime(end)}</div>
          </div>
          <KV k={L('你的认购上限', 'Your cap')} v={`${fmt(cap, 0)} USDC`} />
          <Btn block variant={s.reminders[p.id] ? 'soft' : 'primary'} onClick={() => { toggleReminder(p.id); toast(s.reminders[p.id] ? L('已取消提醒', 'Reminder removed') : L('开始前 10 分钟提醒你', 'We will remind you 10 min before')); }}>
            {s.reminders[p.id] ? <><BellRing size={16} />{L('已设置提醒', 'Reminder set')}</> : <><Bell size={16} />{L('设置开始提醒', 'Remind me')}</>}
          </Btn>
          <p className="fine">{L('提示：可在左下角“演示”面板快进时间，直接进入认购期。', 'Tip: use the Demo console (bottom left) to fast-forward into the sale.')}</p>
        </div>
      )}

      {ph === 'live' && (
        !s.wallet.connected ? <ConnectGate /> : (
          <div className="stack">
            <div className="tier-line" style={{ '--tier': t.color }}>
              <Trophy size={14} />{L(...t.name)} ×{t.mult}
              <span className="muted">{L('上限', 'Cap')} <b className="mono">{fmt(cap, 0)}</b> · {L('已认购', 'Used')} <b className="mono">{fmt(used, 0)}</b></span>
            </div>
            <NumInput id="sub-amt" label={L('认购金额', 'Amount')} value={amt} onChange={setAmt} suffix="USDC"
              right={<button className="max-btn" onClick={() => setAmt(String(floorTo(Math.min(room, usdc), 2)))}>MAX</button>} />
            <div className="row-between small">
              <span className="muted">{L('可用', 'Available')} <b className="mono">{fmt(usdc, 2)} USDC</b></span>
              <span className="row-gap">
                <button className="link-btn" onClick={() => openModal('convert', { from: 'USDT', to: 'USDC' })}><Repeat size={13} />{L('闪兑', 'Convert')}</button>
                <button className="link-btn" onClick={() => openModal('deposit', { sym: 'USDC' })}><ArrowDownToLine size={13} />{L('充值', 'Deposit')}</button>
              </span>
            </div>
            <div className="summary">
              <KV k={L('按认购价可得', 'At sale price')} v={`${fmt(a / p.price, 2)} ${p.sym}`} />
              <KV k={L('当前超募倍数', 'Oversubscription')} v={`${estRatio.toFixed(2)}x`} />
              <KV k={L('预计实际获配', 'Est. allocation')} v={<b className="accent-text">{fmt(a / estRatio / p.price, 2)} {p.sym}</b>} />
              <KV k={L('预计退还', 'Est. refund')} v={`${fmt(a - a / estRatio, 2)} USDC`} />
            </div>
            <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />{L('我已阅读认购规则与风险提示', 'I have read the rules and risk notice')}</label>
            <Btn block size="lg" disabled={!agree || !(a >= p.minBuy) || a > room + 1e-9} onClick={() => setConfirm(true)}>
              {a > room + 1e-9 ? L('超过认购上限', 'Over your cap') : a && a < p.minBuy ? L(`最低 ${p.minBuy} USDC`, `Min ${p.minBuy} USDC`) : L('立即认购', 'Subscribe')}
            </Btn>
          </div>
        )
      )}

      {ph === 'ended' && mySubs.length === 0 && (
        <div className="stack">
          <div className="summary">
            <KV k={L('最终认购倍数', 'Final ratio')} v={`${(ratio * 100).toFixed(1)}%`} />
            {listed && <KV k={L('当前价格', 'Price now')} v={`${fmt(price(p.sym), 5)} USDT`} />}
            {listed && <KV k={L('较认购价', 'vs. sale price')} v={<b className={athRoi(p) >= 1 ? 'up' : 'down'}>{fmt(athRoi(p), 2)}x</b>} />}
          </div>
          {listed ? <Btn block onClick={() => go('spot', `${p.sym}_USDT`)}>{L(`交易 ${p.sym}`, `Trade ${p.sym}`)}</Btn> : <p className="muted small">{L('认购已结束，代币即将上线现货。', 'Sale ended. Spot listing soon.')}</p>}
        </div>
      )}

      {mySubs.length > 0 && <MyAllocation p={p} subs={mySubs} />}

      <div className="policy"><ShieldCheck size={16} />{L('政策：若认购超额，将执行比例分配及资金返还政策。', 'Policy: oversubscribed sales are allocated pro rata and the remainder refunded.')}</div>

      {confirm && (
        <Modal title={L('确认认购', 'Confirm subscription')} onClose={() => setConfirm(false)} width={420}>
          <div className="stack">
            <div className="confirm-hero"><ProjLogo p={p} size={48} /><div><b>{p.name}</b><div className="muted small">{p.sym} · {p.price} USDC</div></div></div>
            <div className="summary">
              <KV k={L('认购金额', 'Commit')} v={`${fmt(a, 2)} USDC`} />
              <KV k={L('预计获配', 'Est. allocation')} v={`${fmt(a / estRatio / p.price, 2)} ${p.sym}`} />
              <KV k={L('结算时间', 'Settles')} v={dateTime(end)} />
              <KV k={L('TGE 解锁', 'TGE unlock')} v={`${p.vesting.tge * 100}%`} />
            </div>
            <p className="fine">{L('认购资金将冻结至结算，超募部分自动退回。', 'Funds are locked until settlement; any excess is refunded automatically.')}</p>
            <div className="btn-row">
              <Btn variant="ghost" onClick={() => setConfirm(false)}>{L('取消', 'Cancel')}</Btn>
              <Btn onClick={doSub} loading={busy}>{L('确认认购', 'Confirm')}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MyAllocation({ p, subs }) {
  const pending = subs.filter((x) => x.status === 'pending');
  const settled = subs.filter((x) => x.status === 'settled');
  const committed = pending.reduce((a, x) => a + x.amount, 0);
  return (
    <div className="my-alloc">
      <div className="field-label">{L('我的认购', 'My position')}</div>
      {committed > 0 && (
        <div className="alloc-row">
          <span><Lock size={14} />{L('已冻结', 'Committed')}</span>
          <b className="mono">{fmt(committed, 2)} USDC</b>
          <Pill tone="accent" dot>{L('等待结算', 'Awaiting settlement')}</Pill>
        </div>
      )}
      {settled.map((x) => {
        const unlocked = vestUnlocked(p, x);
        const claimable = Math.max(0, unlocked - x.claimed);
        return (
          <div key={x.id} className="alloc-card">
            <div className="row-between"><span className="muted small">{L('获配', 'Allocated')}</span><b className="mono">{fmt(x.tokens, 2)} {p.sym}</b></div>
            <div className="row-between"><span className="muted small">{L('退还', 'Refunded')}</span><span className="mono">{fmt(x.refund, 2)} USDC</span></div>
            <Progress value={unlocked} max={x.tokens} tone="up" />
            <div className="row-between small"><span className="muted">{L('已解锁', 'Unlocked')} {((unlocked / x.tokens) * 100).toFixed(1)}%</span><span className="muted">{L('已领取', 'Claimed')} {fmt(x.claimed, 2)}</span></div>
            <Btn block variant={claimable > 0.0001 ? 'primary' : 'soft'} disabled={claimable <= 0.0001} onClick={() => { const g = claimVested(x.id); toast(L('领取成功', 'Claimed'), 'ok', `+${fmt(g, 2)} ${p.sym}`); }}>
              <Gift size={16} />{claimable > 0.0001 ? L(`领取 ${fmt(claimable, 2)} ${p.sym}`, `Claim ${fmt(claimable, 2)} ${p.sym}`) : L('暂无可领取', 'Nothing to claim')}
            </Btn>
          </div>
        );
      })}
    </div>
  );
}

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    left: 50 + (Math.random() - 0.5) * 30, dx: (Math.random() - 0.5) * 320, dy: -120 - Math.random() * 200, r: Math.random() * 720,
    c: ['var(--accent)', 'var(--up)', 'var(--violet)', '#FFD27A', '#5B8CFF'][i % 5], d: Math.random() * 0.2,
  })), []);
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => <i key={i} style={{ left: b.left + '%', background: b.c, '--dx': b.dx + 'px', '--dy': b.dy + 'px', '--r': b.r + 'deg', animationDelay: b.d + 's' }} />)}
    </div>
  );
}
