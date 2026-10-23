// Turns dist/index.html into a page fragment for publishing (the host adds doctype/html/head/body).
import fs from 'node:fs';
const html = fs.readFileSync('dist/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/i)[1]
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '');
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
fs.mkdirSync('artifact', { recursive: true });
fs.writeFileSync('artifact/prepdex.html', head.trim() + '\n' + body.trim() + '\n');
console.log('artifact/prepdex.html', (fs.statSync('artifact/prepdex.html').size / 1024).toFixed(1) + ' KB');
