// Adapted from OIerDB NG school/contest UI (AGPL-3.0); see NOTICE.
import React from "react";
import { Link, useParams } from "react-router-dom";
import { Header, Table } from "semantic-ui-react";
function PlayerDetail({ data }) {
  const { name } = useParams();
  const p = data.players.find((x) => x.name === name);
  if (!p) return <Header as="h2">选手不存在</Header>;
  return (
    <>
      <Header as="h2" dividing>
        {p.name}
      </Header>
      <p className="muted">
        参赛 {p.performances.length} 场 · 获奖 {p.medals} 次
      </p>
      <Table celled unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>比赛</Table.HeaderCell>
            <Table.HeaderCell>队伍</Table.HeaderCell>
            <Table.HeaderCell>奖项</Table.HeaderCell>
            <Table.HeaderCell>日期</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {p.performances.map((r, i) => (
            <Table.Row key={i}>
              <Table.Cell>
                <Link to={`/contests/${r.contestId}`}>{r.contest}</Link>
              </Table.Cell>
              <Table.Cell>{r.team || "-"}</Table.Cell>
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
              <Table.Cell>{r.date}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

export default PlayerDetail;
