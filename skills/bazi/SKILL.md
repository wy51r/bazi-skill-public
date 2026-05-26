---
name: bazi
description: Traditional Chinese Bazi命理 reasoning and mingshu generation from complete precomputed chart JSON. Use when asked to analyze 八字, 四柱, 子平命理, 用神喜忌, 格局成败, 调候, 大运流年, or generate a 命书 from structured pillars, hidden stems, ten gods, five-element strength, relations, and luck-cycle data.
---

# 八字 · 命理推理操作系统

Use this skill to produce stable, auditable, classical Bazi reasoning from a complete deterministic chart JSON. This skill does not calculate the chart from birth data; it interprets already-computed symbols.

## Operating Rule

Require complete chart data before judging. If any required input is missing, stop and return a missing-field list.

Load references only as needed:

- For accepted input fields, read `references/input-schema.md`.
- For conflict resolution and decision order, read `references/heuristics.md`.
- For source-derived rule families, read `references/rule-system.md`.
- For report and mingshu style, read `references/output-style.md`.
- For raw source material checks, search `references/sources/`.

## Core Heuristic

Use this fixed decision order:

```text
月令定纲，调候定生机，气势定真伪，格局定名分，病药定喜忌，岁运定应期。
```

Do not treat the classics as equal free-form citations. First classify the chart into one leading mode, then let that mode choose the primary rule family:

1. **调候主导**: severe cold, heat, dryness, or dampness controls viability. Primary lens: `穷通宝鉴`; secondary: `滴天髓`.
2. **气势主导**: one force dominates, follow/transform/special momentum is real, or the chart is strongly partial. Primary lens: `滴天髓`; secondary: `子平真诠` and `穷通宝鉴`.
3. **格局主导**: no fatal climate imbalance or extreme momentum; month-command pattern is legible. Primary lens: `子平真诠`; secondary: `滴天髓` and `穷通宝鉴`.

Use `渊海子平`, `三命通会`, and `千里命稿` for ten-god imagery, pattern corroboration, old-style judgments, luck timing, and mingshu structure. They may support or lower the judgment level, but they do not override the selected primary mode.

## Output Requirements

Every major judgment must include:

```text
主裁决:
裁决强度: A级定断 / B级主断 / C级条件断 / D级不裁决
依据:
岁运验证:
```

Use direct conclusions. Do not end key findings with "可能", "也许", "各有道理", or unresolved school disagreement. If evidence is insufficient, mark `D级不裁决` and name the missing fields.

Default output is dual-layer:

1. Modern structured reasoning for auditability.
2. Classical or semi-classical mingshu prose for final presentation.

## Safety Boundary

Frame results as traditional命理 cultural and textual reasoning, not guaranteed real-world fact. Do not replace medical, legal, financial, marital, or safety decisions. For illness, death, disaster, fertility, or other sensitive topics, use structural language and avoid intimidation.
