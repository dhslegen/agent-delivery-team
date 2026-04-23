// T-M01: DeliveryStore — SQLite 封装，使用 Node.js 内置 node:sqlite（v22+）
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class DeliveryStore {
  constructor(dbPath) {
    this._path = dbPath;
    this._db = null;
  }

  openOrCreate() {
    this._db = new DatabaseSync(this._path);
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    this._db.exec(schema);
  }

  createProject(id, name) {
    this._db.prepare(
      'INSERT OR IGNORE INTO projects(project_id, name, created_at) VALUES(?, ?, ?)'
    ).run(id, name, new Date().toISOString());
  }

  ingestEvent(ev) {
    const d = ev.data || {};
    const ts = ev.ts || new Date().toISOString();
    const pid = ev.project_id || 'unknown';

    switch (ev.event) {
      case 'session_start':
        this._db.prepare(
          'INSERT OR IGNORE INTO sessions(session_id, project_id, started_at) VALUES(?, ?, ?)'
        ).run(d.session_id || 'unknown', pid, ts);
        break;

      case 'session_end':
        this._db.prepare(
          'UPDATE sessions SET ended_at=?, total_input_tokens=?, total_output_tokens=? WHERE session_id=?'
        ).run(ts, d.tokens_input || 0, d.tokens_output || 0, d.session_id || 'unknown');
        break;

      case 'pre_tool_use':
        this._db.prepare(
          'INSERT INTO tool_calls(session_id, project_id, tool_name, started_at, file_path, bash_head) VALUES(?, ?, ?, ?, ?, ?)'
        ).run('unknown', pid, d.tool_name || '', ts, d.file_path || '', d.bash_head || '');
        break;

      case 'post_tool_use':
        // 更新同项目同工具最近一条未关闭的记录
        this._db.prepare(
          'UPDATE tool_calls SET ended_at=?, success=? WHERE id=(SELECT MAX(id) FROM tool_calls WHERE project_id=? AND tool_name=? AND ended_at IS NULL)'
        ).run(ts, d.success ? 1 : 0, pid, d.tool_name || '');
        break;

      case 'subagent_stop':
        this._db.prepare(
          'INSERT INTO subagent_runs(session_id, project_id, subagent_name, ended_at, duration_ms, input_tokens, output_tokens, success) VALUES(?, ?, ?, ?, ?, ?, ?, ?)'
        ).run('unknown', pid, d.subagent_name || 'unknown', ts,
          d.duration_ms || 0, d.tokens_input || 0, d.tokens_output || 0, 1);
        break;
    }
  }

  aggregateStageHours(projectId) {
    const rows = this._db.prepare(
      'SELECT subagent_name, SUM(duration_ms) AS total_ms FROM subagent_runs WHERE project_id=? GROUP BY subagent_name'
    ).all(projectId);
    const result = {};
    for (const row of rows) {
      result[row.subagent_name] = (row.total_ms || 0) / 3_600_000;
    }
    return result;
  }

  latestQuality(projectId) {
    return this._db.prepare(
      'SELECT * FROM quality_metrics WHERE project_id=? ORDER BY captured_at DESC LIMIT 1'
    ).get(projectId) || null;
  }
}
