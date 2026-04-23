---
description: 并行实现 · 同一轮对话同时派发 frontend-agent 与 backend-agent。
argument-hint: ""
---

# /impl

---

## 关键约束

在**同一条消息**内同时发出两个 Task 工具调用（否则退化为串行，失去并行提效）：

- **Task 1**：`frontend-agent`，处理 `web/` 目录
- **Task 2**：`backend-agent`，处理 `server/` 目录

两者共享 `docs/api-contract.yaml` 作为唯一契约。

## 前置校验

```bash
test -f docs/api-contract.yaml || { echo "❌ 请先运行 /design"; exit 1; }
```

## 契约冲突处理

任一 agent 发现契约描述不清：
- 追加问题到 `docs/blockers.md`
- 暂停该 agent，**禁止擅自修改契约**
- 等待人类仲裁

## 两者都完成后

1. 分别跑构建与测试：

```bash
(cd web    && npm run build && npm run lint && npm test -- --run)   || echo "⚠️ 前端校验失败"
(cd server && make migrate  && make smoke)                          || echo "⚠️ 后端校验失败"
```

2. 汇总输出：

```
/impl 完成

前端测试通过率: <passed> / <total>
后端测试通过率: <passed> / <total>
新增 endpoint:  <n> 个
```

若 `docs/blockers.md` 非空：

> ⚠️ **存在阻塞项，请人类仲裁后重跑受影响的 agent**

否则：

> ✅ 建议下一步：`/verify`

$ARGUMENTS
