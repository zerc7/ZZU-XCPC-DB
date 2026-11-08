import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { convertToStaticRanklist } from "@algoux/standard-ranklist-utils";
import {
  classifyContest,
  contestId,
  normalizeAward,
  ranklandUrl,
} from "./data-model.mjs";

const repoRoot = new URL("..", import.meta.url).pathname.replace(
  /^\/(\w:)/,
  "$1",
);
const repoUrl = "https://github.com/algoux/srk-collection.git";
const args = process.argv.slice(2);
const contestArg = args
  .find((value) => value.startsWith("--contest="))
  ?.slice("--contest=".length);
const listOnly = args.includes("--list");
const allContests = args.includes("--all");
const tempRoot = await mkdtemp(join(tmpdir(), "zzu-srk-"));

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0)
    throw new Error(`${command} failed (${result.status ?? result.error})`);
}

async function findSrkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? findSrkFiles(path) : [path];
    }),
  );
  return groups.flat().filter((path) => path.endsWith(".srk.json"));
}

function awardFor(staticDoc, rowIndex, seriesIndex) {
  const series = staticDoc.series?.[seriesIndex];
  const rowValue = staticDoc.rows[rowIndex]?.rankValues?.[seriesIndex];
  if (!series?.segments?.length || !rowValue)
    return { award: "未设奖项", awardLevel: "none" };
  const rank = rowValue.rank;
  if (rank === null || rank === undefined)
    return { award: "未获奖", awardLevel: "none" };
  const segment =
    rowValue.segmentIndex === null || rowValue.segmentIndex === undefined
      ? null
      : series.segments[rowValue.segmentIndex];
  if (!segment) return { award: "未获奖", awardLevel: "none", rank };
  const [award, awardLevel] = normalizeAward(segment.title, segment.style);
  return { award, awardLevel, rank };
}

function localized(value) {
  if (typeof value === "string") return value;
  return (
    value?.["zh-CN"] ??
    value?.["en-US"] ??
    value?.fallback ??
    value?.en ??
    "未命名队伍"
  );
}

try {
  const checkout = join(tempRoot, "collection");
  console.log("正在同步 algoux/srk-collection ...");
  run("git", ["clone", "--depth", "1", repoUrl, checkout], tempRoot);

  const officialDir = join(checkout, "official");
  const contests = [];
  for (const path of await findSrkFiles(officialDir)) {
    let doc;
    try {
      doc = JSON.parse(await readFile(path, "utf8"));
    } catch {
      continue;
    }
    const title =
      doc.contest?.title?.["zh-CN"] ??
      doc.contest?.title?.fallback ??
      doc.contest?.title?.en;
    if (!title || !Array.isArray(doc.rows)) continue;
    const rows = doc.rows.filter((row) =>
      /郑州大学|Zhengzhou University|\bZZU\b/i.test(
        row.user?.organization ?? "",
      ),
    );
    if (rows.length) {
      let staticDoc = doc;
      try {
        staticDoc = convertToStaticRanklist(doc);
      } catch (error) {
        console.warn(`奖项规则解析失败：${title} (${error.message})`);
      }
      const awardSeriesIndex =
        doc.series?.findIndex((series) => series.title === "#") ?? -1;
      contests.push({ path, doc, staticDoc, awardSeriesIndex, title, rows });
    }
  }
  contests.sort(
    (a, b) =>
      (b.doc.contest?.startAt ?? "").localeCompare(
        a.doc.contest?.startAt ?? "",
      ) || a.title.localeCompare(b.title, "zh-CN"),
  );

  if (!contests.length)
    throw new Error("没有找到 organization 匹配郑州大学的赛事。");
  if (listOnly) {
    contests.forEach((item, index) =>
      console.log(
        `${String(index + 1).padStart(3)}. ${item.doc.contest?.startAt?.slice(0, 10) ?? "日期未知"}  ${item.title} (${item.rows.length} 队)`,
      ),
    );
    process.exitCode = 0;
  } else {
    let selected;
    if (allContests) selected = contests;
    else if (contestArg) {
      selected = contests.filter(
        (item) =>
          item.title.toLowerCase().includes(contestArg.toLowerCase()) ||
          item.path.toLowerCase().includes(contestArg.toLowerCase()),
      );
      if (selected.length !== 1)
        throw new Error(
          `--contest 匹配到 ${selected.length} 场赛事；请传入更具体的标题或文件名片段。`,
        );
    } else {
      contests.forEach((item, index) =>
        console.log(
          `${String(index + 1).padStart(3)}. ${item.doc.contest?.startAt?.slice(0, 10) ?? "日期未知"}  ${item.title} (${item.rows.length} 队)`,
        ),
      );
      const rl = createInterface({ input: stdin, output: stdout });
      const answer = await rl.question("输入赛事序号（输入 a 同步全部）：");
      rl.close();
      selected =
        answer.trim().toLowerCase() === "a"
          ? contests
          : [contests[Number(answer) - 1]].filter(Boolean);
      if (!selected.length) throw new Error("无效赛事序号。");
    }

    const output = join(repoRoot, "data", "srk-results.json");
    const existing = JSON.parse(await readFile(output, "utf8"));
    const imported = existing.results ?? [];
    for (const item of selected) {
      const sourceFile = relative(checkout, item.path).split(sep).join("/");
      const eventRows = item.rows.map((row, index) => {
        const user = row.user ?? {};
        const year = Number(item.doc.contest?.startAt?.slice(0, 4));
        const key = `${sourceFile}:${user.id ?? index}`;
        const id = `srk-${createHash("sha1").update(key).digest("hex").slice(0, 16)}`;
        const members = (user.teamMembers ?? [])
          .filter((member) => member.role !== "coach")
          .map((member) => localized(member.name))
          .filter(Boolean);
        const rowIndex = item.doc.rows.indexOf(row);
        const award =
          item.awardSeriesIndex >= 0
            ? awardFor(item.staticDoc, rowIndex, item.awardSeriesIndex)
            : { award: "未设奖项", awardLevel: "none" };
        const previous = imported.find((record) => record.id === id);
        return {
          id,
          sourceFile,
          contestId: contestId({ sourceFile }),
          year: Number.isFinite(year) ? year : null,
          contest: item.title,
          date: item.doc.contest?.startAt?.slice(0, 10) ?? "",
          team: localized(user.name) || `未命名队伍 ${index + 1}`,
          members,
          award: award.award,
          awardLevel: award.awardLevel,
          rank: award.rank ?? null,
          categories: classifyContest({ sourceFile, contest: item.title }),
          source: ranklandUrl({ sourceFile }),
          verified: true,
          note: previous?.note ?? "",
        };
      });
      for (let i = imported.length - 1; i >= 0; i--)
        if (imported[i].sourceFile === sourceFile) imported.splice(i, 1);
      imported.push(...eventRows);
      console.log(`已更新：${item.title}（${eventRows.length} 队）`);
    }
    const payload = {
      meta: {
        version: 1,
        status: "synced",
        source: repoUrl,
        syncedAt: new Date().toISOString(),
      },
      results: imported,
    };
    await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(
      `写入 ${output}，共 ${imported.length} 条上游记录；奖项已按 SRK series 规则计算。`,
    );
  }
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
