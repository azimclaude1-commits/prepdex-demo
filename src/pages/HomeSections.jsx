// Extra home page sections: ticker tape, launches, trading, earn, security, news, FAQ and a closing call to action.
import { useState } from 'react';
import {
  Rocket, Clock, ChevronRight, ChevronDown, ChevronLeft, Zap, Target, ShieldCheck, Lock, Vault, KeyRound, Landmark, Layers, Megaphone,
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
const NEWS_PAGE = 5;

// Announcements (paged) and community links
export function NewsCommunity() {
  const t = now();
  const [page, setPage] = useState(0);
  const news = [
    [L('上新', 'Listing'), L('ORIA 免費申購開啟：連接錢包簽名即可領取', 'Free ORIA launch: connect and sign to claim'), t - 1 * DAY, () => go('rewards', 'drop')],
    [L('活動', 'Campaign'), L('邀請好友活動上線，好友連接錢包後雙方各得 2 USDT', 'Invite friends: you and each friend get 2 USDT when they connect'), t - 3 * DAY, () => go('rewards', 'invite')],
    [L('活動', 'Campaign'), L('每日簽到改為每週一輪，連續 7 天共 10 USDT', 'Daily check-in now runs weekly: 10 USDT for 7 days in a row'), t - 4 * DAY, () => go('rewards', 'checkin')],
    [L('產品', 'Product'), L('合約新增 TON、LINK 永續，最高 50 倍槓桿', 'TON and LINK perpetuals added, up to 50x'), t - 6 * DAY, () => go('futures', 'TON')],
    [L('上新', 'Listing'), L('ZEPH/USDT 現貨交易對上線', 'ZEPH/USDT spot pair listed'), t - 8 * DAY, () => go('spot', 'ZEPH_USDT')],
    [L('公告', 'Notice'), L('10 月儲備金證明報告已發佈，總儲備率 108%', 'October proof of reserves published: 108% total'), t - 10 * DAY, null],
    [L('產品', 'Product'), L('一鍵兌換上線，支援 21 個幣種', 'Swap launched with 21 coins'), t - 12 * DAY, () => go('swap')],
    [L('理財', 'Earn'), L('NVX 180 天定期上線，年化 36%', 'NVX 180-day fixed term launched at 36% APR'), t - 14 * DAY, () => go('staking')],
    [L('公告', 'Notice'), L('OTC 新增 MoonPay、Banxa 銀行卡買幣渠道', 'MoonPay and Banxa card on-ramps added to OTC'), t - 17 * DAY, () => go('otc')],
    [L('維護', 'Maintenance'), L('錢包系統升級完成，充提已恢復', 'Wallet upgrade complete; deposits and withdrawals resumed'), t - 20 * DAY, null],
    [L('上新', 'Listing'), L('LUMN Launchpad 認購完成，超募 4.2 倍', 'LUMN launchpad sale closed, 4.2x oversubscribed'), t - 24 * DAY, () => go('launchpad')],
    [L('產品', 'Product'), L('借貸市場上線，支援 6 種資產抵押借款', 'Lending launched with 6 collateral assets'), t - 28 * DAY, () => go('lending')],
  ];
  const pages = Math.ceil(news.length / NEWS_PAGE);
  const rows = news.slice(page * NEWS_PAGE, page * NEWS_PAGE + NEWS_PAGE);
  const socials = [
    ['x', 'X', '@NovarixHQ', '486K', '#000000', L('上新與活動第一時間發佈', 'Listings and campaigns first')],
    ['telegram', 'Telegram', 't.me/novarix', '312K', '#26A5E4', L('中文社群，客服全天在線', 'Community chat with 24/7 support')],
    ['discord', 'Discord', 'discord.gg/novarix', '128K', '#5865F2', L('交易討論與 AMA 活動', 'Trading talk and AMAs')],
    ['youtube', 'YouTube', '@novarix', '54K', '#FF0000', L('產品教學與每週行情', 'Tutorials and weekly market recaps')],
  ];
  return (
    <section className="nc">
      <div className="card nc-news">
        <div className="row-between"><h2 className="display sec-title"><Megaphone size={19} className="accent-text" />{L('最新公告', 'Announcements')}</h2><span className="muted small">{L(`共 ${news.length} 條`, `${news.length} posts`)}</span></div>
        <div className="news-list">
          {rows.map(([tag, title, ts, act], i) => (
            <button key={page + '-' + i} className="news-row" onClick={act || (() => toast(L('公告詳情（演示）', 'Announcement details (demo)'), 'ok', title))}>
              <span className="news-tag">{tag}</span>
              <span className="news-title">{title}</span>
              <span className="mono muted small">{dateOnly(ts)}</span>
            </button>
          ))}
        </div>
        <div className="pager">
          <button className="pager-btn" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label={L('上一頁', 'Previous page')}><ChevronLeft size={16} /></button>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={cx('pager-btn', i === page && 'on')} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
          <button className="pager-btn" disabled={page === pages - 1} onClick={() => setPage(page + 1)} aria-label={L('下一頁', 'Next page')}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="card nc-social">
        <h2 className="display sec-title"><Users size={19} className="accent-text" />{L('加入社群', 'Join the community')}</h2>
        <p className="muted small">{L('獲取上新與活動消息。', 'News on listings and campaigns.')}</p>
        <div className="soc-grid">
          {socials.map(([k, name, handle, n, bg, desc]) => (
            <button key={k} className="soc-card" onClick={() => go('rewards', 'social')}>
              <span className="soc-top">
                <span className="soc-logo" style={{ background: bg }}><img src={SOCIAL_LOGOS[k]} alt="" width={22} height={22} /></span>
                <span className="soc-meta"><b>{name}</b><small className="mono">{handle}</small></span>
                <ArrowUpRight size={16} className="muted" />
              </span>
              <span className="soc-desc">{desc}</span>
              <span className="soc-n"><b className="mono">{n}</b><small>{L('關注者', 'followers')}</small></span>
            </button>
          ))}
        </div>
        <button className="soc-cta" onClick={() => go('rewards', 'social')}>
          <Gift size={16} /><span>{L('關注官方帳號，在活動中心領取最高 15 USDT', 'Follow us and claim up to 15 USDT in the rewards hub')}</span><ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  const items = [
    [L(`${BRAND} 是什麼？`, `What is ${BRAND}?`), L(`${BRAND} 是一站式加密資產交易平台，提供現貨、永續合約、兌換、Launchpad 認購、質押理財、借貸與 OTC 買幣。`, `${BRAND} is an all-in-one crypto exchange with spot, perpetual futures, swap, launchpad sales, staking, lending and fiat on-ramps.`)],
    [L('如何開始交易？', 'How do I start trading?'), L('連接 MetaMask 等插件錢包並簽名登入，平台會為你分配專屬充值地址。充值到帳後即可交易，也可以用銀行卡或 P2P 直接買幣。', 'Connect an extension wallet such as MetaMask and sign in. You get your own deposit address; once funds arrive you can trade, or buy crypto with a card or P2P.')],
    [L('活動獎勵怎麼發放？', 'How are campaign rewards paid?'), L('所有活動獎勵（包括 ORIA 申購）都由平台直接記入你的現貨帳戶，點擊領取即到帳。', 'Every campaign reward, including the ORIA launch, is booked straight to your spot account when you claim.')],
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

// Banner shown above the campaign cards on the home page
export function CampBanner() {
  const s = useApp();
  return (
    <div className="final-cta">
      <div className="banner-grid" />
      <div className="final-cta-in">
        <h2 className="display">{L('連接錢包，參與活動', 'Connect a wallet and join in')}</h2>
        <p>{L('完成簽到、關注社媒、答題或邀請好友，領取 USDT 獎勵；簽名申購 ORIA 不需要付款。', 'Check in, follow us, take the quiz or invite friends to earn USDT. Subscribing to ORIA takes a signature, no payment.')}</p>
        <div className="hero-cta">
          {s.wallet.connected
            ? <Btn onClick={() => go('rewards')}><Gift size={16} />{L('前往活動中心', 'Go to rewards')}</Btn>
            : <Btn onClick={() => openModal('connect')}><Wallet size={16} />{L('連接錢包', 'Connect wallet')}</Btn>}
          <Btn variant="ghost" onClick={() => go('spot')}>{L('先看看行情', 'Browse markets')}<ArrowUpRight size={16} /></Btn>
        </div>
      </div>
      <div className="final-coins">
        {['BTC', 'ETH', 'SOL', 'BNB', 'TON', 'NVX'].map((x) => <CoinIcon key={x} sym={x} size={52} />)}
      </div>
    </div>
  );
}
