import { useState } from 'react';
import { Layers, Trophy, Gift, Clock, Flame, AlertTriangle, CalendarClock, Coins, TrendingUp, Lock, Unlock } from 'lucide-react';
import { STAKE_PRODUCTS, TIERS, COIN, EARLY_REDEEM_PENALTY } from '../core/data.js';
import { L } from '../core/lang.js';
import { useApp, stake, claimStake, redeemStake, stakeReward, matured, tier, toast, bal, now, openModal, valueOf } from '../core/store.js';
import { useMarket, price } from '../core/market.js';
import { fmt, usd, compact, dateTime, dateOnly, countdown, floorTo, adp } from '../core/fmt.js';
import { Btn, Tabs, NumInput, Progress, Pill, CoinIcon, Modal, KV, Empty, cx } from '../ui/kit.jsx';
import { PageHead, ConnectGate } from '../layout/Shell.jsx';

const DAY = 86400e3;

export function Staking() {
  useMarket();
  const s = useApp();
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(null);
  const [redeem, setRedeem] = useState(null);
  const t = tier();
  const active = s.stakes.filter((x) => x.status === 'active');
  const totalV = active.reduce((a, x) => a + valueOf(x.sym, x.amount), 0);
  const pendingV = active.reduce((a, x) => a + valueOf(x.sym, stakeReward(x)), 0);
  const earnedV = s.stakes.reduce((a, x) => a + valueOf(x.sym, x.earned), 0);

  const coins = [...new Set(STAKE_PRODUCTS.map((p) => p.sym))];
  const prods = (sym) => STAKE_PRODUCTS.filter((p) => p.sym === sym && (filter === 'all' || (filter === 'flex' ? p.days === 0 : filter === 'fixed' ? p.days > 0 : true)));
  const shown = coins.filter((c) => (filter === 'pdx' ? c === 'PDX' : prods(c).length));

  return (
    <div className="page">
      <PageHead eyebrow={<><Layers size={14} />{L('质押理财', 'Staking')}</>} title={L('让闲置资产持续产生收益', 'Put idle assets to work')}
        sub={L('活期随存随取，定期锁仓收益更高。质押 PDX 还能提升认购等级与手续费折扣。', 'Flexible products redeem any time; fixed terms pay more. Staking PDX also raises your launchpad tier and fee discount.')} />

      <div className="stat-row">
        <div className="stat"><span>{L('质押总值', 'Staked value')}</span><b className="mono">{usd(totalV)}</b></div>
        <div className="stat"><span>{L('待领取收益', 'Pending rewards')}</span><b className="mono up">{usd(pendingV, 4)}</b></div>
        <div className="stat"><span>{L('累计已领取', 'Total earned')}</span><b className="mono">{usd(earnedV, 2)}</b></div>
        <div className="stat tier-stat" style={{ '--tier': t.color }}><span>{L('认购等级', 'Launchpad tier')}</span><b><Trophy size={16} />{L(...t.name)} <span className="mono">×{t.mult}</span></b></div>
      </div>

      <div className="card tier-table">
        <div className="row-between"><h3 className="sub-h"><Trophy size={16} />{L('PDX 质押等级权益', 'PDX tier benefits')}</h3><span className="muted small">{L('按活跃中的 PDX 质押总量计算', 'Based on your active PDX stake')}</span></div>
        <div className="tiers">
          {TIERS.map((x) => (
            <div key={x.id} className={cx('tier-cell', x.id === t.id && 'on')} style={{ '--c': x.color }}>
              <i className="tier-gem" />
              <b>{L(...x.name)}</b>
              <span className="mono">≥ {compact(x.min, 0)} PDX</span>
              <span>{L('认购上限', 'Sale cap')} <b className="mono">×{x.mult}</b></span>
              <span>{L('现货手续费', 'Spot fee')} <b className="mono">-{x.fee * 100}%</b></span>
            </div>
          ))}
        </div>
      </div>

      <div className="sec-head">
        <h2 className="display sec-title">{L('质押产品', 'Products')}</h2>
        <Tabs value={filter} onChange={setFilter} items={[['all', L('全部', 'All')], ['flex', L('活期', 'Flexible')], ['fixed', L('定期', 'Fixed')], ['pdx', 'PDX']]} />
      </div>
      <div className="earn-list">
        {shown.map((sym) => (
          <div key={sym} className="earn-row card">
            <div className="earn-coin">
              <CoinIcon sym={sym} size={40} />
              <div><b>{sym}</b><small>{COIN[sym].name}</small></div>
            </div>
            <div className="earn-apr">
              <span className="muted small">{L('年化收益', 'APR')}</span>
              <b className="mono up">{(Math.min(...prods(sym).map((p) => p.apr)) * 100).toFixed(1)}% ~ {(Math.max(...prods(sym).map((p) => p.apr)) * 100).toFixed(1)}%</b>
            </div>
            <div className="earn-terms">
              {prods(sym).map((p) => (
                <button key={p.id} className="term" onClick={() => setSel(p)}>
                  <span>{p.days ? `${p.days}${L('天', 'd')}` : L('活期', 'Flexible')}{p.hot && <Flame size={12} className="hot" />}</span>
                  <b className="mono">{(p.apr * 100).toFixed(1)}%</b>
                  <Progress value={p.filled} thin />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sec-head"><h2 className="display sec-title">{L('我的质押', 'My stakes')}</h2><span className="count">{active.length}</span></div>
      <div className="card">
        {s.stakes.length === 0 ? <Empty text={L('还没有质押，选择上方产品开始赚取收益', 'No stakes yet. Pick a product above to start earning.')} /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>{L('产品', 'Product')}</th><th>{L('数量', 'Amount')}</th><th>{L('年化', 'APR')}</th><th>{L('起息 / 到期', 'Start / maturity')}</th><th>{L('待领取收益', 'Pending')}</th><th>{L('状态', 'Status')}</th><th>{L('操作', 'Actions')}</th></tr></thead>
              <tbody>
                {s.stakes.map((x) => {
                  const r = stakeReward(x);
                  const mat = x.days ? x.start + x.days * DAY : null;
                  const isMat = matured(x);
                  return (
                    <tr key={x.id}>
                      <td><span className="row-gap"><CoinIcon sym={x.sym} size={20} /><b>{x.sym}</b><Pill tone={x.days ? 'violet' : 'muted'}>{x.days ? `${x.days}${L('天', 'd')}` : L('活期', 'Flex')}</Pill></span></td>
                      <td className="mono">{fmt(x.amount, adp(price(x.sym)))}</td>
                      <td className="mono up">{(x.apr * 100).toFixed(1)}%</td>
                      <td className="mono small">{dateOnly(x.start)}<br /><span className="muted">{mat ? (isMat ? L('已到期', 'Matured') : countdown(mat - now())) : L('随时赎回', 'Any time')}</span></td>
                      <td className="mono up ticking">{x.status === 'active' ? fmt(r, 8) : '--'} <span className="muted">{x.sym}</span></td>
                      <td>{x.status === 'active' ? (isMat ? <Pill tone="up">{L('可赎回', 'Redeemable')}</Pill> : <Pill tone="accent" dot>{L('计息中', 'Earning')}</Pill>) : <Pill>{L('已赎回', 'Redeemed')}</Pill>}</td>
                      <td>
                        {x.status === 'active' && (
                          <div className="row-gap">
                            {x.days === 0 && <button className="mini-btn" onClick={() => { const g = claimStake(x.id); toast(L('收益已领取', 'Rewards claimed'), 'ok', `+${fmt(g, 8)} ${x.sym}`); }}><Gift size={13} />{L('领取', 'Claim')}</button>}
                            <button className={cx('mini-btn', isMat || !x.days ? 'strong' : '')} onClick={() => setRedeem(x)}>{L('赎回', 'Redeem')}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sel && <StakeModal p={sel} onClose={() => setSel(null)} />}
      {redeem && <RedeemModal x={redeem} onClose={() => setRedeem(null)} />}
    </div>
  );
}

function StakeModal({ p, onClose }) {
  useMarket();
  const s = useApp();
  const [amt, setAmt] = useState('');
  const [agree, setAgree] = useState(true);
  const a = parseFloat(amt) || 0;
  const avail = bal(p.sym);
  const daily = (a * p.apr) / 365;
  const start = now();
  const t = tier();
  const nextTier = p.sym === 'PDX' ? [...TIERS].reverse().find((x) => t.staked + a >= x.min) : null;
  return (
    <Modal title={<span className="row-gap"><CoinIcon sym={p.sym} size={22} />{p.sym} {p.days ? `${p.days}${L(' 天定期', '-day fixed')}` : L(' 活期', ' flexible')}</span>} onClose={onClose} width={460}>
      <div className="stack">
        <div className="apr-hero"><span>{L('年化收益率', 'APR')}</span><b className="mono">{(p.apr * 100).toFixed(2)}%</b></div>
        <NumInput id="stk-amt" label={L('质押数量', 'Amount')} value={amt} onChange={setAmt} suffix={p.sym}
          right={<button className="max-btn" onClick={() => setAmt(String(floorTo(avail, 6)))}>MAX</button>} />
        <div className="row-between small"><span className="muted">{L('可用', 'Available')} <span className="mono">{fmt(avail, 6)} {p.sym}</span></span><span className="muted">{L('最低', 'Min')} {p.min} {p.sym}</span></div>
        <div className="timeline-mini">
          <div><Lock size={14} /><span>{L('起息', 'Start')}</span><b className="mono">{dateTime(start)}</b></div>
          <div><CalendarClock size={14} /><span>{p.days ? L('到期', 'Maturity') : L('赎回', 'Redeem')}</span><b className="mono">{p.days ? dateTime(start + p.days * DAY) : L('随时', 'Any time')}</b></div>
          <div><Unlock size={14} /><span>{L('到账', 'Payout')}</span><b>{p.days ? L('到期赎回后本息到账', 'Principal + rewards at maturity') : L('收益每秒累计，可随时领取', 'Accrues every second; claim any time')}</b></div>
        </div>
        <div className="summary">
          <KV k={L('预计日收益', 'Est. daily')} v={`${fmt(daily, 6)} ${p.sym}`} />
          {p.days > 0 && <KV k={L('到期总收益', 'At maturity')} v={<b className="up">{fmt(daily * p.days, 6)} {p.sym}</b>} />}
          <KV k={L('池子额度', 'Pool usage')} v={`${(p.filled * 100).toFixed(0)}% / ${compact(p.cap, 0)} ${p.sym}`} />
          {nextTier && <KV k={L('质押后等级', 'Tier after')} v={<b style={{ color: nextTier.color }}>{L(...nextTier.name)} ×{nextTier.mult}</b>} />}
        </div>
        {p.days > 0 && <div className="warn-box"><AlertTriangle size={15} />{L(`提前赎回将扣除 ${EARLY_REDEEM_PENALTY * 100}% 已产生收益，本金全额返还。`, `Early redemption forfeits ${EARLY_REDEEM_PENALTY * 100}% of accrued rewards; principal is returned in full.`)}</div>}
        <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />{L('我已阅读并同意《质押服务协议》', 'I agree to the Staking Terms')}</label>
        {!s.wallet.connected ? <ConnectGate /> : avail < p.min ? (
          <Btn block variant="soft" onClick={() => { onClose(); openModal(p.sym === 'PDX' ? 'convert' : 'deposit', p.sym === 'PDX' ? { from: 'USDT', to: 'PDX' } : { sym: p.sym }); }}>{p.sym === 'PDX' ? L('余额不足，去闪兑 PDX', 'Not enough. Convert to PDX') : L(`余额不足，去充值 ${p.sym}`, `Not enough. Deposit ${p.sym}`)}</Btn>
        ) : (
          <Btn block size="lg" disabled={!agree || a < p.min} onClick={() => { const r = stake(p.id, a); if (r.err) toast(r.err, 'err'); else { toast(L('质押成功', 'Staked'), 'ok', `${fmt(a, 6)} ${p.sym} · ${(p.apr * 100).toFixed(1)}% APR`); onClose(); } }}>{L('确认质押', 'Stake')}</Btn>
        )}
      </div>
    </Modal>
  );
}

function RedeemModal({ x, onClose }) {
  useMarket();
  const early = x.days > 0 && !matured(x);
  const r = stakeReward(x);
  const got = early ? r * (1 - EARLY_REDEEM_PENALTY) : r;
  return (
    <Modal title={L('赎回质押', 'Redeem')} onClose={onClose} width={420}>
      <div className="stack">
        <div className="summary">
          <KV k={L('本金', 'Principal')} v={`${fmt(x.amount, 6)} ${x.sym}`} />
          <KV k={L('已产生收益', 'Accrued')} v={`${fmt(r, 8)} ${x.sym}`} />
          {early && <KV k={L('提前赎回扣除', 'Early penalty')} v={<span className="down">-{fmt(r - got, 8)} {x.sym}</span>} />}
          <KV k={L('实际到账', 'You receive')} v={<b className="accent-text">{fmt(x.amount + got, 8)} {x.sym}</b>} />
        </div>
        {early && <div className="warn-box"><AlertTriangle size={15} />{L('该定期产品尚未到期，提前赎回会损失部分收益。', 'This fixed product has not matured. Redeeming now forfeits part of the rewards.')}</div>}
        <div className="btn-row">
          <Btn variant="ghost" onClick={onClose}>{L('取消', 'Cancel')}</Btn>
          <Btn variant={early ? 'down' : 'primary'} onClick={() => { const o = redeemStake(x.id); toast(L('赎回成功', 'Redeemed'), 'ok', `+${fmt(o.principal + o.reward, 6)} ${x.sym}`); onClose(); }}>{early ? L('仍然赎回', 'Redeem anyway') : L('确认赎回', 'Redeem')}</Btn>
        </div>
      </div>
    </Modal>
  );
}
