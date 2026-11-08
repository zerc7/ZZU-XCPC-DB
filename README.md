# ZZU XCPC DB

郑州大学历年 XCPC 比赛与选手档案。React + Semantic UI React 前端，SRK 官方工具库解析奖项，Vite 构建静态站点，GitHub Pages 发布。

## 本地开发

需要 Node.js 20+；同步上游时还需要 Git。所有命令在项目根目录执行。

```bash
npm ci
npm run dev
```

按终端提示访问开发服务器，通常是 `http://localhost:5173/#/contests`。

## 常用命令

| 命令                                          | 用途                            |
| --------------------------------------------- | ------------------------------- |
| `npm run dev`                                 | 生成站点数据并启动开发服务器    |
| `npm run sync -- --list`                      | 获取上游并列出含郑大队伍的赛事  |
| `npm run sync -- --contest=ccpc2024zhengzhou` | 同步唯一匹配的单场赛事          |
| `npm run sync -- --all`                       | 同步全部匹配赛事                |
| `npm run sync`                                | 交互选择赛事                    |
| `node scripts/merge-duplicate-contests.mjs`   | 预览完全重复的赛事快照          |
| `npm run merge-contests`                      | 保存识别到的赛事合并规则        |
| `npm run clean-data`                          | 就地清洗两个输入数据文件        |
| `npm test`                                    | 校验输入数据；不是浏览器测试    |
| `npm run build-data`                          | 生成前端 JSON，不访问 GitHub    |
| `npm run build`                               | 清洗 → 合并重复赛 → 校验 → 构建 |
| `npm run preview`                             | 预览上次构建的 dist/            |
| `npm run format`                              | 格式化源码与文档                |
| `npm run format:check`                        | 检查格式                        |

同步后执行 `npm run build`；开发过程中也可运行 `npm run clean-data`、`npm run build-data` 后刷新浏览器。源码热更新不会自动执行数据生成。

## 二次开发文档

- [开发指南](docs/DEVELOPMENT.md)：页面路由、UI 来源、修改入口、表格/分页、新增页面和检查流程。
- [数据模型与维护](docs/DATA.md)：输入/输出字段、同步、奖项、多类别、备注、人工补录、统计口径及限制。
- [部署与排错](docs/DEPLOYMENT.md)：GitHub Pages、子路径、构建产物、常见问题。
- [本次清理记录](docs/CLEANUP.md)：删除项、保留项及行为修正。

维护 `data/srk-results.json` 和 `data/manual-results.json`；不直接修改生成的 `data/site-data.json` 或 `public/data/site-data.json`。网站导航包括比赛、奖项和选手；奖项页按每场比赛的队伍赛果展示，可筛选类别并选择并集/交集。

## 上游与许可

UI 直接改编自 OIerDB NG 的导航、分页、响应式工具和主题样式，保留 LICENSE、NOTICE 和上游注释。软件许可标记为 AGPL-3.0-only；数据来源与上游数据许可应另行保留，软件许可不替代数据许可。

部署时请提供当前版本的对应源代码入口。本站自己的公开仓库地址尚未配置，需替换页脚为实际发布的源码链接，见部署文档。
