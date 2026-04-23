#!/usr/bin/env node
// T-H04: PreToolUse handler — 记录工具调用前事件，提取 tool_name/file_path/bash_head/task_subagent
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
    const toolInput = input.tool_input || {};
    appendEvent('pre_tool_use', projectId, {
      tool_name: input.tool_name || '',
      file_path: toolInput.file_path || toolInput.path || '',
      bash_head: toolInput.command ? String(toolInput.command).slice(0, 80) : '',
      task_subagent: toolInput.description ? String(toolInput.description).slice(0, 100) : ''
    });
  } catch (e) {
    process.stderr.write('[delivery-hook] pre-tool-use error: ' + e.message + '\n');
  }
  process.exit(0);
})();
