import { useState } from 'react';
import {
  Sparkles, Wallet, ArrowDownToLine, Gift, ChevronRight, Rocket, CandlestickChart, Activity, ArrowLeftRight, Layers, Landmark,
  BadgeDollarSign, ShieldCheck, Globe, ArrowUpRight, Flame, CalendarCheck, Vault, Headphones,
} from 'lucide-react';
import { COINS, COIN, PROJECTS, FREE_DROP, LEND_MARKETS, FIATS, MAX_LEV, STAKE_PRODUCTS } from '../core/data.js';
import { L } from '../core/lang.js';
import { useApp, go, openModal, phase, claimableUsd, checkinState } from '../core/store.js';
import { useMarket, price, change24, volume24, getCandles } from '../core/market.js';
import { fmt, fp, usd, compact, amt } from '../core/fmt.js';
import { Btn, Tabs, CoinIcon, ProjLogo, Spark, Delta, Flash, cx, useMedia, PHONE } from '../ui/kit.jsx';
import { CAMP_IDS, campMeta, CampArt } from './Rewards.jsx';
import { TickerTape, LaunchShowcase, TradeShowcase, EarnSection, SecuritySection, NewsCommunity, Faq, FinalCta } from './HomeSections.jsx';

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
      <LaunchShowcase />
      <Markets />
      <TradeShowcase />
      <EarnSection />
      <Products />
      <SecuritySection />
      <NewsCommunity />
      <GetStarted />
      <Faq />
      <FinalCta />
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

function CampaignStrip() {
  const s = useApp();
  return (
    <section className="lp-sec">
      <div className="sec-head">
        <h2 className="display sec-title"><Flame size={20} className="accent-text" />{L('熱門活動', 'Campaigns')}</h2>
        <button className="link-btn" onClick={() => go('rewards')}>{L('全部活動', 'All campaigns')}<ChevronRight size={14} /></button>
      </div>
      <div className="camp-strip">
        {CAMP_IDS.map((id) => {
          const m = campMeta(id);
          const Icon = m.icon;
          return (
            <button key={id} className={cx('camp-mini', id === 'drop' && 'hot')} style={{ '--tone': m.tone, '--b1': m.colors[0], '--b2': m.colors[1], '--b3': m.colors[2] }} onClick={() => go('rewards', id)}>
              <CampArt id={id} size={42} ring />
              <b>{m.title}</b>
              <span className="camp-reward"><Gift size={12} />{m.reward}</span>
              {id === 'drop' && s.camp.drop == null && <span className="free-badge sm">{L('免費', 'FREE')}</span>}
            </button>
          );
        })}
      </div>
    </section>
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

function Products() {
  const live = PROJECTS.filter((p) => phase(p) === 'live').length;
  const maxApr = Math.max(...STAKE_PRODUCTS.map((x) => x.apr));
  const maxLev = Math.max(...Object.values(MAX_LEV));
  const items = [
    ['launchpad', Rocket, L('認購 Launchpad', 'Launchpad'), L('經過盡調的早期項目，USDC 認購，超募自動退款。', 'Vetted early projects in USDC, with automatic refunds when oversubscribed.'), L(`${live} 個項目認購中`, `${live} sales live`)],
    ['spot', CandlestickChart, L('現貨交易', 'Spot trading'), L('限價與市價單，即時深度與 K 線。', 'Limit and market orders with live depth and charts.'), L(`${COINS.length - 2} 個幣種`, `${COINS.length - 2} coins`)],
    ['futures', Activity, L('永續合約', 'Perpetual futures'), L('全倉或逐倉，支援止盈止損。', 'Cross or isolated margin with take-profit and stop-loss.'), L(`最高 ${maxLev} 倍`, `Up to ${maxLev}x`)],
    ['swap', ArrowLeftRight, L('一鍵兌換', 'Swap'), L('自動選擇最優路徑，即時成交。', 'Best route picked automatically, filled instantly.'), L('手續費 0.1%', '0.1% fee')],
    ['staking', Layers, L('質押理財', 'Staking'), L('活期與定期產品，質押 NVX 提升等級。', 'Flexible and fixed terms. Stake NVX to raise your tier.'), L(`年化最高 ${Math.round(maxApr * 100)}%`, `Up to ${Math.round(maxApr * 100)}% APR`)],
    ['lending', Landmark, L('借貸', 'Lending'), L('存入賺利息，或抵押資產借款。', 'Supply to earn interest or borrow against collateral.'), L(`${LEND_MARKETS.length} 個市場`, `${LEND_MARKETS.length} markets`)],
    ['otc', BadgeDollarSign, L('OTC 買幣', 'Buy crypto'), L('銀行卡快捷買幣與 P2P 商家交易。', 'Card purchases and P2P merchant trades.'), L(`${FIATS.length} 種法幣`, `${FIATS.length} currencies`)],
  ];
  return (
    <section className="lp-sec">
      <div className="sec-head"><h2 className="display sec-title">{L('一個帳戶，全部產品', 'Every product, one account')}</h2></div>
      <div className="prod-grid">
        {items.map(([k, Icon, title, desc, stat]) => (
          <button key={k} className="prod-card" onClick={() => go(k)}>
            <span className="prod-ico"><Icon size={22} /></span>
            <b>{title}</b>
            <p>{desc}</p>
            <span className="prod-stat">{stat}<ArrowUpRight size={15} /></span>
          </button>
        ))}
        <div className="prod-card trust">
          <span className="prod-ico"><ShieldCheck size={22} /></span>
          <b>{L('資產安全', 'Security')}</b>
          <p>{L('95% 資產冷錢包存放，每月公佈儲備金證明。', '95% of assets in cold storage, with monthly proof of reserves.')}</p>
          <span className="prod-stat"><Globe size={14} />{L('支援 8 種語言', '8 languages')}</span>
        </div>
      </div>
    </section>
  );
}

function GetStarted() {
  const s = useApp();
  const steps = [
    [Wallet, L('連接錢包', 'Connect a wallet'), L('用 MetaMask 等插件錢包簽名登入，不消耗 Gas。', 'Sign in with MetaMask or another extension wallet. No gas.'), s.wallet.connected, () => openModal('connect'), L('連接', 'Connect')],
    [ArrowDownToLine, L('充值到專屬地址', 'Deposit to your address'), L('平台為你分配專屬充值地址，區塊確認後自動到帳。', 'You get your own deposit address. Funds arrive after confirmations.'), s.records.some((r) => r.kind === 'deposit'), () => openModal(s.wallet.connected ? 'deposit' : 'connect'), L('充值', 'Deposit')],
    [Rocket, L('交易或參與活動', 'Trade or join a campaign'), L('開始交易、認購新項目，或在活動中心完成任務領取 USDT。', 'Trade, join a token sale, or finish tasks in the rewards hub for USDT.'), false, () => go('rewards'), L('去看看', 'Explore')],
  ];
  return (
    <section className="card get-started">
      <h2 className="display sec-title">{L('三步開始', 'Get started in 3 steps')}</h2>
      <div className="gs-grid">
        {steps.map(([Icon, title, desc, done, act, label], i) => (
          <div key={i} className={cx('gs-step', done && 'done')}>
            <span className="gs-n mono">0{i + 1}</span>
            <span className="prod-ico"><Icon size={20} /></span>
            <b>{title}</b>
            <p>{desc}</p>
            {done ? <span className="gs-ok">{L('已完成', 'Done')}</span> : <Btn size="sm" variant="soft" onClick={act}>{label}<ChevronRight size={14} /></Btn>}
          </div>
        ))}
      </div>
    </section>
  );
}
