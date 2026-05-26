# converter

把普通出生信息转换成 `$bazi` skill 可读的 `bazi.input.v1` JSON。

## 安装

```powershell
npm install
```

## 基础排盘

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

## 真太阳时

启用：

```powershell
node bin/build-bazi-json.js `
  --date 2016-09-14 `
  --time 05:50 `
  --gender male `
  --location "China, Hefei, Anhui, timezone Asia/Shanghai" `
  --use-true-solar-time `
  --out ../examples/hefei-true-solar.json
```

显式经度：

```powershell
node bin/build-bazi-json.js `
  --date 2016-09-14 `
  --time 05:50 `
  --gender male `
  --longitude 117.2272 `
  --use-true-solar-time `
  --out ../examples/hefei-true-solar.json
```

校正逻辑：

```text
真太阳时 = 北京时间 + 经度修正 + 均时差
经度修正 = (出生地经度 - 标准经线 120E) * 4 分钟
均时差 = 常见近似公式计算
```

输出 JSON 中：

```text
meta.birth_datetime   原始北京时间
meta.chart_datetime   实际用于排盘的时间
meta.true_solar_time  校正明细
```

## 测试

```powershell
npm test
```
