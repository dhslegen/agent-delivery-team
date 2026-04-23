#!/usr/bin/env node
// T-H06: SubagentStop handler — 记录子代理停止事件，岗位级度量主来源
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
    const usage = input.usage || {};
    appendEvent('subagent_stop', projectId, {
      subagent_name: input.agent_name || input.subagent_name || 'unknown',
      duration_ms: input.duration_ms || 0,
      tokens_input: usage.input_tokens || 0,
      tokens_output: usage.output_tokens || 0,
      tokens_total: usage.total_tokens || (usage.input_tokens || 0) + (usage.output_tokens || 0)
    });
  } catch (e) {
    process.stderr.write('[delivery-hook] subagent-stop error: ' + e.message + '\n');
  }
  process.exit(0);
})();
