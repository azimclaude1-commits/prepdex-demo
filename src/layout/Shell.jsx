import { useEffect, useRef, useState } from 'react';
import {
  Rocket, CandlestickChart, Activity, ArrowLeftRight, Layers, Landmark, BadgeDollarSign, Wallet, Globe, Moon, Sun, Menu, X,
  FlaskConical, FastForward, RotateCcw, Zap, CircleCheck, AlertTriangle, CircleAlert, Droplets, TrendingDown, TrendingUp, ChevronDown,
} from 'lucide-react';
import { BRAND } from '../core/data.js';
import { L, getLang, LANGS } from '../core/lang.js';
import { useApp, useUI, go, openModal, setLangPref, setTheme, fastForward, resetAll, quickFund, faucet, now, toast } from '../core/store.js';
import { useMarket, netStats, shockPrice } from '../core/market.js';
import { shortAddr, dateTime, compact } from '../core/fmt.js';
import { BrandMark, cx, Btn } from '../ui/kit.jsx';

export const NAV = [
  ['launchpad', Rocket, ['認購', 'Launchpad']],
  ['spot', CandlestickChart, ['現貨', 'Spot']],
  ['futures', Activity, ['合約', 'Futures']],
  ['swap', ArrowLeftRight, ['兌換', 'Swap']],
  ['staking', Layers, ['質押', 'Staking']],
  ['lending', Landmark, ['借貸', 'Lending']],
  ['otc', BadgeDollarSign, ['OTC 買幣', 'Buy crypto']],
];

export function Header() {
  const s = useApp();
  const { route } = useUI();
  // one header menu open at a time: 'lang' | 'nav' | null
  const [menu, setMenu] = useState(null);
  const hdrRef = useRef(null);
  const langOpen = menu === 'lang';
  const toggle = (m) => setMenu((cur) => (cur === m ? null : m));
  useEffect(() => {
    if (!menu) return;
    const out = (e) => hdrRef.current && !hdrRef.current.contains(e.target) && setMenu(null);
    const esc = (e) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('pointerdown', out);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', out); window.removeEventListener('keydown', esc); };
  }, [menu]);
  useEffect(() => setMenu(null), [route.page, route.arg]);
  const page = route.page === 'project' ? 'launchpad' : route.page;
  const dark = document.documentElement.dataset.resolved === 'dark';
  return (
    <header className="hdr" ref={hdrRef}>
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
            <button className={cx('chip-btn', langOpen && 'on')} onClick={() => toggle('lang')} aria-haspopup="listbox" aria-expanded={langOpen}><Globe size={15} />{LANGS.find((x) => x.code === getLang())?.short}<ChevronDown size={14} /></button>
            {langOpen && (
              <div className="lang-pop" role="listbox">
                {LANGS.map((x) => (
                  <button key={x.code} role="option" aria-selected={getLang() === x.code} className={cx(getLang() === x.code && 'on')} onClick={() => { setLangPref(x.code); setMenu(null); }}>
                    {x.label}<span className="lang-code">{x.short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="icon-btn ring" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={L('切換主題', 'Toggle theme')}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className={cx('chip-btn hide-sm', page === 'wallet' && 'on')} onClick={() => go('wallet')}><Wallet size={15} />{L('錢包', 'Wallet')}</button>
          {s.wallet.connected ? (
            <button className="addr-btn" onClick={() => openModal('account')}>
              <span className="orb" style={orbStyle(s.wallet.address)} />
              <span className="mono">{shortAddr(s.wallet.address)}</span>
            </button>
          ) : (
            <Btn size="sm" onClick={() => openModal('connect')}><Wallet size={15} />{L('連接錢包', 'Connect')}</Btn>
          )}
          <button className={cx('icon-btn burger', menu === 'nav' && 'on')} onClick={() => toggle('nav')} aria-label={L('選單', 'Menu')} aria-expanded={menu === 'nav'}>{menu === 'nav' ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      {menu === 'nav' && (
        <div className="nav-pop" role="menu">
          {[...NAV, ['wallet', Wallet, ['錢包', 'Wallet']]].map(([k, Icon, [zh, en]]) => (
            <button key={k} role="menuitem" className={cx('nav-pop-item', page === k && 'on')} onClick={() => { go(k); setMenu(null); }}>
              <Icon size={17} />{L(zh, en)}
            </button>
          ))}
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
        <span className="sb-item"><i className="live-dot" />{L('網路連接：健康', 'Network: healthy')}</span>
        <span className="sb-tag">MAINNET</span>
        <span className="sb-item mono">{L('延遲', 'Latency')} {st.latency}ms</span>
        {s.clockOffset > 0 && <span className="sb-item sb-warn"><FastForward size={13} />{L('模擬時間', 'Sim time')} {dateTime(now())}</span>}
        <span className="sb-spacer" />
        <span className="sb-item">{L('加密市場總值', 'Crypto market cap')} <b className="mono">${compact(st.mcap)}</b></span>
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
  const ff = (ms, label) => { fastForward(ms); toast(L('時間已快進', 'Clock moved forward'), 'ok', label); };
  return (
    <div className={cx('demo', open && 'open')}>
      {open && (
        <div className="demo-panel">
          <div className="demo-head">
            <b><FlaskConical size={16} />{L('演示控制檯', 'Demo console')}</b>
            <button className="icon-btn" onClick={() => setOpen(false)}><X size={16} /></button>
          </div>
          <p className="demo-note">{L('這裡的操作隻影響本機的演示數據，方便快速體驗完整流程。', 'These controls only change demo data in this browser.')}</p>
          <div className="demo-sec">{L('資金', 'Funds')}</div>
          <div className="demo-grid">
            <Btn variant="soft" size="sm" onClick={() => { if (!s.wallet.connected) { openModal('connect'); return; } quickFund(); toast(L('已入金到現貨帳戶', 'Funded spot account'), 'ok', '10,000 USDT · 5,000 USDC · 25,000 NVX'); }}><Zap size={14} />{L('一鍵入金', 'Quick fund')}</Btn>
            <Btn variant="soft" size="sm" onClick={() => { faucet(); toast(L('插件錢包已領取測試幣', 'Test tokens sent to wallet')); }}><Droplets size={14} />{L('錢包領測試幣', 'Wallet faucet')}</Btn>
          </div>
          <div className="demo-sec">{L('時間快進', 'Fast-forward')} <span className="mono muted">{dateTime(now())}</span></div>
          <div className="demo-grid four">
            <Btn variant="soft" size="sm" onClick={() => ff(3600e3, '+1h')}>+1h</Btn>
            <Btn variant="soft" size="sm" onClick={() => ff(86400e3, '+1d')}>+1d</Btn>
            <Btn variant="soft" size="sm" onClick={() => ff(7 * 86400e3, '+7d')}>+7d</Btn>
            <Btn variant="soft" size="sm" onClick={() => ff(30 * 86400e3, '+30d')}>+30d</Btn>
          </div>
          <div className="demo-sec">{L('行情衝擊（測試強平/清算）', 'Price shock (test liquidations)')}</div>
          <div className="demo-grid four">
            <Btn variant="soft" size="sm" onClick={() => shockPrice('BTC', 0.92)}><TrendingDown size={14} />BTC</Btn>
            <Btn variant="soft" size="sm" onClick={() => shockPrice('BTC', 1.08)}><TrendingUp size={14} />BTC</Btn>
            <Btn variant="soft" size="sm" onClick={() => shockPrice('ETH', 0.9)}><TrendingDown size={14} />ETH</Btn>
            <Btn variant="soft" size="sm" onClick={() => shockPrice('ETH', 1.1)}><TrendingUp size={14} />ETH</Btn>
          </div>
          <div className="demo-sec" />
          {confirmReset ? (
            <div className="demo-grid">
              <Btn variant="down" size="sm" onClick={() => { resetAll(); setConfirmReset(false); toast(L('演示數據已重置', 'Demo data reset')); }}>{L('確認重置', 'Confirm reset')}</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>{L('取消', 'Cancel')}</Btn>
            </div>
          ) : (
            <Btn variant="ghost" size="sm" block onClick={() => setConfirmReset(true)}><RotateCcw size={14} />{L('重置全部演示數據', 'Reset all demo data')}</Btn>
          )}
        </div>
      )}
      <button className="demo-fab" onClick={() => setOpen(!open)} aria-label={L('演示控制檯', 'Demo console')}>
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
    <Btn block size="lg" onClick={() => openModal('connect')}><Wallet size={17} />{text || L('連接錢包並登入', 'Connect wallet & sign in')}</Btn>
  );
}
