// Adapted from OIerDB NG school/contest UI (AGPL-3.0); see NOTICE.
import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header, Table } from "semantic-ui-react";
import Pager from "../components/Pagination";
const PAGE_SIZE = 20;
function Players({ data }) {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const queryParam = params.get("q") || "";
  const [q, setQ] = useState(queryParam);
  const isComposing = useRef(false);
  useEffect(() => setQ(queryParam), [queryParam]);
  const filtered = data.players.filter(
    (x) => !q || x.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <Header as="h2" dividing>
        选手列表
      </Header>
      <div className="list-tools">
        <input
          className="search-input"
          placeholder="搜索选手姓名"
          value={q}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onCompositionEnd={(e) => {
            isComposing.current = false;
            setQ(e.currentTarget.value);
            const n = new URLSearchParams(params);
            if (e.currentTarget.value) n.set("q", e.currentTarget.value);
            else n.delete("q");
            n.set("page", "1");
            setParams(n);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            if (isComposing.current) return;
            const n = new URLSearchParams(params);
            if (e.target.value) n.set("q", e.target.value);
            else n.delete("q");
            n.set("page", "1");
            setParams(n);
          }}
        />
      </div>
      <Table celled unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={1}>#</Table.HeaderCell>
            <Table.HeaderCell>姓名</Table.HeaderCell>
            <Table.HeaderCell width={2}>参赛场次</Table.HeaderCell>
            <Table.HeaderCell width={2}>获奖次数</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filtered
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map((p, i) => (
              <Table.Row key={p.name}>
                <Table.Cell>{(page - 1) * PAGE_SIZE + i + 1}</Table.Cell>
                <Table.Cell>
                  <Link to={`/players/${encodeURIComponent(p.name)}`}>
                    {p.name}
                  </Link>
                </Table.Cell>
                <Table.Cell>{p.performances.length}</Table.Cell>
                <Table.Cell>{p.medals}</Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
      </Table>
      <Pager total={filtered.length} perPage={PAGE_SIZE} />
    </>
  );
}

export default Players;
