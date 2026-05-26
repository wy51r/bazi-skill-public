# 架构说明

## 目标

让普通用户只输入出生信息，系统自动完成：

```text
排盘 -> 标准 JSON -> 命理推理 -> 命书生成
```

## 模块

### 1. 排盘转换器

位置：

```text
converter/
```

输入：

```json
{
  "date": "2001-11-16",
  "time": "09:50",
  "gender": "female",
  "location": "China, timezone Asia/Shanghai"
}
```

输出：

```text
bazi.input.v1 JSON
```

### 2. Codex Skill

位置：

```text
skills/bazi/
```

职责：

```text
读取完整排盘 JSON
按命理规则裁决
按指定输出模式生成命书
```

### 3. 应用后端

建议由你的业务系统实现：

```text
POST /api/bazi/report
```

请求：

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

内部流程：

```text
1. 校验出生信息
2. 如需要，传入 `use_true_solar_time` 和出生地经度
3. 调用 converter 生成 bazi.input.v1 JSON；converter 会把原始时间和校正后排盘时间都写入 `meta`
4. 拼接 skill 规则和用户输出模式
5. 调用大模型
6. 返回 chart_json 和 report_markdown
```

返回：

```json
{
  "chart": {
    "pillars": "辛巳 己亥 癸未 丁巳",
    "current_dayun": "辛丑",
    "target_years": ["丙午", "丁未", "戊申"]
  },
  "bazi_json": {},
  "report_markdown": "# 命书..."
}
```

## 推荐产品边界

- 不让用户手写 JSON。
- 不把 skill 和 API Key 放到小程序前端。
- 后端统一控制输出风格、免责声明、风控词和版本。
- 真太阳时建议作为高级选项：默认按北京时间，用户开启后按经度和均时差校正。
- 对未成年人启用未成年人输出规则。
- 健康、投资、婚姻、法律内容只作传统象意或文化分析。
