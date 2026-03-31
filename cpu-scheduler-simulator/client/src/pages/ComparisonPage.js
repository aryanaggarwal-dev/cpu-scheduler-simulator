import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { runComparison } from "../hooks/simulationSlice";
import { addNotification } from "../hooks/uiSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";

const ALL_ALGORITHMS = ["FCFS", "SJF", "SRTF", "RR", "HRRN"];

const ALGO_COLORS = {
  FCFS: "#6c63ff",
  SJF: "#22d3a0",
  SRTF: "#f59e0b",
  RR: "#ef4444",
  HRRN: "#8b5cf6",
};

const METRICS = [
  { key: "avgWaitingTime", label: "Avg Wait (ms)", lowerBetter: true },
  { key: "avgTurnaroundTime", label: "Avg Turnaround (ms)", lowerBetter: true },
  { key: "avgResponseTime", label: "Avg Response (ms)", lowerBetter: true },
  { key: "cpuUtilization", label: "CPU Util %", lowerBetter: false },
  { key: "contextSwitches", label: "Ctx Switches", lowerBetter: true },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-3)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "10px 14px",
        fontSize: "12px",
        fontFamily: "var(--mono)",
      }}
    >
      <div
        style={{ color: "var(--text-1)", marginBottom: "6px", fontWeight: 700 }}
      >
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.stroke, marginTop: "3px" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

function WinnerBadge({ results, metricKey, lowerBetter }) {
  if (!results || results.length < 2) return null;
  const sorted = [...results].sort((a, b) => {
    const va = a.metrics?.[metricKey] ?? Infinity;
    const vb = b.metrics?.[metricKey] ?? Infinity;
    return lowerBetter ? va - vb : vb - va;
  });
  const winner = sorted[0];
  if (!winner) return null;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "10px",
        fontSize: "10px",
        fontFamily: "var(--mono)",
        fontWeight: 700,
        background: `${ALGO_COLORS[winner.algorithm]}22`,
        color: ALGO_COLORS[winner.algorithm],
        border: `1px solid ${ALGO_COLORS[winner.algorithm]}44`,
      }}
    >
      ★ {winner.algorithm}
    </span>
  );
}

function ComparisonRows({ results, metricKey }) {
  if (!results?.length) return null;
  const vals = results.map((r) => r.metrics?.[metricKey] ?? 0);
  const max = Math.max(...vals, 0.001);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {results.map((r) => {
        const v = r.metrics?.[metricKey] ?? 0;
        const pct = (v / max) * 100;
        return (
          <div
            key={r.algorithm}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                fontWeight: 700,
                color: ALGO_COLORS[r.algorithm],
                width: "48px",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {r.algorithm}
            </span>
            <div
              style={{
                flex: 1,
                background: "var(--bg-2)",
                borderRadius: "4px",
                height: "22px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: ALGO_COLORS[r.algorithm],
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "rgba(0,0,0,0.7)",
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  minWidth: pct > 0 ? "4px" : "0",
                }}
              >
                {pct > 20 ? v.toFixed(2) : ""}
              </div>
            </div>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                color: "var(--text-1)",
                width: "48px",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {v.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function exportCompareCSV(results) {
  if (!results?.length) return;
  const headers = ["Algorithm", ...METRICS.map((m) => m.label)];
  const rows = results.map((r) => [
    r.algorithm,
    ...METRICS.map((m) => (r.metrics?.[m.key] ?? "").toString()),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flowcpu-comparison-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ComparisonPage() {
  const dispatch = useDispatch();
  const { processes, quantum, comparisonResults, compareLoading } = useSelector(
    (s) => s.simulation,
  );
  const [selectedAlgos, setSelectedAlgos] = useState(new Set(ALL_ALGORITHMS));
  const [activeMetricTab, setActiveMetricTab] = useState(0);

  const toggleAlgo = (algo) => {
    setSelectedAlgos((prev) => {
      const next = new Set(prev);
      if (next.has(algo) && next.size > 1) next.delete(algo);
      else if (!next.has(algo)) next.add(algo);
      return next;
    });
  };

  const handleCompare = async () => {
    if (processes.length === 0) return;
    const action = await dispatch(
      runComparison({
        algorithms: Array.from(selectedAlgos),
        processes,
        quantum,
      }),
    );
    if (runComparison.fulfilled.match(action)) {
      dispatch(
        addNotification({
          type: "success",
          message: `Compared ${selectedAlgos.size} algorithms successfully.`,
        }),
      );
    }
  };

  // comparisonResults is an array [{algorithm, processes, ganttChart, metrics}]
  const results = (comparisonResults || []).filter((r) =>
    selectedAlgos.has(r.algorithm),
  );

  // Bar chart: one bar group per algorithm, x-axis = metric
  const barData = METRICS.slice(0, 3).map((m) => {
    const entry = { metric: m.label.replace(" (ms)", "").replace(" %", "") };
    results.forEach((r) => {
      entry[r.algorithm] = +(r.metrics?.[m.key] ?? 0).toFixed(2);
    });
    return entry;
  });

  // Radar — normalize each metric 0–100 (higher = better in all cases for display)
  const radarData = [
    {
      metric: "Low Wait",
      ...Object.fromEntries(
        results.map((r) => [
          r.algorithm,
          Math.max(0, 100 - (r.metrics?.avgWaitingTime ?? 0) * 2),
        ]),
      ),
    },
    {
      metric: "Low TAT",
      ...Object.fromEntries(
        results.map((r) => [
          r.algorithm,
          Math.max(0, 100 - (r.metrics?.avgTurnaroundTime ?? 0) * 1.5),
        ]),
      ),
    },
    {
      metric: "CPU Util",
      ...Object.fromEntries(
        results.map((r) => [r.algorithm, r.metrics?.cpuUtilization ?? 0]),
      ),
    },
    {
      metric: "Low CtxSW",
      ...Object.fromEntries(
        results.map((r) => [
          r.algorithm,
          Math.max(0, 100 - (r.metrics?.contextSwitches ?? 0) * 4),
        ]),
      ),
    },
    {
      metric: "Throughput",
      ...Object.fromEntries(
        results.map((r) => [r.algorithm, (r.metrics?.throughput ?? 0) * 400]),
      ),
    },
  ];

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
          <div className="page-title">Algorithm Comparison</div>
          <div className="page-subtitle">
            Run all algorithms on the same process set and compare performance
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {results.length > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportCompareCSV(results)}
            >
              ↓ CSV
            </button>
          )}
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCompare}
            disabled={
              compareLoading ||
              processes.length === 0 ||
              selectedAlgos.size === 0
            }
          >
            {compareLoading ? (
              <>
                <span
                  className="spinner"
                  style={{ width: "16px", height: "16px" }}
                />{" "}
                Comparing…
              </>
            ) : (
              `◫ Compare ${selectedAlgos.size} Algorithms`
            )}
          </button>
        </div>
      </div>

      {/* ── Algorithm Selector ── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header" style={{ marginBottom: "12px" }}>
          <span className="card-title">Select Algorithms</span>
          <span style={{ fontSize: "11px", color: "var(--text-2)" }}>
            {selectedAlgos.size} selected
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {ALL_ALGORITHMS.map((algo) => (
            <button
              key={algo}
              onClick={() => toggleAlgo(algo)}
              style={{
                padding: "9px 20px",
                borderRadius: "20px",
                cursor: "pointer",
                border: `2px solid ${selectedAlgos.has(algo) ? ALGO_COLORS[algo] : "var(--border)"}`,
                background: selectedAlgos.has(algo)
                  ? `${ALGO_COLORS[algo]}1a`
                  : "var(--bg-2)",
                color: selectedAlgos.has(algo)
                  ? ALGO_COLORS[algo]
                  : "var(--text-2)",
                fontFamily: "var(--mono)",
                fontSize: "13px",
                fontWeight: 700,
                transition: "all 0.2s",
              }}
            >
              {selectedAlgos.has(algo) ? "✓ " : ""}
              {algo}
            </button>
          ))}
        </div>
        {processes.length === 0 && (
          <div
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "var(--amber)",
            }}
          >
            ⚠ Add processes on the Dashboard before comparing
          </div>
        )}
      </div>

      {results.length > 0 ? (
        <>
          {/* ── Summary Table ── */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="card-header" style={{ marginBottom: "0" }}>
              <span className="card-title">Summary Table</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {METRICS.map((m, i) => (
                  <button
                    key={m.key}
                    className="btn btn-secondary btn-sm"
                    style={
                      activeMetricTab === i
                        ? {
                            borderColor: "var(--accent)",
                            color: "var(--accent)",
                          }
                        : {}
                    }
                    onClick={() => setActiveMetricTab(i)}
                  >
                    {m.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: "auto", marginTop: "16px" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    {METRICS.map((m) => (
                      <th key={m.key} style={{ position: "relative" }}>
                        {m.label}
                        <div style={{ marginTop: "4px" }}>
                          <WinnerBadge
                            results={results}
                            metricKey={m.key}
                            lowerBetter={m.lowerBetter}
                          />
                        </div>
                      </th>
                    ))}
                    <th>Throughput</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    // Find best value per metric for highlighting
                    return (
                      <tr key={r.algorithm}>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              width: "10px",
                              height: "10px",
                              borderRadius: "2px",
                              background: ALGO_COLORS[r.algorithm],
                              marginRight: "8px",
                              verticalAlign: "middle",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontWeight: 700,
                              color: ALGO_COLORS[r.algorithm],
                            }}
                          >
                            {r.algorithm}
                          </span>
                        </td>
                        {METRICS.map((m) => (
                          <td key={m.key} style={{ fontFamily: "var(--mono)" }}>
                            {(r.metrics?.[m.key] ?? 0).toFixed(2)}
                          </td>
                        ))}
                        <td
                          style={{
                            fontFamily: "var(--mono)",
                            color: "var(--text-1)",
                          }}
                        >
                          {(r.metrics?.throughput ?? 0).toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Metric Bars + Radar ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div className="card">
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <span className="card-title">Metric Breakdown</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {METRICS.map((m) => (
                  <div key={m.key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "10px",
                        fontFamily: "var(--mono)",
                        color: "var(--text-2)",
                        letterSpacing: "1px",
                      }}
                    >
                      <span>{m.label.toUpperCase()}</span>
                      <WinnerBadge
                        results={results}
                        metricKey={m.key}
                        lowerBetter={m.lowerBetter}
                      />
                    </div>
                    <ComparisonRows results={results} metricKey={m.key} />
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ marginBottom: "8px" }}>
                <span className="card-title">Radar Overview</span>
                <span style={{ fontSize: "10px", color: "var(--text-2)" }}>
                  higher = better
                </span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart
                  data={radarData}
                  margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
                >
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{
                      fill: "var(--text-2)",
                      fontSize: 10,
                      fontFamily: "var(--mono)",
                    }}
                  />
                  {results.map((r) => (
                    <Radar
                      key={r.algorithm}
                      name={r.algorithm}
                      dataKey={r.algorithm}
                      stroke={ALGO_COLORS[r.algorithm]}
                      fill={ALGO_COLORS[r.algorithm]}
                      fillOpacity={0.07}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  paddingLeft: "16px",
                }}
              >
                {results.map((r) => (
                  <div
                    key={r.algorithm}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11px",
                      color: "var(--text-1)",
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "2px",
                        background: ALGO_COLORS[r.algorithm],
                        display: "inline-block",
                        borderRadius: "2px",
                      }}
                    />
                    {r.algorithm}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bar Chart ── */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: "8px" }}>
              <span className="card-title">Side-by-Side Performance</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={barData}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="metric"
                  tick={{
                    fill: "var(--text-2)",
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                  }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: "var(--text-2)",
                    fontSize: 10,
                    fontFamily: "var(--mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "11px",
                    fontFamily: "var(--mono)",
                    color: "var(--text-2)",
                  }}
                />
                {results.map((r) => (
                  <Bar
                    key={r.algorithm}
                    dataKey={r.algorithm}
                    fill={ALGO_COLORS[r.algorithm]}
                    radius={[3, 3, 0, 0]}
                    fillOpacity={0.85}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ marginTop: "40px" }}>
          <div className="empty-icon">◫</div>
          <div className="empty-title">No comparison yet</div>
          <div className="empty-desc">
            Select algorithms above and click{" "}
            <strong style={{ color: "var(--text-0)" }}>Compare</strong> to run
            all on your current process set.
          </div>
        </div>
      )}
    </div>
  );
}
