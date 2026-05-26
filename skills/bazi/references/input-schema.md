# 输入 JSON 协议

The skill accepts complete precomputed chart data. It must not infer pillars, hidden stems, ten gods, luck cycles, or jieqi from birth data unless the user explicitly asks for a separate exploratory note.

## Required Top-Level Fields

```text
schema_version
meta
pillars
day_master
solar_terms
five_elements
relations
ten_gods
luck
analysis_options
```

## Required Pillar Fields

For `year`, `month`, `day`, and `hour`:

```text
stem
branch
stem_yinyang
stem_element
branch_element
hidden_stems
ten_god
nayin
```

## Required Luck Fields

```text
luck.start_age
luck.direction
luck.dayun
luck.current_dayun
luck.target_years
```

Each dayun item should include:

```text
index
age_range
pillar
stem
branch
ten_god_stem
hidden_stems
```

## Validation Rule

If any required field is missing, output:

```text
缺失字段:
- ...

裁决: D级不裁决
原因: 输入不足，不能按工程化理法链稳定推断。
```

Do not fill missing values by guesswork.
