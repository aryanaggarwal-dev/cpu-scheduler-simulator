import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchHistory, loadPastSimulation } from "../hooks/simulationSlice";
import { deleteSimulationAPI } from "../services/api";
import { addNotification } from "../hooks/uiSlice";

const ALGO_COLORS = {
  FCFS: "#6c63ff",
  SJF: "#22d3a0",
  SRTF: "#f59e0b",
  RR: "#ef4444",
  HRRN: "#8b5cf6",
};

const METRICS_DISPLAY = [
  {
    key: "avgWaitingTime",
    label: "Avg Wait",
    unit: "ms",
    color: "var(--amber)",
  },
  {
    key: "avgTurnaroundTime",
    label: "Avg TAT",
    unit: "ms",
    color: "var(--green)",
  },
  { key: "cpuUtilization", label: "CPU Util", unit: "%", color: "var(--cyan)" },
  { key: "contextSwitches", label: "Ctx SW", unit: "", color: "var(--purple)" },
];

export default function HistoryPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, historyLoading } = useSelector((s) => s.simulation);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState({});

  useEffect(() => {
    dispatch(fetchHistory({ limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    if (history.length > 0) {
      console.log("History loaded:", history[0]);
      console.log("First item has id?", history[0].id);
    }
  }, [history]);

  const filtered =
    filter === "ALL" ? history : history.filter((s) => s.algorithm === filter);
  const algosInHistory = ["ALL", ...new Set(history.map((s) => s.algorithm))];

  const handleDelete = async (id) => {
    console.log("handleDelete called with id:", id, "typeof:", typeof id);
    setDeleting(id);
    try {
      await deleteSimulationAPI(id);
      dispatch(
        addNotification({ type: "success", message: "Simulation deleted." }),
      );
      dispatch(fetchHistory({ limit: 50 }));
    } catch (err) {
      console.error("Delete error:", err);
      console.error("Delete error response:", err.response?.data);
      const errorMsg =
        err.response?.data?.error || err.message || "Delete failed";
      dispatch(
        addNotification({
          type: "error",
          message: `Delete failed: ${errorMsg}`,
        }),
      );
    } finally {
      setDeleting(null);
    }
  };

  const handleLoadSimulation = async (sim) => {
    setLoading((prev) => ({ ...prev, [sim.id]: true }));
    try {
      // Load the past simulation into Redux state
      dispatch(
        loadPastSimulation({
          processes: sim.processes || [],
          algorithm: sim.algorithm,
          quantum: sim.quantum,
          result: {
            ganttChart: sim.ganttChart || [],
            processes: sim.processes || [],
            metrics: sim.metrics || {},
            gantt: sim.gantt,
            completed: sim.completed,
          },
        }),
      );

      dispatch(
        addNotification({
          type: "success",
          message: `Loaded ${sim.algorithm} simulation with ${sim.processes?.length || 0} processes.`,
        }),
      );

      // Navigate to visualization page
      navigate("/visualize");
    } catch (err) {
      console.error("Load simulation error:", err);
      dispatch(
        addNotification({
          type: "error",
          message: "Failed to load simulation.",
        }),
      );
    } finally {
      setLoading((prev) => ({ ...prev, [sim.id]: false }));
    }
  };

  return (
    <div className="page">
      {/* ── Header ── */}
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div className="page-title">Simulation History</div>
          <div className="page-subtitle">
            {history.length} saved simulation{history.length !== 1 ? "s" : ""} —
            requires MongoDB connection
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => dispatch(fetchHistory({ limit: 50 }))}
          disabled={historyLoading}
        >
          {historyLoading ? <span className="spinner" /> : "↺"} Refresh
        </button>
      </div>

      {/* ── Filter tabs ── */}
      {history.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {algosInHistory.map((a) => (
            <button
              key={a}
              className="btn btn-secondary btn-sm"
              style={
                filter === a
                  ? {
                      borderColor:
                        a === "ALL" ? "var(--accent)" : ALGO_COLORS[a],
                      color: a === "ALL" ? "var(--accent)" : ALGO_COLORS[a],
                    }
                  : {}
              }
              onClick={() => setFilter(a)}
            >
              {a}
              {a !== "ALL" && (
                <span style={{ marginLeft: "4px", opacity: 0.6 }}>
                  {history.filter((s) => s.algorithm === a).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {historyLoading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "60px" }}
        >
          <div className="spinner" style={{ width: "32px", height: "32px" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "40px" }}>
          <div className="empty-icon">◷</div>
          <div className="empty-title">
            {history.length === 0
              ? "No history yet"
              : `No ${filter} simulations`}
          </div>
          <div className="empty-desc">
            {history.length === 0
              ? "Simulations are saved automatically when you run them. Make sure MongoDB is connected."
              : `Switch the filter above to see other algorithms.`}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((sim, idx) => {
            const color = ALGO_COLORS[sim.algorithm] || "var(--accent)";
            const date = sim.createdAt
              ? new Date(sim.createdAt).toLocaleString()
              : "Unknown date";
            const procs = sim.processes || sim.completed || [];
            const isDel = deleting === sim.id;
            const isLoading = loading[sim.id];

            return (
              <div
                key={sim.id}
                className="card animate-fadeIn"
                style={{
                  borderLeft: `4px solid ${color}`,
                  animationDelay: `${idx * 0.04}s`,
                  transition: "all 0.3s",
                  opacity: isDel ? 0.4 : 1,
                  cursor: "pointer",
                }}
                onClick={() =>
                  !isDel && !isLoading && handleLoadSimulation(sim)
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "20px",
                  }}
                >
                  {/* Left: algorithm + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "16px",
                          fontWeight: 700,
                          color,
                        }}
                      >
                        {sim.algorithm}
                      </span>
                      {sim.quantum && (
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "10px",
                            color: "var(--text-2)",
                            padding: "2px 6px",
                            background: "var(--bg-3)",
                            borderRadius: "8px",
                          }}
                        >
                          Q={sim.quantum}
                        </span>
                      )}
                      <span
                        style={{ fontSize: "11px", color: "var(--text-2)" }}
                      >
                        {procs.length} processes
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-2)",
                          marginLeft: "auto",
                        }}
                      >
                        {date}
                      </span>
                    </div>

                    {/* Process chips */}
                    <div
                      style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                    >
                      {procs.slice(0, 10).map((p) => (
                        <span
                          key={p.name}
                          style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontFamily: "var(--mono)",
                            fontWeight: 700,
                            background: p.color
                              ? `${p.color}18`
                              : "var(--bg-3)",
                            border: `1px solid ${p.color ? p.color + "44" : "var(--border)"}`,
                            color: p.color || color,
                          }}
                        >
                          {p.name}
                        </span>
                      ))}
                      {procs.length > 10 && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-2)",
                            padding: "2px 6px",
                          }}
                        >
                          +{procs.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: metrics */}
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      flexShrink: 0,
                      alignItems: "flex-start",
                    }}
                  >
                    {METRICS_DISPLAY.map((m) => (
                      <div
                        key={m.key}
                        style={{ textAlign: "center", minWidth: "52px" }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "15px",
                            fontWeight: 700,
                            color: m.color,
                          }}
                        >
                          {sim.metrics?.[m.key] != null
                            ? m.unit === "%"
                              ? sim.metrics[m.key].toFixed(1)
                              : m.unit === ""
                                ? sim.metrics[m.key]
                                : sim.metrics[m.key].toFixed(1)
                            : "—"}
                          <span
                            style={{
                              fontSize: "9px",
                              color: "var(--text-2)",
                              marginLeft: "2px",
                            }}
                          >
                            {m.unit}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "var(--text-2)",
                            marginTop: "2px",
                            letterSpacing: "0.3px",
                          }}
                        >
                          {m.label}
                        </div>
                      </div>
                    ))}

                    {/* Action buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignSelf: "flex-start",
                      }}
                    >
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadSimulation(sim);
                        }}
                        disabled={isDel || isLoading}
                        title="Load and view this simulation"
                        style={{ minWidth: "36px" }}
                      >
                        {isLoading ? (
                          <span
                            className="spinner"
                            style={{ width: "12px", height: "12px" }}
                          />
                        ) : (
                          "→"
                        )}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(sim.id);
                        }}
                        disabled={isDel}
                        title="Delete simulation"
                        style={{ minWidth: "36px" }}
                      >
                        {isDel ? (
                          <span
                            className="spinner"
                            style={{ width: "12px", height: "12px" }}
                          />
                        ) : (
                          "✕"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Stats footer ── */}
      {history.length > 0 && (
        <div
          style={{
            marginTop: "24px",
            padding: "14px 20px",
            background: "var(--bg-1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
            fontSize: "12px",
            fontFamily: "var(--mono)",
          }}
        >
          <span style={{ color: "var(--text-2)" }}>
            Total runs:{" "}
            <span style={{ color: "var(--text-0)" }}>{history.length}</span>
          </span>
          {Object.entries(
            history.reduce((acc, s) => {
              acc[s.algorithm] = (acc[s.algorithm] || 0) + 1;
              return acc;
            }, {}),
          ).map(([algo, count]) => (
            <span key={algo} style={{ color: ALGO_COLORS[algo] }}>
              {algo}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
