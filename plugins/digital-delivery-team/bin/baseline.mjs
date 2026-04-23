#!/usr/bin/env node
// T-M03: 从 historical CSV + expert MD 产出 baseline.locked.json。
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';

const HIST = 'baseline/historical-projects.csv';
const EXPERT = 'baseline/estimation-rules.md';
const OUT = 'baseline/baseline.locked.json';
const HISTORY = 'baseline/baseline.history.jsonl';
const args = new Set(process.argv.slice(2));

if (args.has('--help')) {
  console.log('Usage: node baseline.mjs [--lock] [--force]\n  --lock   refuse to overwrite if locked\n  --force  overwrite and leave history trail');
  process.exit(0);
}

if (existsSync(OUT) && !args.has('--force')) {
  console.error('baseline already locked. Use --force to override.');
  process.exit(3);
}

if (!existsSync(HIST)) { console.error(`Missing: ${HIST}`); process.exit(2); }
if (!existsSync(EXPERT)) { console.error(`Missing: ${EXPERT}`); process.exit(2); }

const csv = readFileSync(HIST, 'utf8').trim().split('\n');
const header = csv.shift().split(',');
const rows = csv.map(l => Object.fromEntries(l.split(',').map((v, i) => [header[i], v])));

const expert = readFileSync(EXPERT, 'utf8');
const stages = ['prd','wbs','design','frontend','backend','test','review','docs'];
const histAvg = {}, expertAvg = {};

for (const s of stages) {
  const vals = rows.map(r => parseFloat(r[`${s}_hours`] || r[s] || '0')).filter(Number.isFinite);
  histAvg[s] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const m = expert.match(new RegExp(`\\|\\s*${s}\\s*\\|\\s*([\\d.]+)`, 'i'));
  expertAvg[s] = m ? parseFloat(m[1]) : histAvg[s];
}

const merged = Object.fromEntries(stages.map(s => [s, +((histAvg[s] + expertAvg[s]) / 2).toFixed(2)]));
const payload = { lockedAt: new Date().toISOString(), hist: histAvg, expert: expertAvg, merged };

if (existsSync(OUT) && args.has('--force')) {
  appendFileSync(HISTORY, JSON.stringify({ replacedAt: new Date().toISOString(), prev: JSON.parse(readFileSync(OUT, 'utf8')) }) + '\n');
}

writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(OUT);
