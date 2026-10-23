import { useState } from 'react';
import {
  Rocket, CandlestickChart, Activity, Layers, Landmark, BadgeDollarSign, Wallet, Globe, Moon, Sun, Menu, X,
  FlaskConical, FastForward, RotateCcw, Zap, CircleCheck, AlertTriangle, CircleAlert, Droplets, TrendingDown, TrendingUp, ChevronDown,
} from 'lucide-react';
import { BRAND } from '../core/data.js';
import { L, getLang, LANGS } from '../core/lang.js';
import { useApp, useUI, go, openModal, setLangPref, setTheme, fastForward, resetAll, quickFund, faucet, now, toast } from '../core/store.js';
import { useMarket, netStats, shockPrice } from '../core/market.js';
import { shortAddr, dateTime, compact } from '../core/fmt.js';
import { BrandMark, cx, Btn } from '../ui/kit.jsx';

export const NAV = [
  ['launchpad', Rocket, ['认购', 'Launchpad']],
  ['spot', CandlestickChart, ['现货', 'Spot']],
  ['futures', Activity, ['合约', 'Futures']],
  ['staking', Layers, ['质押', 'Staking']],
  ['lending', Landmark, ['借贷', 'Lending']],
  ['otc', BadgeDollarSign, ['OTC 买币', 'Buy crypto']],
];

export function Header() {
  const s = useApp();
  const { route } = useUI();
  const [drawer, setDrawer] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const page = route.page === 'project' ? 'launchpad' : route.page;
  const dark = document.documentElement.dataset.resolved === 'dark';
  return (
    <header className="hdr">
      <div className="hdr-in">
        <button className="brand" onClick={() => go('launchpad')} aria-label={BRAND}>
          <BrandMark size={30} />
          <span className="brand-name">Nova<b>rix</b></span>
        </button>
        <nav className="nav">
          {NAV.map(([k, Icon, [zh, en]]) => (
            <button key={k} className={cx('nav-item', page === k && 'on')} onClick={() => go(k)}>
              <Icon size={16} />{L(zh, en)}
            </button>
          ))}
        </nav>
        <div className="hdr-right">
          <div className="lang">
            <button className="chip-btn" onClick={() => setLangOpen(!langOpen)} aria-haspopup="listbox" aria-expanded={langOpen}><Globe size={15} />{LANGS.find((x) => x.code === getLang())?.short}<ChevronDown size={14} /></button>
            {langOpen && (
              <div className="lang-pop" role="listbox" onMouseLeave={() => setLangOpen(false)}>
                {LANGS.map((x) => (
                  <button key={x.code} role="option" aria-selected={getLang() === x.code} className={cx(getLang() === x.code && 'on')} onClick={() => { setLangPref(x.code); setLangOpen(false); }}>
                    {x.label}<span className="lang-code">{x.short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="icon-btn ring" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={L('切换主题', 'Toggle theme')}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className={cx('chip-btn hide-sm', page === 'wallet' && 'on')} onClick={() => go('wallet')}><Wallet size={15} />{L('钱包', 'Wallet')}</button>
          {s.wallet.connected ? (
            <button className="addr-btn" onClick={() => openModal('account')}>
              <span className="orb" style={orbStyle(s.wallet.address)} />
              <span className="mono">{shortAddr(s.wallet.address)}</span>
            </button>
          ) : (
            <Btn size="sm" onClick={() => openModal('connect')}><Wallet size={15} />{L('连接钱包', 'Connect')}</Btn>
          )}
          <button className="icon-btn burger" onClick={() => setDrawer(true)} aria-label="Menu"><Menu size={18} /></button>
        </div>
      </div>
      {drawer && (
        <div className="drawer-wrap" onClick={() => setDrawer(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <span className="brand-name">Nova<b>rix</b></span>
              <button className="icon-btn" onClick={() => setDrawer(false)}><X size={18} /></button>
            </div>
            {[...NAV, ['wallet', Wallet, ['钱包', 'Wallet']]].map(([k, Icon, [zh, en]]) => (
              <button key={k} className={cx('drawer-item', page === k && 'on')} onClick={() => { go(k); setDrawer(false); }}>
                <Icon size={18} />{L(zh, en)}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function orbStyle(addr = '') {
  const h1 = parseInt(addr.slice(2, 5) || '0', 16) % 360;
  const h2 = (h1 + 70) % 360;
  return { background: `radial-gradient(circle at 30% 28%, hsl(${h1} 95% 78%), hsl(${h1} 80% 52%) 45%, hsl(${h2} 70% 30%))` };
}

export function Footer() {
  useMarket();
  const s = useApp();
  const st = netStats();
  return (
    <footer className="statusbar">
      <div className="statusbar-in">
        <span className="sb-item"><i className="live-dot" />{L('网络连接：健康', 'Network: healthy')}</span>
        <span className="sb-tag">MAINNET</span>
        <span className="sb-item mono">{L('延迟', 'Latency')} {st.latency}ms</span>
        {s.clockOffset > 0 && <span className="sb-item sb-warn"><FastForward size={13} />{L('模拟时间', 'Sim time')} {dateTime(now())}</span>}
        <span className="sb-spacer" />
        <span className="sb-item">{L('加密市场总值', 'Crypto market cap')} <b className="mono">${compact(st.mcap)}</b></span>
        <span className="sb-item">Gas <b className="mono">{st.gas} Gwei</b></span>
      </div>
    </footer>
  );
}

export function Toasts() {
  const { toasts } = useUI();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={cx('toast', 'toast-' + t.kind)}>
          <span className="toast-ico">{t.kind === 'err' ? <CircleAlert size={18} /> : t.kind === 'warn' ? <AlertTriangle size={18} /> : <CircleCheck size={18} />}</span>
          <div>
            <div className="toast-msg">{t.msg}</div>
            {t.sub && <div className="toast-sub">{t.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DemoPanel() {
  const s = useApp();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const ff = (ms, label) => { fastForward(ms); toast(L('时间已快进', 'Clock moved forward'), 'ok', label); };
  return (
    <div className={cx('demo', open && 'open')}>
      {open && (
        <div className="demo-panel">
          <div className="demo-head">
            <b><FlaskConical size={16} />{L('演示控制台', 'Demo console')}</b>
            <button className="icon-btn" onClick={() => setOpen(false)}><X size={16} /></button>
          </div>
          <p className="demo-note">{L('这里的操作只影响本机的演示数据，方便快速体验完整流程。', 'These controls only change demo data in this browser.')}</p>
          <div className="demo-sec">{L('资金', 'Funds')}</div>
          <div className="demo-grid">
            <Btn variant="soft" size="sm" onClick={() => { if (!s.wallet.connected) { openModal('connect'); return; } quickFund(); toast(L('已入金到现货账户', 'Funded spot account'), 'ok', '10,000 USDT · 5,000 USDC · 25,000 NVX'); }}><Zap size={14} />{L('一键入金', 'Quick fund')}</Btn>
            <Btn variant="soft" size="sm" onClick={() => { faucet(); toast(L('插件钱包已领取测试币', 'Test tokens sent to wallet')); }}><Droplets size={14} />{L('钱包领测试币', 'Wallet faucet')}</Btn>
          </div>
          <div className="demo-sec">{L('时间快进', 'Fast-forward')} <span className="mono muted">{dateTime(now())}</span></div>
          <div className="demo-grid four">
            <Btn variant="soft" size="sm" onClick={() => ff(3600e3, '+1h')}>+1h</Btn>
            <Btn variant="soft" size="sm" onClick={() => ff(86400e3, '+1d')}>+1d</Btn>
            <Btn variant="soft" size="sm" onClick={() => ff(7 * 86400e3, '+7d')}>+7d</Btn>
            <Btn variant="soft" size="sm" onClick={() => ff(30 * 86400e3, '+30d')}>+30d</Btn>
          </div>
          <div className="demo-sec">{L('行情冲击（测试强平/清算）', 'Price shock (test liquidations)')}</div>
          <div className="demo-grid four">
            <Btn variant="soft" size="sm" onClick={() => shockPrice('BTC', 0.92)}><TrendingDown size={14} />BTC</Btn>
            <Btn variant="soft" size="sm" onClick={() => shockPrice('BTC', 1.08)}><TrendingUp size={14} />BTC</Btn>
            <Btn variant="soft" size="sm" onClick={() => shockPrice('ETH', 0.9)}><TrendingDown size={14} />ETH</Btn>
            <Btn variant="soft" size="sm" onClick={() => shockPrice('ETH', 1.1)}><TrendingUp size={14} />ETH</Btn>
          </div>
          <div className="demo-sec" />
          {confirmReset ? (
            <div className="demo-grid">
              <Btn variant="down" size="sm" onClick={() => { resetAll(); setConfirmReset(false); toast(L('演示数据已重置', 'Demo data reset')); }}>{L('确认重置', 'Confirm reset')}</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>{L('取消', 'Cancel')}</Btn>
            </div>
          ) : (
            <Btn variant="ghost" size="sm" block onClick={() => setConfirmReset(true)}><RotateCcw size={14} />{L('重置全部演示数据', 'Reset all demo data')}</Btn>
          )}
        </div>
      )}
      <button className="demo-fab" onClick={() => setOpen(!open)} aria-label={L('演示控制台', 'Demo console')}>
        <FlaskConical size={18} /><span>{L('演示', 'Demo')}</span>
      </button>
    </div>
  );
}

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="aurora a1" />
      <div className="aurora a2" />
      <div className="aurora a3" />
      <div className="gridlines" />
    </div>
  );
}

// Section header used across pages
export function PageHead({ eyebrow, title, sub, right }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="display">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {right && <div className="page-head-right">{right}</div>}
    </div>
  );
}

// Shown in place of actions when no wallet is connected
export function ConnectGate({ text }) {
  return (
    <Btn block size="lg" onClick={() => openModal('connect')}><Wallet size={17} />{text || L('连接钱包并登录', 'Connect wallet & sign in')}</Btn>
  );
}

// ----------------------------------------------------------------------------
// Site footer
// ----------------------------------------------------------------------------
const SOCIAL = [
  ['X', 'M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3zm-1.08 16.2h1.7L7.4 4.73H5.58l11.09 14.47z'],
  ['Telegram', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.64 6.8-1.64 7.73c-.12.55-.45.68-.91.42l-2.5-1.84-1.2 1.16c-.13.13-.25.25-.51.25l.18-2.55 4.64-4.19c.2-.18-.04-.28-.31-.1L8.67 13.3l-2.47-.77c-.54-.17-.55-.54.11-.8l9.65-3.72c.45-.16.84.11.68.79z'],
  ['Discord', 'M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15 15 0 0 0-5.4 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C2.1 9.2 1.4 13 1.7 16.7a16.7 16.7 0 0 0 5 2.5l1.1-1.7c-.6-.2-1.2-.5-1.8-.9l.4-.3a11.9 11.9 0 0 0 11.2 0l.4.3c-.6.4-1.2.7-1.8.9l1.1 1.7a16.6 16.6 0 0 0 5-2.5c.4-4.3-.6-8-2.9-11.4zM8.7 14.4c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z'],
  ['YouTube', 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z'],
  ['Medium', 'M13 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0zm6.6 0c0 3.2-1.4 5.7-3.1 5.7s-3.1-2.5-3.1-5.7 1.4-5.7 3.1-5.7 3.1 2.5 3.1 5.7zM23 12c0 2.9-.5 5.2-1.1 5.2s-1.1-2.3-1.1-5.2.5-5.2 1.1-5.2S23 9.1 23 12z'],
  ['GitHub', 'M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z'],
  ['Reddit', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5.9 11.2c0 2.6-2.6 4.4-5.9 4.4s-5.9-1.8-5.9-4.4c0-.6.1-1.1.4-1.5a1.4 1.4 0 1 1 1.6-2.2c1-.6 2.3-1 3.7-1l.8-3.4 2.5.6a1.1 1.1 0 1 1-.2.9l-1.8-.4-.6 2.3c1.4 0 2.6.4 3.6 1a1.4 1.4 0 1 1 1.6 2.2c.1.4.2.9.2 1.5zM9.4 13.6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm5.2 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-.3 1.7c-.6.5-1.4.7-2.3.7s-1.7-.2-2.3-.7l-.4.5c.7.6 1.7.9 2.7.9s2-.3 2.7-.9l-.4-.5z'],
];

export function SiteFooter() {
  const ext = () => toast(L('演示环境不打开外部链接', 'External links are disabled in this demo'), 'warn');
  const cols = [
    [L('关于', 'About'), [[L('关于我们', 'About us')], [L('公告中心', 'Announcements')], [L('新闻与媒体', 'Press')], [L('加入我们', 'Careers')], [L('品牌资源', 'Brand kit')], [L('联系我们', 'Contact')]]],
    [L('产品', 'Products'), NAV.map(([k, , [zh, en]]) => [L(zh, en), k])],
    [L('服务', 'Services'), [[L('帮助中心', 'Help center')], [L('API 文档', 'API docs')], [L('费率标准', 'Fees')], [L('上币申请', 'Listing application')], [L('机构服务', 'Institutional')], [L('VIP 计划', 'VIP program')]]],
    [L('合规与安全', 'Legal & security'), [[L('用户协议', 'Terms of use')], [L('隐私政策', 'Privacy policy')], [L('风险披露', 'Risk disclosure')], [L('储备金证明', 'Proof of reserves')], [L('漏洞赏金', 'Bug bounty')], [L('执法请求', 'Law enforcement')]]],
  ];
  return (
    <footer className="site-foot">
      <div className="sf-in">
        <div className="sf-top">
          <div className="sf-brand">
            <div className="brand"><BrandMark size={30} /><span className="brand-name">Nova<b>rix</b></span></div>
            <p>{L('安全、透明的一站式数字资产平台：认购、交易、质押与借贷。', 'One secure, transparent home for launches, trading, staking and lending.')}</p>
            <div className="sf-social" aria-label={L('社区', 'Community')}>
              {SOCIAL.map(([name, d]) => (
                <button key={name} onClick={ext} aria-label={name} title={name}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d={d} fill="currentColor" fillRule="evenodd" /></svg>
                </button>
              ))}
            </div>
            <div className="sf-apps">
              <button onClick={ext}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.9-.9-3.1-.8c-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.1.8c1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.6-1-2.7-4.2zM14.1 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z" /></svg><span><small>Download on the</small>App Store</span></button>
              <button onClick={ext}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1zm11 8.5 2.6-2.6 3.3 1.9c.9.5.9 1.4 0 1.9l-3.3 1.9-2.6-2.6v-.5zm-1-.9L5 1.3l10.8 6.2-2.2 2.4zm0 4.2 2.2 2.4L5 22.7l8.6-8.6z" /></svg><span><small>GET IT ON</small>Google Play</span></button>
            </div>
          </div>
          {cols.map(([title, links]) => (
            <div key={title} className="sf-col">
              <b>{title}</b>
              {links.map(([label, route]) => (
                <button key={label} onClick={() => (route ? go(route) : ext())}>{label}</button>
              ))}
            </div>
          ))}
        </div>
        <div className="sf-risk">
          {L('风险提示：数字资产价格波动剧烈，交易、合约与借贷可能导致本金全部损失。请在充分了解风险并结合自身情况后谨慎参与。本平台服务不面向受限司法辖区的用户。', 'Risk warning: digital asset prices are highly volatile. Trading, derivatives and lending can result in the loss of your entire principal. Participate only after you understand the risks. Services are not available in restricted jurisdictions.')}
        </div>
        <div className="sf-bottom">
          <span>© 2026 Novarix. {L('保留所有权利。', 'All rights reserved.')}</span>
          <span className="sf-demo">{L('本页面为产品原型，所有项目、行情与资金数据均为模拟。', 'Product prototype: all projects, prices and balances are simulated.')}</span>
        </div>
      </div>
    </footer>
  );
}
