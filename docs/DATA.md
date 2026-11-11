# 数据模型与维护

## 1. 哪些文件应该手动维护

| 文件                       | 身份               | 修改方式                |
| -------------------------- | ------------------ | ----------------------- |
| data/srk-results.json      | 上游同步记录       | 同步脚本刷新；可补 note |
| data/manual-results.json   | 额外人工记录       | 手动编辑，独立于同步    |
| data/site-data.json        | 生成结果的工作副本 | 只查看，不手改          |
| public/data/site-data.json | Vite 静态数据输入  | 自动生成，已忽略提交    |
| dist/data/site-data.json   | 部署产物           | Vite 自动拷贝，不手改   |

前端只读取 site-data.json，不直接读取两个原始数据文件。两个生成副本保留的原因：data/ 便于比较结果，public/ 是 Vite 约定的静态资源入口。

## 2. 输入记录字段

两个输入文件形如 `{ "meta": { "version": 1 }, "results": [] }`。results 的每条记录对应一个赛事里的一个队伍赛果。

| 字段       | 类型           | 说明                                              |
| ---------- | -------------- | ------------------------------------------------- |
| id         | string         | 赛果稳定 ID；两个文件之间也不能重复               |
| sourceFile | string，可选   | 上游相对路径，例如 official/ccpc/.../xxx.srk.json |
| contestId  | string，可选   | 赛事聚合 ID；缺省在生成时计算，清洗时重算         |
| year       | integer        | 年份                                              |
| contest    | string         | 赛事名称                                          |
| date       | string，可选   | YYYY-MM-DD，空字符串表示没有日期                  |
| categories | string[]       | 赛事类别，多值；清洗时自动推断                    |
| team       | string         | 队伍名称，比赛详情显示                            |
| members    | string[]       | 队员姓名，不含教练；空数组表示未知                |
| award      | string         | 展示奖项，例如金奖、银奖、铜奖、未获奖            |
| awardLevel | string         | gold / silver / bronze / none 等                  |
| rank       | number 或 null | SRK 奖项系列中的排名，不一定是榜单原始行号        |
| source     | string         | 公开来源链接；上游记录生成 RankLand URL           |
| verified   | boolean        | 同步默认 true，清洗也设为 true                    |
| note       | string，可空   | 历史背景备注                                      |

字段模板仅演示结构，不代表真实赛果。不要直接把例子提交为历史成绩：

```json
{
  "id": "manual-example-001",
  "year": 2024,
  "contest": "示例比赛（非真实记录）",
  "date": "2024-01-01",
  "team": "示例队伍",
  "members": ["示例选手甲", "示例选手乙"],
  "award": "银奖",
  "awardLevel": "silver",
  "rank": null,
  "source": "https://example.org/evidence",
  "verified": true,
  "note": "此处记录经资料支持的历史背景。"
}
```

重要：当前完整构建会调用 clean-data，它会重写上述示例的 source。若人工比赛没有 sourceFile，不能依赖完整构建保留这个外部来源；见第 7 节。

## 3. GitHub 同步

```bash
npm run sync -- --list
npm run sync -- --contest=ccpc2024zhengzhou
npm run sync
npm run sync -- --all
```

实现位置：scripts/sync-srk.mjs。

1. 在系统临时目录新建工作区，用 git clone --depth 1 获取上游默认分支；
2. 递归读取 official/ 下的 .srk.json；无效 JSON 当前跳过；
3. 根据 organization 匹配“郑州大学”“Zhengzhou University”或独立单词 ZZU；
4. 对完整榜单计算排名/奖项，之后才提取郑大行；
5. 按标题或文件路径关键词选择赛事；--contest 必须唯一匹配；
6. 按 sourceFile 替换选中赛事的所有旧记录，保留其他赛事；
7. 相同赛果 ID 的 note 保留，其余同步字段重新生成；
8. finally 清理临时检出目录。

即使只列目录或只选一场，也会重新克隆并扫描，当前没有增量缓存或离线导入接口。移除了旧 import-srk.mjs，因为它不计算奖项、ID 也与同步脚本不一致。

同步不会上传 GitHub、提交 Git 或发布网站，也不会读取人工文件进行覆盖。全量同步也不会主动删除上游已不再出现的历史赛事残留。

### ID 的稳定性

- 赛果 ID：`srk-` + SHA-1(`sourceFile:user.id`) 的前 16 位；没有 user.id 时退回当前筛出行的序号。
- 比赛 ID：SHA-1(sourceFile) 前 16 位；无 sourceFile 时用赛事名和日期生成。

源文件迁移或上游 user.id 改变可能改变 ID，导致旧备注无法自动匹配。同步前备份输入数据，必要时按源文件和队伍手动迁移备注。

## 4. 奖项计算和清洗

同步使用 @algoux/standard-ranklist-utils 的 convertToStaticRanklist，在完整榜单上生成 rankValues，并读取 title 为 # 的系列。

选择该系列的 rankValues 后，通过 segmentIndex 取得上游奖项分段；正式资格、并列、比例或固定人数等由官方工具库处理，不手写人数比例推断。

| 上游表述或 style                                 | 输出 award | 输出 awardLevel |
| ------------------------------------------------ | ---------- | --------------- |
| gold / Gold Award / Gold Medalist / 一等奖       | 金奖       | gold            |
| silver / Silver Award / Silver Medalist / 二等奖 | 银奖       | silver          |
| bronze / Bronze Award / Bronze Medalist / 三等奖 | 铜奖       | bronze          |
| 不在分段内，或排名为空                           | 未获奖     | none            |
| 无可用 # 系列/分段                               | 未设奖项   | none            |

normalizeAward 优先使用 style，其次匹配奖项文本；未知奖项原样保留。修改映射在 scripts/data-model.mjs，不要逐条改生成数据。

解析异常目前会警告并继续，不会把 verified 自动变为 false。因此 true 是按项目约定导入时的默认状态，不代表独立人工审核。未设奖项也不等同于确定没有任何奖项。

## 5. 多类别

classifyContest 根据 sourceFile 和 contest 文本推断，多条规则可同时命中：

- ICPC/ACM → ICPC；CCPC → CCPC；
- regional、区域赛 → 区域赛；Asia regionals、亚洲区域 → 亚洲区域赛；能从中文区域赛站名或英文亚洲分站标题识别地点时，额外生成“区域赛-武汉站”一类的地点标签；
- 区域赛同时属于线上赛时增加“区域赛线上赛”；预选赛单独标记为“预选赛”；
- provincial、省赛、省大学生 → 省赛；online、preliminary、网络、线上 → 线上赛；
- final、总决赛、决赛 → 决赛；女生、women → 女子赛；invitational、邀请赛 → 邀请赛；
- 完全未命中 → 其他。

类别规则不会只选一个结果。例如线上的 ICPC 亚洲区域赛可同时拥有 ICPC、区域赛、亚洲区域赛、线上赛和区域赛线上赛类别。地点提取依赖比赛标题格式，无法可靠识别的地点不会生成地点标签。这些规则是启发式分类，不是完整的官方赛事分类表。

目前 clean-data 无条件重算 categories，直接改 JSON 数组会在完整构建时被覆盖。持久调整应修改 classifyContest；如要做赛事级手工分类，可后续新增独立 overrides 文件并在生成阶段应用。项目当前尚未实现 overrides 功能。

## 6. 备注与人工补录

### 已有比赛的历史意义

在 srk-results.json 的相关记录添加 note。相同 ID 再同步时保留；同赛事的不同 note 会去重后用 `/` 合并为比赛详情下方的说明。备注目前不会逐队显示，若要逐队展示参见开发指南。

### 缺失比赛或队伍

在 manual-results.json 的 results 数组追加记录，id 使用 manual- 前缀并保证唯一，不要把同一赛果从上游文件复制一遍再补备注：生成器不会按队伍去重，两条都会计数。

同步不修改 manual-results，但 clean-data 会修改它；“人工数据独立”只表示不被同步替换，不代表后续所有字段完全不变。

## 7. 清洗脚本的写入边界

clean-data.mjs 会就地修改两个输入文件：

- 归一 award/awardLevel；
- 重算 categories 和 contestId；
- 以 sourceFile 的 basename 构建 `https://rl.algoux.cn/collection/official?rankId={key}`；
- 将 verified 设为 true，缺失的 note 补为空字符串；
- 更新 meta.cleanedAt。

现有限制：没有 sourceFile 的人工记录会生成空 key 的 RankLand URL；自定义 source、categories、contestId 会被清洗覆盖。当前如果人工来源不是 SRK，应先改清洗策略再使用完整构建，不要以为表面上符合 HTTPS 校验就意味着来源有效。

建议的扩展位置：在 clean-data 按 sourceFile 是否存在分支，仅对 SRK 记录重算 RankLand 来源，对人工记录保留合法 URL。若增加显式覆盖机制，还应在 build-site-data 中保持相同优先级，避免清洗和生成互相冲突。

当前脚本从文件名推导 RankLand key，没有远程验证每个 key，也未合并不同榜单文件代表的同一现实赛事。

## 8. 输出模型和统计口径

build-site-data.mjs 输出 `{ meta, contests, players }`，并写入两个生成副本。

### contests[]

- id、title、year、date、categories、source、note；
- athleteCount：同一赛事按队员姓名去重人数；
- awards：gold/silver/bronze，各计获奖队伍条数，不是获奖人数；
- entries：每条包含 team、members、award、awardLevel、rank。

按 contestId 合并赛事；categories 取并集，note 去重合并；日期、标题、来源采用遇到的第一条记录。输入顺序为先 SRK 后 manual，人工记录不会自动覆盖已有元数据。

### players[]

- name：姓名；
- performances：对应个人的比赛记录，含比赛、队伍、奖项、排名、来源和备注；
- medals：金/银/铜个人参赛记录数，不是唯一奖项等级数量。

每条队伍记录展开为队员个人记录；按日期降序排序。选手列表按参赛记录数降序，同分按中文姓名排序。

姓名是当前的合并键：同名会误合并，异体字或拼写变化会拆成不同人；同一赛事重复记录也会重复累计成绩。若要解决，应新增 playerId、别名/身份映射并修改路由及生成器，而不是只改 UI。

## 9. 合并不同 ID 的同一场比赛

不同 SRK 文件可能重复收录同一场完整榜单，造成来源路径和 contestId 不同。脚本使用 `data/contest-merges.json` 保存合并规则，不修改 SRK 记录自己的 ID 或 sourceFile。

先预览候选：

```bash
node scripts/merge-duplicate-contests.mjs
```

默认只报告、不写文件。自动合并的条件是：比赛名称、日期完全相同；至少两个不同 sourceFile；整组郑大赛果指纹完全一致（队伍、队员、奖项、awardLevel、排名）。

确认报告后保存并重建：

```bash
npm run merge-contests
npm run build-data
```

赛事 ID 映射到按文件路径排序后的代表榜单；完全相同的队伍赛果会去重，类别取并集，RankLand 来源采用代表文件。原始输入仍保留各个来源。`npm run build` 自动重新生成规则，因此同步后重建即可。

只有标题和日期相同、但赛果不完全一致的记录不会自动合并。脚本不猜测部分榜单是否属于同场赛事，以免误合并。

## 10. 校验覆盖范围

npm test 检查必填字段、跨输入文件 ID 重复、年份、members 字符串、日期外形、HTTPS 前缀和 verified 布尔值。

它不检查真实奖项、重复队伍、同名身份、来源能否访问、完整日历合法性，也不证明所有上游赛事都已覆盖。生产构建在清洗后执行该校验，再生成站点数据。
