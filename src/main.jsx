import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { startMarket } from './core/market.js';
import { startEngine, syncWallet, toast } from './core/store.js';
import { watchWallet, takeUserAsked, getKit } from './core/walletconnect.js';
import { L } from './core/lang.js';
import { shortAddr } from './core/fmt.js';
import { startTableLabels } from './core/stackTables.js';
import './styles.css';

startMarket();
startEngine();
// Real wallet connection: follow AppKit's account state
watchWallet((w) => {
  if (w.status === 'connecting' || w.status === 'reconnecting') return;
  if (syncWallet(w) === 'connected' && takeUserAsked()) {
    // the wallet's name can arrive a moment after the address
    setTimeout(() => toast(L('已連接錢包', 'Wallet connected'), 'ok', `${getKit().getWalletInfo()?.name || w.walletName || 'Wallet'} · ${shortAddr(w.address)}`), 400);
  }
});
createRoot(document.getElementById('root')).render(<App />);
startTableLabels();
