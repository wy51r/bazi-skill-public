# 规则清单

## 主系统

当前主系统是 `skills/bazi`，不是 GPT 5.5 版本的轻量提示词。

核心入口：

```text
skills/bazi/SKILL.md
```

核心原则：

```text
月令定纲，调候定生机，气势定真伪，格局定名分，病药定喜忌，岁运定应期。
```

## 输入协议

文件：

```text
skills/bazi/references/input-schema.md
```

要求输入完整预排盘 JSON：

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

## 理法裁决

文件：

```text
skills/bazi/references/heuristics.md
```

三种主导模式：

```text
调候主导
气势主导
格局主导
```

裁决强度：

```text
A级定断
B级主断
C级条件断
D级不裁决
```

## 古籍规则索引

文件：

```text
skills/bazi/references/rule-system.md
```

六个来源角色：

```text
子平真诠：格局主导
滴天髓阐微：气势主导
穷通宝鉴：调候主导
渊海子平：十神取象与传统术语
三命通会：格局交叉验证和岁运参考
千里命稿：现代命书结构和表达
```

## 输出模式

文件：

```text
skills/bazi/references/output-style.md
```

当前包含：

```text
传统命书型 + 冷静直接
结构强断事件流
```

`结构强断事件流` 合并了 GPT 5.5 版本中最有价值的部分：

```text
先定盘
命局骨架
十神结构
地支暗线
格局判断
原生家庭
婚姻感情
事业财运
健康象意
大运走势
人生关键节点
最终总断
```

## 反幻觉规则

目前集中写在 `output-style.md` 的 `结构强断事件流` 中：

```text
不发明不存在的冲合刑害
只在大运流年出现的冲合，必须标明不是原局
每个强断必须有命理触发
不能把上一盘逻辑复制到下一盘
健康只作传统象意，不作医学诊断
```

## 男女命规则

当前规则：

```text
男命：财星是婚恋、伴侣、钱财、资源的重要主线
女命：官杀是婚恋、伴侣、关系压力、规则名分的重要主线
```

但不能只看单一星：

```text
必须合看夫妻宫、食伤、比劫、印星、财官关系、合冲刑害和岁运触发。
```

## 未成年人规则

当前规则：

```text
未满 18 岁时，强断学习习惯、家庭教育、纪律、天赋方向和成长风险。
不输出成人式财富、婚恋、性、灾祸、不可逆人生判断。
事业、财富、婚姻只能作为长期倾向，不作当前具体事件。
```

## 排盘算法

转换器：

```text
converter/src/bazi-json-builder.js
```

依赖：

```text
lunar-javascript
```

负责：

```text
出生信息 -> 四柱、藏干、十神、纳音、大运、流年、节气、五行评分、冲合刑害 -> bazi.input.v1 JSON
```

当前边界：

```text
已支持可选真太阳时校正：经度修正 + 均时差
五行评分是工程化估算
冲合刑害是确定性枚举，不自动判定化局成立
```
