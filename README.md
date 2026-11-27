# 山泠庐 Shanlinglu

一个宿舍的创意作品集。主站用 Astro 生成静态网页，由 GitHub Pages 托管。[访问山泠庐](https://shanlinglu.github.io/) · [投稿指南](CONTRIBUTING.md)

## 本地运行

安装 Node.js 24 LTS，在仓库根目录运行：

```sh
npm ci
npm run dev
```

终端会显示本地预览地址。运行 `npm run build` 生成 `dist/`，再用 `npm run preview` 检查生产版本。

## 投稿与发布

将 `templates/work` 复制到 `works/<作品目录名>`，填写作品资料，并在新分支提交 PR。作品页面、分类和首页卡片会自动生成。静态作品和独立部署作品使用同一套模板。[查看投稿步骤](CONTRIBUTING.md)

仓库默认分支为 `main`。在 **Settings → Pages → Source** 选择 **GitHub Actions**。PR 执行构建，合并到 `main` 后自动部署。若上线后发现问题，可通过 GitHub 的 **Revert** 为已合并的 PR 创建回退提交，再次构建并部署。

## 首发验收

请一位初次投稿的室友独立按照投稿指南提交一件作品。在校园 Wi-Fi 和手机流量下分别打开首页，进入每件作品，玩完一局或读完一页。记录设备、网络、打开失败的具体地址和时间，方便复查。

绑定自定义域名时，在仓库的 Pages 设置中添加域名，再按 GitHub 指引配置 DNS 并启用 HTTPS。域名持有人和续费安排由小组约定。需要跨设备存档、多人联机等功能时，可以为对应作品单独部署后端。[GitHub Pages 域名指南](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
