import { createHash } from "node:crypto";

const awardByStyle = {
  gold: ["金奖", "gold"],
  silver: ["银奖", "silver"],
  bronze: ["铜奖", "bronze"],
};

const regionalCityNames = {
  beijing: "北京",
  chengdu: "成都",
  hangzhou: "杭州",
  jiaozuo: "焦作",
  jinan: "济南",
  kunming: "昆明",
  nanchang: "南昌",
  nanjing: "南京",
  nanning: "南宁",
  qingdao: "青岛",
  shanghai: "上海",
  shenyang: "沈阳",
  wuhan: "武汉",
  xian: "西安",
  xuzhou: "徐州",
  yinchuan: "银川",
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
  const isRegional =
    /\bregional(?:s)?\b|区域赛/.test(value) ||
    /亚洲区域赛|亚洲区域/.test(value);
  if (isRegional) types.push("区域赛");
  if (/asia\s+regionals?|亚洲区域赛|亚洲区域/.test(value))
    types.push("亚洲区域赛");

  const chineseRegionalCity = record.contest?.match(
    /(?:亚洲)?区域赛\s*[（(]?\s*([\u4e00-\u9fff]{2,4}?)(?:站|[）)]|\s|$)/,
  );
  const englishRegionalCity = record.contest?.match(
    /\bAsia\s+([A-Z][A-Za-z-]+)\s+Regional(?:s)?\b|\bRegional(?:s)?(?:\s+Programming)?\s+Contest\s*[（(]\s*([A-Z][A-Za-z-]+)/i,
  );
  const rawRegionalCity =
    chineseRegionalCity?.[1] ||
    englishRegionalCity?.[1] ||
    englishRegionalCity?.[2];
  const regionalCity =
    regionalCityNames[rawRegionalCity?.toLowerCase().replace(/[^a-z]/g, "")] ||
    rawRegionalCity;
  if (regionalCity) types.push(`区域赛-${regionalCity}站`);

  if (value.includes("provincial") || /省赛|省大学生/.test(value))
    types.push("省赛");
  const isOnline =
    value.includes("online") ||
    value.includes("preliminary") ||
    /网络|线上/.test(value);
  if (isOnline) types.push("线上赛");
  if (isRegional && isOnline) types.push("区域赛线上赛");
  if (/preliminary|预选赛/.test(value)) types.push("预选赛");
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
