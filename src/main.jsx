import PlayerDetail from "./pages/PlayerDetail";
import Players from "./pages/Players";
import ContestDetail from "./pages/ContestDetail";
import ContestList from "./pages/ContestList";
import Awards from "./pages/Awards";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Container } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import "./oierdb.less";
import "./main.css";
import SiteHeader from "./components/Header";

try {
  document.documentElement.dataset.theme =
    localStorage.getItem("zzu-xcpc-theme") === "dark" ? "dark" : "light";
} catch {
  document.documentElement.dataset.theme = "light";
}

function useData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("./data/site-data.json")
      .then((r) => r.json())
      .then(setData);
  }, []);
  return data;
}
function Layout({ children }) {
  return (
    <>
      <SiteHeader />
      <Container className="page-container">{children}</Container>
      <footer>
        <Container>
          ZZU XCPC DB / Data from{" "}
          <a href="https://github.com/algoux/srk-collection">SRK Collection</a>{" "}
          / UI adapted from{" "}
          <a href="https://github.com/OIerDb-ng/OIerDb">OIerDB NG</a> ·{" "}
          <a href="https://github.com/OIerDb-ng/OIerDb/blob/master/LICENSE">
            AGPL-3.0
          </a>{" "}
          / Developed and maintained by{" "}
          <a href="https://github.com/zerc7">Zerc</a>
        </Container>
      </footer>
    </>
  );
}
function App() {
  const data = useData();
  if (!data) return <Layout>正在加载数据…</Layout>;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ContestList data={data} />} />
        <Route path="/contests" element={<ContestList data={data} />} />
        <Route path="/contests/:id" element={<ContestDetail data={data} />} />
        <Route path="/awards" element={<Awards data={data} />} />
        <Route path="/players" element={<Players data={data} />} />
        <Route path="/players/:name" element={<PlayerDetail data={data} />} />
      </Routes>
    </Layout>
  );
}
createRoot(document.getElementById("root")).render(
  <HashRouter>
    <App />
  </HashRouter>,
);
