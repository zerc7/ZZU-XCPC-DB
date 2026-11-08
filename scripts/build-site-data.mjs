import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  classifyContest,
  contestId,
  normalizeAward,
  ranklandUrl,
} from "./data-model.mjs";

const paths = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["data/srk-results.json", "data/manual-results.json"];
const mergeData = JSON.parse(
  await readFile("data/contest-merges.json", "utf8").catch(
    () => '{"merges":[]}',
  ),
);
const mergedContestIds = new Map();
const canonicalFiles = new Map();
for (const merge of mergeData.merges ?? []) {
  for (const id of merge.duplicateContestIds) {
    mergedContestIds.set(id, merge.canonicalId);
  }
  canonicalFiles.set(merge.canonicalId, merge.canonicalSourceFile);
}
const sourceRows = [];
for (const path of paths) {
  const data = JSON.parse(await readFile(path, "utf8"));
  sourceRows.push(...(data.results ?? []));
}

const eventMap = new Map();
const performances = [];
for (const row of sourceRows) {
  const sourceId = row.contestId ?? contestId(row);
  const id = mergedContestIds.get(sourceId) ?? sourceId;
  const categories = row.categories ?? classifyContest(row);
  const source = row.sourceFile
    ? ranklandUrl(row)
    : row.source || ranklandUrl(row);
  let event = eventMap.get(id);
  if (!event) {
    event = {
      id,
      title: row.contest,
      year: row.year,
      date: row.date ?? "",
      categories: new Set(),
      source: canonicalFiles.has(id)
        ? ranklandUrl({ sourceFile: canonicalFiles.get(id) })
        : source,
      notes: new Set(),
      athletes: new Set(),
      entries: [],
      awards: { gold: 0, silver: 0, bronze: 0 },
    };
    eventMap.set(id, event);
  }
  categories.forEach((category) => event.categories.add(category));
  if (row.note?.trim()) event.notes.add(row.note.trim());
  const [award, awardLevel] = normalizeAward(row.award, row.awardLevel);
  const entryKey = JSON.stringify({
    team: row.team ?? "",
    members: row.members ?? [],
    award,
    awardLevel,
    rank: row.rank ?? null,
  });
  if (canonicalFiles.has(id)) {
    event.seenEntries ??= new Set();
    if (event.seenEntries.has(entryKey)) continue;
    event.seenEntries.add(entryKey);
  }
  event.entries.push({
    team: row.team ?? "",
    members: row.members ?? [],
    award,
    awardLevel,
    rank: row.rank ?? null,
  });
  if (["gold", "silver", "bronze"].includes(awardLevel))
    event.awards[awardLevel]++;
  for (const name of row.members ?? []) {
    if (!name || typeof name !== "string") continue;
    event.athletes.add(name);
    performances.push({
      contestId: id,
      contest: row.contest,
      year: row.year,
      date: row.date ?? "",
      categories,
      person: name,
      team: row.team ?? "",
      award,
      awardLevel,
      rank: row.rank ?? null,
      note: row.note ?? "",
      source,
    });
  }
}

const contests = [...eventMap.values()]
  .map((event) => ({
    id: event.id,
    title: event.title,
    year: event.year,
    date: event.date,
    categories: [...event.categories].sort(),
    source: event.source,
    note: [...event.notes].join(" / "),
    athleteCount: event.athletes.size,
    awards: event.awards,
    entries: event.entries,
  }))
  .sort(
    (a, b) =>
      (b.date || "").localeCompare(a.date || "") ||
      a.title.localeCompare(b.title, "zh-CN"),
  );

const playerMap = new Map();
for (const performance of performances) {
  let player = playerMap.get(performance.person);
  if (!player) {
    player = { name: performance.person, performances: [] };
    playerMap.set(performance.person, player);
  }
  player.performances.push(performance);
}
const players = [...playerMap.values()]
  .map((player) => ({
    ...player,
    performances: player.performances.sort((a, b) =>
      (b.date || "").localeCompare(a.date || ""),
    ),
    medals: player.performances.filter((item) =>
      ["gold", "silver", "bronze"].includes(item.awardLevel),
    ).length,
  }))
  .sort(
    (a, b) =>
      b.performances.length - a.performances.length ||
      a.name.localeCompare(b.name, "zh-CN"),
  );

const output = `${JSON.stringify({ meta: { version: 1, generatedAt: new Date().toISOString() }, contests, players }, null, 2)}\n`;
await writeFile("data/site-data.json", output);
await mkdir("public/data", { recursive: true });
await writeFile("public/data/site-data.json", output);
console.log(
  `Generated ${contests.length} contests and ${players.length} players.`,
);
