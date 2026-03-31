import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setActiveTab, toggleTheme } from "./hooks/uiSlice";
import Dashboard from "./pages/Dashboard";
import Visualization from "./pages/Visualization";
import MotherboardPage from "./pages/MotherboardPage";
import ComparisonPage from "./pages/ComparisonPage";
import HistoryPage from "./pages/HistoryPage";
import Notifications from "./components/common/Notifications";
import "./styles/global.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/", icon: "⬡" },
  { id: "visualization", label: "Visualize", path: "/visualize", icon: "◈" },
  { id: "motherboard", label: "System", path: "/motherboard", icon: "◉" },
  { id: "comparison", label: "Compare", path: "/compare", icon: "◫" },
  { id: "history", label: "History", path: "/history", icon: "◷" },
];

export default function App() {
  const dispatch = useDispatch();
  const algorithm = useSelector((s) => s.simulation.algorithm);
  const result = useSelector((s) => s.simulation.result);
  const theme = useSelector((s) => s.ui.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-icon">⬡</span>
            <span className="brand-text">FlowCPU</span>
          </div>

          <div className="sidebar-status">
            <div className="status-algo">{algorithm}</div>
            <div className="status-label">active algorithm</div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
                onClick={() => dispatch(setActiveTab(item.id))}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.id === "visualization" && result && (
                  <span className="nav-badge">●</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button
              className="btn-theme-toggle"
              onClick={() => dispatch(toggleTheme())}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <div className="footer-text">CPU Scheduler v1.0</div>
          </div>
        </aside>

        {/* Main content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/visualize" element={<Visualization />} />
            <Route path="/motherboard" element={<MotherboardPage />} />
            <Route path="/compare" element={<ComparisonPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>

        <Notifications />
      </div>
    </BrowserRouter>
  );
}
