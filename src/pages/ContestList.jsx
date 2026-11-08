// Adapted from OIerDB NG school/contest UI (AGPL-3.0); see NOTICE.
import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Dropdown, Header, Table } from "semantic-ui-react";
import Pager from "../components/Pagination";
const PAGE_SIZE = 20;
function ContestList({ data }) {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const queryParam = params.get("q") || "";
  const [query, setQuery] = useState(queryParam);
  const isComposing = useRef(false);
  const category = params.get("category") || "",
    year = params.get("year") || "";
  const categories = [
      ...new Set(data.contests.flatMap((x) => x.categories)),
    ].sort(),
    years = [...new Set(data.contests.map((x) => x.year))].sort(
      (a, b) => b - a,
    );
  const filtered = data.contests.filter(
    (x) =>
      (!query || x.title.toLowerCase().includes(query.toLowerCase())) &&
      (!category || x.categories.includes(category)) &&
      (!year || String(x.year) === year),
  );
  useEffect(() => setQuery(queryParam), [queryParam]);
  const set = (key, value) => {
    const n = new URLSearchParams(params);
    if (value) n.set(key, value);
    else n.delete(key);
    if (key !== "page") n.set("page", "1");
    setParams(n);
  };
  return (
    <>
      <Header as="h2" dividing>
        比赛列表
      </Header>
      <div className="list-tools">
        <input
          className="search-input"
          placeholder="搜索比赛名称"
          value={query}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onCompositionEnd={(e) => {
            isComposing.current = false;
            setQuery(e.currentTarget.value);
            set("q", e.currentTarget.value);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isComposing.current) set("q", e.target.value);
          }}
        />
        <Dropdown
          selection
          compact
          clearable
          placeholder="全部类别"
          value={category || null}
          options={categories.map((x) => ({ key: x, text: x, value: x }))}
          onChange={(_, d) => set("category", d.value)}
        />
        <Dropdown
          selection
          compact
          clearable
          placeholder="全部年份"
          value={year || null}
          options={years.map((x) => ({ key: x, text: x, value: String(x) }))}
          onChange={(_, d) => set("year", d.value)}
        />
      </div>
      <Table celled unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={1} textAlign="center">
              #
            </Table.HeaderCell>
            <Table.HeaderCell>名称</Table.HeaderCell>
            <Table.HeaderCell width={2}>类别</Table.HeaderCell>
            <Table.HeaderCell width={2}>时间</Table.HeaderCell>
            <Table.HeaderCell width={1.8}>队伍数</Table.HeaderCell>
            <Table.HeaderCell width={2.5}>奖项</Table.HeaderCell>
            <Table.HeaderCell width={1.8}>来源</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filtered
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map((c, i) => (
              <Table.Row key={c.id}>
                <Table.Cell textAlign="center">
                  {(page - 1) * PAGE_SIZE + i + 1}
                </Table.Cell>
                <Table.Cell>
                  <Link to={`/contests/${c.id}`}>{c.title}</Link>
                </Table.Cell>
                <Table.Cell>{c.categories.join(" / ")}</Table.Cell>
                <Table.Cell>{c.date}</Table.Cell>
                <Table.Cell>{c.entries.length}</Table.Cell>
                <Table.Cell>
                  <span className={c.awards.gold ? "award-chip gold" : ""}>
                    金 {c.awards.gold}
                  </span>
                  {"  "}
                  <span className={c.awards.silver ? "award-chip silver" : ""}>
                    银 {c.awards.silver}
                  </span>
                  {"  "}
                  <span className={c.awards.bronze ? "award-chip bronze" : ""}>
                    铜 {c.awards.bronze}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <a href={c.source} target="_blank" rel="noreferrer">
                    RL ↗
                  </a>
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
      </Table>
      {!filtered.length && <p className="empty">没有符合条件的比赛。</p>}
      <Pager total={filtered.length} perPage={PAGE_SIZE} />
    </>
  );
}

export default ContestList;
