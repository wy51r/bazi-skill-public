# bazi-skill-public

面向 AI 命理应用的八字结构化分析 Skill 与排盘 JSON 转换器。

这个项目不是一个简单的“八字提示词”，而是一套可工程化接入的命书生成底座：用户只需要输入出生日期、时间、性别和地区，后端先生成标准化八字 JSON，再交给 Codex / 大模型按照固定命理规则输出命书。

适合用于：

- AI 命理小程序
- 八字命书生成器
- 传统文化内容产品
- 命理 App 原型
- Codex Skill 研究
- LLM 结构化提示词工程

## 为什么做这个项目

普通八字 AI 分析经常有几个问题：

- 让用户手写八字 JSON，门槛太高。
- 让大模型直接排盘，容易算错四柱、大运和流年。
- 输出看似玄妙，但没有稳定推理链。
- 同一个命盘换一次问法，结论漂移明显。
- 成人命盘、未成年人命盘、婚恋、财运、健康混在一起乱断。

本项目的思路是把流程拆开：

```text
出生信息
  ↓
确定性排盘
  ↓
标准化 bazi.input.v1 JSON
  ↓
命理规则裁决
  ↓
不同风格命书输出
```

大模型不负责算盘，只负责解释盘、裁决结构、生成命书。

## 核心能力

- 出生信息转八字 JSON。
- 自动生成四柱、藏干、十神、纳音、大运、流年。
- 内置月令、调候、气势、格局、病药、岁运的推理顺序。
- 支持裁决强度：`A级定断 / B级主断 / C级条件断 / D级不裁决`。
- 支持多种输出模式：
  - 传统命书型
  - 白话小白型
  - 强断命书型
  - 结构强断事件流
  - 未成年人成长分析
- 内置反幻觉约束：
  - 不发明不存在的冲合刑害。
  - 不把上一个命盘逻辑复制到下一个命盘。
  - 大运流年触发必须说明依据。
  - 健康只作传统象意，不作医学诊断。

## 项目结构

```text
bazi-skill-public/
├─ skills/bazi/                 # Codex skill 主系统
│  ├─ SKILL.md
│  ├─ agents/openai.yaml
│  ├─ references/
│  │  ├─ heuristics.md          # 理法裁决顺序
│  │  ├─ input-schema.md        # bazi.input.v1 协议
│  │  ├─ output-style.md        # 输出风格与强断模式
│  │  └─ rule-system.md         # 古籍规则索引
│  └─ examples/
├─ converter/                   # 出生信息 -> bazi.input.v1 JSON
│  ├─ src/bazi-json-builder.js
│  ├─ bin/build-bazi-json.js
│  └─ package.json
├─ examples/                    # 示例排盘 JSON
├─ docs/                        # 架构、规则清单、发布说明
└─ tools/                       # 古籍文本处理脚本
```

## 快速开始

### 1. 安装依赖

```powershell
cd converter
npm install
```

### 2. 生成八字 JSON

```powershell
node bin/build-bazi-json.js `
  --date 2001-11-16 `
  --time 09:50 `
  --gender female `
  --location "China, timezone Asia/Shanghai" `
  --target-start-year 2026 `
  --target-year-count 3 `
  --out ../examples/test.json
```

生成后的 JSON 可以直接交给 `skills/bazi` 使用。

### 2.1 启用真太阳时

如果需要按出生地经度校正真太阳时，增加 `--use-true-solar-time`。

已内置部分常见城市经度，例如北京、上海、广州、深圳、杭州、南京、合肥、成都、武汉、西安等。也可以用 `--longitude` 显式传入经度。

```powershell
node bin/build-bazi-json.js `
  --date 2016-09-14 `
  --time 05:50 `
  --gender male `
  --location "China, Hefei, Anhui, timezone Asia/Shanghai" `
  --use-true-solar-time `
  --target-start-year 2026 `
  --target-year-count 3 `
  --out ../examples/hefei-true-solar.json
```

或者显式指定经度：

```powershell
node bin/build-bazi-json.js `
  --date 2016-09-14 `
  --time 05:50 `
  --gender male `
  --longitude 117.2272 `
  --use-true-solar-time `
  --out ../examples/hefei-true-solar.json
```

输出 JSON 中会同时保留：

```text
meta.birth_datetime   原始北京时间
meta.chart_datetime   真太阳时校正后用于排盘的时间
meta.true_solar_time  经度修正、均时差和总校正分钟数
```

### 3. 安装 Codex Skill

```powershell
Copy-Item -Recurse -Force ".\skills\bazi" "$env:USERPROFILE\.codex\skills\bazi"
```

### 4. 在 Codex 中调用

```text
使用 $bazi，读取：
<你的 JSON 文件路径>

请按“结构强断事件流”输出。
```

## 命理推理框架

核心裁决顺序：

```text
月令定纲，调候定生机，气势定真伪，格局定名分，病药定喜忌，岁运定应期。
```

三种主导模式：

```text
调候主导：寒暖燥湿决定命局能不能运转。
气势主导：全局气势、从化、偏枯、流通阻滞决定主线。
格局主导：月令格局清晰时，以格局成败和用神救应为核心。
```

参考规则来源：

```text
子平真诠：格局主导
滴天髓阐微：气势主导
穷通宝鉴：调候主导
渊海子平：十神取象
三命通会：格局交叉验证
千里命稿：现代命书结构
```

## 结构强断事件流模式

这是当前最适合产品化的输出模式之一。

它不是简单毒舌，而是：

```text
先定盘
再看命局骨架
再看十神结构
再看地支暗线
再把合冲刑害落到现实事件
最后用大运流年验证
```

示例调用：

```text
使用 $bazi，读取：
examples/1987-10-29-0830-male-generated.json

请按“结构强断事件流”输出。
要求先定盘，每个判断给出命理触发、现实落点、强断，语气尖锐直接。
```

## 小程序/后端推荐架构

```text
用户输入出生日期、出生时间、性别、出生地
  ↓
后端校验输入
  ↓
可选：真太阳时校正
  ↓
converter 生成 bazi.input.v1 JSON
  ↓
后端拼接 bazi skill 规则
  ↓
调用大模型生成命书
  ↓
返回 Markdown / HTML / JSON 给小程序
```

推荐接口：

```http
POST /api/bazi/report
```

请求示例：

```json
{
  "birth_date": "2001-11-16",
  "birth_time": "09:50",
  "gender": "female",
  "location": "China, Shanghai",
  "use_true_solar_time": false,
  "target_start_year": 2026,
  "target_year_count": 3,
  "style": "structural_sharp_event_flow"
}
```

## 当前边界

- 排盘依赖 `lunar-javascript`。
- 已支持可选真太阳时校正：经度修正 + 均时差。常见城市可自动识别，也可传 `--longitude`。
- 五行强弱评分是工程化估算，建议产品上线前按你的门派规则复核。
- 冲合刑害是确定性枚举，不自动判定化局成立。
- 本项目只用于传统文化、文本生成、产品原型和研究。
- 不提供医疗、法律、投资、婚姻等现实决策保证。

## 古籍文本说明

公开仓库默认不包含六本古籍全文。

原因是：古籍本身多为公版，但不同网站的数字化文本、排版、校注和整理成果可能有各自授权边界。

如果你确认来源允许转载，可以自行把文本放到：

```text
skills/bazi/references/sources/
```

并注明来源和版权状态。

## Roadmap

- [x] 增加真太阳时校正。
- [ ] 增加 Web API 示例。
- [ ] 增加 HTML / PDF 命书模板。
- [ ] 增加更多输出模式示例。
- [ ] 增加可配置五行旺衰评分策略。
- [ ] 增加单元测试。

## License

代码和规则文件使用 MIT License。

古籍原文、第三方库、第三方数据源按各自许可处理。

## Disclaimer

本项目输出属于传统命理文化和文本生成研究，不应被视为科学预测，也不应替代医疗、法律、投资、婚姻、心理咨询等现实决策。
