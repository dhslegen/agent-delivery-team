---
description: 度量命令 · 生成效率报告（含洞察、瓶颈分析、优化建议）。
argument-hint: "[--stage <all|design|impl|verify|ship>]"
---

# /report

**输入**：$ARGUMENTS

---

## Phase 1 — 前置校验

若 `baseline/baseline.locked.json` 不存在，先初始化基线：

```bash
(cd plugins/digital-delivery-team && node bin/baseline.mjs --lock)
```

读取项目 ID：

```bash
export DELIVERY_PROJECT_ID=$(cat .delivery/project-id 2>/dev/null || echo "$DELIVERY_PROJECT_ID")
test -n "$DELIVERY_PROJECT_ID" || { echo "❌ 未设置 DELIVERY_PROJECT_ID，请先运行 /prd"; exit 1; }
```

## Phase 2 — 聚合 + 原始报告

```bash
node plugins/digital-delivery-team/bin/aggregate.mjs --project "$DELIVERY_PROJECT_ID"
node plugins/digital-delivery-team/bin/report.mjs \
  --project "$DELIVERY_PROJECT_ID" \
  --out docs/efficiency-report.raw.md
```

## Phase 3 — 派发 metrics-agent

使用 Task 工具派发 `metrics-agent`，传入：

- `docs/efficiency-report.raw.md`（原始数据报告）
- `baseline/baseline.locked.json`（基线）
- `templates/efficiency-report.template.md`（报告模板）
- `$ARGUMENTS`（过滤阶段，如 `--stage impl`）

metrics-agent 产出 `docs/efficiency-report.md`，包含：
- 自然语言解读
- 瓶颈分析
- Top 3 优化建议

## Phase 4 — 汇总输出

```
/report 完成

总提效:       <+n>% / <-n>%
质量劣化:     ✅ 无 / ⚠️ <n> 项
Top 3 优化建议:
  1. <suggestion-1>
  2. <suggestion-2>
  3. <suggestion-3>

报告: docs/efficiency-report.md
```

若质量指标劣化：

> ⚠️ **存在质量劣化，请 metrics-agent 重点分析并给出改进计划**

否则：

> ✅ 建议下一步：`/ship`

## --refresh

传入 `--refresh` 时，重新聚合并覆盖已有报告。

$ARGUMENTS
