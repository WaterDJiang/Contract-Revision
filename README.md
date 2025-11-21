# LexAI Contract Revision

React + Vite 应用，用于合同的生成与审核：支持多模型提供商、比对模式、历史记录、本地化和建议提交。

## 功能

- 合同起草与审核，严格 JSON 输出（便于前端解析与高亮）
- 模型提供商：Google Gemini、OpenAI、GLM、Custom
- 默认模型：生产环境默认 GLM（`glm-4.6`），开发环境默认 Google（`gemini-2.5-flash`）
- 模型配置弹窗：按提供商分桶保存密钥；GLM 默认走环境密钥
- 建议提交：弹窗表单，通过 n8n Webhook（Basic Auth）发送
- 本地历史记录：使用 IndexedDB 存储关键操作记录
- 多语言：中英文切换
- 主页链接：页脚提供个人主页跳转 `wattter.cn`

## 快速开始

前置：Node.js 18+

1. 安装依赖：
   `npm install`
2. 配置环境变量（本地开发）：在 `.env.local` 设置需要的密钥
   - `GEMINI_API_KEY=...`
   - `OPENAI_API_KEY=...`
   - `GLM_API_KEY=...`
   - `CUSTOM_API_KEY=...`
   - 建议（可选）：
     - `SUGGEST_WEBHOOK_URL=https://n8n.example.com/webhook-test/lex_suggests`
     - `SUGGEST_WEBHOOK_USER=xxx`
     - `SUGGEST_WEBHOOK_PASS=xxx`
3. 启动开发：
   `npm run dev`

## 生产部署

- 构建：`npm run build`（产物在 `dist/`）
- 环境变量需在“构建环境”注入，推荐使用 Vite 前缀：
  - `VITE_GLM_API_KEY`、`VITE_GEMINI_API_KEY`、`VITE_OPENAI_API_KEY`、`VITE_CUSTOM_API_KEY`
  - 建议 Webhook：`VITE_SUGGEST_WEBHOOK_URL`、`VITE_SUGGEST_WEBHOOK_USER`、`VITE_SUGGEST_WEBHOOK_PASS`
- 默认提供商：生产环境默认 GLM；如未配置 GLM 密钥，会在设置弹窗中出现提示

## 使用说明

- 模型配置：右上角导航或侧边栏设置按钮打开；按提供商填写对应密钥
- GLM：默认使用环境密钥，不在前端输入框展示；建议在生产环境设置 `VITE_GLM_API_KEY`
- 建议提交：右上角或侧边栏的“提交建议”按钮，支持建议内容（必填）、姓名/邮箱/手机号（选填）
- 历史记录：侧边栏“历史”按钮打开，查看或清空本地操作记录
- 合同比对：侧边栏“合同比对”按钮打开比对弹窗

## 安全与隐私

- 前端输入的 API Key 按提供商分桶保存在浏览器本地（加密混淆），不上传服务器
- GLM 默认从环境变量读取，避免在前端存储密钥
- 建议通过后端 Webhook（Basic Auth）发送，需自行配置凭据

## 常见问题

- 报错 “API Key is missing for provider: glm”
  - 在生产环境设置 `VITE_GLM_API_KEY`（或 `GLM_API_KEY`）并重新构建部署
- OpenAI/Custom 请求失败
  - 确认 `baseUrl` 与密钥匹配，例如 OpenAI 默认 `https://api.openai.com/v1`
- 语言输出
  - Prompt 统一，依据 `language` 输出中文或英文

## 项目脚本

- `npm run dev` 启动本地开发服务器
- `npm run build` 生成生产构建
- `npm run preview` 预览构建产物（如已配置）

## 版本控制

- `.gitignore` 已忽略：`node_modules/`、`dist/`、`.env*`、日志与缓存、IDE/OS 文件
- 若历史中曾提交过 `node_modules`，可使用 `git filter-repo` 或 BFG 进行历史瘦身（需谨慎操作）
