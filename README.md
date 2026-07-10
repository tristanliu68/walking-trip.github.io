# 熊野同行计划｜协作型网页

这是“熊野古道全踏破”五日行程的协作网页版本。它保留路线地图、每日行程、徒步数据与 Day 1「14–16 km」数据差异提示，并将原先的小程序协作设计迁移为可通过浏览器链接分享的 Web App。

## 具备的功能

- 行程拥有者、可编辑同行者、仅查看同行者三层权限；
- 生成 7 天有效的邀请链接；
- 多人编辑每日路线、概览、里程／时间／爬升、提醒和行程节点；
- 基于版本号的保存校验，避免同时编辑时覆盖他人内容；
- 修改记录、成员列表与实时刷新；
- 未配置后端时可直接打开 `index.html` 进行本机交互预览，数据仅保存于当前浏览器；配置后端后，自动切换为多人实时协作。

## 让朋友真正共同编辑（约 10 分钟）

1. 创建一个 Supabase 项目，并在 Authentication 设置中开启 Anonymous Sign-Ins。
2. 在 SQL Editor 中完整运行 `supabase-schema.sql`。
3. 在 Project Settings → API 复制 `Project URL` 和 **Publishable key**，填入 `config.js`（或将 `config.example.js` 复制为 `config.js` 再填写）。**不要**填写 Secret key 或 `service_role key`。
4. 在 Supabase 的 Realtime / Publications 中确认 `trip_days`、`trip_members`、`trip_activity` 已启用。SQL 已包含发布语句；若控制台提示重复，请忽略该提示。
5. 将整个目录部署到任一静态网站托管服务。部署后，组织者打开网站会自动创建初始行程；点击“邀请朋友”生成链接，复制或发送给同行者即可。

## 部署方式

本项目没有构建步骤。任何静态托管均可：GitHub Pages、Cloudflare Pages、Netlify、Vercel Static 或普通 Web 服务器。部署时应保留 `config.js` 与 `app.js` 同级。

## 安全说明

- 数据表启用 RLS；浏览器端只能读取自己已加入的行程。Publishable key 可以出现在浏览器端，Secret key 仅可保留在受控服务端环境中。
- 所有写入操作均走带权限检查的数据库函数；匿名用户也只能编辑自己拥有“编辑”权限的行程。
- 邀请链接包含随机邀请码并在 7 天后失效。生产环境可以进一步增加密码登录、邮件邀请、图片上传和行程备份。

## 文件

```text
index.html            页面入口
styles.css            响应式视觉样式
app.js                前端、协作交互与实时订阅
config.js             后端配置（初始为空，默认本机预览）
supabase-schema.sql   数据表、权限、邀请与版本控制函数
```
