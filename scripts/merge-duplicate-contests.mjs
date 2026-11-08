import { readFile, writeFile } from "node:fs/promises";
import { contestId, ranklandUrl } from "./data-model.mjs";

const inputFiles = ["data/srk-results.json", "data/manual-results.json"];
const outputFile = "data/contest-merges.json";
const write = process.argv.includes("--write");

function rowSignature(row) {
  return JSON.stringify({
    team: row.team ?? "",
    members: row.members ?? [],
    award: row.award ?? "",
    awardLevel: row.awardLevel ?? "",
    rank: row.rank ?? null,
  });
}

function contestKey(row) {
  return JSON.stringify([String(row.contest ?? "").trim(), row.date ?? ""]);
}

const rows = [];
for (const file of inputFiles) {
  const data = JSON.parse(await readFile(file, "utf8"));
  rows.push(...(data.results ?? []));
}

const contests = new Map();
for (const row of rows) {
  if (!row.sourceFile) continue;
  const key = contestKey(row);
  const files = contests.get(key) ?? new Map();
  const records = files.get(row.sourceFile) ?? [];
  records.push(row);
  files.set(row.sourceFile, records);
  contests.set(key, files);
}

const merges = [];
for (const [key, files] of contests) {
  const signatures = new Map();
  for (const [sourceFile, records] of files) {
    const signature = JSON.stringify(records.map(rowSignature).sort());
    const matchingFiles = signatures.get(signature) ?? [];
    matchingFiles.push({ sourceFile, records });
    signatures.set(signature, matchingFiles);
  }

  for (const matchingFiles of signatures.values()) {
    if (matchingFiles.length < 2) continue;
    matchingFiles.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
    const canonicalFile = matchingFiles[0].sourceFile;
    const representative = matchingFiles[0].records[0];
    merges.push({
      eventKey: key,
      canonicalId: contestId({ sourceFile: canonicalFile }),
      canonicalSourceFile: canonicalFile,
      duplicateSourceFiles: matchingFiles.map((item) => item.sourceFile),
      duplicateContestIds: matchingFiles.map((item) =>
        contestId({ sourceFile: item.sourceFile }),
      ),
      rowCount: matchingFiles[0].records.length,
      title: representative.contest,
      date: representative.date ?? "",
    });
  }
}

merges.sort((a, b) => a.eventKey.localeCompare(b.eventKey));
for (const merge of merges) {
  console.log(
    `${merge.title} (${merge.date}): ${merge.duplicateSourceFiles.length} identical snapshots, ${merge.rowCount} rows`,
  );
  console.log(
    `  canonical source: ${ranklandUrl({ sourceFile: merge.canonicalSourceFile })}`,
  );
}

if (write) {
  await writeFile(
    outputFile,
    `${JSON.stringify({ version: 1, merges }, null, 2)}\n`,
  );
  console.log(`Wrote ${merges.length} merge rules to ${outputFile}.`);
} else {
  console.log(
    `Found ${merges.length} mergeable groups. Re-run with --write to save rules.`,
  );
}
