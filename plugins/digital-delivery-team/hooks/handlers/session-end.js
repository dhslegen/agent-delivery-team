#!/usr/bin/env node
// T-H03: SessionEnd handler — 记录会话结束事件
'use strict';
const { appendEvent, resolveProjectId } = require('./lib/events');

function readStdin() {
  return new Promise(resolve => {
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', () => resolve(''));
  });
}

(async () => {
  try {
    const raw = await readStdin();
    let input = {};
    try {
      input = JSON.parse(raw);
    } catch {}
    const cwd = input.cwd || process.cwd();
    const projectId = resolveProjectId(cwd);
    appendEvent('session_end', projectId, {
      session_id: input.session_id || process.env.CLAUDE_SESSION_ID || 'unknown',
      cwd,
      turns: input.num_turns || 0,
      total_cost_usd: input.total_cost_usd || 0
    });
  } catch (e) {
    process.stderr.write('[delivery-hook] session-end error: ' + e.message + '\n');
  }
  process.exit(0);
})();
