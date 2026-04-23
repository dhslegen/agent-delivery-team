# digital-delivery-team

一人一队：全栈工程师 + 数字员工交付插件化方案。

9 个数字员工子代理 · 13 个岗位/编排命令 · 4 个领域知识 skill · 5 个自动度量 hook · 零 npm 依赖

---

## 5 分钟上手

1. **安装插件**

   ```bash
   # 将插件目录加入 Claude Code 插件路径
   git clone <repo> ~/plugins/digital-delivery-team
   # 在 ~/.claude/settings.json 中添加插件路径
   ```

2. **初始化项目**

   ```bash
   cd your-project/
   echo "我要做一个任务清单 Web App，支持看板视图和标签管理" > project-brief.md
   ```

3. **一键启动完整流程**

   ```
   /kickoff      → 产出 PRD + WBS + 架构契约（串行，约 3 步）
   /impl         → 前后端并行实现（并行，1 步双产物）
   /verify       → 测试 + 评审（并行，1 步双产物）
   /ship         → 交付包 + 效率报告（串行，约 2 步）
   ```

4. **查看效率报告**

   ```bash
   node plugins/digital-delivery-team/bin/report.mjs
   # 产出 docs/efficiency-report.raw.md
   ```

---

## 岗位速查

| 岗位 | 命令 | 主要产物 | 调用的子代理 |
|------|------|---------|------------|
| 产品 | `/prd` | `docs/prd.md` | product-agent |
| PM | `/wbs` | `docs/wbs.md` | pm-agent |
| 架构 | `/design` | `docs/api-contract.yaml` + `docs/data-model.md` | architect-agent |
| 前端 | `/build-web` | `web/`（含测试） | frontend-agent |
| 后端 | `/build-api` | `server/`（含集成测试） | backend-agent |
| 测试 | `/test` | `tests/test-report.md`（含覆盖率）| test-agent |
| 评审 | `/review` | `docs/review-report.md`（三级分类） | review-agent |
| 交付 | `/package` | `README + deploy.md + demo-script.md` | docs-agent |
| 度量 | `/report` | `docs/efficiency-report.raw.md` | metrics-agent |

**编排命令（一键组合）**：

| 命令 | 等价于 | 适用场景 |
|------|--------|---------|
| `/kickoff` | `/prd` → `/wbs` → `/design` | 新项目起手 |
| `/impl` | `/build-web` ‖ `/build-api` | 有设计文档后并行开发 |
| `/verify` | `/test` ‖ `/review` | 开发完成后并行验收 |
| `/ship` | `/package` → `/report` | 准备交付 |

---

## 架构概览

```
project-brief.md
    └─ /kickoff ─── product-agent  ──► docs/prd.md
                ├── pm-agent       ──► docs/wbs.md
                └── architect-agent──► docs/api-contract.yaml
                                       docs/data-model.md
    └─ /impl ────── frontend-agent ──► web/
              └─── backend-agent   ──► server/
    └─ /verify ─── test-agent      ──► tests/
               └── review-agent    ──► docs/review-report.md
    └─ /ship ────── docs-agent     ──► docs/delivery-package/
               └── metrics-agent   ──► docs/efficiency-report.raw.md
```

---

## 度量与效率追踪

插件通过 5 个 hook 自动采集交付事件（零侵入，无需手动触发）：

| Hook | 触发时机 | 采集内容 |
|------|---------|---------|
| `session-start` | 会话开始 | session_id、时间戳 |
| `session-end` | 会话结束 | token 消耗（input/output）|
| `pre-tool-use` | 工具调用前 | 工具名、文件路径 |
| `post-tool-use` | 工具调用后 | 成功/失败 |
| `subagent-stop` | 子代理完成 | 运行时长、token 消耗 |

**查看报告**：

```bash
node bin/aggregate.mjs                                # 聚合最新事件
node bin/baseline.mjs --force                         # 刷新基线
node bin/report.mjs --out docs/efficiency-report.raw.md  # 产出效率报告
```

---

## 数据与隐私

- 所有度量数据落在本地 `~/.claude/delivery-metrics/`，**不上报任何外部服务**
- Bash 命令与文件路径经脱敏后仅保留必要字段（工具名、文件扩展名等）
- 度量数据库（`metrics.db`）为本地 SQLite 文件，可随时删除
- 清空数据：`rm ~/.claude/delivery-metrics/events.jsonl ~/.claude/delivery-metrics/metrics.db`

---

## 环境要求

| 项目 | 要求 |
|------|------|
| Node.js | ≥ 22.0.0（使用内置 `node:sqlite`，零 npm 依赖） |
| Claude Code | 最新版 |
| 操作系统 | macOS / Linux / Windows（WSL2）|

**可选环境变量**：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DELIVERY_METRICS_DIR` | `~/.claude/delivery-metrics/` | 度量数据目录 |

---

## 相关文档

- [USAGE.md](./USAGE.md) — 场景化使用示例
- [CHANGELOG.md](./CHANGELOG.md) — 版本变更记录
- 设计文档：`fork-design/岗位技能提效与数字员工团队方案_v3.md`

---

> **版本**：0.3.0 · **许可**：Proprietary
