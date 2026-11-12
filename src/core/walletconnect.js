// Real wallet connection through WalletConnect (Reown AppKit).
// The connected address is used as the account, and campaign signatures are real wallet signatures.
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, arbitrum, base, bsc } from '@reown/appkit/networks';
import { verifyMessage } from 'ethers';

// Reown Cloud project ID (public, client-side). Add the site's domain to the project's allowlist.
export const WC_PROJECT_ID = 'c34b3bde7397ea7ed6780e9ce1d5194d';

let kit = null;
let userAsked = false;

export function getKit() {
  if (kit) return kit;
  const origin = typeof location !== 'undefined' && /^https?:/.test(location.origin) ? location.origin : 'https://novarix.app';
  kit = createAppKit({
    adapters: [new EthersAdapter()],
    networks: [mainnet, arbitrum, base, bsc],
    defaultNetwork: mainnet,
    projectId: WC_PROJECT_ID,
    metadata: {
      name: 'Novarix',
      description: 'Novarix exchange',
      url: origin,
      icons: [`${origin}/favicon.ico`],
    },
    features: { analytics: false, email: false, socials: false, swaps: false, onramp: false, send: false, history: false },
    themeMode: document.documentElement.dataset.resolved === 'light' ? 'light' : 'dark',
    themeVariables: { '--w3m-accent': '#FF9A3D', '--w3m-z-index': 1000 },
  });
  return kit;
}

// Opens the wallet picker (browser extensions, WalletConnect QR, mobile wallets)
export function openWalletModal() {
  userAsked = true;
  getKit().open({ view: 'Connect' });
}
// True once after the user picked a wallet from our connect button
export function takeUserAsked() {
  const v = userAsked;
  userAsked = false;
  return v;
}

export function closeWalletModal() {
  kit?.close();
}

export async function disconnectWallet() {
  try { await kit?.disconnect(); } catch (e) { /* already disconnected */ }
}

export function setWalletTheme(mode) {
  kit?.setThemeMode(mode === 'light' ? 'light' : 'dark');
}

// Calls back with { address, isConnected, status, walletName, walletIcon } whenever the account changes
export function watchWallet(cb) {
  const k = getKit();
  let info = k.getWalletInfo?.() || null;
  let last = null;
  const emit = (acc) => {
    last = acc || last;
    if (!last) return;
    cb({ address: last.address, isConnected: last.isConnected, status: last.status, walletName: info?.name || '', walletIcon: info?.icon || '' });
  };
  const offInfo = k.subscribeWalletInfo((w) => { info = w || null; emit(); });
  const offAcc = k.subscribeAccount((acc) => emit(acc));
  return () => { offInfo?.(); offAcc?.(); };
}

// Asks the connected wallet to sign a plain-text message (personal_sign). Resolves with the signature.
export async function signMessage(message, address) {
  const provider = getKit().getWalletProvider();
  if (!provider?.request) throw Object.assign(new Error('No wallet connected'), { code: 'NO_WALLET' });
  const hex = '0x' + Array.from(new TextEncoder().encode(message), (b) => b.toString(16).padStart(2, '0')).join('');
  return provider.request({ method: 'personal_sign', params: [hex, address] });
}

// The user pressed Reject / Cancel in the wallet
export function isUserRejection(e) {
  return e?.code === 4001 || e?.code === 5000 || e?.code === 'ACTION_REJECTED' || /reject|denied|cancel/i.test(e?.message || '');
}

// Address that produced the signature (checks it really came from the connected wallet)
export function recoverSigner(message, signature) {
  return verifyMessage(message, signature);
}
