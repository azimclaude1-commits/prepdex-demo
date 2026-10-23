import { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { getCandles, subscribe, TF, price } from '../core/market.js';
import { pdp, fmt } from '../core/fmt.js';
import { cx } from './kit.jsx';
import { L } from '../core/lang.js';

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function ma(bars, n) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close;
    if (i >= n) sum -= bars[i - n].close;
    if (i >= n - 1) out.push({ time: bars[i].time, value: sum / n });
  }
  return out;
}

// sym: base coin; quote: quote currency (prices are converted from USD)
export default function Kline({ sym, quote = 'USDT', label, themeKey, lines = [], height }) {
  const quoteDiv = () => (quote === 'USDT' ? 1 : price(quote) / price('USDT'));
  const box = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});
  const [tf, setTf] = useState('15m');
  const [legend, setLegend] = useState(null);
  const plRef = useRef([]);

  // build chart
  useEffect(() => {
    const el = box.current;
    const up = cssVar('--up') || '#22D39B';
    const down = cssVar('--down') || '#FF4D6A';
    const chart = createChart(el, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: cssVar('--muted'), fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 11 },
      grid: { vertLines: { color: cssVar('--grid') }, horzLines: { color: cssVar('--grid') } },
      rightPriceScale: { borderColor: cssVar('--line') },
      timeScale: { borderColor: cssVar('--line'), timeVisible: true, secondsVisible: false, rightOffset: 6, barSpacing: 8 },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: cssVar('--muted'), labelBackgroundColor: cssVar('--panel-solid') }, horzLine: { color: cssVar('--muted'), labelBackgroundColor: cssVar('--panel-solid') } },
    });
    const candles = chart.addCandlestickSeries({ upColor: up, downColor: down, borderUpColor: up, borderDownColor: down, wickUpColor: up, wickDownColor: down });
    const volume = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol', lastValueVisible: false, priceLineVisible: false });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    const ma7 = chart.addLineSeries({ color: cssVar('--accent'), lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    const ma25 = chart.addLineSeries({ color: cssVar('--violet'), lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    chartRef.current = chart;
    seriesRef.current = { candles, volume, ma7, ma25, up, down };
    chart.subscribeCrosshairMove((param) => {
      const d = param?.seriesData?.get(candles);
      setLegend(d ? { ...d } : null);
    });
    return () => { chart.remove(); chartRef.current = null; };
  }, [themeKey]);

  // data
  useEffect(() => {
    const { candles, volume, ma7, ma25, up, down } = seriesRef.current;
    if (!candles) return;
    const div = quoteDiv();
    const conv = (b) => ({ time: b.time, open: b.open / div, high: b.high / div, low: b.low / div, close: b.close / div });
    const load = () => {
      const bars = getCandles(sym, tf).map(conv);
      const raw = getCandles(sym, tf);
      const dp = pdp(bars[bars.length - 1].close);
      candles.applyOptions({ priceFormat: { type: 'price', precision: dp, minMove: Math.pow(10, -dp) } });
      candles.setData(bars);
      volume.setData(raw.map((b) => ({ time: b.time, value: b.volume, color: (b.close >= b.open ? up : down) + '55' })));
      ma7.setData(ma(bars, 7));
      ma25.setData(ma(bars, 25));
      return bars.length;
    };
    let count = load();
    chartRef.current?.timeScale().scrollToRealTime();
    const unsub = subscribe(() => {
      const raw = getCandles(sym, tf);
      if (raw.length !== count) { count = load(); return; }
      const last = raw[raw.length - 1];
      candles.update(conv(last));
      volume.update({ time: last.time, value: last.volume, color: (last.close >= last.open ? up : down) + '55' });
    });
    return unsub;
  }, [sym, tf, themeKey, quote]);

  // price lines (entry / liquidation / open orders)
  const linesKey = JSON.stringify(lines.map((l) => [l.price.toPrecision(8), l.title]));
  useEffect(() => {
    const { candles } = seriesRef.current;
    if (!candles) return;
    for (const pl of plRef.current) candles.removePriceLine(pl);
    plRef.current = lines.map((l) => candles.createPriceLine({ price: l.price, color: l.color, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: l.title }));
  }, [linesKey, themeKey]);

  const bars = getCandles(sym, tf);
  const div = quoteDiv();
  const last = bars[bars.length - 1];
  const lg = legend || (last && { open: last.open / div, high: last.high / div, low: last.low / div, close: last.close / div });
  const dp = lg ? pdp(lg.close) : 2;
  const chg = lg ? lg.close / lg.open - 1 : 0;

  return (
    <div className="kline" style={height ? { height } : null}>
      <div className="kline-bar">
        <div className="kline-tfs">
          {Object.keys(TF).map((k) => (
            <button key={k} className={cx(tf === k && 'on')} onClick={() => setTf(k)}>{k}</button>
          ))}
        </div>
        <div className="kline-legend mono">
          <span className="muted">{label}</span>
          {lg && (
            <>
              <span>O <b className={chg >= 0 ? 'up' : 'down'}>{fmt(lg.open, dp)}</b></span>
              <span>H <b className={chg >= 0 ? 'up' : 'down'}>{fmt(lg.high, dp)}</b></span>
              <span>L <b className={chg >= 0 ? 'up' : 'down'}>{fmt(lg.low, dp)}</b></span>
              <span>C <b className={chg >= 0 ? 'up' : 'down'}>{fmt(lg.close, dp)}</b></span>
              <span className={chg >= 0 ? 'up' : 'down'}>{chg >= 0 ? '+' : ''}{(chg * 100).toFixed(2)}%</span>
            </>
          )}
          <span className="kline-ma"><i style={{ background: 'var(--accent)' }} />MA7 <i style={{ background: 'var(--violet)' }} />MA25</span>
        </div>
      </div>
      <div className="kline-chart" ref={box} aria-label={L('K線圖', 'Candlestick chart')} />
    </div>
  );
}
