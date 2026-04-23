#!/usr/bin/env node
// T-H05: PostToolUse handler — 记录工具调用后结果，捕获 success/output_size
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
    const cwd = process.cwd();
    const projectId = resolveProjectId(cwd);
    appendEvent('post_tool_use', projectId, {
      tool_name: input.tool_name || '',
      success: input.error == null,
      output_size: typeof input.output === 'string' ? input.output.length : 0
    });
  } catch (e) {
    process.stderr.write('[delivery-hook] post-tool-use error: ' + e.message + '\n');
  }
  process.exit(0);
})();
