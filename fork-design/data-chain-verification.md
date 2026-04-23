# 真数据链路验证报告 · digital-delivery-team

> 执行时间: 2026-04-23T05:06:00Z  
> 测试目录: /tmp/ddt-smoke-e02-1776920761/  
> 执行人: AI (断点执行 T-E02)

---

## 验证目标

验证 `aggregate.mjs → baseline.mjs → report.mjs` 三段数据链路：
1. 能消费真实格式的 events.jsonl（5 条 fake 事件）
2. 能从历史 CSV 产出有效基线（非零数值）
3. report 输出包含"阶段对比表 + 质量守门 + 原始数据链接"三个章节

---

## Step 1：构造 fake events.jsonl（5 条）

| # | event | project_id | 关键数据 |
|---|-------|-----------|---------|
| 1 | session_start | proj-e02-verify | session_id: sess-e02-01 |
| 2 | subagent_stop | proj-e02-verify | product-agent, 30min, 4k/2.5k tokens |
| 3 | subagent_stop | proj-e02-verify | backend-agent, 60min, 6k/4k tokens |
| 4 | subagent_stop | proj-e02-verify | test-agent, 20min, 3k/2k tokens |
| 5 | session_end | proj-e02-verify | 15k/9k tokens |

**结果**：events.jsonl 写入 5 条，格式符合 `store.mjs.ingestEvent()` schema。

---

## Step 2a：aggregate.mjs

```
输入: /tmp/.../metrics/events.jsonl (5 条)
输出: /tmp/.../metrics/metrics.db
命令退出码: 0
导入结果: {"imported":5,"db":"...metrics.db"}
```

**结论**：PASS — 5 条事件全部导入 SQLite。

---

## Step 2b：baseline.mjs（含 CSV 列名修正）

**问题修复**：历史 CSV 列名 (`prd_h`, `wbs_h` 等) 与 `baseline.mjs` 期望格式 (`prd_hours`, `wbs_hours`) 不匹配，导致所有历史均值为 0。已修正列名并拆分合并字段（`impl_h` → `frontend_hours + backend_hours`，`verify_h` → `test_hours + review_hours`）。

```
输入: baseline/historical-projects.csv (8 条历史数据)
      baseline/estimation-rules.md
输出: baseline/baseline.locked.json
命令退出码: 0
```

**产出基线（合理数值）**：

| 阶段 | 合并基线(h) |
|------|-----------|
| prd | 3.63 |
| wbs | 3.13 |
| design | 6.38 |
| frontend | 10.38 |
| backend | 14.25 |
| test | 5.13 |
| review | 1.88 |
| docs | 3.25 |

**结论**：PASS — 基线数值非零，历史数据读取正常。

---

## Step 2c：report.mjs

```
输入: metrics.db + baseline.locked.json + events.jsonl
输出: report.md
命令退出码: 0
```

---

## Step 3：核对 report 输出内容

### 阶段对比表

report.md 包含 `## 1. 阶段级对比表`，含 8 个阶段行，基线数值有效（非零）。✅

### 质量守门

report.md 包含 `## 2. 质量守门表`（当前 quality_metrics 表为空，符合预期——无质量事件写入）。✅

### 原始数据链接

report.md 包含 `## 3. 原始数据链接`，列出 DB / Baseline / Events JSONL 三条路径。✅

---

## 验证结论

| 检查项 | 结果 |
|--------|------|
| events.jsonl 格式正确，5 条全部导入 | ✅ PASS |
| baseline.mjs 产出有效（非零）基线 | ✅ PASS |
| report.md 含"阶段对比表"章节 | ✅ PASS |
| report.md 含"质量守门"章节 | ✅ PASS |
| report.md 含"原始数据链接"章节 | ✅ PASS |
| CSV 列名修正（prd_h → prd_hours 等）| ✅ 已修复 |

**三段链路完全可用**，T-E02 验证通过。P9（打包与文档）现可解锁。

---

_data-chain-verification.md 由 T-E02 自动生成_
