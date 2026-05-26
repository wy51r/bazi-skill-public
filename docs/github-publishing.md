# GitHub 发布步骤

## 1. 检查公开内容

确认不要上传：

```text
node_modules/
.env
skills/bazi/references/sources/
```

`references/sources/` 是可选古籍全文目录。公开发布前必须确认数字化文本来源允许转载。

## 2. 初始化 Git

```powershell
cd "<你的本地路径>\bazi-skill-public"
git init -b main
git status
git add .
git commit -m "Initial bazi skill public package"
```

## 3. 创建 GitHub 仓库

建议仓库名：

```text
bazi-skill-public
```

GitHub 页面选择：

```text
Public
不要勾选自动生成 README
不要勾选 LICENSE
```

## 4. 推送

把下面 URL 换成你的仓库地址：

```powershell
git remote add origin https://github.com/<your-name>/bazi-skill-public.git
git push -u origin main
```

## 5. 用户安装方式

### 安装 converter

```powershell
git clone https://github.com/<your-name>/bazi-skill-public.git
cd bazi-skill-public\converter
npm install
```

### 安装 Codex skill

```powershell
Copy-Item -Recurse -Force "..\skills\bazi" "$env:USERPROFILE\.codex\skills\bazi"
```

### 测试生成 JSON

```powershell
node bin/build-bazi-json.js `
  --date 1990-01-01 `
  --time 12:00 `
  --gender male `
  --target-start-year 2026 `
  --target-year-count 3 `
  --out ../tmp/test.json
```

### 在 Codex 中调用

```text
使用 $bazi，读取：
<仓库路径>\examples\qianli-minggao-lu-friend.json

请按“结构强断事件流”输出。
```
