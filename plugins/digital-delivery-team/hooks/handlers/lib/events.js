'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const EVENTS_DIR = process.env.DELIVERY_METRICS_DIR || path.join(os.homedir(), '.claude', 'delivery-metrics');
const EVENTS_FILE = path.join(EVENTS_DIR, 'events.jsonl');

function ensureDir() {
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }
}

/**
 * 同步追加一条事件到 events.jsonl。
 * 使用同步写入：hooks 在阻塞路径上，进程可能在 async 完成前退出。
 *
 * @param {string} eventName  事件类型（session_start/session_end/tool_use/subagent_stop）
 * @param {string} projectId  项目 ID
 * @param {object} data       附加数据（工具名、文件路径、耗时等）
 */
function appendEvent(eventName, projectId, data) {
  try {
    ensureDir();
    const record = {
      ts: new Date().toISOString(),
      event: eventName,
      project_id: projectId || 'unknown',
      data: data || {}
    };
    fs.appendFileSync(EVENTS_FILE, JSON.stringify(record) + '\n', 'utf8');
  } catch (err) {
    // 写入失败不得阻塞工具执行，仅记录到 stderr
    process.stderr.write(`[events.js] appendEvent failed: ${err.message}\n`);
  }
}

/**
 * 从环境变量或项目本地文件读取 project_id。
 * 优先级：DELIVERY_PROJECT_ID 环境变量 > .delivery/project-id 文件
 *
 * @param {string} cwd 当前工作目录（默认 process.cwd()）
 * @returns {string}
 */
function resolveProjectId(cwd) {
  if (process.env.DELIVERY_PROJECT_ID) {
    return process.env.DELIVERY_PROJECT_ID;
  }
  const localFile = path.join(cwd || process.cwd(), '.delivery', 'project-id');
  try {
    return fs.readFileSync(localFile, 'utf8').trim();
  } catch {
    return 'unknown';
  }
}

/**
 * 读取最近 N 条事件（避免全量加载大文件）。
 *
 * @param {number} limit 最多返回条数（默认 200）
 * @returns {object[]}
 */
function readRecentEvents(limit) {
  const n = limit || 200;
  try {
    if (!fs.existsSync(EVENTS_FILE)) return [];
    const content = fs.readFileSync(EVENTS_FILE, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    return lines
      .slice(-n)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (err) {
    process.stderr.write(`[events.js] readRecentEvents failed: ${err.message}\n`);
    return [];
  }
}

module.exports = { appendEvent, resolveProjectId, readRecentEvents };
