# 二次开发指南

## 1. 运行方式

本项目是静态前端，没有数据库、服务端 API、后台登录或在线写入。脚本在本地或 CI 中把数据整理成 JSON，浏览器加载后渲染和筛选。

```text
GitHub srk-collection
        ↓ npm run sync
data/srk-results.json + data/manual-results.json
        ↓ clean-data / validate-data / build-site-data
data/site-data.json + public/data/site-data.json
        ↓ Vite build
dist/ → GitHub Pages
```

前端修改与数据修改是两条流程。Vite 会热更新源码，但不会自动执行数据生成脚本。

## 2. 目录与修改入口

```text
index.html                     React 挂载点 #root、标题和描述
vite.config.js                 Vite 配置，base 为 ./
src/
  main.jsx                     数据加载、公共布局、HashRouter 路由
  main.css                     本站小范围业务样式
  oierdb.less                  OIerDB NG 全局主题与暗色适配
  pages/
    ContestList.jsx            比赛搜索、年份/类别筛选、分页表格
    ContestDetail.jsx          单场比赛的队伍、队员、奖项、排名
    Players.jsx                姓名搜索与选手分页表格
    PlayerDetail.jsx           单个选手的参赛历史
  components/
    Header.tsx                 上游导航及移动端侧边栏改编
    Header.module.less         导航响应式样式
    Pagination.tsx             上游分页组件改编
    Pagination.module.less     分页容器样式
  utils/
    usePartialSearchParams.ts  只更新部分 URL 查询参数
    useScreenWidthWithin.ts    导航/分页的屏幕宽度判断
scripts/
  sync-srk.mjs                 克隆上游、选赛事、解析奖项、写输入数据
  data-model.mjs               奖项归一、类别规则、赛事 ID、RankLand URL
  clean-data.mjs               就地清洗输入数据
  validate-data.mjs            输入数据基本校验
  build-site-data.mjs          生成 contests 和 players
data/                          输入数据及一份可检查的生成结果
public/data/                   Vite 自动拷贝的生成结果，不手改
docs/                          开发、数据、部署文档
.github/workflows/pages.yml    GitHub Pages 工作流
```

JSX 用于业务页面；TSX/TS 用于保留的上游组件和工具。Vite 能编译它们，但没有单独的 TypeScript 类型检查任务；构建成功不等于执行过 `tsc`。

## 3. 页面与 URL

| 地址后缀             | 页面          | 参数                                                |
| -------------------- | ------------- | --------------------------------------------------- |
| `/#/`、`/#/contests` | ContestList   | q、category、year、page                             |
| `/#/contests/:id`    | ContestDetail | 路由 ID、page                                       |
| `/#/awards`          | Awards        | q、重复的 category、categoryMode、year、award、page |
| `/#/players`         | Players       | q、page                                             |
| `/#/players/:name`   | PlayerDetail  | URL 编码的姓名                                      |

例如 `/#/contests?category=ICPC&year=2024&page=2`。查询参数放在 `#` 后的路由内，刷新和分享可以保留筛选。

HashRouter 不要求 GitHub Pages 配置服务端重写。只有一个 HTML 入口，但四个页面有各自的路由和组件，不是一个长页面。

选手链接用 `encodeURIComponent(name)` 编码；`useParams()` 获取参数。目前姓名同时承担选手标识，参见数据文档的同名限制。

## 4. UI 的修改原则

当前使用 Semantic UI React 组件及 Semantic UI CSS；导航、分页、响应式工具及全局 Less 直接改编自 OIerDB NG，保留上游注释和 NOTICE。

`main.jsx` 中依次加载 Semantic UI CSS、`oierdb.less`、`main.css`。业务修改优先放最后一层；不要为改一个表格覆盖所有 `.ui.table`。

- 改表头、列宽和内容：对应页面里的 `Table`。
- 改导航：`Header.tsx` 的 `headerButtons`。
- 改分页外观：`Pagination.tsx` 和其 Less 文件。
- 改品牌、页脚：`Header.tsx`、`main.jsx` 的 Layout。
- 改静态浏览器标题与 description：`index.html`。

奖项汇总页在 URL 中保存多个 `category` 参数。`categoryMode=any` 表示类别取并集；`categoryMode=all` 表示取交集。实现位于 `src/pages/Awards.jsx`。

保留 `oierdb.less` 的主题变量、暗色规则和来源注释。响应式/暗色选择器不能仅凭桌面截图判断为无用代码。

## 5. 常见修改

### 5.1 修改分页数量

比赛列表和选手列表的 `PAGE_SIZE` 是 20，比赛详情是 30。修改对应页面的常量即可，表格切片、序号和传给 Pager 的 perPage 都引用它。

```jsx
<Pager total={filtered.length} perPage={PAGE_SIZE} />
```

分页组件自己读写 URL 的 page 参数，不接收 page/onChange 回调。筛选条件变化时把 page 重置为 1，避免落到筛选后的空页。

选手详情当前显示全部历史，尚未分页。若需要，参考比赛详情的查询参数、切片和 Pager 三部分，并保持同一个每页数量。

### 5.2 给赛果增加一列备注

比赛详情现在显示合并后的比赛备注。若要每个队伍单独显示：

1. 在 build-site-data.mjs 的 `event.entries.push()` 加入 `note: row.note ?? ''`；
2. 执行 `npm run build-data`，确认 `contests[].entries[]` 有 note；
3. 在 ContestDetail.jsx 加一个 Table.HeaderCell 和对应 Table.Cell；
4. 检查空备注、长备注和手机布局。

不要直接编辑生成 JSON，它会被下一次构建覆盖。

### 5.3 调整赛事分类

编辑 data-model.mjs 的 `classifyContest()`，然后运行 clean-data 和 build-data。下拉项从数据自动生成，不需要硬编码新选项。

数据的 categories 是多值数组，当前类别筛选下拉一次选一个值。如要多选：给 Dropdown 加 multiple，用重复查询参数和 getAll 存储，再明确使用“任意匹配”还是“全部匹配”的筛选逻辑。

### 5.4 新增页面或字段

1. 在 src/pages 新建组件，在 main.jsx 注册 Route；
2. 需要顶部入口时，在 Header.tsx 的 headerButtons 增加菜单；
3. 站内跳转使用 Link，不写相对 HTML 文件路径；
4. 需要新字段时，按“输入数据 → 生成脚本 → 输出字段 → 页面”逐层修改。

### 5.5 改首页或动态标题

`/` 当前也渲染比赛列表，可在 main.jsx 更换对应 Route 的 element。页面没有动态设置浏览器标题，可自行通过 effect 更新 document.title。

## 6. 开发检查

```bash
npm ci
npm run dev
# 编辑源码或数据
npm run format
npm run format:check
npm test
npm run build
npm run preview
```

dev 当前绑定 0.0.0.0，便于局域网设备预览。仅希望本机访问时，移除命令里的 `--host 0.0.0.0`。

手工检查：类别/年份/关键词筛选、翻页、浏览器后退、比赛与选手跳转、中文姓名、来源链接、手机导航、深链接刷新。

npm test 只做数据基本校验；构建只检查可打包性。目前没有浏览器自动化、单元测试或完整类型检查。

## 7. 已知边界

- 一次 fetch 加载全部站点数据，尚未按页面拆分 JSON。
- 加载失败没有完整的错误恢复界面，需要查浏览器 Network/Console。
- 尚无通配 404 页面；无效比赛或姓名详情显示“不存在”。
- 手写负数/超大 page 时，表格切片与 Pager 的边界处理还不完全一致；正常点分页不依赖这种地址。
- 构建会就地清洗输入文件，执行前建议提交或备份手工修改。
- 同步只更新输入数据，不自动重建前端 JSON。

这些是后续可扩展工作，不是当前已经完成的功能。
