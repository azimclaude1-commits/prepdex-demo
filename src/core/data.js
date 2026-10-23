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
  { sym: 'NVX', name: 'Novarix Token', price: 0.4218, color: '#FF9A3D', vol: 0.0022, chg: 0.0645, v24: 48e6 },
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
  { q: '2025 Q3', done: true, title: ['測試網上線', 'Testnet live'], items: [zh[0], en[0]] },
  { q: '2025 Q4', done: true, title: ['審計與生態基金', 'Audits & ecosystem fund'], items: [zh[1], en[1]] },
  { q: '2026 Q1', done: true, title: ['主網 Beta', 'Mainnet beta'], items: [zh[2], en[2]] },
  { q: '2026 Q4', done: false, now: true, title: ['TGE 與上線交易', 'TGE & listing'], items: [zh[3], en[3]] },
  { q: '2027 Q2', done: false, title: ['治理與跨鏈擴展', 'Governance & cross-chain'], items: [zh[4], en[4]] },
];

export const PROJECTS = [
  {
    id: 'vela', sym: 'VELA', name: 'Vela Finance', status: 'live',
    start: -30, end: 142, price: 0.06, hardCap: 600000, minBuy: 50, baseMax: 2000,
    totalSupply: 1_000_000_000, raiseCurve: [0.12, 2.65],
    colors: ['#0E2A2B', '#1C6B5A', '#7CF5C8'], glyph: 'sail', chain: 'Ethereum',
    tags: [['RWA', 'RWA'], ['私募信貸', 'Private credit'], ['機構級', 'Institutional']],
    tagline: ['把機構私募信貸帶到鏈上，年化收益透明可查', 'Institutional private credit, on-chain and auditable'],
    vision: [
      ['Vela Finance 是一個面向現實世界資產（RWA）的私募信貸協議。它把中小企業應收帳款、貿易融資和供應鏈票據打包成標準化的鏈上信貸池，由持牌資產管理人負責盡調與貸後管理，投資者可以按池子認購並即時查看底層資產表現。',
        'Vela Finance is a private-credit protocol for real-world assets. It packages SME receivables, trade finance and supply-chain notes into standardised on-chain credit pools. Licensed asset managers run diligence and servicing, and investors can subscribe per pool and track the underlying loans in real time.'],
      ['傳統私募信貸市場規模超過 1.7 兆美元，但門檻高、透明度低、流動性差。Vela 用智能合約記錄每一筆放款、還款和逾期，把月度報表變成可驗證的鏈上狀態，並透過二級市場讓 LP 份額可以轉讓。',
        'Traditional private credit is a $1.7T market that is hard to access, opaque and illiquid. Vela records every disbursement, repayment and delinquency in smart contracts, turning monthly reports into verifiable on-chain state, and lets LP shares trade on a secondary market.'],
      ['VELA 代幣用於協議治理、風險準備金質押和費用折扣。質押 VELA 的用戶承擔第一損失層風險，並獲得協議收入分成。',
        'VELA is used for governance, first-loss reserve staking and fee discounts. Stakers absorb first-loss risk and earn a share of protocol revenue.'],
    ],
    highlights: [
      ['已接入 4 家持牌資產管理人，在管資產 $38.6M', '4 licensed asset managers onboarded, $38.6M under management'],
      ['底層資產歷史違約率 0.42%，加權年化 11.8%', '0.42% historical default rate, 11.8% weighted APY'],
      ['合約經兩家審計機構審計，漏洞賞金 $250K', 'Audited twice, $250K bug bounty'],
    ],
    metrics: { tvl: 38.6e6, holders: 12840, apy: 0.118 },
    tokenomics: [['生態激勵', 'Ecosystem', 28], ['團隊', 'Team', 18], ['投資人', 'Investors', 16], ['風險準備金', 'Reserve', 12], ['國庫', 'Treasury', 10], ['公開認購', 'Public sale', 10], ['流動性', 'Liquidity', 6]],
    vesting: { tge: 0.25, cliff: 1, months: 6 },
    roadmap: roadmapTpl(
      ['Sepolia 測試網，3 個信貸池試運行', '完成兩輪審計，設立 $5M 生態基金', '主網 Beta，在管資產突破 $30M', '認購完成後 TGE，現貨上線 VELA/USDT', '鏈上治理上線，擴展至 Base 與 Arbitrum'],
      ['Sepolia testnet with 3 pilot pools', 'Two audits, $5M ecosystem fund', 'Mainnet beta, $30M+ AUM', 'TGE after the sale, VELA/USDT spot listing', 'On-chain governance, expand to Base & Arbitrum']),
    team: [['Elena Marsh', 'CEO', ['前 Apollo 信貸基金副總裁', 'Ex-VP, Apollo credit']], ['Daniel Okafor', 'CTO', ['前 Aave 核心合約工程師', 'Ex-core engineer, Aave']], ['Wen Li', 'Head of Risk', ['12 年結構化融資經驗', '12 yrs in structured finance']]],
    investors: ['Northwind Capital', 'Arcadia Ventures', 'Blue Harbor', 'Kite Labs', 'Meridian DAO'],
  },
  {
    id: 'kora', sym: 'KORA', name: 'Kora AI', status: 'live',
    start: -80, end: 20, price: 0.025, hardCap: 400000, minBuy: 20, baseMax: 1500,
    totalSupply: 2_000_000_000, raiseCurve: [0.3, 3.1],
    colors: ['#1A1033', '#4B2E9A', '#C7B8FF'], glyph: 'orbit', chain: 'Arbitrum',
    tags: [['AI', 'AI'], ['DePIN', 'DePIN'], ['推理網路', 'Inference']],
    tagline: ['把閒置 GPU 組成去中心化 AI 推理網路', 'A decentralised AI inference network built from idle GPUs'],
    vision: [
      ['Kora AI 把分佈在全球的閒置消費級 GPU 聚合成一個去中心化推理網路，開發者可以用比中心化雲低 60% 的價格調用開源大模型。',
        'Kora AI pools idle consumer GPUs worldwide into a decentralised inference network, letting developers call open-source models at up to 60% less than centralised clouds.'],
      ['網路採用可驗證推理（optimistic + 抽樣復算）保證結果正確，節點需要質押 KORA 才能接單，作惡會被罰沒。',
        'Results are secured by verifiable inference (optimistic execution with sampled re-computation). Nodes stake KORA to accept jobs and are slashed for misbehaviour.'],
    ],
    highlights: [
      ['測試網已有 18,400 張 GPU 接入', '18,400 GPUs connected on testnet'],
      ['日均處理 2,100 萬次推理請求', '21M inference requests per day'],
      ['與 3 個開源模型社區達成合作', 'Partnered with 3 open-model communities'],
    ],
    metrics: { tvl: 9.2e6, holders: 30210, apy: null },
    tokenomics: [['節點獎勵', 'Node rewards', 35], ['團隊', 'Team', 17], ['投資人', 'Investors', 15], ['生態基金', 'Ecosystem', 13], ['公開認購', 'Public sale', 8], ['國庫', 'Treasury', 7], ['流動性', 'Liquidity', 5]],
    vesting: { tge: 0.2, cliff: 0, months: 8 },
    roadmap: roadmapTpl(
      ['推理節點客戶端發佈', '可驗證推理論文與審計', '激勵測試網，GPU 數破萬', 'TGE，KORA 上線現貨與合約', '訓練任務市場上線'],
      ['Node client release', 'Verifiable inference paper & audit', 'Incentivised testnet, 10K+ GPUs', 'TGE, KORA on spot and perps', 'Training-job marketplace']),
    team: [['Mina Park', 'CEO', ['前 Google Brain 研究員', 'Ex-Google Brain researcher']], ['Arjun Rao', 'CTO', ['分佈式系統專家，前 Cloudflare', 'Distributed systems, ex-Cloudflare']]],
    investors: ['Polar Ventures', 'Lattice Fund', 'Hashrate Partners', 'Oakline'],
  },
  {
    id: 'mira', sym: 'MIRA', name: 'Mirage Labs', status: 'upcoming',
    start: 18, end: 90, price: 0.012, hardCap: 300000, minBuy: 20, baseMax: 1000,
    totalSupply: 5_000_000_000, raiseCurve: [0, 2.2],
    colors: ['#2B0F1E', '#9A2A5B', '#FFB3D1'], glyph: 'prism', chain: 'Base',
    tags: [['GameFi', 'GameFi'], ['全鏈遊戲', 'On-chain games'], ['引擎', 'Engine']],
    tagline: ['全鏈遊戲引擎，讓玩法邏輯完全運行在鏈上', 'An engine for fully on-chain games'],
    vision: [
      ['Mirage Labs 提供一套全鏈遊戲引擎和 ECS 框架，開發者用熟悉的工具寫玩法，狀態和規則全部部署在 Base 上，玩家資產天然可組合。',
        'Mirage Labs ships an on-chain game engine and ECS framework. Developers write gameplay with familiar tools while state and rules live on Base, so player assets are composable by default.'],
      ['首款旗艦遊戲《Driftline》已有 42 萬預約玩家。', 'Its flagship title Driftline has 420K pre-registered players.'],
    ],
    highlights: [
      ['引擎開源，GitHub 星標 6.8K', 'Open-source engine, 6.8K GitHub stars'],
      ['旗艦遊戲預約 42 萬', '420K pre-registrations'],
      ['會話密鑰免簽名，體驗接近 Web2', 'Session keys for Web2-like UX'],
    ],
    metrics: { tvl: 2.4e6, holders: 8800, apy: null },
    tokenomics: [['玩家激勵', 'Player rewards', 30], ['團隊', 'Team', 18], ['投資人', 'Investors', 17], ['開發者基金', 'Dev fund', 15], ['公開認購', 'Public sale', 7], ['國庫', 'Treasury', 8], ['流動性', 'Liquidity', 5]],
    vesting: { tge: 0.15, cliff: 2, months: 10 },
    roadmap: roadmapTpl(
      ['引擎 Alpha 開源', '開發者大賽與審計', '《Driftline》公測', 'TGE 與 MIRA 上線', '引擎 2.0 與多鏈部署'],
      ['Engine alpha open-sourced', 'Dev contest & audit', 'Driftline public beta', 'TGE & MIRA listing', 'Engine 2.0, multichain']),
    team: [['Lucas Ferreira', 'CEO', ['前 Riot Games 製作人', 'Ex-Riot Games producer']], ['Hana Sato', 'CTO', ['前 Unity 引擎架構師', 'Ex-Unity engine architect']]],
    investors: ['Pixel Ventures', 'Redwood Guild', 'Orbit DAO'],
  },
  // Completed sales
  ...[
    ['orbx', 'ORBX', 'Orbix', 0.03, 1_200_000, 2.844, ['#1A0F0A', '#7A3416', '#FFB37A'], 'hexo', ['跨鏈流動性層', 'Cross-chain liquidity'], ['把 12 條鏈的流動性匯成一個池子', 'One liquidity pool across 12 chains'], -2000],
    ['halo', 'HALO', 'Halo Network', 0.02, 800_000, 2.333, ['#0A1440', '#1E3AA8', '#9DB6FF'], 'ring', ['隱私計算 L2', 'Privacy L2'], ['基於 ZK 的隱私計算二層網路', 'A ZK privacy-compute layer 2'], -1500],
    ['tess', 'TESS', 'Tessera', 0.09, 900_000, 2.433, ['#22252C', '#5A6274', '#E7ECF5'], 'cube', ['RWA 代幣化', 'RWA tokenisation'], ['房產與債券的合規代幣化平臺', 'Compliant tokenisation for property and bonds'], -1100],
    ['lumn', 'LUMN', 'Lumen AI', 0.005, 500_000, 1.599, ['#0B0B10', '#2B2B3A', '#F2F2FF'], 'spark', ['AI 智能體', 'AI agents'], ['鏈上 AI 智能體的身份與支付層', 'Identity and payments for on-chain AI agents'], -800],
    ['zeph', 'ZEPH', 'Zephyr', 0.046, 700_000, 1.313, ['#0B1F1A', '#16634C', '#8CF0C6'], 'wind', ['DePIN 能源', 'Energy DePIN'], ['分佈式光伏與儲能的鏈上結算網路', 'On-chain settlement for distributed solar & storage'], -500],
  ].map(([id, sym, name, price, hardCap, ratio, colors, glyph, cat, tagline, endH]) => ({
    id, sym, name, status: 'ended', start: endH - 120, end: endH, price, hardCap, minBuy: 20, baseMax: 1500,
    totalSupply: 1_000_000_000, finalRatio: ratio, colors, glyph, chain: 'Ethereum',
    tags: [cat, ['已上線', 'Listed']], tagline,
    vision: [
      [`${name} ${tagline[0]}。項目於 ${PLATFORM_LAUNCH_NOTE[0]}完成公開認購，認購倍數 ${(ratio * 100).toFixed(1)}%，超額部分已按比例退還。`,
        `${name}: ${tagline[1]}. The public sale finished ${PLATFORM_LAUNCH_NOTE[1]} at ${(ratio * 100).toFixed(1)}% of the hard cap; oversubscribed funds were refunded pro rata.`],
      ['代幣已在 Novarix 現貨上線，認購用戶按釋放計劃線性解鎖。', 'The token is listed on Novarix spot, and subscribers unlock linearly per the vesting schedule.'],
    ],
    highlights: [[`認購倍數 ${(ratio * 100).toFixed(1)}%`, `${(ratio * 100).toFixed(1)}% subscribed`], [`認購價 ${price} USDC`, `Sale price ${price} USDC`]],
    metrics: { tvl: hardCap * ratio * 6, holders: Math.round(hardCap / 40), apy: null },
    tokenomics: [['生態', 'Ecosystem', 30], ['團隊', 'Team', 18], ['投資人', 'Investors', 17], ['國庫', 'Treasury', 15], ['公開認購', 'Public sale', 12], ['流動性', 'Liquidity', 8]],
    vesting: { tge: 0.2, cliff: 1, months: 6 },
    roadmap: roadmapTpl(['測試網', '審計', '主網', 'TGE 與上線', '生態擴展'], ['Testnet', 'Audit', 'Mainnet', 'TGE & listing', 'Ecosystem growth']).map((r) => ({ ...r, done: r.q !== '2027 Q2', now: false })),
    team: [['Core team', 'Founders', ['匿名核心團隊，已完成 KYC', 'Pseudonymous team, KYC-verified']]],
    investors: ['Arcadia Ventures', 'Kite Labs'],
  })),
];

export const PROJECT = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));

// NVX staking tiers drive launchpad allocation and fee discounts
export const TIERS = [
  { id: 'none', name: ['普通', 'Standard'], min: 0, mult: 1, fee: 0, color: '#8A96AD' },
  { id: 'bronze', name: ['青銅', 'Bronze'], min: 1000, mult: 1.5, fee: 0.05, color: '#C98A5A' },
  { id: 'silver', name: ['白銀', 'Silver'], min: 5000, mult: 2, fee: 0.1, color: '#C9D3E6' },
  { id: 'gold', name: ['黃金', 'Gold'], min: 20000, mult: 3, fee: 0.15, color: '#FFC94D' },
  { id: 'diamond', name: ['鑽石', 'Diamond'], min: 100000, mult: 5, fee: 0.25, color: '#7FE7FF' },
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
export const LANG_FIAT = { zht: 'TWD', en: 'USD', ko: 'KRW', ja: 'JPY', ms: 'MYR', es: 'EUR', fil: 'PHP' };

export const PAY_METHODS = {
  smbc: { name: ['三井住友銀行 SMBC', 'SMBC'], color: '#00875A', bank: true, mark: 'SMBC' },
  mufg: { name: ['三菱UFJ銀行', 'MUFG Bank'], color: '#D7000F', bank: true, mark: 'MUFG' },
  rakuten: { name: ['樂天銀行', 'Rakuten Bank'], color: '#BF0000', bank: true, mark: 'R' },
  mizuho: { name: ['瑞穗銀行', 'Mizuho Bank'], color: '#0A3D91', bank: true, mark: 'M' },
  card: { name: ['Visa / Mastercard', 'Visa / Mastercard'], color: '#5B8CFF' },
  applepay: { name: ['Apple Pay', 'Apple Pay'], color: '#E6E8EC' },
  googlepay: { name: ['Google Pay', 'Google Pay'], color: '#34A853' },
  bank: { name: ['銀行轉帳', 'Bank transfer'], color: '#F5B841' },
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
  const methodsPool = fiat === 'JPY' ? ['smbc', 'mufg', 'rakuten', 'mizuho'] : fiat === 'EUR' ? ['sepa', 'wise', 'revolut'] : fiat === 'USD' || fiat === 'GBP' ? ['bank', 'wise', 'revolut'] : ['bank', 'wise'];
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
  { id: 'moonpay', name: 'MoonPay', fee: 0.035, spread: 0.006, eta: ['即時到帳', 'Instant'], methods: ['smbc', 'mufg', 'rakuten', 'mizuho', 'card', 'applepay', 'googlepay', 'bank'], color: '#7D00FF', min: 20 },
  { id: 'banxa', name: 'Banxa', fee: 0.0199, spread: 0.012, eta: ['1–5 分鐘', '1–5 min'], methods: ['smbc', 'mufg', 'mizuho', 'card', 'applepay', 'googlepay', 'sepa'], color: '#00C2FF', min: 30 },
];

export const WALLETS = [
  { id: 'metamask', name: 'MetaMask', color: '#F6851B', hint: ['瀏覽器插件', 'Browser extension'], installed: true },
  { id: 'okx', name: 'OKX Wallet', color: '#E6E8EC', hint: ['瀏覽器插件', 'Browser extension'], installed: true },
  { id: 'coinbase', name: 'Coinbase Wallet', color: '#0052FF', hint: ['瀏覽器插件 / App', 'Extension / app'] },
  { id: 'walletconnect', name: 'WalletConnect', color: '#3B99FC', hint: ['掃碼連接手機錢包', 'Scan with a mobile wallet'] },
  { id: 'trust', name: 'Trust Wallet', color: '#3375BB', hint: ['移動端 App', 'Mobile app'] },
];

export const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA', gas: 'ETH' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0', gas: 'ETH' },
  { id: 'base', name: 'Base', color: '#0052FF', gas: 'ETH' },
  { id: 'bsc', name: 'BNB Chain', color: '#F3BA2F', gas: 'BNB' },
];
