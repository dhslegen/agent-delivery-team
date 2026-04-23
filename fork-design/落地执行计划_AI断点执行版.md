---
name: digital-delivery-team 落地执行计划（AI 断点执行版）
version: 1.0
target_audience: Claude Code / Codex / 任何能读写本仓库的 AI 助手
parent_design: fork-design/岗位技能提效与数字员工团队方案_v3.md
plugin_root: plugins/digital-delivery-team/
progress_file: fork-design/progress.json
execution_log: fork-design/execution-log.md
ecc_repo_root: /Users/zhaowenhao/Developer/Personal/agent-delivery-team
---

# digital-delivery-team 落地执行计划（AI 断点执行版）

> 本文档是一份**可由 AI 逐步执行**的工程落地规范。
> 适用场景：单次会话 token 有限，AI 无法一次交付全部 62 个构件（9 agent + 13 command + 4 skill + 5 hook handler + 4 度量脚本 + 11 template + 插件清单 + 文档）。
> 设计目标：AI 读完本文档后，**每次会话只推进一个或若干原子任务**，通过 `progress.json` 接力，直到所有任务达成。
> 最大化复用原则：ECC 是 160K star 级别的最佳实践集合，**凡是 ECC 已有的骨架、frontmatter、约束、脚本设施，一律"先复用、再特化、最后原创"**。

---

## 目录

- [0. AI 启动协议（每次会话第一步必读）](#0-ai-启动协议每次会话第一步必读)
- [1. 文件与目录约定](#1-文件与目录约定)
- [2. 进度追踪机制](#2-进度追踪机制)
- [3. 任务执行规约](#3-任务执行规约)
- [4. Phase 全景与依赖图](#4-phase-全景与依赖图)
- [5. Phase 0 · Bootstrap 基础设施](#5-phase-0--bootstrap-基础设施)
- [6. Phase 1 · Skill 层（4 个）](#6-phase-1--skill-层4-个)
- [7. Phase 2 · Agent 层（9 个）](#7-phase-2--agent-层9-个)
- [8. Phase 3 · Templates（11 个）](#8-phase-3--templates11-个)
- [9. Phase 4 · Hook 层（7 个任务）](#9-phase-4--hook-层7-个任务)
- [10. Phase 5 · 度量脚本（4 个任务）](#10-phase-5--度量脚本4-个任务)
- [11. Phase 6 · Command 层（13 个）](#11-phase-6--command-层13-个)
- [12. Phase 7 · Baseline 数据](#12-phase-7--baseline-数据)
- [13. Phase 8 · 端到端联调](#13-phase-8--端到端联调)
- [14. Phase 9 · 打包与文档](#14-phase-9--打包与文档)
- [15. 完成度验证 Matrix](#15-完成度验证-matrix)
- [16. 常见故障与处理](#16-常见故障与处理)
- [17. ECC 复用映射总表](#17-ecc-复用映射总表)
- [18. AI 执行示例](#18-ai-执行示例一次会话的完整流转)
- [19. 本文档版本管理](#19-本文档的版本管理)

---

## 0. AI 启动协议（每次会话第一步必读）

### 0.1 启动流程（必须按顺序执行）

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1  Read this file (落地执行计划_AI断点执行版.md)          │
│ Step 2  Read fork-design/progress.json                        │
│         ├─ 不存在 → 执行 Phase 0 · T-B03 初始化                │
│         └─ 存在 → 继续                                         │
│ Step 3  从 progress.json.tasks 里筛出                          │
│         status == "ready" AND 所有 depends_on 均为 "done"      │
│ Step 4  向用户输出候选任务列表（ID + 名称 + token 估算）        │
│         询问用户选哪个执行（或若用户已授权"自动推进"则取首个）   │
│ Step 5  执行选中任务（严格按任务卡的"执行步骤"）                │
│ Step 6  执行"验证命令"                                          │
│ Step 7  若验证通过 → 追加日志到 execution-log.md                │
│                 → 更新 progress.json：                         │
│                   该任务 status = "done"                       │
│                   completed_at = <ISO-8601 UTC>                │
│                   依赖该任务的后继任务若依赖全部完成则 = "ready" │
│         若验证失败 → status = "blocked"                         │
│                   blocker_note = <原因>                        │
│                   停止并向用户报告                              │
│ Step 8  询问是否继续执行下一个任务                              │
└──────────────────────────────────────────────────────────────┘
```

### 0.2 断点续传规则

- 每个任务**必须原子化**：要么完成并验证通过，要么 status 留在 `ready` / `blocked`，**不留"半完成"状态**。
- 会话结束前 AI **必须**把 `progress.json` 落盘——这是下次会话的入口。
- 同一任务允许**多次会话分段执行**，但只能通过把该任务**拆分为子任务**的方式。拆分需写入 `progress.json` 的 `subtasks` 字段。

### 0.3 Token 预算红线

- 单个任务 token 估算 > 8000 → **必须**在任务卡里提前拆分，不允许现场硬吞。
- 会话剩余 token < 已估算任务 × 1.5 倍 → 向用户明确提示"本任务可能无法在本会话内完成，建议先提交进度并换会话"。

### 0.4 ECC 复用判定优先级（最大化复用原则）

每个新增构件，按**以下顺序逐级下沉**决定实现方式：

1. **🟢 直接继承**：ECC 已有完全对口的文件 → `cp` + 改 frontmatter + 加 Self-Check（如 `agents/architect.md`）。
2. **🟡 裁剪特化**：ECC 有近似的骨架但职责/产物不同 → 以 ECC 文件为基模，保留其通用结构，替换领域细节（如用 `skills/api-design/SKILL.md` 改造 `api-contract-first`）。
3. **🟠 混搭**：ECC 里有多个相关片段 → 融合后特化（如用 `product-capability` + `product-lens` 合成 `acceptance-criteria`）。
4. **🔴 原创**：ECC 无可用参考 → 原创，但仍必须遵循 ECC 的通用约定（frontmatter、Self-Check、命名）。

**禁止**跳过 1~3 直接走 4。每个任务卡已预判了级别，AI 需按卡上标注执行。

---

## 1. 文件与目录约定

### 1.1 插件根目录

插件根目录：`plugins/digital-delivery-team/`

> 之所以放在 `plugins/` 下而不是仓库根，是为了与 ECC 主插件（仓库根）**物理隔离**，避免被 ECC 的 `.claude-plugin/plugin.json`、`hooks.json`、`install-components.json` 扫描到。

### 1.2 完整目录结构（目标态）

```
plugins/digital-delivery-team/
├── .claude-plugin/
│   └── plugin.json                        # Phase 0 · T-B02
├── .claude/
│   └── hooks.json                         # Phase 4 · T-H07
├── README.md                              # Phase 0 · T-B05（占位）→ Phase 9 · T-P01（完整）
├── USAGE.md                               # Phase 9 · T-P02
├── CHANGELOG.md                           # Phase 9 · T-P03
├── package.json                           # Phase 9 · T-P04
├── _templates/
│   └── agent-base.md                      # Phase 0 · T-B04（内部模板，非 Claude Code 模板）
├── agents/                                # Phase 2（9 个）
├── commands/                              # Phase 6（13 个）
├── skills/                                # Phase 1（4 个目录，每个含 SKILL.md）
├── hooks/handlers/                        # Phase 4（5 个 handler + lib/events.js）
├── bin/                                   # Phase 5（3 个 mjs + lib/store.mjs + lib/schema.sql）
├── templates/                             # Phase 3（11 个模板文件）
└── baseline/                              # Phase 7（2 个数据文件）
```

### 1.3 外部辅助文件（位于 `fork-design/` 下）

| 文件 | 作用 | 创建任务 |
|---|---|---|
| `fork-design/progress.json` | 全量任务进度 | T-B03 |
| `fork-design/execution-log.md` | 每次任务完成后追加的日志 | T-B03 |

### 1.4 命名规范（与 ECC 及官方规范一致）

- Agent 文件名：`<role>-agent.md`（kebab-case）
- Command 文件名：`<verb-or-noun>.md`（无缩写歧义）
- Skill 目录名：`<domain>/`（kebab-case），内含 `SKILL.md`
- Hook handler：`<event-kebab>.js`
- JSONL 事件字段：`snake_case`
- Node 脚本扩展：`.mjs`（ESM）；hook handler 用 `.js`（CommonJS，与 ECC 现有 handler 保持一致）

---

## 2. 进度追踪机制

### 2.1 progress.json Schema

所有日期字段格式均为 **ISO-8601 UTC**（`YYYY-MM-DDTHH:MM:SSZ`）。以下值全部为合成示例，AI 初始化时按当时时刻填入真实值。

```jsonc
{
  "$schema": "digital-delivery-team/progress/v1",
  "plugin_name": "digital-delivery-team",
  "plugin_version_target": "0.3.0",
  "created_at": "2026-04-22T10:00:00Z",
  "last_updated_at": "2026-04-22T10:00:00Z",
  "current_phase": "P0",
  "completion_pct": 0.0,

  "phases": {
    "P0": { "name": "Bootstrap",    "total": 6,  "done": 0, "status": "in_progress" },
    "P1": { "name": "Skills",       "total": 4,  "done": 0, "status": "blocked" },
    "P2": { "name": "Agents",       "total": 9,  "done": 0, "status": "blocked" },
    "P3": { "name": "Templates",    "total": 11, "done": 0, "status": "blocked" },
    "P4": { "name": "Hooks",        "total": 7,  "done": 0, "status": "blocked" },
    "P5": { "name": "MetricsBins",  "total": 4,  "done": 0, "status": "blocked" },
    "P6": { "name": "Commands",     "total": 13, "done": 0, "status": "blocked" },
    "P7": { "name": "Baseline",     "total": 2,  "done": 0, "status": "blocked" },
    "P8": { "name": "E2ESmoke",     "total": 2,  "done": 0, "status": "blocked" },
    "P9": { "name": "PackageDocs",  "total": 4,  "done": 0, "status": "blocked" }
  },

  "tasks": [
    {
      "id": "T-B01",
      "phase": "P0",
      "name": "创建插件目录骨架",
      "depends_on": [],
      "status": "ready",
      "token_estimate": 500,
      "completed_at": null,
      "blocker_note": null,
      "verification": null,
      "subtasks": null
    }
  ],

  "session_history": []
}
```

`status` 取值枚举：`ready` / `in_progress` / `done` / `blocked` / `skipped`。

### 2.2 状态机

```
ready ──[开始执行]──> in_progress ──[验证通过]──> done
                           │
                           └─[验证失败]──> blocked ──[修复]──> ready
                                               │
                                               └─[用户决定跳过]──> skipped
```

- `blocked` 任务**必须**在 `blocker_note` 写清楚阻塞原因 + 建议修复动作。
- `skipped` 任务不占总数分母，但必须在 `execution-log.md` 里说明原因。

### 2.3 完成度计算

```
completion_pct = sum(tasks.status == "done") / sum(tasks.status != "skipped") × 100
```

AI 在每次执行完任务后，**必须**重新计算并更新 `completion_pct` 和对应 `phases.<P>.done`。

### 2.4 execution-log.md 格式

每次任务完成追加一节，示例（字段值为合成占位）：

```markdown
## 2026-04-22T10:15:00Z · T-B01 · done

- **任务**：创建插件目录骨架
- **产出文件**：
  - `plugins/digital-delivery-team/.claude-plugin/`
  - `plugins/digital-delivery-team/agents/`
  - （合计 12 个目录）
- **ECC 复用**：无（纯原创目录结构）
- **验证**：`find plugins/digital-delivery-team -type d` 输出 13 行，包含全部必需目录
- **token 实际消耗**：~400
- **备注**：—
```

---

## 3. 任务执行规约

### 3.1 任务卡必备字段

每个任务卡都包含以下字段。AI 必须**逐字段**执行，不允许跳过"验证"。

| 字段 | 含义 | 必填 |
|---|---|:---:|
| **ID** | 任务唯一标识（`T-<Phase><编号>`） | ✅ |
| **名称** | 人类可读的任务标题 | ✅ |
| **依赖** | 必须已 done 的任务 ID 列表 | ✅ |
| **复用级别** | 🟢/🟡/🟠/🔴 | ✅ |
| **ECC 源** | 要参考/复用的 ECC 文件路径（若 🔴 可写 `无`） | ✅ |
| **产出文件** | 本任务落盘的文件路径（可多个） | ✅ |
| **执行步骤** | 按顺序的操作清单（可 Read/Write/Edit/Bash） | ✅ |
| **验证命令** | 能证明产出正确的 Bash/Read 命令 | ✅ |
| **验证通过条件** | 明确的判定条件（例如"文件存在且行数 > 50"） | ✅ |
| **token 估算** | 任务预计消耗 | ✅ |
| **failure 回退** | 若执行失败如何回退（rm 哪个文件等） | ✅ |

### 3.2 AI 执行一个任务的 checklist

```
[ ] 1. 确认 depends_on 的所有任务都已 done
[ ] 2. 把该任务的 status 改为 in_progress，写回 progress.json
[ ] 3. Read ECC 源文件（若非 🔴）
[ ] 4. 按"执行步骤"逐步操作（使用 Write/Edit/Bash 工具）
[ ] 5. 运行"验证命令"
[ ] 6. 对照"验证通过条件"判定
[ ] 7. 通过 → 追加 execution-log.md + 更新 progress.json 到 done
         失败 → 按"failure 回退"清理 + 更新 progress.json 到 blocked + 报告用户
[ ] 8. 向用户输出 1-3 句完成/阻塞摘要
```

### 3.3 跨任务编辑规则

- **任何**写入 `plugins/digital-delivery-team/` 的文件都属于某个具体任务，不能"顺手加一个"。
- 若执行中发现需要修改**已 done** 任务的产出：
  - 小改（typo / 路径纠错）：直接修，在 `execution-log.md` 追加 `## <ts> · T-xxx · patched` 记录。
  - 大改（逻辑变更）：把该任务的 status 退回 `ready` 并重新执行。

---

## 4. Phase 全景与依赖图

### 4.1 Phase 拓扑

```
P0 Bootstrap ──┬─> P1 Skills ─────┐
               │                  ├──> P2 Agents ──┐
               └─> P3 Templates ──┤                ├──> P6 Commands ──┐
                                  │                │                  │
                                  │   P4 Hooks ────┤                  │
                                  │       │        │                  │
                                  │       └─> P5 MetricsBins ──┐      │
                                  │                            │      │
                                  │                            └──────┤
                                  └────────────────────────────────>──┼──> P7 Baseline ──> P8 E2E ──> P9 Package
                                                                      │
                                                                      └──> P8
```

关键约束：
- **P1 Skills 要先于 P2 Agents**：agent 的 description 里会引用 skill，skill 不存在则 agent 的 "auto-load" 引用悬空。
- **P3 Templates 要先于 P6 Commands**：command 里会调用 template 拷贝，template 不存在命令会失败。
- **P4 Hooks 与 P5 MetricsBins 需在 P6 前完成**：`/report` 命令会跑 aggregate/report mjs，且 mjs 读的是 hooks 写入的 jsonl。
- **P7 Baseline 可与 P6 并行**：仅数据文件，不影响代码构件。
- **P8 E2E 是唯一能证明系统真跑通的关卡**，强制放在 P9 前。
- **P9 Package** 是对外推广资产，最后做。

### 4.2 Phase 门槛（gate）

进入下一 Phase 前必须满足：

| Phase | 进入门槛 |
|---|---|
| P1 | P0 全部 done |
| P2 | P1 全部 done |
| P3 | P0 全部 done（与 P1/P2 并行不阻塞） |
| P4 | P0 全部 done |
| P5 | P0 全部 done |
| P6 | P2 + P3 + P4 + P5 全部 done |
| P7 | P0 全部 done |
| P8 | P6 + P7 全部 done |
| P9 | P8 全部 done |

---

## 5. Phase 0 · Bootstrap 基础设施

> Phase 目标：建立插件骨架 + 进度追踪基建，让后续所有任务有确定的落盘位置和状态记录载体。
> 完成后可以开启任意 Phase 1/3/4/5/7 的任务。

### T-B01 · 创建插件目录骨架

| 字段 | 值 |
|---|---|
| 依赖 | 无 |
| 复用级别 | 🔴（目录结构原创，但遵循 ECC 的 `.claude-plugin/` + `.claude/hooks.json` 约定） |
| ECC 源 | 参考仓库根 `.claude-plugin/plugin.json` 的目录布局 |
| 产出文件 | `plugins/digital-delivery-team/` 及 §1.2 的所有子目录（空目录 + `.gitkeep`） |
| token 估算 | 500 |

**执行步骤**：

```bash
PLUGIN_ROOT=plugins/digital-delivery-team
mkdir -p "$PLUGIN_ROOT"/.claude-plugin
mkdir -p "$PLUGIN_ROOT"/.claude
mkdir -p "$PLUGIN_ROOT"/_templates
mkdir -p "$PLUGIN_ROOT"/agents
mkdir -p "$PLUGIN_ROOT"/commands
mkdir -p "$PLUGIN_ROOT"/skills
mkdir -p "$PLUGIN_ROOT"/hooks/handlers/lib
mkdir -p "$PLUGIN_ROOT"/bin/lib
mkdir -p "$PLUGIN_ROOT"/templates
mkdir -p "$PLUGIN_ROOT"/baseline
find "$PLUGIN_ROOT" -type d -empty -exec touch {}/.gitkeep \;
```

**验证命令**：

```bash
find plugins/digital-delivery-team -type d | sort
```

**验证通过条件**：
- 输出行数 ≥ 12
- 包含 `.claude-plugin`、`.claude`、`agents`、`commands`、`skills`、`hooks/handlers/lib`、`bin/lib`、`templates`、`baseline`、`_templates`

**failure 回退**：`rm -rf plugins/digital-delivery-team`

---

### T-B02 · 创建 plugin.json

| 字段 | 值 |
|---|---|
| 依赖 | T-B01 |
| 复用级别 | 🟡（复用 ECC 的 plugin.json 字段规范） |
| ECC 源 | 仓库根 `.claude-plugin/plugin.json` |
| 产出文件 | `plugins/digital-delivery-team/.claude-plugin/plugin.json` |
| token 估算 | 400 |

**执行步骤**：
1. Read 仓库根的 `.claude-plugin/plugin.json` 获取字段格式参考
2. Write 目标文件，内容如下（作者信息 AI 按当前仓库 git user 自动填入）：

```json
{
  "name": "digital-delivery-team",
  "version": "0.3.0",
  "description": "一人一队：全栈工程师 + 数字员工交付插件。9 个数字员工子代理 + 13 个岗位/编排命令 + 4 个领域知识 skill + 5 个自动度量 hook + 本地度量脚本。",
  "authors": [
    { "name": "赵文昊", "email": "" }
  ],
  "keywords": ["delivery", "efficiency", "agent", "subagent", "workflow", "metrics"],
  "license": "Proprietary",
  "homepage": "",
  "repository": ""
}
```

**验证命令**：

```bash
node -e "JSON.parse(require('fs').readFileSync('plugins/digital-delivery-team/.claude-plugin/plugin.json','utf8'))" && echo OK
```

**验证通过条件**：输出末尾包含 `OK`。

**failure 回退**：`rm plugins/digital-delivery-team/.claude-plugin/plugin.json`

---

### T-B03 · 初始化进度追踪机制

| 字段 | 值 |
|---|---|
| 依赖 | T-B01 |
| 复用级别 | 🔴（进度文件为原创） |
| ECC 源 | 无 |
| 产出文件 | `fork-design/progress.json`、`fork-design/execution-log.md` |
| token 估算 | 3000 |

**执行步骤**：
1. 按 §2.1 schema 生成 `progress.json`。
2. 枚举 §5-§14 所有任务，每个任务生成一条 `tasks[]`：
   - `status`：按 §4.1 拓扑判定。**只有** `depends_on == []` 的任务才 `ready`，其余全部 `blocked`（因为依赖未 done）。
   - `token_estimate`：从对应任务卡抄写。
3. `phases` 字段按 §2.1 填充 `total`，`done = 0`，`status`：只有 `P0` 是 `in_progress`，其余全部 `blocked`。
4. `execution-log.md` 写入标题：

```markdown
# digital-delivery-team 执行日志

> 每次任务完成后由 AI 自动追加。

---
```

**验证命令**：

```bash
node -e "const p=JSON.parse(require('fs').readFileSync('fork-design/progress.json','utf8'));console.log('total_tasks:',p.tasks.length,'ready:',p.tasks.filter(t=>t.status==='ready').length,'phases:',Object.keys(p.phases).length)"
```

**验证通过条件**：
- `total_tasks >= 62`
- `ready >= 1`（至少 T-B04/T-B05 可 ready，因为 T-B01/T-B02 已 done 时它们的依赖全部满足）
- `phases == 10`

**failure 回退**：`rm fork-design/progress.json fork-design/execution-log.md`

---

### T-B04 · 创建 agent-base 内部模板

| 字段 | 值 |
|---|---|
| 依赖 | T-B01 |
| 复用级别 | 🟡（从 ECC agent 抽取通用约束） |
| ECC 源 | `agents/planner.md`、`agents/architect.md`、`agents/code-reviewer.md` |
| 产出文件 | `plugins/digital-delivery-team/_templates/agent-base.md` |
| token 估算 | 1500 |

**执行步骤**：
1. Read ECC 的 3 个 agent，提取共通的：
   - YAML frontmatter 字段（`name`/`description`/`tools`/`model`）
   - "Your Role" / "Process" / "Self-Check" 结构
2. 产出 agent-base.md，必须包含以下骨架（占位符用 `<...>` 标注）：

````markdown
---
name: <agent-name>
description: <何时触发；被谁调用；输入是什么；产出是什么>
tools: Read, Write, Edit, Grep, Glob, Bash
model: <sonnet | opus>
---

# <Role Name>

你是一名 <role>。你的**唯一交付物**是 `<path/to/output>`。

## Inputs（必读清单）
- <input-1>
- <input-2>
- （若存在同名已有产物，采取增量修订模式）

## Hard Requirements
1. <硬约束-1>
2. <硬约束-2>

## Output Contract
- 路径：`<path>`
- 模板：`<templates/xxx.template.md>`
- 结构：<必备章节>

## Self-Check（追加到产物末尾）
- [ ] <check-1>
- [ ] <check-2>

## Interaction Rules
- <触发 blocker 的条件> → 停止 → 写 `docs/blockers.md` → 请求人类

## Global Invariants（以下 6 条对所有 9 个 agent 生效，禁止删减）
1. 单一产物原则：只对一份主产物负责，禁止跨产物写入。
2. 禁止猜测：输入不足/契约冲突/术语歧义 → 写 blockers.md → 停。
3. 禁止自我汇报度量：时长、token、成败由 hooks 捕获，不调用任何 track_* 接口。
4. 输出前自检：未全勾 Self-Check 不得声称完成。
5. 禁用糊弄词：不得写"根据需要"/"视情况"/"等"/"若有必要"。
6. 可重入：目标产物已存在时增量修订，不做全量覆盖。
````

**验证命令**：

```bash
grep -c "Global Invariants" plugins/digital-delivery-team/_templates/agent-base.md
```

**验证通过条件**：输出 `1`。

**failure 回退**：`rm plugins/digital-delivery-team/_templates/agent-base.md`

---

### T-B05 · 创建 README.md 占位

| 字段 | 值 |
|---|---|
| 依赖 | T-B01 |
| 复用级别 | 🔴 |
| ECC 源 | 无 |
| 产出文件 | `plugins/digital-delivery-team/README.md` |
| token 估算 | 300 |

**执行步骤**：写入占位（真正的 README 在 P9 · T-P01 完成）：

```markdown
# digital-delivery-team

> 一人一队：全栈工程师 + 数字员工交付插件。
> 当前状态：**开发中**，完整 README 将在 P9 阶段生成。

设计文档：`../../fork-design/岗位技能提效与数字员工团队方案_v3.md`
落地计划：`../../fork-design/落地执行计划_AI断点执行版.md`
执行进度：`../../fork-design/progress.json`
```

**验证命令**：

```bash
wc -l plugins/digital-delivery-team/README.md
```

**验证通过条件**：行数 ≥ 5。

**failure 回退**：`rm plugins/digital-delivery-team/README.md`

---

### T-B06 · Phase 0 完成门禁

| 字段 | 值 |
|---|---|
| 依赖 | T-B01, T-B02, T-B03, T-B04, T-B05 |
| 复用级别 | — |
| ECC 源 | — |
| 产出文件 | 无（仅验证） |
| token 估算 | 300 |

**执行步骤**：
1. 运行以下验证命令全部通过；
2. 更新 `progress.json.phases.P0.status = "done"`；
3. 把 `P1/P3/P4/P5/P7` 的 status 改为 `ready`；
4. 把 `P1/P3/P4/P5/P7` 中 `depends_on` 全部已 done 的任务的 status 从 `blocked` 改为 `ready`。

**验证命令**：

```bash
test -f plugins/digital-delivery-team/.claude-plugin/plugin.json && \
test -f plugins/digital-delivery-team/_templates/agent-base.md && \
test -f plugins/digital-delivery-team/README.md && \
test -f fork-design/progress.json && \
test -f fork-design/execution-log.md && \
node -e "JSON.parse(require('fs').readFileSync('plugins/digital-delivery-team/.claude-plugin/plugin.json','utf8'))" && \
echo "PHASE-0-DONE"
```

**验证通过条件**：输出包含 `PHASE-0-DONE`。

---

## 6. Phase 1 · Skill 层（4 个）

> Phase 目标：产出 4 个领域知识 skill，它们会被 agent 的 description 引用并自动加载。
> 顺序建议：T-S01 → T-S02 → T-S03 → T-S04（互相独立，可任意顺序）。

### 6.1 通用约束

所有 skill 文件**必须**：
- 位于 `plugins/digital-delivery-team/skills/<skill-name>/SKILL.md`
- frontmatter 含 `name` 和 `description`（description 决定自动触发）
- 结构章节：`Triggers` / `Core Principles` / `Design Rules 或 Format` / `Do` / `Don't` / `Templates & References`
- **不**描述工作流顺序（工作流归 command）

### T-S01 · api-contract-first skill

| 字段 | 值 |
|---|---|
| 依赖 | T-B06 |
| 复用级别 | 🟠 混搭 |
| ECC 源 | `skills/api-design/SKILL.md`（URL 结构、分页、错误响应、版本化）、`skills/architecture-decision-records/SKILL.md`（ADR 格式） |
| 产出文件 | `plugins/digital-delivery-team/skills/api-contract-first/SKILL.md` |
| token 估算 | 3500 |

**执行步骤**：
1. Read `skills/api-design/SKILL.md`，摘录：URL 结构 / 分页 / 错误响应 / 状态码 / 幂等性 / 版本化 章节。
2. Read `skills/architecture-decision-records/SKILL.md`，摘录 ADR 格式与 trade-off 表。
3. 融合 + 追加父设计文档 §4.2 的硬约束（"契约先于代码""契约变更 = 事件"）。
4. 按父设计文档 §4.2 的完整内容产出 `SKILL.md`。

**验证命令**：

```bash
head -5 plugins/digital-delivery-team/skills/api-contract-first/SKILL.md && \
grep -E "^## (Triggers|Core Principles|Design Rules|Do|Don't|Templates)" plugins/digital-delivery-team/skills/api-contract-first/SKILL.md
```

**验证通过条件**：
- frontmatter 有 `name: api-contract-first`
- 至少包含 `Triggers / Core Principles / Design Rules / Do / Don't / Templates` 中的 5 个章节头

**failure 回退**：`rm -rf plugins/digital-delivery-team/skills/api-contract-first`

---

### T-S02 · acceptance-criteria skill

| 字段 | 值 |
|---|---|
| 依赖 | T-B06 |
| 复用级别 | 🟠 混搭 |
| ECC 源 | `skills/product-capability/SKILL.md`、`skills/product-lens/SKILL.md`、父设计文档 §4.3 |
| 产出文件 | `plugins/digital-delivery-team/skills/acceptance-criteria/SKILL.md` |
| token 估算 | 2500 |

**执行步骤**：
1. Read ECC 的两个 product skill，摘录"用户故事 / 可测量"相关片段；
2. 按父设计文档 §4.3 完整生成，重点强调：
   - Given/When/Then 格式硬约束
   - "可自动化测试"判定表
   - Self-Test 清单

**验证命令**：

```bash
grep -c "Given" plugins/digital-delivery-team/skills/acceptance-criteria/SKILL.md
```

**验证通过条件**：输出 ≥ 3。

**failure 回退**：`rm -rf plugins/digital-delivery-team/skills/acceptance-criteria`

---

### T-S03 · delivery-package skill

| 字段 | 值 |
|---|---|
| 依赖 | T-B06 |
| 复用级别 | 🔴 原创（仅参考 ECC 风格） |
| ECC 源 | `skills/api-design/SKILL.md`（仅结构参考） |
| 产出文件 | `plugins/digital-delivery-team/skills/delivery-package/SKILL.md` |
| token 估算 | 2500 |

**执行步骤**：严格按父设计文档 §4.4 全量落地。关键内容：
- README 8 要素
- Deploy 幂等/回滚/环境变量原则
- Demo Script 时间轴与意外备选

**验证命令**：

```bash
grep -E "README 8 要素|幂等|时间轴" plugins/digital-delivery-team/skills/delivery-package/SKILL.md | wc -l
```

**验证通过条件**：输出 ≥ 3。

**failure 回退**：`rm -rf plugins/digital-delivery-team/skills/delivery-package`

---

### T-S04 · efficiency-metrics skill

| 字段 | 值 |
|---|---|
| 依赖 | T-B06 |
| 复用级别 | 🟡 裁剪特化 |
| ECC 源 | `skills/benchmark/SKILL.md` |
| 产出文件 | `plugins/digital-delivery-team/skills/efficiency-metrics/SKILL.md` |
| token 估算 | 3000 |

**执行步骤**：
1. Read `skills/benchmark/SKILL.md` 获取"基线测量"范式；
2. 按父设计文档 §4.5 落地，强化：
   - 双口径（历史 + 专家独立估算）
   - 封盘规则
   - 质量守门阈值表
   - Report 6 段结构

**验证命令**：

```bash
grep -cE "双口径|封盘|质量守门" plugins/digital-delivery-team/skills/efficiency-metrics/SKILL.md
```

**验证通过条件**：输出 ≥ 3。

**failure 回退**：`rm -rf plugins/digital-delivery-team/skills/efficiency-metrics`

---

## 7. Phase 2 · Agent 层（9 个）

> Phase 目标：产出 9 个数字员工子代理。每个 agent 严格单一产物、禁止猜测、含 Self-Check。
> **推荐顺序**：按复用级别从易到难：T-A03 → T-A07 → T-A02 → T-A08 → T-A06 → T-A01 → T-A04 → T-A05 → T-A09。

### 7.1 通用模板

**所有** agent 都必须：
1. 开头引用 `_templates/agent-base.md` 的 Global Invariants（可直接内联那 6 条）。
2. frontmatter 的 `description` 必须含"何时触发 + 输入 + 产出"三要素（ECC 的 description 已是此模式）。
3. 末尾带 Self-Check 清单。
4. 不得违反父设计文档 §2.1 的 6 条全局约束。

### T-A01 · product-agent

| 字段 | 值 |
|---|---|
| 依赖 | T-S02, T-B04 |
| 复用级别 | 🟡 |
| ECC 源 | `agents/planner.md`（结构参考）、`skills/product-capability/SKILL.md` |
| 产出文件 | `plugins/digital-delivery-team/agents/product-agent.md` |
| token 估算 | 2500 |
| 内容源 | 父设计文档 §2.2 |

**执行步骤**：
1. Read `_templates/agent-base.md`；
2. Read `agents/planner.md` 参考 frontmatter；
3. 产出 `product-agent.md`，严格对齐父设计文档 §2.2 的全部内容（inputs / hard requirements / output contract / self-check / interaction rules）。

**验证命令**：

```bash
grep -E "^---$|^name:|^description:|^tools:|^model:" plugins/digital-delivery-team/agents/product-agent.md | head && \
grep -c "Self-Check" plugins/digital-delivery-team/agents/product-agent.md
```

**验证通过条件**：
- frontmatter 完整（4 字段齐全）
- Self-Check 出现 ≥ 1 次

**failure 回退**：`rm plugins/digital-delivery-team/agents/product-agent.md`

---

### T-A02 · pm-agent

| 字段 | 值 |
|---|---|
| 依赖 | T-B04 |
| 复用级别 | 🟡 |
| ECC 源 | `agents/planner.md` |
| 产出文件 | `plugins/digital-delivery-team/agents/pm-agent.md` |
| token 估算 | 2200 |
| 内容源 | 父设计文档 §2.3 |

**执行步骤**：以 planner.md 为基模，替换职责为 WBS 拆分，硬约束严格复用父设计文档 §2.3（0.5-4h 粒度 / 依赖类型 / 关键路径 / 风险清单）。

**验证命令**：

```bash
grep -cE "0.5|4.{0,3}小时|critical path|关键路径" plugins/digital-delivery-team/agents/pm-agent.md
```

**验证通过条件**：≥ 2。

**failure 回退**：`rm plugins/digital-delivery-team/agents/pm-agent.md`

---

### T-A03 · architect-agent

| 字段 | 值 |
|---|---|
| 依赖 | T-S01, T-B04 |
| 复用级别 | 🟢 |
| ECC 源 | `agents/architect.md` |
| 产出文件 | `plugins/digital-delivery-team/agents/architect-agent.md` |
| token 估算 | 2500 |
| 内容源 | 父设计文档 §2.4 |

**执行步骤**：
1. `cp agents/architect.md plugins/digital-delivery-team/agents/architect-agent.md`
2. 改 frontmatter：`name: architect-agent`，`model: opus`
3. 追加父设计文档 §2.4 的 3 份交付物（arch.md / api-contract.yaml / data-model.md）约束
4. 追加 OpenAPI lint 硬要求（`npx @redocly/cli lint`）

**验证命令**：

```bash
grep -cE "api-contract.yaml|OpenAPI|data-model" plugins/digital-delivery-team/agents/architect-agent.md
```

**验证通过条件**：≥ 3。

**failure 回退**：`rm plugins/digital-delivery-team/agents/architect-agent.md`

---

### T-A04 · frontend-agent

| 字段 | 值 |
|---|---|
| 依赖 | T-S01, T-B04 |
| 复用级别 | 🔴（ECC 无 builder 类 agent） |
| ECC 源 | 无直接对应；可参考 `agents/typescript-reviewer.md` 仅作为 frontmatter 风格 |
| 产出文件 | `plugins/digital-delivery-team/agents/frontend-agent.md` |
| token 估算 | 2200 |
| 内容源 | 父设计文档 §2.5 |

**执行步骤**：严格照父设计文档 §2.5 原创，强调"契约为唯一真相源""不得发明字段"。

**验证命令**：

```bash
grep -cE "契约|api-contract.yaml|happy-path" plugins/digital-delivery-team/agents/frontend-agent.md
```

**验证通过条件**：≥ 3。

**failure 回退**：`rm plugins/digital-delivery-team/agents/frontend-agent.md`

---

### T-A05 · backend-agent

| 字段 | 值 |
|---|---|
| 依赖 | T-S01, T-B04 |
| 复用级别 | 🔴 |
| ECC 源 | 无 |
| 产出文件 | `plugins/digital-delivery-team/agents/backend-agent.md` |
| token 估算 | 2200 |
| 内容源 | 父设计文档 §2.6 |

**执行步骤**：原创，强调契约 + data-model.md + 集成测试 + migration 幂等。

**验证命令**：

```bash
grep -cE "data-model|集成测试|migration" plugins/digital-delivery-team/agents/backend-agent.md
```

**验证通过条件**：≥ 3。

**failure 回退**：`rm plugins/digital-delivery-team/agents/backend-agent.md`

---

### T-A06 · test-agent

| 字段 | 值 |
|---|---|
| 依赖 | T-S02, T-B04 |
| 复用级别 | 🟡 |
| ECC 源 | `agents/tdd-guide.md`、`skills/tdd-workflow/SKILL.md`、`skills/verification-loop/SKILL.md` |
| 产出文件 | `plugins/digital-delivery-team/agents/test-agent.md` |
| token 估算 | 2500 |
| 内容源 | 父设计文档 §2.7 |

**执行步骤**：以 tdd-guide.md 为基模，修改为"从验收标准生成测试（非从实现反推）"+ 覆盖率硬门槛 70% + 三类测试（单元 / 契约 / E2E happy-path）。

**验证命令**：

```bash
grep -cE "70%|验收标准|契约测试" plugins/digital-delivery-team/agents/test-agent.md
```

**验证通过条件**：≥ 3。

**failure 回退**：`rm plugins/digital-delivery-team/agents/test-agent.md`

---

### T-A07 · review-agent

| 字段 | 值 |
|---|---|
| 依赖 | T-B04 |
| 复用级别 | 🟢 |
| ECC 源 | `agents/code-reviewer.md`、`agents/security-reviewer.md` |
| 产出文件 | `plugins/digital-delivery-team/agents/review-agent.md` |
| token 估算 | 2500 |
| 内容源 | 父设计文档 §2.8 |

**执行步骤**：
1. Read code-reviewer.md + security-reviewer.md；
2. 合并两者的维度，生成 7 维度 review（契约一致性 / 异常 / 并发 / 输入校验 / 敏感信息 / 可观测性 / 依赖安全）；
3. 输出格式：阻塞 / 警告 / 建议 三级。

**验证命令**：

```bash
grep -cE "阻塞|警告|建议|blocker|warning|suggestion" plugins/digital-delivery-team/agents/review-agent.md
```

**验证通过条件**：≥ 3。

**failure 回退**：`rm plugins/digital-delivery-team/agents/review-agent.md`

---

### T-A08 · docs-agent

| 字段 | 值 |
|---|---|
| 依赖 | T-S03, T-B04 |
| 复用级别 | 🟡 |
| ECC 源 | `agents/doc-updater.md` |
| 产出文件 | `plugins/digital-delivery-team/agents/docs-agent.md` |
| token 估算 | 2200 |
| 内容源 | 父设计文档 §2.9 |

**执行步骤**：基模为 doc-updater.md；交付物替换为 README + deploy.md + demo-script.md；硬门槛：README 5 分钟上手可跑通、deploy 幂等、demo 3-5 分钟。

**验证命令**：

```bash
grep -cE "5 分钟|幂等|demo" plugins/digital-delivery-team/agents/docs-agent.md
```

**验证通过条件**：≥ 3。

**failure 回退**：`rm plugins/digital-delivery-team/agents/docs-agent.md`

---

### T-A09 · metrics-agent

| 字段 | 值 |
|---|---|
| 依赖 | T-S04, T-B04 |
| 复用级别 | 🔴 |
| ECC 源 | 无 |
| 产出文件 | `plugins/digital-delivery-team/agents/metrics-agent.md` |
| token 估算 | 2200 |
| 内容源 | 父设计文档 §2.10 |

**执行步骤**：原创。要点：
- 只读 raw 数据，不修改
- 必答三个问题（哪阶段提效最多 / 最少 / 下次怎么优化）
- 质量劣化警告首行 `⚠️`
- 附原始数据链接

**验证命令**：

```bash
grep -cE "⚠️|劣化|raw|优化建议" plugins/digital-delivery-team/agents/metrics-agent.md
```

**验证通过条件**：≥ 3。

**failure 回退**：`rm plugins/digital-delivery-team/agents/metrics-agent.md`

---

## 8. Phase 3 · Templates（11 个）

> Phase 目标：产出每个 agent 产物的"填空模板"。与 P1/P2 并行。
> 每个 template 末尾都有 Self-Check 复选框。

### 8.1 任务矩阵（批量执行）

| ID | 文件 | 依赖 | 内容源 | token 估算 |
|---|---|---|---|---:|
| T-T01 | `templates/project-brief.template.md` | T-B01 | 衍生：一页纸 brief，字段 = 谁用 / 为什么 / 成功什么样 | 400 |
| T-T02 | `templates/prd.template.md` | T-B01 | 父设计 §8.1 | 600 |
| T-T03 | `templates/wbs.template.md` | T-B01 | 父设计 §8.2 | 500 |
| T-T04 | `templates/risks.template.md` | T-B01 | 衍生：触发条件 / 影响面 / mitigation / owner 表 | 400 |
| T-T05 | `templates/api-contract.template.yaml` | T-B01 | 父设计 §8.3 | 500 |
| T-T06 | `templates/data-model.template.md` | T-B01 | 衍生：实体 + ER 图（mermaid）+ 索引策略 | 500 |
| T-T07 | `templates/review-checklist.template.md` | T-B01 | 衍生：7 维度 × 3 级（阻塞/警告/建议） | 500 |
| T-T08 | `templates/test-plan.template.md` | T-B01 | 衍生：验收标准 → 测试映射表 + 覆盖率 | 500 |
| T-T09 | `templates/deploy.template.md` | T-B01 | 衍生：前置环境 / 步骤 / 回滚 / 幂等验证 | 500 |
| T-T10 | `templates/demo-script.template.md` | T-B01 | 衍生：时间轴（10s 精度）+ 口播 + 意外分支 | 500 |
| T-T11 | `templates/efficiency-report.template.md` | T-B01 | 衍生：摘要 / 阶段对比表 / 质量守门 / 三问 / Top3 建议 / 原始数据链接 | 600 |

### 8.2 单任务执行模板（适用 T-T01 ~ T-T11）

**通用执行步骤**（以 T-T02 为例）：
1. `Write plugins/digital-delivery-team/templates/prd.template.md`，完整照抄父设计 §8.1；
2. 末尾追加 Self-Check 复选框。

**通用验证命令**：

```bash
for f in plugins/digital-delivery-team/templates/*.template.*; do
  test -s "$f" || echo "EMPTY: $f"
done && echo "ALL-NONEMPTY"
```

**验证通过条件**：输出 `ALL-NONEMPTY`（无 `EMPTY:` 行）。

**failure 回退**：单文件删除重写。

---

## 9. Phase 4 · Hook 层（7 个任务）

> Phase 目标：打通**事件 → jsonl** 数据链路，全部走 Node.js handler（与 ECC 现有 handler 风格一致，不写 shell）。
> **最大化复用**：handler 内部复用 ECC 的 jsonl 写入模式（参考 `scripts/hooks/cost-tracker.js`），运行时开关对齐 ECC 的 `ECC_DISABLED_HOOKS` 机制。

### T-H01 · 事件写入公共库

| 字段 | 值 |
|---|---|
| 依赖 | T-B06 |
| 复用级别 | 🟡 |
| ECC 源 | `scripts/hooks/cost-tracker.js`（学习 jsonl 追加写入范式） |
| 产出文件 | `plugins/digital-delivery-team/hooks/handlers/lib/events.js` |
| token 估算 | 1500 |

**执行步骤**：
1. Read `scripts/hooks/cost-tracker.js`，学习：
   - 读取 stdin JSON 的方式
   - jsonl 追加写入
   - 脱敏处理
2. 产出 CommonJS 模块，导出：
   - `appendEvent(eventName, payload)`：写入 `${DELIVERY_METRICS_DIR:-$HOME/.claude/delivery-metrics}/events.jsonl`
   - `readStdinJson()`：容错读取 stdin，返回 `{}` 或已解析对象
   - `sanitizeToolInput(toolName, input)`：按父设计 §5.7 规则脱敏
   - `getSessionContext()`：返回 `{ session_id, project_id, ts }`
3. 所有异常吞掉，`console.error('[delivery-hook] ...')` 记录后 `return`（绝不抛出，绝不阻塞 Claude Code）。

**验证命令**：

```bash
node -e "const m=require('./plugins/digital-delivery-team/hooks/handlers/lib/events.js');console.log(typeof m.appendEvent==='function',typeof m.readStdinJson==='function',typeof m.sanitizeToolInput==='function',typeof m.getSessionContext==='function')"
```

**验证通过条件**：输出 `true true true true`。

**failure 回退**：`rm plugins/digital-delivery-team/hooks/handlers/lib/events.js`

---

### T-H02 ~ T-H06 · 5 个事件 handler

| ID | 事件 | 文件 | 依赖 | 内容 | token 估算 |
|---|---|---|---|---|---:|
| T-H02 | `SessionStart` | `hooks/handlers/session-start.js` | T-H01 | 参考父设计 §5.2，改为 Node：调 `appendEvent('session_start', {cwd,...})` | 600 |
| T-H03 | `SessionEnd` | `hooks/handlers/session-end.js` | T-H01 | 参考父设计 §5.3 | 600 |
| T-H04 | `PreToolUse` | `hooks/handlers/pre-tool-use.js` | T-H01 | 参考父设计 §5.4，只保留 `tool_name / file_path / bash_head / task_subagent` | 700 |
| T-H05 | `PostToolUse` | `hooks/handlers/post-tool-use.js` | T-H01 | 参考父设计 §5.5，捕获 `success / duration_ms / output_size` | 700 |
| T-H06 | `SubagentStop` | `hooks/handlers/subagent-stop.js` | T-H01 | 参考父设计 §5.6，保留 `subagent_name / duration / tokens`。**这是岗位级度量的主来源** | 800 |

**通用执行模板**（Node CommonJS）：

```javascript
#!/usr/bin/env node
// plugins/digital-delivery-team/hooks/handlers/<event>.js
const { appendEvent, readStdinJson, sanitizeToolInput, getSessionContext } = require('./lib/events');

(async () => {
  try {
    const input = await readStdinJson();
    const ctx = getSessionContext();
    // 各 handler 特化的字段提取
    const payload = { /* ... */ };
    appendEvent('<event_name>', { ...ctx, ...payload });
  } catch (e) {
    console.error('[delivery-hook] <name> error:', e.message);
  }
  process.exit(0); // 永远 0
})();
```

**通用验证命令**（以 T-H04 为例）：

```bash
mkdir -p /tmp/ddt-test && rm -f /tmp/ddt-test/events.jsonl && \
echo '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}' | \
  DELIVERY_METRICS_DIR=/tmp/ddt-test node plugins/digital-delivery-team/hooks/handlers/pre-tool-use.js && \
  node -e "const l=require('fs').readFileSync('/tmp/ddt-test/events.jsonl','utf8').trim().split('\n').pop();const o=JSON.parse(l);console.log(o.event==='pre_tool_use'?'OK':'FAIL')"
```

**验证通过条件**：输出 `OK`。

**failure 回退**：删除对应 handler 文件。

---

### T-H07 · 注册 hooks.json

| 字段 | 值 |
|---|---|
| 依赖 | T-H02, T-H03, T-H04, T-H05, T-H06 |
| 复用级别 | 🟡 |
| ECC 源 | 仓库根 `hooks/hooks.json`（参考 matcher 与 command 格式） |
| 产出文件 | `plugins/digital-delivery-team/.claude/hooks.json` |
| token 估算 | 800 |

**执行步骤**：写入（注意使用 `${CLAUDE_PLUGIN_ROOT}` 变量以支持 plugin-scoped 调度）：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/handlers/session-start.js" }] }
    ],
    "SessionEnd": [
      { "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/handlers/session-end.js" }] }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit|Task",
        "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/handlers/pre-tool-use.js" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash|Write|Edit|Task",
        "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/handlers/post-tool-use.js" }]
      }
    ],
    "SubagentStop": [
      { "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/handlers/subagent-stop.js" }] }
    ]
  }
}
```

**验证命令**：

```bash
node -e "const j=JSON.parse(require('fs').readFileSync('plugins/digital-delivery-team/.claude/hooks.json','utf8'));console.log(['SessionStart','SessionEnd','PreToolUse','PostToolUse','SubagentStop'].every(k=>j.hooks[k]))"
```

**验证通过条件**：输出 `true`。

**failure 回退**：`rm plugins/digital-delivery-team/.claude/hooks.json`

---

## 10. Phase 5 · 度量脚本（4 个任务）

### T-M01 · schema.sql + store.mjs

| 字段 | 值 |
|---|---|
| 依赖 | T-B06 |
| 复用级别 | 🔴 |
| ECC 源 | 无 |
| 产出文件 | `plugins/digital-delivery-team/bin/lib/schema.sql`、`plugins/digital-delivery-team/bin/lib/store.mjs` |
| token 估算 | 3000 |

**执行步骤**：
1. 产出 `schema.sql`，严格照父设计文档 §6.2 的 DDL（projects / sessions / tool_calls / subagent_runs / quality_metrics 五表）；
2. 产出 `store.mjs`，按父设计文档 §6.5 的 `DeliveryStore` 类实现：
   - 构造接受 db 路径（默认 `$DELIVERY_METRICS_DIR/metrics.db`）
   - `openOrCreate()` 执行 schema.sql
   - `createProject(id, name)`
   - `ingestEvent(ev)` switch on `ev.event`
   - `aggregateStageHours(projectId)`
   - `latestQuality(projectId)`
3. 依赖选型：**首选** `better-sqlite3`（同步、快）；若安装失败**降级**用 `sql.js`（纯 JS，启动慢 300ms 可接受）。
4. 在 `plugins/digital-delivery-team/package.json` 中声明依赖（T-P04 之前可以是最小 package.json）。

**验证命令**：

```bash
cd plugins/digital-delivery-team && node --input-type=module -e "import('./bin/lib/store.mjs').then(m=>{const s=new m.DeliveryStore('/tmp/ddt-test.db');s.openOrCreate();console.log('OK')})"
```

**验证通过条件**：输出 `OK`。

**failure 回退**：`rm plugins/digital-delivery-team/bin/lib/schema.sql plugins/digital-delivery-team/bin/lib/store.mjs`

---

### T-M02 · aggregate.mjs

| 字段 | 值 |
|---|---|
| 依赖 | T-M01, T-H07 |
| 复用级别 | 🔴 |
| 产出文件 | `plugins/digital-delivery-team/bin/aggregate.mjs` |
| token 估算 | 2000 |

**功能**：读 `$DELIVERY_METRICS_DIR/events.jsonl`，按行解析、调 `store.ingestEvent()`。

**CLI**：
- `--project <id>` 只聚合指定 project
- `--bootstrap` 初始化 project 并写入 `.delivery/project-id`

**验证命令**：

```bash
mkdir -p /tmp/ddt-test && \
printf '%s\n' '{"event":"session_start","ts":"2026-04-22T10:00:00Z","session_id":"s1","project_id":"demo","cwd":"/tmp"}' > /tmp/ddt-test/events.jsonl && \
DELIVERY_METRICS_DIR=/tmp/ddt-test node plugins/digital-delivery-team/bin/aggregate.mjs --project demo && \
test -f /tmp/ddt-test/metrics.db && echo OK
```

**验证通过条件**：输出 `OK`。

**failure 回退**：`rm plugins/digital-delivery-team/bin/aggregate.mjs`

---

### T-M03 · baseline.mjs

| 字段 | 值 |
|---|---|
| 依赖 | T-M01 |
| 复用级别 | 🔴 |
| 产出文件 | `plugins/digital-delivery-team/bin/baseline.mjs` |
| token 估算 | 2200 |

**功能**：
- 读 `baseline/historical-projects.csv` + `baseline/estimation-rules.md`
- 双口径均值 → 产出 `baseline/baseline.locked.json`
- `--lock` 开关：存在则拒绝覆盖（退出码 3），`--force` 覆盖时留痕到 `baseline/baseline.history.jsonl`

**验证命令**：

```bash
node plugins/digital-delivery-team/bin/baseline.mjs --help | grep -q "lock" && echo OK
```

**验证通过条件**：输出 `OK`。

**failure 回退**：`rm plugins/digital-delivery-team/bin/baseline.mjs`

---

### T-M04 · report.mjs

| 字段 | 值 |
|---|---|
| 依赖 | T-M01, T-M02, T-M03 |
| 复用级别 | 🔴 |
| 产出文件 | `plugins/digital-delivery-team/bin/report.mjs` |
| token 估算 | 2500 |

**功能**：
- 读 `metrics.db` + `baseline.locked.json`
- 产出 `docs/efficiency-report.raw.md`，包含：
  - 阶段级对比表
  - 质量守门表（任一劣化首行 `⚠️`）
  - 原始数据链接
- metrics-agent 会接手做自然语言解读

**验证命令**：

```bash
node plugins/digital-delivery-team/bin/report.mjs --help | grep -q "out" && echo OK
```

**验证通过条件**：输出 `OK`。

**failure 回退**：`rm plugins/digital-delivery-team/bin/report.mjs`

---

## 11. Phase 6 · Command 层（13 个）

> Phase 目标：产出所有 slash command。顺序建议：先做 🟢🟡 的，最后做 🔴。
> **推荐顺序**：T-C07 → T-C08 → T-C06 → T-C03 → T-C02 → T-C10 → T-C11 → T-C12 → T-C13 → T-C01 → T-C04 → T-C05 → T-C09

### 11.1 通用规则

1. frontmatter 必须含 `description` 和 `argument-hint`（ECC 的 `commands/plan.md` 是范例）。
2. 所有命令支持 `--refresh`。
3. 命令体末尾必须写 `$ARGUMENTS` 一行（Claude Code 约定）。
4. `!bash` 前缀表示 Claude Code 执行 bash（而不是把命令文本给 AI 念出来）。

### 11.2 任务矩阵

| ID | Command | 依赖 | ECC 源 | 级别 | 内容源 | token 估算 |
|---|---|---|---|:---:|---|---:|
| T-C01 | `/prd` | T-A01, T-T01, T-T02, T-M02 | 无 | 🔴 | 父设计 §3.2.1 | 800 |
| T-C02 | `/wbs` | T-A02, T-T03, T-T04 | `commands/plan.md` | 🟡 | 父设计 §3.2.2 | 700 |
| T-C03 | `/design` | T-A03, T-T05, T-T06 | `commands/feature-dev.md`（派发范式） | 🟡 | 父设计 §3.2.3 | 900 |
| T-C04 | `/build-web` | T-A04, T-T05 | 无 | 🔴 | 父设计 §3.2.4 | 800 |
| T-C05 | `/build-api` | T-A05, T-T05, T-T06 | 无 | 🔴 | 父设计 §3.2.5 | 800 |
| T-C06 | `/test` | T-A06, T-T08 | `commands/test-coverage.md`、`commands/e2e.md` | 🟡 | 父设计 §3.2.6 | 800 |
| T-C07 | `/review` | T-A07, T-T07 | `commands/code-review.md` | 🟢 | 父设计 §3.2.7 | 700 |
| T-C08 | `/package` | T-A08, T-T09, T-T10 | `commands/docs.md` | 🟡 | 父设计 §3.2.8 | 800 |
| T-C09 | `/report` | T-A09, T-M02, T-M03, T-M04, T-T11 | 无 | 🔴 | 父设计 §3.2.9 | 900 |
| T-C10 | `/kickoff` | T-C01, T-C02, T-C03 | 无 | 🟠 | 父设计 §3.3.1 | 500 |
| T-C11 | `/impl` | T-C04, T-C05 | `commands/feature-dev.md`（并行派发范式） | 🟡 | 父设计 §3.3.2 | 700 |
| T-C12 | `/verify` | T-C06, T-C07 | 无 | 🟠 | 父设计 §3.3.3 | 500 |
| T-C13 | `/ship` | T-C08, T-C09 | 无 | 🟠 | 父设计 §3.3.4 | 600 |

### 11.3 单任务执行模板

**执行步骤**（以 T-C07 `/review` 为例）：
1. Read `commands/code-review.md`；
2. Write `plugins/digital-delivery-team/commands/review.md`，frontmatter 抄 ECC 风格，命令体严格按父设计文档 §3.2.7。

**通用验证命令**（对每个 command，替换 `<name>`）：

```bash
head -5 plugins/digital-delivery-team/commands/<name>.md | grep -cE "^description:|^argument-hint:"
```

**验证通过条件**：≥ 2（frontmatter 两字段都有）。

**failure 回退**：删除单文件。

---

## 12. Phase 7 · Baseline 数据

### T-D01 · historical-projects.csv

| 字段 | 值 |
|---|---|
| 依赖 | T-B06 |
| 复用级别 | 🔴 |
| 产出文件 | `plugins/digital-delivery-team/baseline/historical-projects.csv` |
| token 估算 | 400 |

**执行步骤**：写入表头 + 3 行**合成示例数据**（真实基线需用户填入）：

```csv
project_id,name,start_date,end_date,prd_hours,wbs_hours,design_hours,frontend_hours,backend_hours,test_hours,review_hours,docs_hours
demo-001,示例项目A,2025-10-01,2025-10-05,4,2,6,16,20,8,4,4
demo-002,示例项目B,2025-11-10,2025-11-18,6,3,8,24,32,12,6,6
demo-003,示例项目C,2026-01-15,2026-01-22,5,2,7,20,24,10,5,5
```

**验证命令**：

```bash
wc -l plugins/digital-delivery-team/baseline/historical-projects.csv
```

**验证通过条件**：≥ 4（表头 + 3 行）。

**failure 回退**：`rm plugins/digital-delivery-team/baseline/historical-projects.csv`

---

### T-D02 · estimation-rules.md

| 字段 | 值 |
|---|---|
| 依赖 | T-B06 |
| 复用级别 | 🔴 |
| 产出文件 | `plugins/digital-delivery-team/baseline/estimation-rules.md` |
| token 估算 | 500 |

**执行步骤**：写入空白估算表骨架 + 规则说明（架构师与 PM 独立估算）。

**验证命令**：

```bash
wc -l plugins/digital-delivery-team/baseline/estimation-rules.md
```

**验证通过条件**：≥ 10。

**failure 回退**：`rm plugins/digital-delivery-team/baseline/estimation-rules.md`

---

## 13. Phase 8 · 端到端联调

### T-E01 · Toy Project Smoke Test

| 字段 | 值 |
|---|---|
| 依赖 | **全部 P6 + P7** 完成 |
| 复用级别 | — |
| 产出文件 | `fork-design/smoke-test-report.md` |
| token 估算 | 3000 |

**执行步骤**（由 AI 在临时目录跑）：
1. 在 `/tmp/ddt-smoke-<ts>/` 建一个最小项目（`project-brief.md` 写一行需求）；
2. 依次模拟执行（不一定真跑 agent，重点验证命令格式与脚本可执行）：
   - `/prd` → 检查 docs/prd.md 产出路径是否正确（可以手工造产物）
   - `/wbs` / `/design` / `/build-web` / `/build-api` / `/test` / `/review` / `/package`
   - `/report` → 验证 aggregate/baseline/report 三 mjs 链路
3. 写入 `smoke-test-report.md`：每步的产物路径、耗时、是否通过。

**验证命令**：

```bash
test -f fork-design/smoke-test-report.md && grep -cE "PASS|FAIL" fork-design/smoke-test-report.md
```

**验证通过条件**：至少有 10 条 PASS/FAIL 行，PASS 占比 ≥ 80%。

**failure 回退**：`rm fork-design/smoke-test-report.md`

---

### T-E02 · 真数据链路验证

| 字段 | 值 |
|---|---|
| 依赖 | T-E01 |
| 复用级别 | — |
| 产出文件 | `fork-design/data-chain-verification.md` |
| token 估算 | 1500 |

**执行步骤**：
1. 造一段 fake events.jsonl（5 条）；
2. 跑 aggregate → baseline → report；
3. 核对 report 内容含"阶段对比表 + 质量守门 + 原始数据链接"；
4. 写入 verification.md。

**验证命令**：

```bash
test -f fork-design/data-chain-verification.md && grep -c "质量守门" fork-design/data-chain-verification.md
```

**验证通过条件**：≥ 1。

**failure 回退**：`rm fork-design/data-chain-verification.md`

---

## 14. Phase 9 · 打包与文档

### 任务矩阵

| ID | 文件 | 依赖 | 内容 | token 估算 |
|---|---|---|---|---:|
| T-P01 | `plugins/digital-delivery-team/README.md`（完整版） | T-E02 | 按父设计 §9.3 扩写：5 分钟上手 + 岗位速查 + 数据与隐私 | 2000 |
| T-P02 | `plugins/digital-delivery-team/USAGE.md` | T-E02 | 场景化示例（新项目 / 中途加入 / 只跑单岗位） | 2500 |
| T-P03 | `plugins/digital-delivery-team/CHANGELOG.md` | T-E02 | 0.3.0 release notes | 500 |
| T-P04 | `plugins/digital-delivery-team/package.json` | T-M01 | 声明 deps（better-sqlite3 或 sql.js）、bin 入口、scripts | 600 |

**通用验证命令**：

```bash
for f in plugins/digital-delivery-team/README.md plugins/digital-delivery-team/USAGE.md plugins/digital-delivery-team/CHANGELOG.md plugins/digital-delivery-team/package.json; do
  test -s "$f" && wc -l "$f"
done
```

**验证通过条件**：4 个文件都存在且行数合理（README/USAGE ≥ 20；CHANGELOG/package.json ≥ 5）。

---

## 15. 完成度验证 Matrix

### 15.1 总任务数

| Phase | 任务数 |
|---|:---:|
| P0 Bootstrap | 6 |
| P1 Skills | 4 |
| P2 Agents | 9 |
| P3 Templates | 11 |
| P4 Hooks | 7 |
| P5 MetricsBins | 4 |
| P6 Commands | 13 |
| P7 Baseline | 2 |
| P8 E2E | 2 |
| P9 Package | 4 |
| **合计** | **62** |

### 15.2 全局验证脚本

**AI 每完成一个 Phase 后必须运行以下脚本**更新总完成度：

```bash
#!/usr/bin/env bash
P=plugins/digital-delivery-team

# Phase 0
test -f $P/.claude-plugin/plugin.json || echo "FAIL P0: plugin.json"
test -f $P/_templates/agent-base.md || echo "FAIL P0: agent-base"

# Phase 1
for s in api-contract-first acceptance-criteria delivery-package efficiency-metrics; do
  test -f $P/skills/$s/SKILL.md || echo "FAIL P1: $s"
done

# Phase 2
for a in product pm architect frontend backend test review docs metrics; do
  test -f $P/agents/$a-agent.md || echo "FAIL P2: $a-agent"
done

# Phase 3
test $(ls $P/templates/*.template.* 2>/dev/null | wc -l) -ge 11 || echo "FAIL P3: templates"

# Phase 4
for h in session-start session-end pre-tool-use post-tool-use subagent-stop; do
  test -f $P/hooks/handlers/$h.js || echo "FAIL P4: $h"
done
test -f $P/hooks/handlers/lib/events.js || echo "FAIL P4: lib/events.js"
test -f $P/.claude/hooks.json || echo "FAIL P4: hooks.json"

# Phase 5
for b in aggregate baseline report; do
  test -f $P/bin/$b.mjs || echo "FAIL P5: $b.mjs"
done
test -f $P/bin/lib/store.mjs || echo "FAIL P5: store.mjs"

# Phase 6
for c in prd wbs design build-web build-api test review package report kickoff impl verify ship; do
  test -f $P/commands/$c.md || echo "FAIL P6: $c.md"
done

# Phase 7
test -f $P/baseline/historical-projects.csv || echo "FAIL P7: csv"
test -f $P/baseline/estimation-rules.md || echo "FAIL P7: rules"

# Phase 8
test -f fork-design/smoke-test-report.md || echo "FAIL P8: smoke"
test -f fork-design/data-chain-verification.md || echo "FAIL P8: chain"

# Phase 9
test -f $P/README.md || echo "FAIL P9: README"
test -f $P/USAGE.md || echo "FAIL P9: USAGE"
test -f $P/CHANGELOG.md || echo "FAIL P9: CHANGELOG"
test -f $P/package.json || echo "FAIL P9: package.json"

echo "VERIFY-ALL-DONE"
```

### 15.3 最终完成判定

**所有 62 个任务 status == "done"** 且：
- 上述脚本**无 FAIL 行**
- `progress.json.completion_pct == 100.0`
- `smoke-test-report.md` PASS 占比 ≥ 80%
- `metrics-agent` 能对一次真跑的 events 产出完整 `efficiency-report.md`

---

## 16. 常见故障与处理

### 16.1 执行环境故障

| 症状 | 根因 | 处置 |
|---|---|---|
| `node --input-type=module` 失败 | Node 版本 < 14 | 检查 `node --version`；ECC 要求 ≥18，应满足 |
| `better-sqlite3` 安装失败 | 原生依赖编译问题 | T-M01 降级到 `sql.js`（改 store.mjs 实现） |
| hook handler 跑了但 events.jsonl 不生成 | `DELIVERY_METRICS_DIR` 未创建 | handler 里已有 `mkdir -p`，检查权限；否则手工 `mkdir ~/.claude/delivery-metrics` |
| 执行某个 `!bash` 被 gateguard 拦截 | ECC 的 fact-force hook | AI 在命令里先引用用户指令原文再重试；或临时 `ECC_DISABLED_HOOKS=pre:bash:gateguard-fact-force` |

### 16.2 进度文件故障

| 症状 | 处置 |
|---|---|
| `progress.json` 被意外损坏 | 从 `execution-log.md` 回溯最后一次 done 任务，手工重建 progress.json |
| 两个会话并发修改 progress.json | 强制串行；本设计不支持并发执行（ECC 自身也不支持） |
| AI 声称任务 done 但验证命令失败 | 立刻回滚：删产出文件 + 任务 status = ready + 记 execution-log 为 patched |

### 16.3 复用级别判断失误

若 AI 执行中发现"标 🟢 但 ECC 源其实不适配"，**允许**降级处理：
1. 在该任务的 `progress.json.tasks[i]` 追加 `downgrade_note: "🟢→🟡 原因：..."`
2. 继续按新级别执行

反之**不允许**升级（🔴 ↑ 🟢），因为升级意味着漏了复用——必须先说明漏了哪个 ECC 资产。

### 16.4 任务拆分

若某任务在会话中发现 token 不够：
1. 停止，不写入半成品；
2. 在 progress.json 的该任务下新建 `subtasks: [{id:"T-xxx.a", ...},{id:"T-xxx.b",...}]`；
3. 把父任务 status 改为 `in_progress`；
4. 子任务独立 `ready`；
5. 所有子任务 done 后，父任务自动 done。

---

## 17. ECC 复用映射总表

> 本表是"最大化复用 ECC"原则的落地清单。**每个 🟢🟡🟠 任务都必须先 Read 对应 ECC 文件**，才能开写。

### 17.1 Agent 层映射

| v3 Agent | ECC 主源 | ECC 辅源 | 复用动作 |
|---|---|---|---|
| product-agent | — | `skills/product-capability`, `skills/product-lens` | 仅借 skill 中"用户故事/可测量"原则 |
| pm-agent | `agents/planner.md` | — | cp + 替换为 WBS 职责 |
| architect-agent | `agents/architect.md` | `skills/api-design`, `skills/architecture-decision-records` | cp + 追加 OpenAPI 契约硬约束 |
| frontend-agent | — | `agents/typescript-reviewer.md`（仅 frontmatter 风格） | 原创 |
| backend-agent | — | — | 原创 |
| test-agent | `agents/tdd-guide.md` | `skills/tdd-workflow`, `skills/verification-loop` | cp + 改为"从验收标准反推" |
| review-agent | `agents/code-reviewer.md` | `agents/security-reviewer.md` | 合并 + 三级分组 |
| docs-agent | `agents/doc-updater.md` | — | cp + 替换交付物 |
| metrics-agent | — | — | 原创 |

### 17.2 Skill 层映射

| v3 Skill | ECC 主源 | ECC 辅源 | 复用动作 |
|---|---|---|---|
| api-contract-first | `skills/api-design/SKILL.md` | `skills/architecture-decision-records/SKILL.md` | 混搭 + 硬约束 |
| acceptance-criteria | `skills/product-capability` | `skills/product-lens` | 混搭 + 特化 |
| delivery-package | — | `skills/api-design`（仅结构） | 原创 |
| efficiency-metrics | `skills/benchmark/SKILL.md` | — | 裁剪 + 双口径 |

### 17.3 Command 层映射

| v3 Command | ECC 主源 | 复用动作 |
|---|---|---|
| `/wbs` | `commands/plan.md` | frontmatter + 结构 |
| `/design` | `commands/feature-dev.md` | 派发范式 |
| `/test` | `commands/test-coverage.md`, `commands/e2e.md` | 覆盖率门槛范式 |
| `/review` | `commands/code-review.md` | diff 基线 + 三级分组 |
| `/package` | `commands/docs.md`, `commands/update-docs.md` | frontmatter |
| `/impl` | `commands/feature-dev.md` | 同一轮并行派发 Task 范式 |
| 其他 | — | 原创 |

### 17.4 Hook 层映射（最大复利点）

| v3 Hook | ECC 资产 | 复用动作 |
|---|---|---|
| 事件写入 lib | `scripts/hooks/cost-tracker.js` | 学习 jsonl 追加范式 |
| 5 个 handler | `scripts/hooks/pre-bash-dispatcher.js`、`scripts/hooks/post-bash-dispatcher.js` | 架构借鉴（但独立挂载） |
| 运行时开关 | `scripts/hooks/run-with-flags.js` 的 `ECC_DISABLED_HOOKS` | 可选：通过 env 整体禁用 |
| hooks.json 格式 | 仓库根 `hooks/hooks.json` | 字段格式参考 |

### 17.5 插件基建映射

| 构件 | ECC 源 | 复用动作 |
|---|---|---|
| `.claude-plugin/plugin.json` | 仓库根同名文件 | 字段规范 |
| `package.json` | 仓库根 | 最小结构参考 |
| `README.md` 格式 | 仓库根 `README.md` + `plugins/README.md` | 章节范式 |
| lint / commit 约定 | `eslint.config.js` / `.markdownlint.json` / `commitlint.config.js` | 插件内置可选 |

---

## 18. AI 执行示例（一次会话的完整流转）

> 本节是**给 AI 看的示例**，演示一次标准会话的行为。

### 场景：用户新开一次会话，说"继续推进插件落地"

**AI 的标准动作**：

1. **Read** 本文档（`fork-design/落地执行计划_AI断点执行版.md`）的 §0 + §4 + §15
2. **Read** `fork-design/progress.json`
3. **筛选**候选任务：
   ```
   ready_tasks = tasks.filter(t => t.status === "ready")
                      .sort((a,b) => a.token_estimate - b.token_estimate)
   ```
4. **输出**给用户（示例）：

> 当前进度：P0 已完成 100%，P1 已完成 2/4，整体完成度 12.9%。
>
> 下一个可执行任务候选：
> - **T-S03** · delivery-package skill · 估算 2500 tokens
> - **T-S04** · efficiency-metrics skill · 估算 3000 tokens
> - **T-T01** · project-brief template · 估算 400 tokens
> - **T-H01** · 事件写入公共库 · 估算 1500 tokens
>
> 建议先做 T-T01（token 最少，可快速推进完成度），或 T-S03（保持 P1 专注度）。你选哪个？

5. 用户选定后，AI **严格按**该任务卡的"执行步骤"操作。
6. 跑"验证命令"。
7. 更新 `progress.json` + 追加 `execution-log.md`。
8. 汇报：
   > T-T01 完成。产出 `plugins/digital-delivery-team/templates/project-brief.template.md`（18 行）。
   > 进度：P3 · 1/11；整体 14.5%。
   > 下一候选：T-T02 / T-T03 / T-S03 ...

### 反模式（AI 禁止的行为）

- ❌ 一次会话里硬写 3 个 agent + 4 个 command + 5 个 template（即使 token 够，也违反"原子任务 + 验证"原则）
- ❌ 跳过"验证命令"直接 mark done
- ❌ 改动 `plugins/digital-delivery-team/` 外的文件（除了 progress.json / execution-log.md）
- ❌ 不 Read ECC 源就开写 🟢🟡🟠 任务
- ❌ 修改已 done 任务的产物却不走 `patched` 流程

---

## 19. 本文档的版本管理

- 本文档本身也是"可执行代码"——若父设计文档（`岗位技能提效与数字员工团队方案_v3.md`）更新，本文档需要同步刷新任务清单。
- 变更类型：
  - **新增任务**：追加到 §5-§14，`progress.json` 相应新增条目（status = ready 或 blocked）
  - **删除任务**：在 `progress.json` 标 `status: "skipped"`，不删记录
  - **修改任务**：递增 `name` 后缀版本号，旧任务标 `superseded`

---

## 结语

本文档的核心承诺：

1. **AI 不会在第一次会话就力竭**——任务原子化，平均 800-2500 token。
2. **AI 不会"幻觉进度"**——每个任务都有具体 Bash/Read 验证命令。
3. **AI 不会重复造轮子**——ECC 复用映射精确到文件级别。
4. **AI 不会"迷路"**——每次启动只需 3 步（Read 本文档 → Read progress.json → 筛 ready 任务）。

> 最后一条强约束：**AI 在任何时刻若发现本文档有自相矛盾 / 验证命令无法执行 / ECC 源文件不存在**，**必须**停下来告诉用户，而不是自行"推断"。
>
> 本文档是契约，不是建议。
