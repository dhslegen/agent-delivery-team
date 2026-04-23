#!/usr/bin/env node
// T-M02: 从 events.jsonl 聚合到 SQLite。支持 --bootstrap 创建新项目 ID。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DeliveryStore } from './lib/store.mjs';

const METRICS_DIR = process.env.DELIVERY_METRICS_DIR || join(homedir(), '.claude', 'delivery-metrics');
const EVENTS = join(METRICS_DIR, 'events.jsonl');
const DB = join(METRICS_DIR, 'metrics.db');

const args = new Map(process.argv.slice(2).flatMap((a, i, arr) =>
  a.startsWith('--') ? [[a.replace(/^--/, ''), arr[i+1] && !arr[i+1].startsWith('--') ? arr[i+1] : true]] : []));

mkdirSync(METRICS_DIR, { recursive: true });
const store = new DeliveryStore(DB);
store.openOrCreate();

if (args.get('bootstrap')) {
  const name = args.get('name') || 'untitled';
  const id = `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  store.createProject(id, name);
  mkdirSync('.delivery', { recursive: true });
  writeFileSync('.delivery/project-id', id);
  console.log(id);
  process.exit(0);
}

const projectId = args.get('project');
if (!existsSync(EVENTS)) {
  console.error(`events.jsonl not found at ${EVENTS}`);
  process.exit(2);
}

const lines = readFileSync(EVENTS, 'utf8').split('\n').filter(Boolean);
let imported = 0;
for (const line of lines) {
  try {
    const ev = JSON.parse(line);
    if (!projectId || ev.project_id === projectId) {
      store.ingestEvent(ev);
      imported++;
    }
  } catch { /* skip bad line */ }
}
console.log(JSON.stringify({ imported, db: DB }));
