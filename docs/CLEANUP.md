# 清理记录

本轮只清理废弃实现和重复状态，不重新设计页面或更改比赛/选手导航结构。

## 删除

- scripts/import-srk.mjs：早期导入原型，不计算奖项、不支持多语言字段，与当前同步脚本的 ID 算法不一致。
- data/results.json：旧版空数据集，没有页面或脚本继续读取。
- 页面中未使用的 React hooks、路由 hooks、Semantic UI 组件导入、PAGE_SIZE 和分页导入。
- 传给 Pager 但组件不使用的 page/onChange 回调。
- main.css 中旧导航、logo、pager 等已无调用的规则。
- package.json 中无用的 main、空 author/keywords；静态应用改为 private，配置文件统一采用 ESM。

## 保留

- OIerDB NG 导航、分页、响应式 hooks、全局主题及其 Less 模块仍在使用，保留来源注释。
- data/site-data.json 与 public/data/site-data.json 有不同职责，分别用于检查结果和 Vite 静态拷贝，未误删。
- SRK 原始赛果里的 team 字段是比赛结果所需信息，不是旧版队伍分类。
- 原始输入数据未删减；node_modules 和 dist 只加入忽略规则，不执行大范围目录清空。

## 可维护性调整

- 源码统一格式化，拆开长行，便于修改和审查；没有增加新的 UI 设计。
- 搜索词统一读取 URL，删除了多余的本地 state，避免后退时输入框与查询条件不一致。
- 比赛详情分页数统一引用 PAGE_SIZE 常量，和表格切片、序号及 Pager 保持一致。
- 增加 .gitignore、格式化与检查命令、生产预览和同步快捷命令。
- 正式构建加入输入数据校验；npm test 仍只代表基本数据校验。
- 增加完全重复的跨文件赛事快照检测；默认仅报告，明确生成规则后才合并。
- 修正 NOTICE 中上游提交号的笔误，并说明实际复用的组件与主题。

## 本轮未扩展的部分

没有实现后台、手工覆盖配置、选手身份消歧或离线同步缓存。人工来源/分类可能被清洗覆盖、手写非法页码的边界以及 fetch 错误恢复等问题，已在数据和开发文档明确说明。
