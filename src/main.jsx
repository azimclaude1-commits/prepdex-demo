import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { startMarket } from './core/market.js';
import { startEngine } from './core/store.js';
import './styles.css';

startMarket();
startEngine();
createRoot(document.getElementById('root')).render(<App />);
