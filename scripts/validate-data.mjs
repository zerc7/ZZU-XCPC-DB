import { readFile } from "node:fs/promises";

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["data/srk-results.json", "data/manual-results.json"];
const errors = [];
const ids = new Set();
const required = [
  "id",
  "year",
  "contest",
  "team",
  "members",
  "award",
  "awardLevel",
  "source",
  "verified",
];

let total = 0;
for (const filename of files) {
  const data = JSON.parse(await readFile(filename, "utf8"));
  if (!Array.isArray(data.results))
    errors.push(`${filename}: results must be an array`);
  for (const [index, result] of (data.results ?? []).entries()) {
    total++;
    const label = `results[${index}]`;
    for (const key of required) {
      if (
        result[key] === undefined ||
        result[key] === null ||
        result[key] === ""
      )
        errors.push(`${label}.${key} is required`);
    }
    if (typeof result.id === "string") {
      if (ids.has(result.id))
        errors.push(`${label}.id duplicates ${result.id}`);
      ids.add(result.id);
    }
    if (
      !Number.isInteger(result.year) ||
      result.year < 1970 ||
      result.year > new Date().getFullYear() + 1
    )
      errors.push(`${label}.year must be a valid year`);
    if (
      !Array.isArray(result.members) ||
      result.members.some(
        (member) => typeof member !== "string" || !member.trim(),
      )
    )
      errors.push(
        `${label}.members must be an array; any provided names must be non-empty`,
      );
    if (result.date && !/^\d{4}-\d{2}-\d{2}$/.test(result.date))
      errors.push(`${label}.date must use YYYY-MM-DD`);
    if (typeof result.source === "string" && !/^https:\/\//.test(result.source))
      errors.push(`${label}.source must be an https URL`);
    if (typeof result.verified !== "boolean")
      errors.push(`${label}.verified must be boolean`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${total} result records.`);
}
