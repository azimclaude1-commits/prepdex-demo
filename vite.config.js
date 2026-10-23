import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Libraries served from a CDN in the production build (keeps the single-file page small).
const CDN = {
  react: ['React', 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js'],
  'react-dom': ['ReactDOM', 'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js'],
  'react-dom/client': ['ReactDOM', null],
  'lightweight-charts': ['LightweightCharts', 'https://cdn.jsdelivr.net/npm/lightweight-charts@4.2.3/dist/lightweight-charts.standalone.production.js'],
  'qrcode-generator': ['qrcode', 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'],
};

function cdnScripts() {
  return {
    name: 'cdn-scripts',
    apply: 'build',
    transformIndexHtml() {
      return Object.values(CDN)
        .filter(([, url]) => url)
        .map(([, url]) => ({ tag: 'script', attrs: { src: url, crossorigin: 'anonymous' }, injectTo: 'head' }));
    },
  };
}

export default defineConfig(({ command }) => ({
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    jsxInject: `import React from 'react'`,
  },
  plugins: [cdnScripts(), viteSingleFile()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      external: command === 'build' ? Object.keys(CDN) : [],
      output: {
        format: 'iife',
        globals: Object.fromEntries(Object.entries(CDN).map(([k, [g]]) => [k, g])),
      },
    },
  },
}));
