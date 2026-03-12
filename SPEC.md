# GitHub Actions Dashboard — 实施计划

## Context

darknight 账号下有 ~10 个项目，其中 3 个有活跃的 GitHub Actions 工作流：
- `daily-digest` — 定时抓取 + 部署到 Cloudflare Pages（2 个 workflow）
- `whoishiring-insight` — 定时数据更新 + 部署到 Cloudflare Pages（2 个 workflow）
- `regular-investing-in-box` — 部署到 Aliyun OSS（1 个 workflow）

**痛点：** 逐个进入 GitHub 项目页面查看 Actions 状态费时费力，也无法统一触发/重跑工作流。

**调研结论：** 市面上没有现成的开源工具能同时满足好看 UI + 触发工作流 + 自部署。决定自建一个轻量 Dashboard。

## 项目信息

- **GitHub Repo:** `darknight/ci-dashboard`
- **子域名:** `ci.illuminating.me`
- **预估代码量:** ~400 行业务代码（不含 scaffolding）
- **资源消耗:** Cloudflare Pages + Workers，免费额度内，成本 $0

## 技术方案

| 层面 | 选择 | 理由 |
|------|------|------|
| 框架 | **SvelteKit** | 全栈框架，内置 API routes + SSR，用户有 Svelte 经验 |
| UI 组件 | **shadcn-svelte** | 基于 Tailwind，高质量组件（Card、Badge、Button 等），开箱好看 |
| 认证 | **Cloudflare Access** | 零代码改动，基础设施层认证，未来可复用到其他服务 |
| 部署 | **Cloudflare Pages** | SSR 代码编译为 Cloudflare Workers，静态资源走 CDN |
| API | **GitHub REST API** | 列出 runs、触发 workflow、重跑失败 job |

## 核心功能

### P0 — MVP
1. **多 repo 工作流状态聚合** — 一页展示所有 repo 的最近 workflow runs，状态（成功/失败/进行中）
2. **触发工作流** — 对支持 `workflow_dispatch` 的 workflow 可直接触发
3. **重跑失败的 run** — 一键重跑

### P1 — 后续迭代
4. **查看 run 日志** — 不跳转 GitHub 直接查看
5. **失败通知** — 工作流失败时推送通知（通过 ntfy，已部署在 Railway）

## GitHub API 端点

```
# 列出某个 repo 的 workflow runs
GET /repos/{owner}/{repo}/actions/runs

# 列出某个 repo 的所有 workflows
GET /repos/{owner}/{repo}/actions/workflows

# 触发 workflow（需要 workflow 配置了 workflow_dispatch）
POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches

# 重跑失败的 run
POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs

# 获取 run 的日志（P1）
GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs
```

## 项目结构

```
github-actions-dashboard/
├── src/
│   ├── routes/
│   │   ├── +page.svelte              # 主 dashboard 页面
│   │   ├── +page.server.ts           # 加载所有 repo 的 workflow runs
│   │   ├── api/
│   │   │   ├── trigger/+server.ts    # POST: 触发 workflow
│   │   │   └── rerun/+server.ts      # POST: 重跑失败 job
│   ├── lib/
│   │   ├── github.ts                 # GitHub API 封装
│   │   ├── config.ts                 # repo 列表等配置
│   │   └── components/
│   │       ├── RepoCard.svelte       # 单个 repo 的工作流状态卡片
│   │       ├── RunStatus.svelte      # run 状态标签
│   │       └── TriggerButton.svelte  # 触发/重跑按钮
├── static/
├── svelte.config.js                  # Cloudflare adapter 配置
├── package.json
└── wrangler.toml                     # Cloudflare Pages 配置
```

## 关键实现细节

### GitHub Token 安全
- Token 存在 Cloudflare Pages 的环境变量中（`GITHUB_TOKEN`）
- 只在 server-side（`+page.server.ts` 和 `api/` routes）使用，永远不暴露给前端
- Token 需要 `repo` 和 `workflow` 权限

### Cloudflare Access 配置
- 在 Cloudflare Zero Trust 面板创建 Access Application
- 设置 Policy：只允许特定 GitHub 账号（darknight）登录
- 应用代码本身不需要任何认证逻辑

### Repo 配置
```ts
// src/lib/config.ts
export const REPOS = [
  'daily-digest',
  'whoishiring-insight',
  'regular-investing-in-box',
  // 未来新增 repo 只需在这里添加
];
export const GITHUB_OWNER = 'darknight';
```

## 实施步骤

1. **初始化项目** — `npx sv create github-actions-dashboard`，选择 SvelteKit + Cloudflare adapter
2. **实现 GitHub API 封装** — `src/lib/github.ts`，封装列出 runs / 触发 / 重跑的 API 调用
3. **实现 Dashboard 主页** — Server-side 加载所有 repo 的 workflow runs，前端渲染状态卡片
4. **实现触发/重跑 API routes** — `src/routes/api/trigger/` 和 `src/routes/api/rerun/`
5. **UI 组件** — 使用 shadcn-svelte（Card、Badge、Button 等），简洁现代的卡片式布局
6. **部署到 Cloudflare Pages** — 配置 `wrangler.toml`，设置环境变量
7. **配置 Cloudflare Access** — 创建 Access Application + Policy

## 验证方式（交付标准）

前提：需要一个有效的 GitHub Token（`repo` + `workflow` 权限）

1. **`npm run dev`** → 能看到所有配置 repo 的最近 workflow runs 及状态（成功/失败/进行中）
2. **触发 workflow** → 点击按钮成功触发一个 `workflow_dispatch` 类型的 workflow
3. **重跑 failed run** → 点击按钮成功重跑一个失败的 run
4. **`npm run build`** → Cloudflare adapter 构建无报错
5. 部署到 Cloudflare Pages + 配置 Cloudflare Access → 不属于代码交付范围，提供部署指南

## 不在本次范围内

- Cloudflare Access 配置（需在 Cloudflare 面板操作）
- GitHub repo 创建和推送（代码完成后再操作）
- P1 功能（日志查看、失败通知）留给后续迭代
