# Smoke Test Report · digital-delivery-team

> 测试时间: 2026-04-23T03:25:00Z  
> 测试目录: /tmp/ddt-smoke-1776914470/  
> 插件目录: plugins/digital-delivery-team/  
> Node.js: v24.6.0  
> 执行人: AI (断点执行 T-E01)

---

## 测试结果汇总

| 结果 | 步骤 | 产物路径 | 备注 |
|------|------|---------|------|
| PASS | [CMD] /prd frontmatter 格式 | commands/prd.md | description + argument-hint 齐全 |
| PASS | [CMD] /wbs frontmatter 格式 | commands/wbs.md | description + argument-hint 齐全 |
| PASS | [CMD] /design frontmatter 格式 | commands/design.md | description + argument-hint 齐全 |
| PASS | [CMD] /build-web frontmatter 格式 | commands/build-web.md | description + argument-hint 齐全 |
| PASS | [CMD] /build-api frontmatter 格式 | commands/build-api.md | description + argument-hint 齐全 |
| PASS | [CMD] /test frontmatter 格式 | commands/test.md | description + argument-hint 齐全 |
| PASS | [CMD] /review frontmatter 格式 | commands/review.md | description + argument-hint 齐全 |
| PASS | [CMD] /package frontmatter 格式 | commands/package.md | description + argument-hint 齐全 |
| PASS | [CMD] /report frontmatter 格式 | commands/report.md | description + argument-hint 齐全 |
| PASS | [CMD] /kickoff frontmatter 格式 | commands/kickoff.md | description + argument-hint 齐全 |
| PASS | [CMD] /impl frontmatter 格式 | commands/impl.md | description + argument-hint 齐全 |
| PASS | [CMD] /verify frontmatter 格式 | commands/verify.md | description + argument-hint 齐全 |
| PASS | [CMD] /ship frontmatter 格式 | commands/ship.md | description + argument-hint 齐全 |
| PASS | [PROD] /prd 产物路径 | smoke/docs/prd.md | 包含用户故事 + GWT 验收标准 |
| PASS | [PROD] /wbs 产物路径 | smoke/docs/wbs.md | 包含迭代任务 + 风险清单 |
| PASS | [PROD] /design 产物路径 | smoke/docs/architecture.md + api-contract.yaml + data-model.md | 三文件齐全 |
| PASS | [PROD] /build-web 产物路径 | smoke/docs/frontend-build.md | 包含完成模块 + 测试结果 |
| PASS | [PROD] /build-api 产物路径 | smoke/docs/backend-build.md | 包含完成模块 + 测试结果 |
| PASS | [PROD] /test 产物路径 | smoke/docs/test-report.md | 覆盖率 84%，20/20 PASS |
| PASS | [PROD] /review 产物路径 | smoke/docs/review-report.md | 三级分类（阻塞/警告/建议） |
| PASS | [PROD] /package 产物路径 | smoke/docs/delivery-package.md | 交付物清单 + 部署命令 |
| PASS | [MJS] aggregate.mjs bootstrap | .delivery/project-id 写入 proj-moax1bb6-ooemao | EXIT:0 |
| PASS | [MJS] aggregate.mjs 导入 events | metrics/metrics.db (imported:5) | EXIT:0 |
| PASS | [MJS] baseline.mjs 生成锁定基线 | baseline/baseline.locked.json | EXIT:0 |
| PASS | [MJS] report.mjs 生成效率报告 | smoke/docs/efficiency-report.raw.md | 含阶段对比表+质量守门+原始数据链接，EXIT:0 |

---

## 统计

| 指标 | 数值 |
|------|------|
| 总检查条目 | 25 |
| PASS | 25 |
| FAIL | 0 |
| PASS 占比 | **100%** |

---

## 关键观测

1. **所有 13 个命令文件** frontmatter 均符合规范（`description` + `argument-hint` 两字段）。
2. **aggregate → baseline → report 三段链路** 完全可执行，产出文件格式正确。
3. `aggregate.mjs` 依赖 `DELIVERY_METRICS_DIR` 环境变量注入，生产环境需设置（hooks 已处理）。
4. `baseline.mjs` 依赖相对路径 `baseline/*.{csv,md}`，必须从插件根目录运行。
5. `report.mjs` 支持 `--baseline` / `--out` 参数覆盖默认路径，便于 CI 集成。
6. historical-projects.csv 列名与 baseline.mjs 阶段键（prd/wbs/…）未完全对应，导致 hist 值全为 0——**不影响脚本可执行性，在 T-E02 中须修正**。

---

## 下一步

- **T-E02**（真数据链路验证）已解锁 → status: ready
- 修正 historical-projects.csv 列名使其匹配 baseline.mjs 阶段键（可在 T-E02 内完成）
- P9（打包与文档）依赖 T-E02 完成后解锁

---

_smoke-test-report.md 由 T-E01 自动生成_
