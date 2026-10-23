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
