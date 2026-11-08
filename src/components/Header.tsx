// Adapted from OIerDB NG (AGPL-3.0); see NOTICE.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Icon,
  Menu,
  Sidebar,
  type SemanticICONS,
} from "semantic-ui-react";
import { useScreenWidthWithin } from "../utils/useScreenWidthWithin";
import styles from "./Header.module.less";

// Header Buttons
const headerButtons: { name: string; to: string; icon: SemanticICONS }[] = [
  { name: "比赛", to: "/contests", icon: "calendar" },
  { name: "奖项", to: "/awards", icon: "trophy" },
  { name: "选手", to: "/players", icon: "user" },
];

const Header: React.FC = () => {
  const wide = useScreenWidthWithin(768, Infinity);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.dataset.theme === "dark",
  );

  const toggleTheme = () => {
    const nextTheme = darkMode ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem("zzu-xcpc-theme", nextTheme);
    } catch {
      // Theme remains active for this page session if storage is unavailable.
    }
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    if (
      sidebarOpen !==
      document.documentElement.classList.contains(styles.sidebarOpen)
    )
      document.documentElement.classList.toggle(styles.sidebarOpen);
  }, [sidebarOpen]);

  const sidebarOpenStatusClassName = sidebarOpen
    ? " " + styles.sidebarOpen
    : "";

  return (
    <>
      <Menu fixed="top" borderless>
        <Container>
          <Menu.Item as={Link} to="/">
            <Icon name="university" />
            <div style={{ fontSize: "20px" }}>
              <b>ZZU XCPC DB</b>
            </div>
          </Menu.Item>
          {wide ? (
            <>
              {headerButtons.map((button) => (
                <Menu.Item key={button.name} as={Link} to={button.to}>
                  <Icon name={button.icon} />
                  {button.name}
                </Menu.Item>
              ))}
              <Menu.Menu position="right">
                <Menu.Item
                  as="button"
                  type="button"
                  className="theme-toggle"
                  icon={darkMode ? "sun" : "moon"}
                  aria-pressed={darkMode}
                  aria-label={darkMode ? "切换到浅色主题" : "切换到深色主题"}
                  title={darkMode ? "切换到浅色主题" : "切换到深色主题"}
                  onClick={toggleTheme}
                />
              </Menu.Menu>
            </>
          ) : (
            <Menu.Item
              position="right"
              icon="bars"
              onClick={() => setSidebarOpen(true)}
            />
          )}
        </Container>
      </Menu>
      {!wide && (
        <>
          <div
            className={styles.sidebarDimmer + sidebarOpenStatusClassName}
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar
            as={Menu}
            className={styles.sidebarMenu + sidebarOpenStatusClassName}
            animation="push"
            direction="right"
            vertical
            visible
          >
            <Menu.Item
              as={Link}
              to="/"
              style={{ fontSize: "20px", textAlign: "center" }}
              onClick={() => setSidebarOpen(false)}
            >
              <b>ZZU XCPC DB</b>
            </Menu.Item>
            {headerButtons.map((button) => (
              <Menu.Item
                key={button.name}
                as={Link}
                to={button.to}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={button.icon} />
                {button.name}
              </Menu.Item>
            ))}
            <Menu.Item
              as="button"
              type="button"
              className="theme-toggle"
              icon={darkMode ? "sun" : "moon"}
              aria-pressed={darkMode}
              aria-label={darkMode ? "切换到浅色主题" : "切换到深色主题"}
              title={darkMode ? "切换到浅色主题" : "切换到深色主题"}
              onClick={toggleTheme}
            />
          </Sidebar>
        </>
      )}
    </>
  );
};

export default Header;
