// Static demo data for the Novarix prototype. All projects, merchants and pools are fictional.

export const BRAND = 'Novarix';
export const PLATFORM_TOKEN = 'NVX';

// sym, name, base price (USD), brand color, volatility per tick, 24h change seed, 24h volume (USD)
export const COINS = [
  { sym: 'BTC', name: 'Bitcoin', price: 67250, color: '#F7931A', vol: 0.0009, chg: 0.0182, v24: 28.4e9 },
  { sym: 'ETH', name: 'Ethereum', price: 3482, color: '#627EEA', vol: 0.0012, chg: 0.0241, v24: 14.2e9 },
  { sym: 'SOL', name: 'Solana', price: 104.6, color: '#14F195', vol: 0.0016, chg: -0.0062, v24: 3.1e9 },
  { sym: 'BNB', name: 'BNB', price: 588.4, color: '#F3BA2F', vol: 0.001, chg: 0.0071, v24: 1.6e9 },
  { sym: 'XRP', name: 'XRP', price: 0.5243, color: '#9AA6B8', vol: 0.0015, chg: -0.0133, v24: 1.2e9 },
  { sym: 'DOGE', name: 'Dogecoin', price: 0.1238, color: '#C2A633', vol: 0.002, chg: 0.0412, v24: 980e6 },
  { sym: 'TON', name: 'Toncoin', price: 5.214, color: '#0098EA', vol: 0.0016, chg: 0.0095, v24: 310e6 },
  { sym: 'ADA', name: 'Cardano', price: 0.3812, color: '#3468D1', vol: 0.0016, chg: -0.0208, v24: 420e6 },
  { sym: 'AVAX', name: 'Avalanche', price: 27.41, color: '#E84142', vol: 0.0018, chg: 0.0154, v24: 360e6 },
  { sym: 'LINK', name: 'Chainlink', price: 13.82, color: '#2A5ADA', vol: 0.0017, chg: 0.0287, v24: 410e6 },
  { sym: 'TRX', name: 'TRON', price: 0.1221, color: '#EB0029', vol: 0.0009, chg: 0.0034, v24: 380e6 },
  { sym: 'DOT', name: 'Polkadot', price: 5.912, color: '#E6007A', vol: 0.0017, chg: -0.0098, v24: 190e6 },
  { sym: 'ARB', name: 'Arbitrum', price: 0.7815, color: '#28A0F0', vol: 0.002, chg: 0.0311, v24: 260e6 },
  { sym: 'NVX', name: 'Novarix Token', price: 0.4218, color: '#3D8BFF', vol: 0.0022, chg: 0.0645, v24: 48e6 },
  // Launchpad graduates (listed after TGE)
  { sym: 'ORBX', name: 'Orbix', price: 0.0842, color: '#FF7A45', vol: 0.003, chg: 0.0921, v24: 12.4e6, launch: true },
  { sym: 'HALO', name: 'Halo Network', price: 0.0514, color: '#5B8CFF', vol: 0.003, chg: -0.0315, v24: 8.1e6, launch: true },
  { sym: 'TESS', name: 'Tessera', price: 0.1206, color: '#9AA3B5', vol: 0.0028, chg: 0.0144, v24: 5.6e6, launch: true },
  { sym: 'LUMN', name: 'Lumen AI', price: 0.00921, color: '#E8E8F0', vol: 0.0032, chg: 0.1182, v24: 9.9e6, launch: true },
  { sym: 'ZEPH', name: 'Zephyr', price: 0.0613, color: '#2BC98A', vol: 0.003, chg: -0.0214, v24: 4.2e6, launch: true },
  // Stablecoins
  { sym: 'USDT', name: 'Tether USD', price: 1, color: '#26A17B', vol: 0, chg: 0.0001, v24: 52e9, stable: true },
  { sym: 'USDC', name: 'USD Coin', price: 1, color: '#2775CA', vol: 0, chg: 0, v24: 7.4e9, stable: true },
];

export const COIN = Object.fromEntries(COINS.map((c) => [c.sym, c]));

// Spot pairs: every non-stable coin against USDT and USDC
export const QUOTES = ['USDT', 'USDC'];
export const SPOT_BASES = COINS.filter((c) => !c.stable).map((c) => c.sym);

export const FUTURES = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'TON', 'AVAX', 'LINK', 'NVX'];
export const MAX_LEV = { BTC: 125, ETH: 100, SOL: 75, BNB: 75, XRP: 50, DOGE: 50, TON: 50, AVAX: 50, LINK: 50, NVX: 20 };

// Deposit / withdrawal networks
export const NETWORKS = {
  ERC20: { id: 'ERC20', name: 'Ethereum (ERC20)', short: 'ETH', conf: 12, fee: { USDT: 3.2, USDC: 3.2, ETH: 0.0012, def: 0 }, arrive: '≈ 3 min', kind: 'evm' },
  TRC20: { id: 'TRC20', name: 'TRON (TRC20)', short: 'TRX', conf: 20, fee: { USDT: 1, def: 0 }, arrive: '≈ 1 min', kind: 'tron' },
  BEP20: { id: 'BEP20', name: 'BNB Smart Chain (BEP20)', short: 'BSC', conf: 15, fee: { USDT: 0.29, USDC: 0.29, BNB: 0.0005, def: 0 }, arrive: '≈ 1 min', kind: 'evm' },
  ARB: { id: 'ARB', name: 'Arbitrum One', short: 'ARB', conf: 12, fee: { USDT: 0.2, USDC: 0.2, ETH: 0.0001, def: 0 }, arrive: '≈ 1 min', kind: 'evm' },
  BASE: { id: 'BASE', name: 'Base', short: 'BASE', conf: 12, fee: { USDC: 0.1, ETH: 0.0001, def: 0 }, arrive: '≈ 1 min', kind: 'evm' },
  SOL: { id: 'SOL', name: 'Solana', short: 'SOL', conf: 32, fee: { USDT: 0.5, USDC: 0.5, SOL: 0.005, def: 0 }, arrive: '≈ 30 s', kind: 'sol' },
  BTC: { id: 'BTC', name: 'Bitcoin', short: 'BTC', conf: 2, fee: { BTC: 0.00012, def: 0 }, arrive: '≈ 20 min', kind: 'btc' },
  TON: { id: 'TON', name: 'TON', short: 'TON', conf: 1, fee: { TON: 0.02, USDT: 0.6, def: 0 }, arrive: '≈ 10 s', kind: 'ton' },
};

export function networksFor(sym) {
  switch (sym) {
    case 'USDT': return ['TRC20', 'ERC20', 'BEP20', 'ARB', 'SOL', 'TON'];
    case 'USDC': return ['ERC20', 'SOL', 'BASE', 'ARB', 'BEP20'];
    case 'ETH': return ['ERC20', 'ARB', 'BASE'];
    case 'BTC': return ['BTC'];
    case 'SOL': return ['SOL'];
    case 'BNB': return ['BEP20'];
    case 'TON': return ['TON'];
    case 'TRX': return ['TRC20'];
    case 'ARB': return ['ARB'];
    default: return ['ERC20', 'BEP20'];
  }
}

export function netFee(net, sym) {
  const f = NETWORKS[net].fee;
  if (f[sym] != null) return f[sym];
  const p = COIN[sym]?.price || 1;
  return +(1.5 / p).toPrecision(2); // ~ $1.5 equivalent
}

export function minDeposit(sym) {
  const p = COIN[sym]?.price || 1;
  return +(5 / p).toPrecision(2);
}

// Assets the connected browser wallet starts with (so deposits can be demoed)
export const ONCHAIN_START = { USDT: 25000, USDC: 12000, ETH: 2.35, BTC: 0.085, SOL: 48, BNB: 3.2 };

// ----------------------------------------------------------------------------
// Launchpad
// ----------------------------------------------------------------------------
// Times are hours relative to the demo epoch (the first time this browser opened the prototype).
const PLATFORM_LAUNCH_NOTE = ['此前', 'earlier'];
const roadmapTpl = (zh, en) => [
  { q: '2025 Q3', done: true, title: ['测试网上线', 'Testnet live'], items: [zh[0], en[0]] },
  { q: '2025 Q4', done: true, title: ['审计与生态基金', 'Audits & ecosystem fund'], items: [zh[1], en[1]] },
  { q: '2026 Q1', done: true, title: ['主网 Beta', 'Mainnet beta'], items: [zh[2], en[2]] },
  { q: '2026 Q4', done: false, now: true, title: ['TGE 与上线交易', 'TGE & listing'], items: [zh[3], en[3]] },
  { q: '2027 Q2', done: false, title: ['治理与跨链扩展', 'Governance & cross-chain'], items: [zh[4], en[4]] },
];

export const PROJECTS = [
  {
    id: 'vela', sym: 'VELA', name: 'Vela Finance', status: 'live',
    start: -30, end: 142, price: 0.06, hardCap: 600000, minBuy: 50, baseMax: 2000,
    totalSupply: 1_000_000_000, raiseCurve: [0.12, 2.65],
    colors: ['#0E2A2B', '#1C6B5A', '#7CF5C8'], glyph: 'sail', chain: 'Ethereum',
    tags: [['RWA', 'RWA'], ['私募信贷', 'Private credit'], ['机构级', 'Institutional']],
    tagline: ['把机构私募信贷带到链上，年化收益透明可查', 'Institutional private credit, on-chain and auditable'],
    vision: [
      ['Vela Finance 是一个面向现实世界资产（RWA）的私募信贷协议。它把中小企业应收账款、贸易融资和供应链票据打包成标准化的链上信贷池，由持牌资产管理人负责尽调与贷后管理，投资者可以按池子认购并实时查看底层资产表现。',
        'Vela Finance is a private-credit protocol for real-world assets. It packages SME receivables, trade finance and supply-chain notes into standardised on-chain credit pools. Licensed asset managers run diligence and servicing, and investors can subscribe per pool and track the underlying loans in real time.'],
      ['传统私募信贷市场规模超过 1.7 万亿美元，但门槛高、透明度低、流动性差。Vela 用智能合约记录每一笔放款、还款和逾期，把月度报表变成可验证的链上状态，并通过二级市场让 LP 份额可以转让。',
        'Traditional private credit is a $1.7T market that is hard to access, opaque and illiquid. Vela records every disbursement, repayment and delinquency in smart contracts, turning monthly reports into verifiable on-chain state, and lets LP shares trade on a secondary market.'],
      ['VELA 代币用于协议治理、风险准备金质押和费用折扣。质押 VELA 的用户承担第一损失层风险，并获得协议收入分成。',
        'VELA is used for governance, first-loss reserve staking and fee discounts. Stakers absorb first-loss risk and earn a share of protocol revenue.'],
    ],
    highlights: [
      ['已接入 4 家持牌资产管理人，在管资产 $38.6M', '4 licensed asset managers onboarded, $38.6M under management'],
      ['底层资产历史违约率 0.42%，加权年化 11.8%', '0.42% historical default rate, 11.8% weighted APY'],
      ['合约经两家审计机构审计，漏洞赏金 $250K', 'Audited twice, $250K bug bounty'],
    ],
    metrics: { tvl: 38.6e6, holders: 12840, apy: 0.118 },
    tokenomics: [['生态激励', 'Ecosystem', 28], ['团队', 'Team', 18], ['投资人', 'Investors', 16], ['风险准备金', 'Reserve', 12], ['国库', 'Treasury', 10], ['公开认购', 'Public sale', 10], ['流动性', 'Liquidity', 6]],
    vesting: { tge: 0.25, cliff: 1, months: 6 },
    roadmap: roadmapTpl(
      ['Sepolia 测试网，3 个信贷池试运行', '完成两轮审计，设立 $5M 生态基金', '主网 Beta，在管资产突破 $30M', '认购完成后 TGE，现货上线 VELA/USDT', '链上治理上线，扩展至 Base 与 Arbitrum'],
      ['Sepolia testnet with 3 pilot pools', 'Two audits, $5M ecosystem fund', 'Mainnet beta, $30M+ AUM', 'TGE after the sale, VELA/USDT spot listing', 'On-chain governance, expand to Base & Arbitrum']),
    team: [['Elena Marsh', 'CEO', ['前 Apollo 信贷基金副总裁', 'Ex-VP, Apollo credit']], ['Daniel Okafor', 'CTO', ['前 Aave 核心合约工程师', 'Ex-core engineer, Aave']], ['Wen Li', 'Head of Risk', ['12 年结构化融资经验', '12 yrs in structured finance']]],
    investors: ['Northwind Capital', 'Arcadia Ventures', 'Blue Harbor', 'Kite Labs', 'Meridian DAO'],
  },
  {
    id: 'kora', sym: 'KORA', name: 'Kora AI', status: 'live',
    start: -80, end: 20, price: 0.025, hardCap: 400000, minBuy: 20, baseMax: 1500,
    totalSupply: 2_000_000_000, raiseCurve: [0.3, 3.1],
    colors: ['#1A1033', '#4B2E9A', '#C7B8FF'], glyph: 'orbit', chain: 'Arbitrum',
    tags: [['AI', 'AI'], ['DePIN', 'DePIN'], ['推理网络', 'Inference']],
    tagline: ['把闲置 GPU 组成去中心化 AI 推理网络', 'A decentralised AI inference network built from idle GPUs'],
    vision: [
      ['Kora AI 把分布在全球的闲置消费级 GPU 聚合成一个去中心化推理网络，开发者可以用比中心化云低 60% 的价格调用开源大模型。',
        'Kora AI pools idle consumer GPUs worldwide into a decentralised inference network, letting developers call open-source models at up to 60% less than centralised clouds.'],
      ['网络采用可验证推理（optimistic + 抽样复算）保证结果正确，节点需要质押 KORA 才能接单，作恶会被罚没。',
        'Results are secured by verifiable inference (optimistic execution with sampled re-computation). Nodes stake KORA to accept jobs and are slashed for misbehaviour.'],
    ],
    highlights: [
      ['测试网已有 18,400 张 GPU 接入', '18,400 GPUs connected on testnet'],
      ['日均处理 2,100 万次推理请求', '21M inference requests per day'],
      ['与 3 个开源模型社区达成合作', 'Partnered with 3 open-model communities'],
    ],
    metrics: { tvl: 9.2e6, holders: 30210, apy: null },
    tokenomics: [['节点奖励', 'Node rewards', 35], ['团队', 'Team', 17], ['投资人', 'Investors', 15], ['生态基金', 'Ecosystem', 13], ['公开认购', 'Public sale', 8], ['国库', 'Treasury', 7], ['流动性', 'Liquidity', 5]],
    vesting: { tge: 0.2, cliff: 0, months: 8 },
    roadmap: roadmapTpl(
      ['推理节点客户端发布', '可验证推理论文与审计', '激励测试网，GPU 数破万', 'TGE，KORA 上线现货与合约', '训练任务市场上线'],
      ['Node client release', 'Verifiable inference paper & audit', 'Incentivised testnet, 10K+ GPUs', 'TGE, KORA on spot and perps', 'Training-job marketplace']),
    team: [['Mina Park', 'CEO', ['前 Google Brain 研究员', 'Ex-Google Brain researcher']], ['Arjun Rao', 'CTO', ['分布式系统专家，前 Cloudflare', 'Distributed systems, ex-Cloudflare']]],
    investors: ['Polar Ventures', 'Lattice Fund', 'Hashrate Partners', 'Oakline'],
  },
  {
    id: 'mira', sym: 'MIRA', name: 'Mirage Labs', status: 'upcoming',
    start: 18, end: 90, price: 0.012, hardCap: 300000, minBuy: 20, baseMax: 1000,
    totalSupply: 5_000_000_000, raiseCurve: [0, 2.2],
    colors: ['#2B0F1E', '#9A2A5B', '#FFB3D1'], glyph: 'prism', chain: 'Base',
    tags: [['GameFi', 'GameFi'], ['全链游戏', 'On-chain games'], ['引擎', 'Engine']],
    tagline: ['全链游戏引擎，让玩法逻辑完全运行在链上', 'An engine for fully on-chain games'],
    vision: [
      ['Mirage Labs 提供一套全链游戏引擎和 ECS 框架，开发者用熟悉的工具写玩法，状态和规则全部部署在 Base 上，玩家资产天然可组合。',
        'Mirage Labs ships an on-chain game engine and ECS framework. Developers write gameplay with familiar tools while state and rules live on Base, so player assets are composable by default.'],
      ['首款旗舰游戏《Driftline》已有 42 万预约玩家。', 'Its flagship title Driftline has 420K pre-registered players.'],
    ],
    highlights: [
      ['引擎开源，GitHub 星标 6.8K', 'Open-source engine, 6.8K GitHub stars'],
      ['旗舰游戏预约 42 万', '420K pre-registrations'],
      ['会话密钥免签名，体验接近 Web2', 'Session keys for Web2-like UX'],
    ],
    metrics: { tvl: 2.4e6, holders: 8800, apy: null },
    tokenomics: [['玩家激励', 'Player rewards', 30], ['团队', 'Team', 18], ['投资人', 'Investors', 17], ['开发者基金', 'Dev fund', 15], ['公开认购', 'Public sale', 7], ['国库', 'Treasury', 8], ['流动性', 'Liquidity', 5]],
    vesting: { tge: 0.15, cliff: 2, months: 10 },
    roadmap: roadmapTpl(
      ['引擎 Alpha 开源', '开发者大赛与审计', '《Driftline》公测', 'TGE 与 MIRA 上线', '引擎 2.0 与多链部署'],
      ['Engine alpha open-sourced', 'Dev contest & audit', 'Driftline public beta', 'TGE & MIRA listing', 'Engine 2.0, multichain']),
    team: [['Lucas Ferreira', 'CEO', ['前 Riot Games 制作人', 'Ex-Riot Games producer']], ['Hana Sato', 'CTO', ['前 Unity 引擎架构师', 'Ex-Unity engine architect']]],
    investors: ['Pixel Ventures', 'Redwood Guild', 'Orbit DAO'],
  },
  // Completed sales
  ...[
    ['orbx', 'ORBX', 'Orbix', 0.03, 1_200_000, 2.844, ['#1A0F0A', '#7A3416', '#FFB37A'], 'hexo', ['跨链流动性层', 'Cross-chain liquidity'], ['把 12 条链的流动性汇成一个池子', 'One liquidity pool across 12 chains'], -2000],
    ['halo', 'HALO', 'Halo Network', 0.02, 800_000, 2.333, ['#0A1440', '#1E3AA8', '#9DB6FF'], 'ring', ['隐私计算 L2', 'Privacy L2'], ['基于 ZK 的隐私计算二层网络', 'A ZK privacy-compute layer 2'], -1500],
    ['tess', 'TESS', 'Tessera', 0.09, 900_000, 2.433, ['#22252C', '#5A6274', '#E7ECF5'], 'cube', ['RWA 代币化', 'RWA tokenisation'], ['房产与债券的合规代币化平台', 'Compliant tokenisation for property and bonds'], -1100],
    ['lumn', 'LUMN', 'Lumen AI', 0.005, 500_000, 1.599, ['#0B0B10', '#2B2B3A', '#F2F2FF'], 'spark', ['AI 智能体', 'AI agents'], ['链上 AI 智能体的身份与支付层', 'Identity and payments for on-chain AI agents'], -800],
    ['zeph', 'ZEPH', 'Zephyr', 0.046, 700_000, 1.313, ['#0B1F1A', '#16634C', '#8CF0C6'], 'wind', ['DePIN 能源', 'Energy DePIN'], ['分布式光伏与储能的链上结算网络', 'On-chain settlement for distributed solar & storage'], -500],
  ].map(([id, sym, name, price, hardCap, ratio, colors, glyph, cat, tagline, endH]) => ({
    id, sym, name, status: 'ended', start: endH - 120, end: endH, price, hardCap, minBuy: 20, baseMax: 1500,
    totalSupply: 1_000_000_000, finalRatio: ratio, colors, glyph, chain: 'Ethereum',
    tags: [cat, ['已上线', 'Listed']], tagline,
    vision: [
      [`${name} ${tagline[0]}。项目于 ${PLATFORM_LAUNCH_NOTE[0]}完成公开认购，认购倍数 ${(ratio * 100).toFixed(1)}%，超额部分已按比例退还。`,
        `${name}: ${tagline[1]}. The public sale finished ${PLATFORM_LAUNCH_NOTE[1]} at ${(ratio * 100).toFixed(1)}% of the hard cap; oversubscribed funds were refunded pro rata.`],
      ['代币已在 Novarix 现货上线，认购用户按释放计划线性解锁。', 'The token is listed on Novarix spot, and subscribers unlock linearly per the vesting schedule.'],
    ],
    highlights: [[`认购倍数 ${(ratio * 100).toFixed(1)}%`, `${(ratio * 100).toFixed(1)}% subscribed`], [`认购价 ${price} USDC`, `Sale price ${price} USDC`]],
    metrics: { tvl: hardCap * ratio * 6, holders: Math.round(hardCap / 40), apy: null },
    tokenomics: [['生态', 'Ecosystem', 30], ['团队', 'Team', 18], ['投资人', 'Investors', 17], ['国库', 'Treasury', 15], ['公开认购', 'Public sale', 12], ['流动性', 'Liquidity', 8]],
    vesting: { tge: 0.2, cliff: 1, months: 6 },
    roadmap: roadmapTpl(['测试网', '审计', '主网', 'TGE 与上线', '生态扩展'], ['Testnet', 'Audit', 'Mainnet', 'TGE & listing', 'Ecosystem growth']).map((r) => ({ ...r, done: r.q !== '2027 Q2', now: false })),
    team: [['Core team', 'Founders', ['匿名核心团队，已完成 KYC', 'Pseudonymous team, KYC-verified']]],
    investors: ['Arcadia Ventures', 'Kite Labs'],
  })),
];

export const PROJECT = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));

// NVX staking tiers drive launchpad allocation and fee discounts
export const TIERS = [
  { id: 'none', name: ['普通', 'Standard'], min: 0, mult: 1, fee: 0, color: '#8A96AD' },
  { id: 'bronze', name: ['青铜', 'Bronze'], min: 1000, mult: 1.5, fee: 0.05, color: '#C98A5A' },
  { id: 'silver', name: ['白银', 'Silver'], min: 5000, mult: 2, fee: 0.1, color: '#C9D3E6' },
  { id: 'gold', name: ['黄金', 'Gold'], min: 20000, mult: 3, fee: 0.15, color: '#FFC94D' },
  { id: 'diamond', name: ['钻石', 'Diamond'], min: 100000, mult: 5, fee: 0.25, color: '#7FE7FF' },
];

// ----------------------------------------------------------------------------
// Staking (Earn)
// ----------------------------------------------------------------------------
export const STAKE_PRODUCTS = [
  { id: 'nvx-flex', sym: 'NVX', days: 0, apr: 0.085, cap: 60e6, filled: 0.41, min: 10, tier: true },
  { id: 'nvx-30', sym: 'NVX', days: 30, apr: 0.15, cap: 30e6, filled: 0.68, min: 100, tier: true },
  { id: 'nvx-90', sym: 'NVX', days: 90, apr: 0.24, cap: 20e6, filled: 0.83, min: 100, tier: true, hot: true },
  { id: 'nvx-180', sym: 'NVX', days: 180, apr: 0.36, cap: 10e6, filled: 0.92, min: 500, tier: true },
  { id: 'usdt-flex', sym: 'USDT', days: 0, apr: 0.062, cap: 80e6, filled: 0.57, min: 1 },
  { id: 'usdt-30', sym: 'USDT', days: 30, apr: 0.088, cap: 25e6, filled: 0.74, min: 50 },
  { id: 'usdt-90', sym: 'USDT', days: 90, apr: 0.115, cap: 15e6, filled: 0.88, min: 100, hot: true },
  { id: 'usdc-flex', sym: 'USDC', days: 0, apr: 0.059, cap: 40e6, filled: 0.49, min: 1 },
  { id: 'usdc-60', sym: 'USDC', days: 60, apr: 0.096, cap: 12e6, filled: 0.61, min: 50 },
  { id: 'eth-flex', sym: 'ETH', days: 0, apr: 0.038, cap: 30000, filled: 0.52, min: 0.01 },
  { id: 'eth-60', sym: 'ETH', days: 60, apr: 0.056, cap: 12000, filled: 0.7, min: 0.05 },
  { id: 'sol-flex', sym: 'SOL', days: 0, apr: 0.069, cap: 400000, filled: 0.44, min: 0.1 },
  { id: 'sol-30', sym: 'SOL', days: 30, apr: 0.084, cap: 150000, filled: 0.66, min: 1 },
  { id: 'btc-90', sym: 'BTC', days: 90, apr: 0.032, cap: 500, filled: 0.79, min: 0.001 },
];
export const EARLY_REDEEM_PENALTY = 0.5; // forfeit 50% of accrued rewards on early redemption

// ----------------------------------------------------------------------------
// Lending
// ----------------------------------------------------------------------------
// ltv: max borrow power, lt: liquidation threshold, base/slope1/slope2: borrow rate model
export const LEND_MARKETS = [
  { sym: 'USDT', ltv: 0.8, lt: 0.85, supply: 182e6, borrow: 131e6, base: 0.01, s1: 0.07, s2: 0.6 },
  { sym: 'USDC', ltv: 0.8, lt: 0.85, supply: 96e6, borrow: 64e6, base: 0.01, s1: 0.065, s2: 0.6 },
  { sym: 'ETH', ltv: 0.75, lt: 0.8, supply: 41200, borrow: 12100, base: 0.005, s1: 0.04, s2: 0.8 },
  { sym: 'BTC', ltv: 0.73, lt: 0.78, supply: 1840, borrow: 410, base: 0.005, s1: 0.035, s2: 0.8 },
  { sym: 'SOL', ltv: 0.65, lt: 0.7, supply: 820000, borrow: 310000, base: 0.01, s1: 0.06, s2: 1 },
  { sym: 'NVX', ltv: 0.4, lt: 0.5, supply: 38e6, borrow: 7.5e6, base: 0.02, s1: 0.1, s2: 1.5 },
];
export const RESERVE_FACTOR = 0.1;
export const KINK = 0.8;

export function borrowRate(m, u) {
  return u <= KINK ? m.base + m.s1 * (u / KINK) : m.base + m.s1 + m.s2 * ((u - KINK) / (1 - KINK));
}
export function supplyRate(m, u) {
  return borrowRate(m, u) * u * (1 - RESERVE_FACTOR);
}

// ----------------------------------------------------------------------------
// OTC
// ----------------------------------------------------------------------------
export const FIATS = [
  { code: 'USD', sym: '$', rate: 1, flag: '🇺🇸' },
  { code: 'EUR', sym: '€', rate: 0.921, flag: '🇪🇺' },
  { code: 'GBP', sym: '£', rate: 0.772, flag: '🇬🇧' },
  { code: 'HKD', sym: 'HK$', rate: 7.786, flag: '🇭🇰' },
  { code: 'SGD', sym: 'S$', rate: 1.336, flag: '🇸🇬' },
  { code: 'JPY', sym: '¥', rate: 151.6, flag: '🇯🇵' },
  { code: 'KRW', sym: '₩', rate: 1381, flag: '🇰🇷' },
  { code: 'MYR', sym: 'RM', rate: 4.47, flag: '🇲🇾' },
  { code: 'PHP', sym: '₱', rate: 57.9, flag: '🇵🇭' },
  { code: 'TWD', sym: 'NT$', rate: 32.14, flag: '🇹🇼' },
];
export const FIAT = Object.fromEntries(FIATS.map((f) => [f.code, f]));
// Default fiat per UI language
export const LANG_FIAT = { zh: 'USD', en: 'USD', ko: 'KRW', ja: 'JPY', ms: 'MYR', es: 'EUR', fil: 'PHP' };

export const PAY_METHODS = {
  card: { name: ['Visa / Mastercard', 'Visa / Mastercard'], color: '#5B8CFF' },
  applepay: { name: ['Apple Pay', 'Apple Pay'], color: '#E6E8EC' },
  googlepay: { name: ['Google Pay', 'Google Pay'], color: '#34A853' },
  bank: { name: ['银行转账', 'Bank transfer'], color: '#F5B841' },
  sepa: { name: ['SEPA', 'SEPA'], color: '#2E6BE6' },
  wise: { name: ['Wise', 'Wise'], color: '#9FE870' },
  revolut: { name: ['Revolut', 'Revolut'], color: '#B98CFF' },
};

export const OTC_CRYPTOS = ['USDT', 'USDC', 'BTC', 'ETH'];

const MERCHANT_NAMES = ['Aurora Desk', 'North Star OTC', 'Bluefin Trade', 'CryptoLion', 'Sakura Crypto', 'Harbor Desk', 'Han River OTC', 'Maple Exchange', 'Manila Bay Desk', 'Kite Pay', 'Meridian OTC', 'Atlas Trading'];

// Deterministic pseudo-random so merchant lists stay stable across renders
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function otcMerchants(side, crypto, fiat) {
  const r = seeded(side.length * 97 + crypto.charCodeAt(0) * 31 + fiat.charCodeAt(1) * 7 + 11);
  const f = FIAT[fiat];
  const base = COIN[crypto].price * f.rate;
  const methodsPool = fiat === 'EUR' ? ['sepa', 'wise', 'revolut'] : fiat === 'USD' || fiat === 'GBP' ? ['bank', 'wise', 'revolut'] : ['bank', 'wise'];
  return MERCHANT_NAMES.map((name, i) => {
    const prem = side === 'buy' ? 0.002 + r() * 0.018 : -0.004 - r() * 0.016;
    const price = base * (1 + prem);
    const avail = crypto === 'BTC' ? 0.3 + r() * 4 : crypto === 'ETH' ? 4 + r() * 60 : 2000 + r() * 180000;
    const minF = Math.round((30 + r() * 250) * f.rate / 10) * 10;
    const maxF = Math.round(Math.min(avail * price, (3000 + r() * 55000) * f.rate) / 100) * 100;
    const methods = methodsPool.filter(() => r() > 0.35);
    if (!methods.length) methods.push(methodsPool[0]);
    return {
      id: `${side}-${crypto}-${fiat}-${i}`,
      name,
      verified: r() > 0.3,
      orders: Math.round(300 + r() * 12000),
      rate: 0.95 + r() * 0.049,
      release: Math.round(1 + r() * 9),
      online: r() > 0.15,
      price,
      avail,
      minF: Math.max(minF, 50),
      maxF: Math.max(maxF, minF * 5),
      methods,
    };
  }).sort((a, b) => (side === 'buy' ? a.price - b.price : b.price - a.price));
}

// Third-party card on-ramps (quotes are simulated)
export const CARD_PROVIDERS = [
  { id: 'moonpay', name: 'MoonPay', fee: 0.035, spread: 0.006, eta: ['即时到账', 'Instant'], methods: ['card', 'applepay', 'googlepay', 'bank'], color: '#7D00FF', min: 20 },
  { id: 'banxa', name: 'Banxa', fee: 0.0199, spread: 0.012, eta: ['1–5 分钟', '1–5 min'], methods: ['card', 'applepay', 'googlepay', 'sepa'], color: '#00C2FF', min: 30 },
];

export const WALLETS = [
  { id: 'metamask', name: 'MetaMask', color: '#F6851B', hint: ['浏览器插件', 'Browser extension'], installed: true },
  { id: 'okx', name: 'OKX Wallet', color: '#E6E8EC', hint: ['浏览器插件', 'Browser extension'], installed: true },
  { id: 'coinbase', name: 'Coinbase Wallet', color: '#0052FF', hint: ['浏览器插件 / App', 'Extension / app'] },
  { id: 'walletconnect', name: 'WalletConnect', color: '#3B99FC', hint: ['扫码连接手机钱包', 'Scan with a mobile wallet'] },
  { id: 'trust', name: 'Trust Wallet', color: '#3375BB', hint: ['移动端 App', 'Mobile app'] },
];

export const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA', gas: 'ETH' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0', gas: 'ETH' },
  { id: 'base', name: 'Base', color: '#0052FF', gas: 'ETH' },
  { id: 'bsc', name: 'BNB Chain', color: '#F3BA2F', gas: 'BNB' },
];
