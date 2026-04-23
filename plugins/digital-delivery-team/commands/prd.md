---
description: 产品经理命令 · 生成或刷新 PRD（含用户故事与 Given/When/Then 验收标准）。
argument-hint: "[--refresh] [补充说明文本]"
---

# /prd

**输入**：$ARGUMENTS

---

## Phase 1 — 前置校验

```bash
git rev-parse --is-inside-work-tree 2>/dev/null || { echo "❌ 非 git 仓库"; exit 1; }
```

若 `project-brief.md` 不存在：

```bash
cp templates/project-brief.template.md project-brief.md
echo "⚠️ 已创建 project-brief.md 骨架，请填写后重跑 /prd"
exit 1
```

## Phase 2 — 初始化项目 ID

若 `DELIVERY_PROJECT_ID` 未设置且 `.delivery/project-id` 不存在：

```bash
node bin/aggregate.mjs --bootstrap --name "$(basename $(pwd))"
export DELIVERY_PROJECT_ID=$(cat .delivery/project-id)
echo "✅ 项目 ID: $DELIVERY_PROJECT_ID"
```

否则读取已有 ID：

```bash
export DELIVERY_PROJECT_ID=$(cat .delivery/project-id 2>/dev/null || echo "$DELIVERY_PROJECT_ID")
```

## Phase 3 — 增量 / 全量选择

若 `docs/prd.md` 已存在且未传 `--refresh`，询问用户选择增量修订（默认）或全量重写。

## Phase 4 — 派发 product-agent

使用 Task 工具派发 `product-agent`，传入：

- `project-brief.md`（项目简报）
- `docs/prd.md`（已有 PRD，若存在）
- `templates/prd.template.md`（PRD 模板）
- `$ARGUMENTS`（补充说明）

product-agent 产出 `docs/prd.md`，必须包含：
- 用户故事列表
- 每条验收标准（Given / When / Then 格式）
- 功能优先级（P0 / P1 / P2）

## Phase 5 — 汇总输出

```
/prd 完成

变更摘要:
  新增用户故事: <n> 条
  修改:         <n> 条
  删除:         <n> 条

项目 ID: <DELIVERY_PROJECT_ID>
报告:    docs/prd.md
```

若 `docs/blockers.md` 有新增条目：

> ⚠️ **存在阻塞项（docs/blockers.md），请处理后再推进**

否则：

> ✅ 建议下一步：`/wbs`

## --refresh

传入 `--refresh` 时，全量重写 `docs/prd.md`。

$ARGUMENTS
