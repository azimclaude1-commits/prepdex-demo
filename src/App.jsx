import { useEffect, useState } from 'react';
import { setLang, LANGS } from './core/lang.js';
import { useApp, useUI } from './core/store.js';
import { Header, Footer, Toasts, DemoPanel, Backdrop } from './layout/Shell.jsx';
import { ModalHost } from './layout/Modals.jsx';
import { Launchpad, ProjectPage } from './pages/Launchpad.jsx';
import { Spot } from './pages/Spot.jsx';
import { Futures } from './pages/Futures.jsx';
import { Staking } from './pages/Staking.jsx';
import { Lending } from './pages/Lending.jsx';
import { OTC } from './pages/OTC.jsx';
import { Swap } from './pages/Swap.jsx';
import { Wallet } from './pages/Wallet.jsx';

function useSystemDark() {
  const q = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null;
  const [dark, setDark] = useState(q ? q.matches : true);
  useEffect(() => {
    if (!q) return;
    const h = (e) => setDark(e.matches);
    q.addEventListener('change', h);
    return () => q.removeEventListener('change', h);
  }, []);
  return dark;
}

export default function App() {
  const s = useApp();
  const { route } = useUI();
  const sysDark = useSystemDark();
  setLang(s.lang);
  const root = document.documentElement;
  // The host may also set data-theme; an explicit in-app choice wins.
  const hostTheme = root.getAttribute('data-theme');
  const resolved = s.theme || (hostTheme === 'light' || hostTheme === 'dark' ? hostTheme : sysDark ? 'dark' : 'light');
  if (s.theme) root.setAttribute('data-theme', s.theme);
  root.dataset.resolved = resolved;
  root.lang = LANGS.find((x) => x.code === s.lang)?.html || 'zh-Hant';

  let page;
  switch (route.page) {
    case 'project': page = <ProjectPage id={route.arg} />; break;
    case 'spot': page = <Spot arg={route.arg} />; break;
    case 'futures': page = <Futures arg={route.arg} />; break;
    case 'staking': page = <Staking />; break;
    case 'lending': page = <Lending />; break;
    case 'otc': page = <OTC />; break;
    case 'swap': page = <Swap />; break;
    case 'wallet': page = <Wallet arg={route.arg} key={route.arg || 'w'} />; break;
    default: page = <Launchpad />;
  }
  return (
    <>
      <Backdrop />
      <Header />
      <main className="main" key={route.page + (route.arg || '') + s.lang}>{page}</main>
      <Footer />
      <DemoPanel />
      <ModalHost />
      <Toasts />
    </>
  );
}
