// Adapted from OIerDB NG school/contest UI (AGPL-3.0); see NOTICE.
import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Header, Icon, Table } from "semantic-ui-react";
import Pager from "../components/Pagination";
const PAGE_SIZE = 30;
function ContestDetail({ data }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const c = data.contests.find((x) => x.id === id);
  if (!c) return <Header as="h2">比赛不存在</Header>;
  const rows = [...c.entries].sort(
    (a, b) => (a.rank ?? 99999) - (b.rank ?? 99999),
  );
  return (
    <>
      <Header as="h2" dividing>
        {c.title}
      </Header>
      <p className="muted">
        {c.date} · {c.categories.join(" / ")} ·{" "}
        <a href={c.source} target="_blank" rel="noreferrer">
          在 RankLand 查看原榜单 ↗
        </a>
      </p>
      <Table celled unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={1}>#</Table.HeaderCell>
            <Table.HeaderCell>比赛</Table.HeaderCell>
            <Table.HeaderCell>队伍</Table.HeaderCell>
            <Table.HeaderCell>选手</Table.HeaderCell>
            <Table.HeaderCell>奖项</Table.HeaderCell>
            <Table.HeaderCell>排名</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r, i) => (
            <Table.Row key={`${r.team}-${i}`}>
              <Table.Cell>{(page - 1) * PAGE_SIZE + i + 1}</Table.Cell>
              <Table.Cell>{c.title}</Table.Cell>
              <Table.Cell>{r.team || "-"}</Table.Cell>
              <Table.Cell>
                {r.members.map((name, j) => (
                  <React.Fragment key={name}>
                    {j > 0 ? "、" : ""}
                    <Link to={`/players/${encodeURIComponent(name)}`}>
                      {name}
                    </Link>
                  </React.Fragment>
                ))}
              </Table.Cell>
              <Table.Cell>
                {r.awardLevel === "gold" ||
                r.awardLevel === "silver" ||
                r.awardLevel === "bronze" ? (
                  <span className={`award-chip ${r.awardLevel}`}>
                    {r.award}
                  </span>
                ) : (
                  <span className="award-neutral">{r.award}</span>
                )}
              </Table.Cell>
              <Table.Cell>{r.rank ?? "-"}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Pager total={rows.length} perPage={PAGE_SIZE} />
      {c.note && (
        <div className="note">
          <Icon name="info circle" /> {c.note}
        </div>
      )}
    </>
  );
}

export default ContestDetail;
