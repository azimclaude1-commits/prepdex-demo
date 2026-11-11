import { useState } from 'react';
import {
  Sparkles, Wallet, ArrowDownToLine, Gift, ChevronRight, Rocket, CandlestickChart, Activity, ArrowLeftRight, Layers, Landmark,
  BadgeDollarSign, ShieldCheck, Globe, ArrowUpRight, Flame, CalendarCheck, Vault, Headphones, Check,
} from 'lucide-react';
import { CHECKIN_REWARDS, COINS, COIN, PROJECTS, FREE_DROP, LEND_MARKETS, FIATS, MAX_LEV, STAKE_PRODUCTS } from '../core/data.js';
import { L } from '../core/lang.js';
import { useApp, go, openModal, toast, claimables, claimableUsd, checkinState, checkIn } from '../core/store.js';
import { useMarket, price, change24, volume24, getCandles } from '../core/market.js';
import { fmt, fp, usd, compact, amt } from '../core/fmt.js';
import { Btn, Tabs, CoinIcon, ProjLogo, Spark, Delta, Flash, cx, useMedia, PHONE } from '../ui/kit.jsx';
import { DropFeature, CampArt, campMeta } from './Rewards.jsx';
import { AirdropModal } from './DropFlows.jsx';
import { TickerTape, TradeShowcase, EarnSection, SecuritySection, NewsCommunity, Faq, CampBanner } from './HomeSections.jsx';

const spark = (sym, n = 48) => getCandles(sym, '1h').slice(-n).map((x) => x.close);

export function Home() {
  useMarket();
  const s = useApp();
  const claim = claimableUsd();
  return (
    <div className="page home">
      <TickerTape />
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="eyebrow"><Sparkles size={14} />Novarix Exchange</div>
          <h1 className="display home-title">
            {L('交易、認購、賺收益', 'Trade, launch, earn.')}
            <span className="grad-text">{L('一個帳戶全搞定', 'One account for all of it')}</span>
          </h1>
          <p className="hero-sub">{L('現貨、合約、兌換、Launchpad、質押與借貸都在這裡。連接錢包並充值即可開始交易。', 'Spot, futures, swap, launchpad, staking and lending in one place. Connect a wallet and deposit to start trading.')}</p>
          <div className="hero-cta">
            {s.wallet.connected
              ? <Btn size="lg" onClick={() => openModal('deposit')}><ArrowDownToLine size={17} />{L('立即充值', 'Deposit now')}</Btn>
              : <Btn size="lg" onClick={() => openModal('connect')}><Wallet size={17} />{L('連接錢包', 'Connect wallet')}</Btn>}
            <Btn size="lg" variant="ghost" onClick={() => go('rewards')}><Gift size={17} />{L('領取獎勵', 'Claim rewards')}{claim > 0 && <span className="tab-badge">≈{usd(claim, 0)}</span>}</Btn>
          </div>
          <button className="home-promo" onClick={() => go('rewards', 'drop')}>
            <ProjLogo p={FREE_DROP} size={30} />
            <span><b>{L(`${FREE_DROP.sym} 免費申購進行中`, `Free ${FREE_DROP.sym} launch is live`)}</b>{L(`簽名即可領 ${FREE_DROP.perUser} ${FREE_DROP.sym}，無需付款`, `Sign to get ${FREE_DROP.perUser} ${FREE_DROP.sym}. No payment.`)}</span>
            <ChevronRight size={16} />
          </button>
          <div className="hero-trust">
            <span><ShieldCheck size={15} />{L('儲備金率 108%', '108% reserves')}</span>
            <span><Vault size={15} />{L('95% 冷錢包', '95% cold storage')}</span>
            <span><Headphones size={15} />{L('7×24 小時客服', '24/7 support')}</span>
          </div>
        </div>
        <HeroBoard />
      </section>

      <StatsStrip />
      <CampaignStrip />
      <Markets />
      <TradeShowcase />
      <EarnSection />
      <SecuritySection />
      <NewsCommunity />
      <Faq />
    </div>
  );
}

function HeroBoard() {
  const syms = ['BTC', 'ETH', 'SOL', 'BNB', 'NVX'];
  return (
    <div className="hero-board">
      <div className="hb-card">
        <div className="hb-head">
          <span className="row-gap"><i className="live-dot" />{L('即時行情', 'Live prices')}</span>
          <button className="link-btn" onClick={() => go('spot')}>{L('去交易', 'Trade')}<ChevronRight size={14} /></button>
        </div>
        {syms.map((sym) => (
          <button key={sym} className="hb-row" onClick={() => go('spot', `${sym}_USDT`)}>
            <CoinIcon sym={sym} size={32} />
            <span className="hb-name"><b>{sym}</b><small>{COIN[sym].name}</small></span>
            <Spark values={spark(sym, 36)} w={90} h={30} color={change24(sym) >= 0 ? 'var(--up)' : 'var(--down)'} />
            <span className="hb-px">
              <Flash value={price(sym)} className="mono">${fp(price(sym))}</Flash>
              <Delta v={change24(sym)} className="small" />
            </span>
          </button>
        ))}
        <div className="hb-foot">
          <button className="hb-act drop" onClick={() => go('rewards', 'drop')}>
            <ProjLogo p={FREE_DROP} size={22} />
            <span>{L('免費申購', 'Free launch')}</span>
            <b className="mono">+{FREE_DROP.perUser} {FREE_DROP.sym}</b>
          </button>
          <button className="hb-act ck" onClick={() => go('rewards', 'checkin')}>
            <CalendarCheck size={18} />
            <span>{L('每日簽到', 'Daily check-in')}</span>
            <b className="mono">+{checkinState().nextReward} USDT</b>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsStrip() {
  const vol = COINS.reduce((a, c) => a + volume24(c.sym), 0) * 0.0042;
  return (
    <section className="home-stats">
      <div><b className="mono">${compact(vol, 1)}</b><span>{L('24 小時成交量', '24h volume')}</span></div>
      <div><b className="mono">2.8M+</b><span>{L('註冊用戶', 'Registered users')}</span></div>
      <div><b className="mono">{COINS.length}</b><span>{L('上線幣種', 'Listed coins')}</span></div>
      <div><b className="mono up">108%</b><span>{L('儲備金率', 'Proof of reserves')}</span></div>
    </section>
  );
}

// Campaign banner and the campaign cards, the same cards as the rewards hub
function CampaignStrip() {
  const s = useApp();
  const ready = claimables();
  return (
    <section className="lp-sec home-camps">
      <div className="sec-head">
        <h2 className="display sec-title"><Flame size={20} className="accent-text" />{L('熱門活動', 'Campaigns')}</h2>
        <button className="link-btn" onClick={() => go('rewards')}>{L('全部活動', 'All campaigns')}<ChevronRight size={14} /></button>
      </div>
      <CampBanner />
      <div className="home-camp-grid">
        <DropFeature ready={ready.drop} />
        <HomeCheckin />
      </div>
    </section>
  );
}

// Check-in card on the home page: this week's progress and a check-in button
function HomeCheckin() {
  const s = useApp();
  const st = checkinState();
  const [rid, setRid] = useState(null);
  const m = campMeta('checkin');
  const weekMax = CHECKIN_REWARDS.reduce((a, b) => a + b, 0);
  const doCheckIn = () => {
    const r = checkIn();
    if (r.err) toast(r.err, 'err'); else setRid(r.rid);
  };
  return (
    <div className="camp-card home-ck" style={{ '--b1': m.colors[0], '--b2': m.colors[1], '--b3': m.colors[2] }}>
      <span className="banner-grid" aria-hidden="true" />
      <div className="camp-card-top">
        <CampArt id="checkin" size={46} ring />
        <span className="camp-reward"><Gift size={13} />{m.reward}</span>
      </div>
      <div className="row-between">
        <h3>{m.title}</h3>
        <span className="hck-week mono">{st.week} / {weekMax} USDT</span>
      </div>
      <div className="hck-days">
        {CHECKIN_REWARDS.map((r, i) => (
          <div key={i} className={cx('hck-day', i < st.filled && 'done', !st.doneToday && i === st.filled && 'today')}>
            <span>{i < st.filled ? <Check size={13} /> : L(`${i + 1} 天`, `D${i + 1}`)}</span>
            <b className="mono">+{r}</b>
          </div>
        ))}
      </div>
      <div className="hck-foot">
        {!s.wallet.connected
          ? <Btn block onClick={() => openModal('connect')}><Wallet size={16} />{L('連接錢包後簽到', 'Connect wallet to check in')}</Btn>
          : st.doneToday
            ? <Btn block variant="ghost" onClick={() => go('rewards', 'checkin')}><CalendarCheck size={16} />{L(`今日已簽到 · 明天 +${st.nextReward} USDT`, `Done today · +${st.nextReward} USDT tomorrow`)}</Btn>
            : <Btn block onClick={doCheckIn}><CalendarCheck size={16} />{L(`立即簽到 +${CHECKIN_REWARDS[st.filled]} USDT`, `Check in +${CHECKIN_REWARDS[st.filled]} USDT`)}</Btn>}
        <button className="link-btn hck-more" onClick={() => go('rewards', 'checkin')}>{L('簽到詳情', 'Details')}<ChevronRight size={14} /></button>
      </div>
      {rid && <AirdropModal rid={rid} onClose={() => setRid(null)} />}
    </div>
  );
}

function Markets() {
  const [tab, setTab] = useState('hot');
  const phone = useMedia(PHONE);
  const tradable = COINS.filter((c) => !c.stable);
  let list;
  if (tab === 'hot') list = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'TON', 'NVX'].map((x) => COIN[x]);
  else if (tab === 'up') list = [...tradable].sort((a, b) => change24(b.sym) - change24(a.sym)).slice(0, 8);
  else if (tab === 'down') list = [...tradable].sort((a, b) => change24(a.sym) - change24(b.sym)).slice(0, 8);
  else list = tradable.filter((c) => c.launch || c.sym === 'NVX');
  return (
    <section className="card markets">
      <div className="row-between">
        <h2 className="display sec-title">{L('市場行情', 'Markets')}</h2>
        <Tabs size="sm" value={tab} onChange={setTab} items={[['hot', L('熱門', 'Hot')], ['up', L('漲幅榜', 'Gainers')], ['down', L('跌幅榜', 'Losers')], ['new', L('新幣', 'New')]]} />
      </div>
      <div className="mk-head">
        <span>{L('幣種', 'Coin')}</span><span>{L('最新價', 'Price')}</span><span>{L('24h 漲跌', '24h change')}</span>
        {!phone && <><span>{L('24h 成交額', '24h volume')}</span><span>{L('走勢', 'Trend')}</span><span /></>}
      </div>
      {list.map((c) => (
        <button key={c.sym} className="mk-row" onClick={() => go('spot', `${c.sym}_USDT`)}>
          <span className="mk-coin"><CoinIcon sym={c.sym} size={28} /><b>{c.sym}</b><small>{c.name}</small></span>
          <Flash value={price(c.sym)} className="mono">${fp(price(c.sym))}</Flash>
          <span><span className={cx('chg-pill', change24(c.sym) >= 0 ? 'up' : 'down')}>{change24(c.sym) >= 0 ? '+' : ''}{(change24(c.sym) * 100).toFixed(2)}%</span></span>
          {!phone && <>
            <span className="mono muted">${compact(volume24(c.sym), 2)}</span>
            <Spark values={spark(c.sym)} w={110} h={30} color={change24(c.sym) >= 0 ? 'var(--up)' : 'var(--down)'} />
            <span className="mk-go">{L('交易', 'Trade')}<ArrowUpRight size={14} /></span>
          </>}
        </button>
      ))}
    </section>
  );
}

