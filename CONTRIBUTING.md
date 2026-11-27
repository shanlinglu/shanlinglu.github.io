# 投稿指南

山泠庐收录宿舍成员做的游戏、工具、手记和作品集。每件作品占一个目录，合并投稿后，首页会自动出现它的卡片。

## 1. 复制模板，给作品起个地址

打开主站仓库，按键盘上的英文句点键 `.` 进入 GitHub 网页编辑器。在左侧文件树中复制 `templates/work`，粘贴到 `works`，把复制的目录改名，例如 `dorm-clock`。目录名使用小写英文字母、数字和短横线。发布后的作品地址就是 `/works/dorm-clock/`，以后更新内容时沿用这个目录。[打开主站仓库](https://github.com/shanlinglu/shanlinglu.github.io) · [查看投稿模板](https://github.com/shanlinglu/shanlinglu.github.io/blob/main/templates/work/index.md)

## 2. 填作品卡，选择入口

在 `index.md` 顶部的两行 `---` 之间填写五项资料。以下是《山径接线员》的作品卡，最后两项可省略。

```yaml
---
title: 山径接线员
author: 山泠庐 × Codex
type: 游戏
summary: 旋转山间线路，把信号从山脚一路送到山顶的木塔。
entry: play.html
cover: cover.png
action: 开始玩
---
```

- **小游戏或工具**：把 HTML、CSS、JavaScript、图片等拖进自己的目录，`entry` 写入口文件名，例如 `play.html`。资源用相对路径引用。若项目需要编译，先生成静态文件，再上传可运行的产物。[查看游戏目录](https://github.com/shanlinglu/shanlinglu.github.io/tree/main/works/ridge-relay)
- **文章、手记或图集**：保留 `entry: article`，在第二行 `---` 下方写 Markdown 正文。封面、插图和附带的实验页都可以放在同一目录，正文用 `[打开实验](experiment.html)` 这样的写法引用。[查看手记目录](https://github.com/shanlinglu/shanlinglu.github.io/tree/main/works/pi-notebook)
- **独立部署的作品**：把 `entry` 改成访客可以直接打开的完整 `https://` 体验网址。作品代码留在原仓库。如果想一并分享源码，可再加一行 `source`，填写完整的 HTTPS 源码网址。

用 `type` 填写分类，新类型会自动出现在首页筛选器里。`author` 写希望公开显示的名字。`cover` 填作品目录里的图片相对路径，省略时卡片会显示分类图标。`action` 可以写“开始玩”“读手记”或“打开工具”。

### 给现有栏目追加文章

在栏目目录下新建 `articles/<文章目录名>/index.md`，目录名用小写英文字母、数字和短横线。比如在 `works/hangai-games/articles/` 下新建 `new-review/index.md`，发布后地址就是 `/works/hangai-games/new-review/`。构建时会生成文章页，并按发表日期从新到旧更新栏目目录。

```markdown
---
title: 文章标题
author: 公开署名
summary: 一句话介绍这篇文章。
date: '2026-11-27'
cover: cover.webp
source: https://example.com/original
---

正文写在这里。配图与正文放在同一个文章目录，用相对路径引用。

![配图说明](images/screenshot.webp)
```

`cover` 和 `source` 可省略。需要标注剧透时，可在顶部填写 `spoiler`，例如 `spoiler: 轻度剧透`。

## 3. 开一个 Pull Request

在网页编辑器左下角点击分支名，从 `main` 创建新分支，例如 `add-dorm-clock`。在左侧“源代码管理”里填写“添加宿舍时钟”，提交并推送该分支。返回 GitHub 仓库，点 **Compare & pull request**，确认目标分支为 `main`，写明作品怎么玩或怎么看，再点 **Create pull request**。

## 4. 让一位室友预览，然后合并

在 PR 的 **Checks** 中查看构建结果。点进对应的 Actions 运行，在 **Artifacts** 下载 `site-preview` 并解压。在含 `index.html` 的目录打开终端，运行 `python3 -m http.server 8000`，用浏览器访问 `http://localhost:8000`。如果电脑装的是 Windows 版 Python，也可以用 `py -m http.server 8000`。

请室友从首页点进作品、试一遍核心操作、用手机尺寸检查排版。站外作品也要点开实际入口。检查通过后点 **Merge pull request**。等仓库的 Pages 部署完成，生产站就会更新。[查看发布记录](https://github.com/shanlinglu/shanlinglu.github.io/actions) · [打开山泠庐](https://shanlinglu.github.io/)
