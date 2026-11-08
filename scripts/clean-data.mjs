import { readFile, writeFile } from "node:fs/promises";
import {
  classifyContest,
  contestId,
  normalizeAward,
  ranklandUrl,
} from "./data-model.mjs";

const file = process.argv[2] ?? "data/srk-results.json";
const data = JSON.parse(await readFile(file, "utf8"));
for (const record of data.results ?? []) {
  [record.award, record.awardLevel] = normalizeAward(
    record.award,
    record.awardLevel,
  );
  record.categories = classifyContest(record);
  record.contestId = contestId(record);
  record.source = ranklandUrl(record);
  record.verified = true;
  record.note ??= "";
}
data.meta.cleanedAt = new Date().toISOString();
data.meta.awardMapping =
  "Gold/Silver/Bronze Award and Medalist variants normalized to 金奖/银奖/铜奖";
await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Cleaned ${data.results?.length ?? 0} records.`);
