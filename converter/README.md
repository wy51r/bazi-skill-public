# converter

把普通出生信息转换成 `$bazi` skill 可读的 `bazi.input.v1` JSON。

## 安装

```powershell
npm install
```

## 基础排盘

```powershell
node bin/build-bazi-json.js `
  --date 1990-01-01 `
  --time 12:00 `
  --gender male `
  --location "China, timezone Asia/Shanghai" `
  --target-start-year 2026 `
  --target-year-count 3 `
  --out ../tmp/test.json
```

## 古籍公开命例

公开仓库示例使用《千里命稿》的四柱命例，不放现代个人出生信息。

```powershell
node bin/build-bazi-json-from-pillars.js `
  --pillars "乙巳 甲申 癸未 丙辰" `
  --gender male `
  --case-id qianli-minggao-lu-friend `
  --source-title "千里命稿" `
  --source-note "《千里命稿》陆维屏君友人命例，原文作：为乙巳甲申癸未丙辰。" `
  --out ../examples/qianli-minggao-lu-friend.json
```

注意：四柱命例不能复原真太阳时、精确起运和完整流年，只用于公开示例和 skill 输出测试。

## 真太阳时

启用：

```powershell
node bin/build-bazi-json.js `
  --date 1990-01-01 `
  --time 12:00 `
  --gender male `
  --location "China, Hefei, Anhui, timezone Asia/Shanghai" `
  --use-true-solar-time `
  --out ../tmp/hefei-true-solar.json
```

显式经度：

```powershell
node bin/build-bazi-json.js `
  --date 1990-01-01 `
  --time 12:00 `
  --gender male `
  --longitude 117.2272 `
  --use-true-solar-time `
  --out ../tmp/hefei-true-solar.json
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
