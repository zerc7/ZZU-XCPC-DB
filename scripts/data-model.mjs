import { createHash } from "node:crypto";

const awardByStyle = {
  gold: ["金奖", "gold"],
  silver: ["银奖", "silver"],
  bronze: ["铜奖", "bronze"],
};

export function normalizeAward(award, level) {
  const style = String(level ?? "")
    .trim()
    .toLowerCase();
  if (awardByStyle[style]) return awardByStyle[style];
  const key = String(award ?? "")
    .trim()
    .toLowerCase();
  for (const [needle, result] of Object.entries({
    gold: awardByStyle.gold,
    silver: awardByStyle.silver,
    bronze: awardByStyle.bronze,
    一等奖: awardByStyle.gold,
    二等奖: awardByStyle.silver,
    三等奖: awardByStyle.bronze,
  })) {
    if (key.includes(needle)) return result;
  }
  return [award || "未设奖项", level || "none"];
}

export function classifyContest(record) {
  const value =
    `${record.sourceFile ?? ""} ${record.contest ?? ""}`.toLowerCase();
  const types = [];
  if (value.includes("icpc") || value.includes("acm")) types.push("ICPC");
  if (value.includes("ccpc")) types.push("CCPC");
  if (value.includes("provincial") || /省赛|省大学生/.test(value))
    types.push("省赛");
  if (
    value.includes("online") ||
    value.includes("preliminary") ||
    /网络|线上/.test(value)
  )
    types.push("线上赛");
  if (value.includes("final") || /总决赛|决赛/.test(value)) types.push("决赛");
  if (/女生|women/.test(value)) types.push("女子赛");
  if (/invitational|邀请赛/.test(value)) types.push("邀请赛");
  return types.length ? [...new Set(types)] : ["其他"];
}

export function contestId(record) {
  return createHash("sha1")
    .update(record.sourceFile ?? `${record.contest}:${record.date}`)
    .digest("hex")
    .slice(0, 16);
}

export function ranklandUrl(record) {
  const key =
    (record.sourceFile ?? "")
      .split("/")
      .pop()
      ?.replace(/\.srk\.json$/, "") || "";
  return `https://rl.algoux.cn/collection/official?rankId=${encodeURIComponent(key)}`;
}
