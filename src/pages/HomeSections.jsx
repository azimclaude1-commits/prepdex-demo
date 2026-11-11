// Extra home page sections: ticker tape, launches, trading, earn, security, news, FAQ and a closing call to action.
import { useState } from 'react';
import {
  Rocket, Clock, ChevronRight, ChevronDown, Zap, Target, ShieldCheck, Lock, Vault, KeyRound, Landmark, Layers, Megaphone,
  CandlestickChart, Activity, Gauge, LineChart, Wallet, Gift, ArrowUpRight, Users, BadgeCheck,
} from 'lucide-react';
import { COINS, COIN, PROJECTS, STAKE_PRODUCTS, FUTURES, MAX_LEV, BRAND } from '../core/data.js';
import { SOCIAL_LOGOS } from '../core/logos.js';
import { L } from '../core/lang.js';
import { useApp, go, openModal, toast, now, phase, raised, projTimes, participants } from '../core/store.js';
import { price, change24, getCandles, getBook } from '../core/market.js';
import { fmt, fp, compact, countdown, dateOnly } from '../core/fmt.js';
import { Btn, CoinIcon, ProjLogo, Spark, Progress, Flash, cx } from '../ui/kit.jsx';

const DAY = 86400e3;

// Scrolling price strip across the top of the page
export function TickerTape() {
  const list = COINS.filter((c) => !c.stable);
  const row = list.map((c) => (
    <button key={c.sym} className="tt-item" onClick={() => go('spot', `${c.sym}_USDT`)} tabIndex={-1}>
      <CoinIcon sym={c.sym} size={18} />
      <b>{c.sym}</b>
      <span className="mono">${fp(price(c.sym))}</span>
      <span className={cx('mono', change24(c.sym) >= 0 ? 'up' : 'down')}>{change24(c.sym) >= 0 ? '+' : ''}{(change24(c.sym) * 100).toFixed(2)}%</span>
    </button>
  ));
  return (
    <div className="tape" aria-hidden="true">
      <div className="tape-track">{row}{row}</div>
    </div>
  );
}

// Live and upcoming token sales
export function LaunchShowcase() {
  const list = PROJECTS.filter((p) => phase(p) !== 'ended').slice(0, 3);
  const t = now();
  return (
    <section className="lp-sec">
      <div className="sec-head">
        <h2 className="display sec-title"><Rocket size={20} className="accent-text" />{L('熱門申購', 'Hot launches')}</h2>
        <span className="count">{list.length}</span>
        <button className="link-btn" onClick={() => go('launchpad')}>{L('全部項目', 'All projects')}<ChevronRight size={14} /></button>
      </div>
      <div className="ls-grid">
        {list.map((p) => {
          const ph = phase(p);
          const { start, end } = projTimes(p);
          const r = raised(p);
          const [a, b, c] = p.colors;
          return (
            <button key={p.id} className="ls-card" style={{ '--b1': a, '--b2': b, '--b3': c }} onClick={() => go('project', p.id)}>
              <div className="ls-top">
                <div className="banner-grid" />
                <div className="ls-mark"><ProjLogo p={p} size={120} /></div>
                <span className={cx('ls-chip', ph)}>
                  {ph === 'live' ? <><i className="live-dot" />{L('認購中', 'Live')} · <b className="mono">{countdown(end - t)}</b></> : <><Clock size={12} />{L('距開始', 'starts in')} <b className="mono">{countdown(start - t)}</b></>}
                </span>
                <div className="ls-id">
                  <ProjLogo p={p} size={44} ring />
                  <div><b className="display">{p.sym}</b><span>{p.name}</span></div>
                </div>
              </div>
              <div className="ls-body">
                <p>{L(...p.tagline)}</p>
                <div className="ls-kv">
                  <div><span>{L('認購價', 'Sale price')}</span><b className="mono">{p.price} USDC</b></div>
                  <div><span>{L('硬頂', 'Hard cap')}</span><b className="mono">${compact(p.hardCap, 1)}</b></div>
                  <div><span>{L('參與人數', 'Participants')}</span><b className="mono">{ph === 'live' ? fmt(participants(p), 0) : '--'}</b></div>
                </div>
                {ph === 'live' && (
                  <div className="ls-prog">
                    <div className="row-between small"><span className="muted">{L('募集進度', 'Raised')}</span><b className="mono accent-text">{((r / p.hardCap) * 100).toFixed(1)}%</b></div>
                    <Progress value={Math.min(1, r / p.hardCap)} glow />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// A trading terminal preview next to the selling points
export function TradeShowcase() {
  const [sym, setSym] = useState('BTC');
  const candles = getCandles(sym, '15m').slice(-96).map((x) => x.close);
  const book = getBook(sym, 1, 14);
  const asks = book.asks.slice(0, 5).reverse();
  const bids = book.bids.slice(0, 5);
  const up = change24(sym) >= 0;
  const feats = [
    [Gauge, L('毫秒級撮合', 'Millisecond matching'), L('撮合引擎每秒處理 100 萬筆訂單。', 'The engine matches 1M orders per second.')],
    [Activity, L(`最高 ${Math.max(...Object.values(MAX_LEV))} 倍槓桿`, `Up to ${Math.max(...Object.values(MAX_LEV))}x leverage`), L(`${FUTURES.length} 個 USDT 永續合約，全倉或逐倉。`, `${FUTURES.length} USDT perpetuals, cross or isolated.`)],
    [LineChart, L('專業 K 線與深度', 'Pro charts & depth'), L('多週期 K 線、均線指標、即時訂單簿。', 'Multi-timeframe charts, moving averages and a live order book.')],
    [Target, L('止盈止損', 'Take-profit & stop-loss'), L('開倉時設定，觸價自動平倉。', 'Set them when you open; positions close automatically.')],
  ];
  return (
    <section className="ts">
      <div className="ts-copy">
        <div className="eyebrow"><CandlestickChart size={14} />Pro Trading</div>
        <h2 className="display ts-title">{L('專業級交易體驗', 'A pro trading desk')}</h2>
        <p className="muted">{L('從現貨到永續合約，同一個帳戶、同一套介面，下單、止盈止損與風險管理一步到位。', 'Spot to perpetuals in one account and one interface, with orders, take-profit, stop-loss and risk tools in one place.')}</p>
        <div className="ts-feats">
          {feats.map(([Icon, t, d], i) => (
            <div key={i} className="ts-feat"><span className="prod-ico"><Icon size={18} /></span><div><b>{t}</b><span>{d}</span></div></div>
          ))}
        </div>
        <div className="hero-cta">
          <Btn onClick={() => go('spot', `${sym}_USDT`)}><CandlestickChart size={16} />{L('現貨交易', 'Trade spot')}</Btn>
          <Btn variant="ghost" onClick={() => go('futures', sym)}><Activity size={16} />{L('合約交易', 'Trade futures')}</Btn>
        </div>
      </div>
      <div className="tdesk">
        <div className="tdesk-head">
          <div className="tdesk-tabs">
            {['BTC', 'ETH', 'SOL'].map((x) => (
              <button key={x} className={cx(x === sym && 'on')} onClick={() => setSym(x)}><CoinIcon sym={x} size={18} />{x}/USDT</button>
            ))}
          </div>
          <span className={cx('mono tdesk-chg', up ? 'up' : 'down')}>{up ? '+' : ''}{(change24(sym) * 100).toFixed(2)}%</span>
        </div>
        <div className="tdesk-price">
          <Flash value={price(sym)} className={cx('mono', up ? 'up' : 'down')}>{fp(price(sym))}</Flash>
          <span className="muted small">{L('24h 走勢 · 15 分鐘', '24h · 15m candles')}</span>
        </div>
        <div className="tdesk-body">
          <div className="tdesk-chart"><Spark values={candles} w={520} h={190} color={up ? 'var(--up)' : 'var(--down)'} /></div>
          <div className="tdesk-book">
            <div className="tb-head"><span>{L('價格', 'Price')}</span><span>{L('數量', 'Size')}</span></div>
            {asks.map((x, i) => (
              <div key={'a' + i} className="tb-row ask" style={{ '--d': `${(x.size / (book.max / 4)) * 100}%` }}><span className="mono">{fp(x.price)}</span><span className="mono">{fmt(x.size, 4)}</span></div>
            ))}
            <div className={cx('tb-mid mono', up ? 'up' : 'down')}>{fp(book.mid)}</div>
            {bids.map((x, i) => (
              <div key={'b' + i} className="tb-row bid" style={{ '--d': `${(x.size / (book.max / 4)) * 100}%` }}><span className="mono">{fp(x.price)}</span><span className="mono">{fmt(x.size, 4)}</span></div>
            ))}
          </div>
        </div>
        <div className="tdesk-actions">
          <Btn variant="up" onClick={() => go('spot', `${sym}_USDT`)}>{L('買入', 'Buy')} {sym}</Btn>
          <Btn variant="down" onClick={() => go('spot', `${sym}_USDT`)}>{L('賣出', 'Sell')} {sym}</Btn>
        </div>
      </div>
    </section>
  );
}

// Best staking product per coin
export function EarnSection() {
  const best = {};
  for (const p of STAKE_PRODUCTS) if (!best[p.sym] || p.apr > best[p.sym].apr) best[p.sym] = p;
  const list = ['NVX', 'USDT', 'ETH', 'SOL', 'USDC', 'BTC'].map((k) => best[k]).filter(Boolean);
  return (
    <section className="lp-sec">
      <div className="sec-head">
        <h2 className="display sec-title"><Layers size={20} className="accent-text" />{L('持續產生收益', 'Earn while you hold')}</h2>
        <button className="link-btn" onClick={() => go('staking')}>{L('全部產品', 'All products')}<ChevronRight size={14} /></button>
      </div>
      <div className="earn-strip">
        {list.map((p) => (
          <button key={p.id} className="earn-tile" onClick={() => go('staking')}>
            <div className="row-between">
              <span className="row-gap"><CoinIcon sym={p.sym} size={30} /><b>{p.sym}</b></span>
              {p.hot && <span className="pill pill-accent">HOT</span>}
            </div>
            <div className="et-apr mono">{(p.apr * 100).toFixed(1)}<small>%</small></div>
            <span className="muted small">{L('年化收益率', 'APR')} · {p.days ? L(`${p.days} 天定期`, `${p.days}-day fixed`) : L('活期', 'Flexible')}</span>
            <Progress value={p.filled} thin />
            <span className="muted small">{L('已售', 'Filled')} {Math.round(p.filled * 100)}%</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// Proof of reserves and how funds are protected
export function SecuritySection() {
  const reserves = [['BTC', 1.12], ['ETH', 1.09], ['USDT', 1.04], ['USDC', 1.06], ['SOL', 1.11]];
  const pillars = [
    [Vault, L('95% 冷錢包存儲', '95% in cold storage'), L('多地分散的離線多簽錢包，熱錢包僅留日常提幣所需。', 'Offline multi-sig wallets in several regions; hot wallets hold only daily withdrawals.')],
    [ShieldCheck, L('$1.2 億風險保障基金', '$120M protection fund'), L('用於極端行情或安全事件下的用戶賠付。', 'Covers users in extreme markets or security incidents.')],
    [KeyRound, L('多重簽名與風控', 'Multi-sig & risk engine'), L('大額提幣需多方簽名，異常行為即時攔截。', 'Large withdrawals need several signers; unusual activity is blocked in real time.')],
    [BadgeCheck, L('定期第三方審計', 'Regular third-party audits'), L('智能合約與儲備金每季度接受獨立審計。', 'Contracts and reserves are audited independently every quarter.')],
  ];
  return (
    <section className="sec-card">
      <div className="sec-card-head">
        <div>
          <div className="eyebrow"><ShieldCheck size={14} />Security</div>
          <h2 className="display ts-title">{L('你的資產，安全第一', 'Your assets come first')}</h2>
          <p className="muted">{L('每月公佈儲備金證明，用戶資產 1:1 以上足額儲備。', 'Proof of reserves is published monthly. User assets are backed at least 1:1.')}</p>
        </div>
        <div className="por-total"><span>{L('總儲備率', 'Total reserve ratio')}</span><b className="mono up">108%</b></div>
      </div>
      <div className="sec-grid">
        <div className="por">
          <div className="sub-h"><Lock size={16} />{L('儲備金證明', 'Proof of reserves')}<span className="muted small por-date">{dateOnly(now() - 10 * DAY)}</span></div>
          {reserves.map(([sym, r]) => (
            <div key={sym} className="por-row">
              <span className="row-gap"><CoinIcon sym={sym} size={22} /><b>{sym}</b></span>
              <div className="por-bar"><i style={{ width: `${Math.min(100, (r / 1.2) * 100)}%` }} /><em style={{ left: `${(1 / 1.2) * 100}%` }} /></div>
              <b className="mono up">{Math.round(r * 100)}%</b>
            </div>
          ))}
          <p className="fine">{L('虛線為 100% 用戶資產，超出部分為平台自有儲備。', 'The dashed line is 100% of user assets; the rest is the platform’s own reserve.')}</p>
        </div>
        <div className="pillars">
          {pillars.map(([Icon, t, d], i) => (
            <div key={i} className="pillar"><span className="prod-ico"><Icon size={20} /></span><b>{t}</b><span>{d}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Announcements and community links
export function NewsCommunity() {
  const t = now();
  const news = [
    [L('上新', 'Listing'), L('ORIA 免費申購開啟：連接錢包簽名即可領取', 'Free ORIA launch: connect and sign to claim'), t - 1 * DAY, () => go('rewards', 'drop')],
    [L('活動', 'Campaign'), L('邀請好友上線，每位好友獎勵 50 NVX', 'Invite friends: 50 NVX for each one'), t - 3 * DAY, () => go('rewards', 'invite')],
    [L('產品', 'Product'), L('合約新增 TON、LINK 永續，最高 50 倍槓桿', 'TON and LINK perpetuals added, up to 50x'), t - 6 * DAY, () => go('futures', 'TON')],
    [L('公告', 'Notice'), L('10 月儲備金證明報告已發佈，總儲備率 108%', 'October proof of reserves published: 108% total'), t - 10 * DAY, null],
    [L('理財', 'Earn'), L('NVX 180 天定期上線，年化 36%', 'NVX 180-day fixed term launched at 36% APR'), t - 14 * DAY, () => go('staking')],
  ];
  const socials = [
    ['x', 'X', '@NovarixHQ', '486K', '#000000'],
    ['telegram', 'Telegram', 't.me/novarix', '312K', '#26A5E4'],
    ['discord', 'Discord', 'discord.gg/novarix', '128K', '#5865F2'],
    ['youtube', 'YouTube', '@novarix', '54K', '#FF0000'],
  ];
  return (
    <section className="nc">
      <div className="card nc-news">
        <div className="row-between"><h2 className="display sec-title"><Megaphone size={19} className="accent-text" />{L('最新公告', 'Announcements')}</h2></div>
        <div className="news-list">
          {news.map(([tag, title, ts, act], i) => (
            <button key={i} className="news-row" onClick={act || (() => toast(L('公告詳情（演示）', 'Announcement details (demo)'), 'ok', title))}>
              <span className="news-tag">{tag}</span>
              <span className="news-title">{title}</span>
              <span className="mono muted small">{dateOnly(ts)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="card nc-social">
        <h2 className="display sec-title"><Users size={19} className="accent-text" />{L('加入社群', 'Join the community')}</h2>
        <p className="muted small">{L('第一時間獲取上新、活動與空投消息。關注官方帳號還能在活動中心領 NVX。', 'Get listings, campaigns and airdrops first. Following us also earns NVX in the rewards hub.')}</p>
        <div className="soc-grid">
          {socials.map(([k, name, handle, n, bg]) => (
            <button key={k} className="soc-card" onClick={() => go('rewards', 'social')}>
              <span className="soc-logo" style={{ background: bg }}><img src={SOCIAL_LOGOS[k]} alt="" width={20} height={20} /></span>
              <span className="soc-meta"><b>{name}</b><small className="mono">{handle}</small></span>
              <span className="soc-n mono">{n}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  const items = [
    [L(`${BRAND} 是什麼？`, `What is ${BRAND}?`), L(`${BRAND} 是一站式加密資產交易平台，提供現貨、永續合約、兌換、Launchpad 認購、質押理財、借貸與 OTC 買幣。`, `${BRAND} is an all-in-one crypto exchange with spot, perpetual futures, swap, launchpad sales, staking, lending and fiat on-ramps.`)],
    [L('如何開始交易？', 'How do I start trading?'), L('連接 MetaMask 等插件錢包並簽名登入，平台會為你分配專屬充值地址。充值到帳後即可交易，也可以用銀行卡或 P2P 直接買幣。', 'Connect an extension wallet such as MetaMask and sign in. You get your own deposit address; once funds arrive you can trade, or buy crypto with a card or P2P.')],
    [L('免費活動的獎勵怎麼發放？', 'How are campaign rewards paid?'), L('在活動中心點擊領取後，獎勵會空投到你在交易所的專屬地址，區塊確認後自動計入現貨帳戶。', 'When you claim in the rewards hub, the reward is airdropped to your exchange address and added to your spot account after confirmations.')],
    [L('交易手續費是多少？', 'What are the trading fees?'), L('現貨 0.1%，合約 Maker 0.02% / Taker 0.05%。質押 NVX 提升等級，最高可享 25% 手續費折扣。', 'Spot is 0.1%; futures are 0.02% maker and 0.05% taker. Staking NVX raises your tier for up to 25% off.')],
    [L('簽名會不會有風險？', 'Is signing risky?'), L('登入與免費申購使用的是消息簽名，不會發起交易，也不會授權轉走你的資產。請只在官方網址簽名。', 'Sign-in and the free launch use message signatures. They send no transaction and grant no access to your funds. Only sign on the official site.')],
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

export function FinalCta() {
  const s = useApp();
  return (
    <section className="final-cta">
      <div className="banner-grid" />
      <div className="final-cta-in">
        <h2 className="display">{L('現在加入，開始你的加密之旅', 'Join now and start your crypto journey')}</h2>
        <p>{L('連接錢包即可領取新用戶獎勵，免費申購、簽到、邀請好友都能賺 NVX。', 'Connect a wallet to claim new-user rewards, and earn NVX from the free launch, check-ins and invites.')}</p>
        <div className="hero-cta">
          {s.wallet.connected
            ? <Btn size="lg" onClick={() => go('rewards')}><Gift size={17} />{L('前往活動中心', 'Go to rewards')}</Btn>
            : <Btn size="lg" onClick={() => openModal('connect')}><Wallet size={17} />{L('連接錢包', 'Connect wallet')}</Btn>}
          <Btn size="lg" variant="ghost" onClick={() => go('spot')}>{L('先看看行情', 'Browse markets')}<ArrowUpRight size={16} /></Btn>
        </div>
      </div>
      <div className="final-coins">
        {['BTC', 'ETH', 'SOL', 'BNB', 'TON', 'NVX'].map((x) => <CoinIcon key={x} sym={x} size={52} />)}
      </div>
    </section>
  );
}
