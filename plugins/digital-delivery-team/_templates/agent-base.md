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
