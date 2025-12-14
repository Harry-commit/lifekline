# Copilot / AI Agent 操作说明（项目特定）

下面的说明面向进入此仓库的 AI 编码代理，帮助你快速理解架构、关键约定、数据格式与常见陷阱，便于安全、可预测地修改或扩展代码。

## 一句概览
- 本项目是一个基于 Vite + React + TypeScript 的前端应用，核心功能：根据用户输入的四柱（八字）与大运信息，调用外部 LLM（默认通过用户填写的 `apiBaseUrl` / `apiKey`）生成 1-100 岁的“人生 K 线”数据并展示。

## 关键目录与文件（必读）
- `services/geminiService.ts`：负责与 LLM 接口交互。所有模型调用与 response JSON 解析在此处进行，修改调用或响应格式必须同时更新这里和 `constants.ts` 的系统指令。
- `constants.ts`：包含 `BAZI_SYSTEM_INSTRUCTION`，这是发给模型的系统提示（system prompt）。任何关于输出 JSON 结构或规则的变动，优先在这里同步修改。
- `types.ts`：定义了 `UserInput`、`KLinePoint`、`LifeDestinyResult` 等类型，代码其它处依赖这些字段名和类型。
- `components/BaziForm.tsx`：前端输入表单。它使用字符串类型保存 `startAge` 等字段（以方便输入控件），后端会做 `parseInt`。
- `components/LifeKLineChart.tsx`：K 线图渲染器，期望接收 `KLinePoint[]`。
- `README.md`：项目背景与外部文档链接。
- `.github/workflows/static.yml`：存在 CI workflow，变更前可查看是否受影响。

## 数据格式与严格约定（非常重要）
- 输出必须符合 `constants.ts` 中 JSON 结构示例：包含 `bazi`, `summary*` 字段和 `chartPoints`（数组，1-100 岁）。
- `KLinePoint`（在 `types.ts`）的必需字段：
  - `age` (number): **虚岁**，必须从 1 开始到 100；
  - `year` (number)：公历年份；
  - `ganZhi` (string)：该年的流年干支（例如 `甲子`）；
  - `daYun` (string|optional)：当前所属大运（10 年周期，**同一周期内 10 年一致**）；
  - `open`, `close`, `high`, `low` (number): 运势分数（0-100）；
  - `score` (number): 年度评分（0-100 或 0-10 视实现，当前 UI 使用 0-100 分值）；
  - `reason` (string): 详批文本（UI 期望可滚动显示，约 100 字左右）。
- 大运（`daYun`）与流年（`ganZhi`）语义：`daYun` 必须是大运干支（十年一变），`ganZhi` 为流年每年一变。

## 服务调用约定与注意点
- 前端默认 `apiBaseUrl` 为 `https://openrouter.ai/api/v1`（见 `BaziForm.tsx` 的初始值），但用户可覆盖。`geminiService.ts` 会对 `apiBaseUrl` 做去尾斜杠处理并向 `${cleanBaseUrl}/chat/completions` 发送请求。
- `geminiService.ts` 构建请求体时：
  - 使用 `BAZI_SYSTEM_INSTRUCTION` 作为 system message；
  - 使用 `userPrompt`（在服务内构造）作为 user message；
  - 使用 `response_format: { type: "json_object" }` 并期望模型返回可解析为 JSON 的 `content`。
- 错误处理：若 HTTP 非 2xx 或模型未返回 `content` 或 `chartPoints` 缺失，`geminiService` 会抛出错误，前端应展示错误提示（目前前端只会把错误打印到控制台并中止流程）。

## 常见陷阱 / 项目特有差异
- `startAge` 在 `types.ts` 和表单中使用字符串类型（为兼容输入控件），在 `geminiService` 中需要 `parseInt`。
- 表单默认 `modelName`：`BaziForm.tsx` 使用 `'google/gemini-3-pro-preview'`，但 `geminiService.ts` 的 fallback 是 `'gemini-3-pro-preview'`。当修改模型名称或默认值时，请同时更新两处以避免不一致。
- 模型必须返回 JSON 字符串（可被 `JSON.parse`）。如果返回的是纯文本或不合法 JSON，请在 `geminiService` 中添加更明确的解析和日志，或在 `constants.ts` 中强制更具体的 `response_format`。

## 编辑/扩展模型提示或输出结构的步骤（安全作业流程）
1. 修改 `constants.ts` 中的 `BAZI_SYSTEM_INSTRUCTION`：明确列出必须字段与示例 JSON（保持与 `types.ts` 同步）。
2. 更新 `types.ts`（如果添加或改字段）。
3. 修改 `services/geminiService.ts` 的解析/校验逻辑，确保对 `chartPoints` 的存在和字段类型做严格检查并抛出清晰错误。
4. 如果前端展示字段有变化，调整相应组件（如 `LifeKLineChart.tsx`, `AnalysisResult.tsx`）。
5. 本地运行并验证：
   - 本地开发：`npm run dev`
   - 打包：`npm run build`
   - 预览打包产物：`npm run preview`

## 快速示例（必遵守）
- 要求模型返回的 `chartPoints` 中前两项示例（伪 JSON）：

```json
{
  "chartPoints": [
    {"age":1,"year":1990,"ganZhi":"庚午","daYun":"童限","open":50,"close":55,"high":60,"low":45,"score":55,"reason":"…约100字详批…"},
    {"age":2,"year":1991,"ganZhi":"辛未","daYun":"童限","open":52,"close":48,"high":58,"low":44,"score":50,"reason":"…"}
  ]
}
```

## 额外提示给 AI 代理
- 优先保持字段名与 `types.ts` 一致；不可随意改名或删除字段。
- 在变更 `BAZI_SYSTEM_INSTRUCTION` 时，把变更写入 commit message，并在 PR 描述中说明对前端显示或后端校验的影响。
- 对外部 API 的任何硬编码（默认 `apiBaseUrl`、model 名）变更必须明确注明兼容性风险并更新 `BaziForm.tsx` 的默认值。

---

如果你希望我把说明做得更简短、或增加「示例请求/响应的完整 mock」，告诉我你想要的层级（快速入门 / 开发者细节 / 深度调试）。
