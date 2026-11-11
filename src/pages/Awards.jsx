// Adapted from OIerDB NG school/contest UI (AGPL-3.0); see NOTICE.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Dropdown, Header, Table } from "semantic-ui-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import Pager from "../components/Pagination";

const PAGE_SIZE = 30;
const MEDALS = [
  { level: "gold", label: "金牌", color: "--app-award-gold" },
  { level: "silver", label: "银牌", color: "--app-award-silver" },
  { level: "bronze", label: "铜牌", color: "--app-award-bronze" },
];

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function Awards({ data }) {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const selectedCategories = params.getAll("category");
  const categoryMode = params.get("categoryMode") === "all" ? "all" : "any";
  const queryParam = params.get("q") || "";
  const [query, setQuery] = useState(queryParam);
  const isComposing = useRef(false);

  useEffect(() => setQuery(queryParam), [queryParam]);

  const rows = useMemo(
    () =>
      data.contests.flatMap((contest) =>
        contest.entries.map((entry, index) => ({
          ...entry,
          id: `${contest.id}-${index}`,
          contestId: contest.id,
          contest: contest.title,
          date: contest.date,
          categories: contest.categories,
          source: contest.source,
        })),
      ),
    [data.contests],
  );
  const categories = [...new Set(rows.flatMap((row) => row.categories))].sort();
  const years = [...new Set(rows.map((row) => row.date?.slice(0, 4)))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  const awards = [...new Set(rows.map((row) => row.award))].sort();
  const year = params.get("year") || "";
  const award = params.get("award") || "";

  const medalTrend = useMemo(() => {
    const counts = new Map();
    rows.forEach((row) => {
      const matchesCategories =
        selectedCategories.length === 0 ||
        (categoryMode === "all"
          ? selectedCategories.every((category) =>
              row.categories.includes(category),
            )
          : selectedCategories.some((category) =>
              row.categories.includes(category),
            ));
      const rowYear = row.date?.slice(0, 4);
      if (!matchesCategories || !/^\d{4}$/.test(rowYear)) return;

      const medalCounts = counts.get(rowYear) || {
        gold: 0,
        silver: 0,
        bronze: 0,
      };
      if (Object.hasOwn(medalCounts, row.awardLevel)) {
        medalCounts[row.awardLevel] += 1;
        counts.set(rowYear, medalCounts);
      }
    });

    const labels = [...counts.keys()].sort();
    return {
      labels,
      datasets: MEDALS.map(({ level, label, color }) => ({
        label,
        data: labels.map((item) => counts.get(item)[level]),
        borderColor: getComputedStyle(document.documentElement)
          .getPropertyValue(color)
          .trim(),
        backgroundColor: getComputedStyle(document.documentElement)
          .getPropertyValue(color)
          .trim(),
        tension: 0.25,
      })),
    };
  }, [categoryMode, rows, selectedCategories]);

  const filtered = rows.filter((row) => {
    const matchesCategories =
      selectedCategories.length === 0 ||
      (categoryMode === "all"
        ? selectedCategories.every((category) =>
            row.categories.includes(category),
          )
        : selectedCategories.some((category) =>
            row.categories.includes(category),
          ));
    const searchable = [row.contest, row.team, ...row.members]
      .join(" ")
      .toLowerCase();
    return (
      matchesCategories &&
      (!query || searchable.includes(query.toLowerCase())) &&
      (!year || row.date?.startsWith(year)) &&
      (!award || row.award === award)
    );
  });

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (Array.isArray(value)) {
      next.delete(key);
      value.forEach((item) => next.append(key, item));
    } else if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== "page") next.set("page", "1");
    setParams(next);
  };

  return (
    <>
      <Header as="h2" dividing>
        获奖信息
      </Header>
      <section className="award-trend" aria-label="年度奖牌趋势">
        <Header as="h3">年度奖牌趋势</Header>
        <div className="award-trend-chart">
          {medalTrend.labels.length ? (
            <Line
              data={medalTrend}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                  legend: { position: "top" },
                  tooltip: { mode: "index", intersect: false },
                },
                scales: {
                  x: {
                    title: { display: true, text: "年份" },
                    grid: { color: "rgba(128, 128, 128, 0.15)" },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    title: { display: true, text: "获奖队伍数" },
                    grid: { color: "rgba(128, 128, 128, 0.15)" },
                  },
                },
              }}
            />
          ) : (
            <p className="empty">当前类别下没有可统计的奖牌赛果。</p>
          )}
        </div>
      </section>
      <div className="list-tools">
        <input
          className="search-input"
          placeholder="搜索比赛、队伍或选手"
          value={query}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onCompositionEnd={(event) => {
            isComposing.current = false;
            setQuery(event.currentTarget.value);
            setParam("q", event.currentTarget.value);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!isComposing.current) setParam("q", event.target.value);
          }}
        />
        <Dropdown
          multiple
          selection
          search
          clearable
          placeholder="全部类别"
          value={selectedCategories}
          options={categories.map((item) => ({
            key: item,
            text: item,
            value: item,
          }))}
          onChange={(_, dropdown) => setParam("category", dropdown.value || [])}
        />
        <Button.Group size="small" aria-label="类别筛选关系">
          <Button
            active={categoryMode === "any"}
            aria-pressed={categoryMode === "any"}
            title="选择任意一个类别即可匹配（并集）"
            onClick={() => setParam("categoryMode", "any")}
          >
            并集
          </Button>
          <Button
            active={categoryMode === "all"}
            aria-pressed={categoryMode === "all"}
            title="必须同时满足所有类别（交集）"
            onClick={() => setParam("categoryMode", "all")}
          >
            交集
          </Button>
        </Button.Group>
        <Dropdown
          selection
          clearable
          placeholder="全部年份"
          value={year || null}
          options={years.map((item) => ({
            key: item,
            text: item,
            value: item,
          }))}
          onChange={(_, dropdown) => setParam("year", dropdown.value)}
        />
        <Dropdown
          selection
          clearable
          placeholder="全部奖项"
          value={award || null}
          options={awards.map((item) => ({
            key: item,
            text: item,
            value: item,
          }))}
          onChange={(_, dropdown) => setParam("award", dropdown.value)}
        />
      </div>
      <Table celled unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={1} textAlign="center">
              #
            </Table.HeaderCell>
            <Table.HeaderCell>比赛</Table.HeaderCell>
            <Table.HeaderCell>队伍</Table.HeaderCell>
            <Table.HeaderCell>选手</Table.HeaderCell>
            <Table.HeaderCell>奖项</Table.HeaderCell>
            <Table.HeaderCell>排名</Table.HeaderCell>
            <Table.HeaderCell>来源</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filtered
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map((row, index) => (
              <Table.Row key={row.id}>
                <Table.Cell textAlign="center">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </Table.Cell>
                <Table.Cell>
                  <Link to={`/contests/${row.contestId}`}>{row.contest}</Link>
                  <div className="award-contest-meta">
                    <span className="subtle">{row.date}</span>
                    <span className="award-category-list">
                      {row.categories.map((category) => (
                        <span className="category-tag" key={category}>
                          {category}
                        </span>
                      ))}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>{row.team || "-"}</Table.Cell>
                <Table.Cell>
                  {row.members.map((name, memberIndex) => (
                    <React.Fragment key={`${row.id}-${name}`}>
                      {memberIndex > 0 ? "、" : ""}
                      <Link to={`/players/${encodeURIComponent(name)}`}>
                        {name}
                      </Link>
                    </React.Fragment>
                  ))}
                </Table.Cell>
                <Table.Cell>
                  {["gold", "silver", "bronze"].includes(row.awardLevel) ? (
                    <span className={`award-chip ${row.awardLevel}`}>
                      {row.award}
                    </span>
                  ) : (
                    <span className="award-neutral">{row.award}</span>
                  )}
                </Table.Cell>
                <Table.Cell>{row.rank ?? "-"}</Table.Cell>
                <Table.Cell>
                  <a href={row.source} target="_blank" rel="noreferrer">
                    RL ↗
                  </a>
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
      </Table>
      {!filtered.length && <p className="empty">没有符合条件的赛果。</p>}
      <Pager total={filtered.length} perPage={PAGE_SIZE} />
    </>
  );
}

export default Awards;
