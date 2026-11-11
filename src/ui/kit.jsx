import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Copy, Search, ChevronDown, Inbox, Loader2 } from 'lucide-react';
import { COIN, PROJECTS, FREE_DROP } from '../core/data.js';
import { COIN_LOGOS } from '../core/logos.js';
import { L } from '../core/lang.js';
import { toast } from '../core/store.js';

export function cx(...a) { return a.filter(Boolean).join(' '); }

// True while the media query matches (e.g. phone widths)
export function useMedia(query) {
  const get = () => (typeof matchMedia !== 'undefined' ? matchMedia(query).matches : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    const mq = matchMedia(query);
    const h = (e) => setM(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [query]);
  return m;
}
export const PHONE = '(max-width: 860px)';

// Keeps an open popover inside the screen by shifting it sideways when it would overflow.
export function useFitPopover(open) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    const pad = 12;
    const W = document.documentElement.clientWidth;
    let dx = 0;
    if (r.right > W - pad) dx = W - pad - r.right;
    if (r.left + dx < pad) dx = pad - r.left;
    if (dx) el.style.transform = `translateX(${Math.round(dx)}px)`;
  });
  return ref;
}

// Closes a popover when the pointer goes down outside its wrapper
export function useOutside(open, close) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && close();
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [open]);
  return ref;
}

// Styled replacement for <select>, matching the app's other dropdowns.
// options: [[value, label, dotColor?]]
export function Select({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false);
  const wrap = useOutside(open, () => setOpen(false));
  const pop = useFitPopover(open);
  const cur = options.find((o) => o[0] === value) || options[0];
  return (
    <div className="csel csel-compact dd" ref={wrap}>
      <button type="button" className="csel-btn" onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open} aria-label={label}>
        {cur[2] && <i className="dd-dot" style={{ background: cur[2] }} />}<span className="dd-cur">{cur[1]}</span><ChevronDown size={15} className="csel-caret" />
      </button>
      {open && (
        <div className="csel-pop" ref={pop} role="listbox">
          <div className="csel-list">
            {options.map(([v, l, c]) => (
              <button key={v} role="option" aria-selected={v === value} className={cx('csel-item', v === value && 'on')} onClick={() => { onChange(v); setOpen(false); }}>
                {c ? <i className="dd-dot" style={{ background: c }} /> : <i className="dd-dot none" />}<span className="dd-label">{l}</span>{v === value && <Check size={14} className="accent-text" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Btn({ variant = 'primary', size = 'md', block, loading, className, children, ...rest }) {
  return (
    <button className={cx('btn', `btn-${variant}`, `btn-${size}`, block && 'btn-block', className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 size={16} className="spin" />}
      {children}
    </button>
  );
}

// Overlays render into <body> so ancestors with backdrop-filter or transforms
// cannot trap their fixed positioning.
export function Portal({ children }) {
  return createPortal(children, document.body);
}

export function Modal({ title, onClose, width = 460, children, className, icon }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    document.body.classList.add('no-scroll');
    return () => { window.removeEventListener('keydown', k); document.body.classList.remove('no-scroll'); };
  }, [onClose]);
  return createPortal(
    <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cx('modal', className)} style={{ maxWidth: width }} role="dialog" aria-modal="true">
        {title != null && (
          <div className="modal-head">
            <div className="modal-title">{icon}{title}</div>
            <button className="icon-btn" onClick={onClose} aria-label={L('關閉', 'Close')}><X size={18} /></button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Tabs({ items, value, onChange, variant = 'pill', className, size }) {
  return (
    <div className={cx('tabs', `tabs-${variant}`, size && `tabs-${size}`, className)} role="tablist">
      {items.map(([k, label, badge]) => (
        <button key={k} role="tab" aria-selected={value === k} className={cx('tab', value === k && 'on')} onClick={() => onChange(k)}>
          {label}
          {badge != null && <span className="tab-badge">{badge}</span>}
        </button>
      ))}
    </div>
  );
}

export function NumInput({ id, label, value, onChange, suffix, right, placeholder = '0.00', hint, error, disabled, autoFocus }) {
  return (
    <label className={cx('num', error && 'num-err', disabled && 'num-dis')} htmlFor={id}>
      {label && <span className="num-label">{label}</span>}
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => {
          const v = e.target.value.replace(/,/g, '.');
          if (v === '' || /^\d*\.?\d*$/.test(v)) onChange(v);
        }}
      />
      {right}
      {suffix && <span className="num-suffix">{suffix}</span>}
      {hint && <span className="num-hint">{hint}</span>}
    </label>
  );
}

export function PctRow({ onPick, value }) {
  return (
    <div className="pct-row">
      {[25, 50, 75, 100].map((p) => (
        <button key={p} className={cx('pct', value === p && 'on')} onClick={() => onPick(p)}>{p === 100 ? 'MAX' : p + '%'}</button>
      ))}
    </div>
  );
}

export function Slider({ value, onChange, min = 0, max = 100, marks = [0, 25, 50, 75, 100], suffix = '%', id }) {
  const pctv = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider">
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} style={{ '--p': pctv + '%' }} />
      <div className="slider-marks">
        {marks.map((mk) => (
          <button key={mk} className={cx(value >= mk && 'on')} style={{ left: ((mk - min) / (max - min)) * 100 + '%' }} onClick={() => onChange(mk)}>{mk}{suffix}</button>
        ))}
      </div>
    </div>
  );
}

export function Progress({ value, max = 1, tone, thin, glow }) {
  const p = Math.max(0, Math.min(1, value / max));
  return (
    <div className={cx('prog', thin && 'prog-thin', tone && `prog-${tone}`, glow && 'prog-glow')}>
      <div className="prog-fill" style={{ width: p * 100 + '%' }} />
    </div>
  );
}

export function Pill({ tone = 'muted', children, dot, className }) {
  return <span className={cx('pill', `pill-${tone}`, className)}>{dot && <i className="pill-dot" />}{children}</span>;
}

export function Empty({ text, icon, children }) {
  return (
    <div className="empty">
      <div className="empty-ico">{icon || <Inbox size={26} />}</div>
      <div>{text || L('暫無數據', 'Nothing here yet')}</div>
      {children}
    </div>
  );
}

export function CopyBtn({ text, label }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={(e) => {
        e.stopPropagation();
        const done = () => { setOk(true); toast(L('已複製', 'Copied')); setTimeout(() => setOk(false), 1500); };
        try {
          navigator.clipboard.writeText(text).then(done, () => { selectText(e.currentTarget.parentElement); done(); });
        } catch (err) { done(); }
      }}
      aria-label={L('複製', 'Copy')}
    >
      {ok ? <Check size={14} /> : <Copy size={14} />}{label}
    </button>
  );
}
function selectText(el) {
  try {
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  } catch (e) { /* ignore */ }
}

// ----------------------------------------------------------------------------
// Coin icons (drawn, not brand logos)
// ----------------------------------------------------------------------------
const GLYPH = {
  BTC: '₿', ETH: 'Ξ', USDT: '₮', USDC: '$', SOL: '◎', BNB: '◆', XRP: '✕', DOGE: 'Ð', ADA: '₳', TRX: '▽', LINK: '⬡', AVAX: 'A', DOT: '●', ARB: 'A', TON: '◇',
};
export function CoinIcon({ sym, size = 24 }) {
  const c = COIN[sym];
  if (sym === FREE_DROP.sym) return <ProjLogo p={FREE_DROP} size={size} />;
  const proj = !c && PROJECTS.find((p) => p.sym === sym);
  if (proj) return <ProjLogo p={proj} size={size} />;
  const launch = c?.launch && PROJECTS.find((p) => p.sym === sym);
  if (launch) return <ProjLogo p={launch} size={size} />;
  if (sym === 'NVX') return <BrandMark size={size} />;
  if (COIN_LOGOS[sym]) return <img className="coin-ico coin-img" src={COIN_LOGOS[sym]} width={size} height={size} alt="" draggable="false" />;
  const color = c?.color || '#7A8599';
  const g = GLYPH[sym] || sym?.[0] || '?';
  return (
    <svg className="coin-ico" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <radialGradient id={`cg-${sym}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={color} stopOpacity="1" />
          <stop offset="1" stopColor={color} stopOpacity="0.72" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill={`url(#cg-${sym})`} />
      <circle cx="16" cy="16" r="15.2" fill="none" stroke="#fff" strokeOpacity="0.18" />
      <text x="16" y="16.5" textAnchor="middle" dominantBaseline="central" fontSize={g.length > 1 ? 11 : 16} fontWeight="800" fill={['USDT', 'TRX', 'AVAX', 'DOT'].includes(sym) ? '#fff' : '#0B0F18'} fontFamily="Manrope, system-ui, sans-serif">{g}</text>
    </svg>
  );
}

export function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="brand-mark">
      <defs>
        <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD27A" />
          <stop offset="0.55" stopColor="#FF9A3D" />
          <stop offset="1" stopColor="#FF5E3A" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#bm-g)" />
      <path d="M12.5 28V12.5L27.5 27.5V12" fill="none" stroke="#170B02" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="29.5" cy="10.5" r="2.4" fill="#170B02" />
    </svg>
  );
}

// Generated project logos: each project gets a distinct geometric glyph in its palette.
export function ProjLogo({ p, size = 40, ring }) {
  const [a, b, c] = p.colors;
  const id = 'pl-' + p.id;
  const shape = {
    sail: <path d="M20 7 L30 29 H10 Z M20 7 V29" fill="none" stroke={c} strokeWidth="2.6" strokeLinejoin="round" />,
    orbit: <g fill="none" stroke={c} strokeWidth="2.2"><ellipse cx="20" cy="20" rx="12" ry="5.5" transform="rotate(-30 20 20)" /><ellipse cx="20" cy="20" rx="12" ry="5.5" transform="rotate(30 20 20)" /><circle cx="20" cy="20" r="2.6" fill={c} /></g>,
    prism: <g fill="none" stroke={c} strokeWidth="2.4" strokeLinejoin="round"><path d="M20 8 L31 28 H9 Z" /><path d="M20 8 L20 28 M14 18 H26" strokeOpacity="0.6" /></g>,
    hexo: <g fill="none" stroke={c} strokeWidth="2.6"><path d="M20 8 L30.4 14 V26 L20 32 L9.6 26 V14 Z" /><circle cx="20" cy="20" r="4" fill={c} /></g>,
    ring: <g fill="none" stroke={c} strokeWidth="2.4"><circle cx="20" cy="20" r="10" /><circle cx="20" cy="20" r="5" strokeDasharray="3 2.4" /></g>,
    cube: <g fill="none" stroke={c} strokeWidth="2.3" strokeLinejoin="round"><path d="M20 8 L30 13.5 V26 L20 32 L10 26 V13.5 Z" /><path d="M10 13.5 L20 19 L30 13.5 M20 19 V32" /></g>,
    spark: <path d="M20 7 L23 17 L33 20 L23 23 L20 33 L17 23 L7 20 L17 17 Z" fill={c} />,
    bloom: <g fill="none" stroke={c} strokeWidth="2.3"><circle cx="20" cy="14" r="5.2" /><circle cx="26" cy="20" r="5.2" /><circle cx="20" cy="26" r="5.2" /><circle cx="14" cy="20" r="5.2" /><circle cx="20" cy="20" r="2" fill={c} /></g>,
    wind: <g fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round"><path d="M8 15 H24 a4 4 0 1 0 -4 -4" /><path d="M8 21 H29 a4 4 0 1 1 -4 4" /><path d="M8 27 H17" /></g>,
  }[p.glyph];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={cx('proj-logo', ring && 'proj-logo-ring')}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={b} />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill={`url(#${id})`} />
      {shape}
    </svg>
  );
}

// ----------------------------------------------------------------------------
// Coin picker
// ----------------------------------------------------------------------------
export function CoinSelect({ value, options, onChange, balances, label, compact: cmp }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const pop = useFitPopover(open);
  const list = options.filter((s) => s.toLowerCase().includes(q.toLowerCase()) || (COIN[s]?.name || '').toLowerCase().includes(q.toLowerCase()));
  return (
    <div className={cx('csel', cmp && 'csel-compact')} ref={ref}>
      {label && <div className="field-label">{label}</div>}
      <button className="csel-btn" onClick={() => setOpen(!open)} type="button">
        <CoinIcon sym={value} size={cmp ? 20 : 24} />
        <b>{value}</b>
        {!cmp && <span className="muted">{COIN[value]?.name}</span>}
        <ChevronDown size={16} className="csel-caret" />
      </button>
      {open && (
        <div className="csel-pop" ref={pop}>
          <div className="search"><Search size={15} /><input autoFocus placeholder={L('搜尋幣種', 'Search')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="csel-list">
            {list.map((s) => (
              <button key={s} className={cx('csel-item', s === value && 'on')} onClick={() => { onChange(s); setOpen(false); setQ(''); }}>
                <CoinIcon sym={s} size={22} />
                <span><b>{s}</b><small>{COIN[s]?.name}</small></span>
                {balances && <span className="mono muted">{balances(s)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Charts
// ----------------------------------------------------------------------------
export function Donut({ data, size = 180, thick = 22, center }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = (size - thick) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={thick} />
      {data.map((d, i) => {
        const len = (d.value / total) * C;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thick}
            strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-acc} transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="butt">
            <title>{d.label}: {((d.value / total) * 100).toFixed(1)}%</title>
          </circle>
        );
        acc += len;
        return el;
      })}
      {center && (
        <foreignObject x={thick} y={thick} width={size - thick * 2} height={size - thick * 2}>
          <div className="donut-center">{center}</div>
        </foreignObject>
      )}
    </svg>
  );
}

export function Spark({ values, w = 120, h = 36, color = 'var(--accent)', fill = true }) {
  const id = useMemo(() => 'sp' + Math.random().toString(36).slice(2, 8), []);
  if (!values?.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const rng = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / rng) * (h - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="spark" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

// QR code via qrcode-generator
import qrcode from 'qrcode-generator';
export function QR({ text, size = 168 }) {
  const svg = useMemo(() => {
    try {
      const q = qrcode(0, 'M');
      q.addData(text);
      q.make();
      const n = q.getModuleCount();
      let path = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
      return { n, path };
    } catch (e) { return null; }
  }, [text]);
  if (!svg) return null;
  return (
    <div className="qr" style={{ width: size, height: size }}>
      <svg viewBox={`-2 -2 ${svg.n + 4} ${svg.n + 4}`} width={size} height={size} shapeRendering="crispEdges">
        <rect x="-2" y="-2" width={svg.n + 4} height={svg.n + 4} fill="#fff" />
        <path d={svg.path} fill="#0B0F18" />
      </svg>
      <div className="qr-badge"><BrandMark size={size / 6} /></div>
    </div>
  );
}

export function KV({ k, v, mono = true, className }) {
  return (
    <div className={cx('kv', className)}>
      <span>{k}</span>
      <b className={mono ? 'mono' : ''}>{v}</b>
    </div>
  );
}

export function Delta({ v, className }) {
  if (v == null || !isFinite(v)) return <span className="muted">--</span>;
  return <span className={cx('mono', v >= 0 ? 'up' : 'down', className)}>{v >= 0 ? '+' : ''}{(v * 100).toFixed(2)}%</span>;
}

// Flashes green/red when a number changes direction
export function Flash({ value, children, className }) {
  const prev = useRef(value);
  const [dir, setDir] = useState(null);
  useEffect(() => {
    if (value > prev.current) setDir('up');
    else if (value < prev.current) setDir('down');
    prev.current = value;
    const t = setTimeout(() => setDir(null), 600);
    return () => clearTimeout(t);
  }, [value]);
  return <span className={cx('flash', dir && 'flash-' + dir, className)}>{children}</span>;
}
