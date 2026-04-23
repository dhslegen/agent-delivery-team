#!/usr/bin/env node
// T-M04: 从 metrics.db + baseline.locked.json 产出 efficiency-report.raw.md
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { DeliveryStore } from './lib/store.mjs';

const METRICS_DIR = process.env.DELIVERY_METRICS_DIR || join(homedir(), '.claude', 'delivery-metrics');
const DB = join(METRICS_DIR, 'metrics.db');
const DEFAULT_BASELINE = 'baseline/baseline.locked.json';
const DEFAULT_OUT = 'docs/efficiency-report.raw.md';

const args = new Map(process.argv.slice(2).flatMap((a, i, arr) =>
  a.startsWith('--') ? [[a.replace(/^--/, ''), arr[i+1] && !arr[i+1].startsWith('--') ? arr[i+1] : true]] : []));

if (args.has('help')) {
  console.log(`Usage: node report.mjs [options]

Options:
  --project <id>     按项目 ID 过滤
  --out <path>       输出文件路径（默认: ${DEFAULT_OUT}）
  --baseline <path>  baseline.locked.json 路径（默认: ${DEFAULT_BASELINE}）
  --help             显示帮助
`);
  process.exit(0);
}

const outPath = args.get('out') || DEFAULT_OUT;
const baselinePath = args.get('baseline') || DEFAULT_BASELINE;
const projectId = args.get('project') || null;

// Stage → agent name 映射
const STAGES = {
  prd:      'product-agent',
  wbs:      'pm-agent',
  design:   'architect-agent',
  frontend: 'frontend-agent',
  backend:  'backend-agent',
  test:     'test-agent',
  review:   'review-agent',
  docs:     'docs-agent',
};

// 读 baseline
let baseline = null;
if (existsSync(baselinePath)) {
  baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
}

// 读 DB
if (!existsSync(DB)) {
  console.error(`metrics.db 不存在于 ${DB}，请先运行 aggregate.mjs`);
  process.exit(2);
}
const store = new DeliveryStore(DB);
store.openOrCreate();

const actual  = projectId ? store.aggregateStageHours(projectId) : {};
const quality = projectId ? store.latestQuality(projectId) : null;

// 构建报告
const ts = new Date().toISOString();
const lines = [];

lines.push(`# Efficiency Report (Raw)`);
lines.push(`> 生成时间: ${ts}${projectId ? ` · 项目: \`${projectId}\`` : ' · 全量（未指定项目）'}`);
lines.push('');

// 1. 阶段对比表
lines.push('## 1. 阶段级对比表');
lines.push('');
lines.push('| 阶段 | 基线(h) | 实际(h) | Δ% | 状态 |');
lines.push('|------|---------|---------|-----|------|');

const mergedBase = baseline?.merged || {};
let anyDegradation = false;

for (const [stage, agent] of Object.entries(STAGES)) {
  const base = mergedBase[stage] ?? null;
  const act  = actual[agent]   ?? null;
  let delta  = '—';
  let status = '—';
  if (base !== null && act !== null) {
    const pct = base > 0 ? ((act - base) / base * 100) : 0;
    delta = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    if (pct > 20) {
      status = '⚠️ 超时';
      anyDegradation = true;
    } else if (pct < -10) {
      status = '✅ 加速';
    } else {
      status = '✅ 正常';
    }
  }
  const baseStr = base !== null ? base.toFixed(2) : '—';
  const actStr  = act  !== null ? act.toFixed(2)  : '—';
  lines.push(`| ${stage} | ${baseStr} | ${actStr} | ${delta} | ${status} |`);
}

lines.push('');

// 2. 质量守门表
lines.push('## 2. 质量守门表');
lines.push('');
if (anyDegradation) {
  lines.push('⚠️ 存在劣化指标，请 metrics-agent 重点分析。');
  lines.push('');
}
if (quality) {
  lines.push('| 指标 | 值 |');
  lines.push('|------|----|');
  for (const [k, v] of Object.entries(quality)) {
    if (k === 'project_id' || k === 'captured_at') continue;
    lines.push(`| ${k} | ${v} |`);
  }
} else {
  lines.push('_暂无质量指标数据（quality_metrics 表为空或未指定项目）_');
}

lines.push('');

// 3. 原始数据链接
lines.push('## 3. 原始数据链接');
lines.push('');
lines.push(`- **DB**: \`${DB}\``);
lines.push(`- **Baseline**: \`${baselinePath}\``);
lines.push(`- **Events JSONL**: \`${join(METRICS_DIR, 'events.jsonl')}\``);
lines.push('');
lines.push('> metrics-agent 接手后将在此基础上做自然语言解读。');

// 写入输出文件
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join('\n') + '\n');
console.log(JSON.stringify({ out: outPath, degradation: anyDegradation, ts }));
