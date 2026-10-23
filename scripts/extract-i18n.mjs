// Collects every English UI string (second argument of L(zh, en) and [zh, en] data pairs),
// and optionally every Chinese source string (first argument) into a second file.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseMod from '@babel/traverse';
const traverse = traverseMod.default || traverseMod;
const CJK = /[㐀-鿿]/;
const keys = new Map();
const zhKeys = new Set();
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { if (!p.includes('i18n')) walk(p); }
    else if (/\.(js|jsx)$/.test(f) && !f.startsWith('i18n')) scan(p);
  }
}
function lit(node) {
  if (!node) return null;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral') {
    let out = '';
    node.quasis.forEach((q, i) => { out += q.value.cooked; if (i < node.expressions.length) out += `{${i}}`; });
    return out;
  }
  return null;
}
function add(k, file) {
  if (!k || !/[A-Za-z]{2}/.test(k.replace(/\{\d+\}/g, ''))) return;
  if (!keys.has(k)) keys.set(k, file);
}
function addZh(k) { if (k && CJK.test(k)) zhKeys.add(k); }
function scan(file) {
  const ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  traverse(ast, {
    CallExpression(p) {
      const n = p.node;
      if (n.callee.type === 'Identifier' && n.callee.name === 'L' && n.arguments.length === 2) { add(lit(n.arguments[1]), file); addZh(lit(n.arguments[0])); }
    },
    ArrayExpression(p) {
      const el = p.node.elements;
      if (el.length >= 2) {
        const a = lit(el[0]), b = lit(el[1]);
        if (a && b && CJK.test(a) && !CJK.test(b)) { add(b, file); addZh(a); }
      }
    },
  });
}
walk('src');
const out = [...keys.keys()].sort();
fs.writeFileSync(process.argv[2] || 'i18n-keys.json', JSON.stringify(out, null, 1));
console.log(out.length, 'strings');
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify([...zhKeys].sort(), null, 1));
