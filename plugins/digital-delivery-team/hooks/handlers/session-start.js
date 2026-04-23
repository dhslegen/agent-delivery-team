#!/usr/bin/env node
// T-H02: SessionStart handler — 记录会话开始事件
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
    appendEvent('session_start', projectId, {
      session_id: input.session_id || process.env.CLAUDE_SESSION_ID || 'unknown',
      cwd
    });
  } catch (e) {
    process.stderr.write('[delivery-hook] session-start error: ' + e.message + '\n');
  }
  process.exit(0);
})();
