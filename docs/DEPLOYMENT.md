# 部署与排错

## 1. 本地构建与预览

```bash
npm ci
npm run build
npm run preview
```

预览地址以终端输出为准。只有 dist/ 是生产静态文件；不能用旧版方式直接打开 index.html 或在项目根目录跑普通文件服务器，因为源页面引用 JSX，需要 Vite 转换。

构建会清洗输入数据并更新生成时间，所以数据 JSON 可能有变动。确认数据差异后再提交。

## 2. GitHub Pages

1. 把项目推送到你自己的 GitHub 仓库，主分支使用 main；
2. Settings → Pages → Source 选择 GitHub Actions；
3. 检查 .github/workflows/pages.yml，当前 push 到 main 或手动 workflow_dispatch 会触发；
4. CI 执行 npm ci、npm run build，再上传 dist/；
5. 等待 deploy-pages 成功，在工作流或 Pages 设置查看站点地址。

如果主分支不是 main，改工作流的 branches。首次 Pages 部署可能需要你在仓库设置中启用对应环境；项目代码不自动创建远程仓库。

工作流不会定时同步 SRK；它发布仓库中已有的数据。要更新数据，先在本地运行 sync，审查后提交输入文件。

## 3. 项目子路径与路由

vite.config.js 的 base 为 `./`，资源路径相对于站点位置。HashRouter 的 `/#/contests` 不向 GitHub Pages 请求 `/contests` 文件，因此刷新详情页可行。

若部署到 `https://用户名.github.io/仓库名/`，入口应为 `/仓库名/#/contests`。不要手写指向站点根的 `/data/...`，否则会跳过仓库名；当前 fetch 使用相对路径 `./data/site-data.json`。

只有改成 BrowserRouter 才需要额外处理托管平台的重写或 404 回退；当前没有这些规则。

## 4. 需要提交与不提交的文件

提交 src/、scripts/、docs/、输入数据、package.json、package-lock.json、Vite 配置、工作流及 LICENSE/NOTICE。data/site-data.json 是当前保留的生成结果副本，可用于审查。

.gitignore 忽略 node_modules/、dist/、public/data/site-data.json 和日志；CI 会自行安装、生成、构建，不需要把依赖或发布目录塞进源码仓库。

## 5. 上游来源说明

OIerDB NG 的代码许可和 SRK 数据许可是两条独立的来源链。保留上游声明和源文件注释；不要因改站名移除它们。

当前页脚只链接到 OIerDB NG 上游，尚未配置本站自身的源码链接。发布前在 main.jsx 的 Layout 添加你自己的公开仓库/当前版本源码地址，保留源代码、构建脚本和锁文件的可获取方式。这里说明的是项目配置位置，不替代你对具体发布方式的许可确认。

SRK 数据来源链接也应保留；source 字段展示 RankLand 原榜单，meta.source 仍保留 GitHub 上游来源信息。

## 6. 常见问题

### 页面一直在加载

查看 Network 里的 site-data.json 是否 200，以及 Console 是否有 JSON 解析异常。先运行 npm run build-data，检查 public/data/site-data.json 是否存在；随后刷新。

### 修改数据页面没变

dev 只在启动时生成一次数据。手改输入后再次运行 npm run build-data，再刷新页面；涉及奖项清洗或分类规则时先运行 npm run clean-data。

### 修改类别被覆盖

完整构建会重算 categories。改 data-model.mjs 的 classifyContest，而不是只改输出 JSON。人工覆盖功能还未实现。

### 备注消失

检查是不是改了生成文件；检查同一赛果的 ID 是否因上游 user.id/文件路径变化而改变。同步只按相同 ID 保留 note。

### 某场比赛同步关键词不唯一

--contest 同时匹配标题与路径，使用更完整的文件名片段，或者运行交互模式选择序号。空匹配或多匹配会报错，不会任选一场。

### Git 克隆失败或很慢

确认终端能运行 git、访问 GitHub。脚本每次浅克隆，--list 也不会使用本地缓存。不要把同步网络失败归因于 Vite 或浏览器。

### 页面分页为空

清除 URL 的 page 或设为 1，再筛选。手动填写超大页数与负页数的边界处理尚不统一。

### 同名选手合并了

当前按姓名聚合，不支持身份消歧。见 DATA.md 的 playerId 扩展说明。

### rank 与 RankLand 页面某列数字不一致

当前 rank 读取 SRK 中 title 为 # 的系列，可能区别于原始行号或其他排名系列；不要直接用在郑大筛选结果中的顺序替代它。

## 7. 发布前检查

```bash
npm run format:check
npm test
npm run build
npm run preview
```

手动打开首页、比赛第二页、比赛详情、选手详情和一条 RankLand 来源；测试项目子路径、手机导航、刷新与后退。构建与数据校验不是浏览器端到端测试。
