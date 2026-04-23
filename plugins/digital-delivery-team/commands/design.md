---
description: 架构师命令 · 生成架构草案 + OpenAPI 契约 + 数据模型。
argument-hint: "[--refresh] [架构倾向性说明]"
---

# /design

**输入**：$ARGUMENTS

---

## Phase 1 — 前置校验

```bash
test -f docs/prd.md || { echo "❌ docs/prd.md 不存在，请先运行 /prd"; exit 1; }
test -f docs/wbs.md || { echo "❌ docs/wbs.md 不存在，请先运行 /wbs"; exit 1; }
```

若 `docs/api-contract.yaml` 已存在且未传 `--refresh`，进入增量修订模式。

## Phase 2 — 识别技术栈

读取项目根目录的技术栈标识文件（按优先级）：

```bash
ls package.json pyproject.toml go.mod Cargo.toml pom.xml 2>/dev/null | head -1
```

将识别结果传给 architect-agent 作为约束条件。

## Phase 3 — 派发 architect-agent

使用 Task 工具派发 `architect-agent`，传入：

- `docs/prd.md`（需求文档）
- `docs/wbs.md`（工作分解结构）
- 技术栈识别结果
- `templates/api-contract.template.yaml`（契约模板）
- `templates/data-model.template.md`（数据模型模板）
- `$ARGUMENTS`（架构倾向性说明）

architect-agent 产出：

| 产出文件 | 说明 |
|----------|------|
| `docs/arch-decision.md` | 架构决策记录（ADR），含技术选型理由 |
| `docs/api-contract.yaml` | OpenAPI 3.0 契约 |
| `docs/data-model.md` | 数据模型（ER 图文字描述 + 字段规范） |

## Phase 4 — 自动契约 lint

```bash
npx --yes @redocly/cli lint docs/api-contract.yaml || echo "⚠️ 契约 lint 未通过，请检查 docs/api-contract.yaml"
```

## Phase 5 — 汇总输出

```
/design 完成

ADR 决策数:   <n> 条
Endpoint 数:  <n> 个
契约 lint:    通过 / ⚠️ 未通过

产出文件:
  docs/arch-decision.md
  docs/api-contract.yaml
  docs/data-model.md

建议下一步：/impl 或 /build-web / /build-api
```

## --refresh

传入 `--refresh` 时，重新执行全流程（覆盖已有产出）。

$ARGUMENTS
