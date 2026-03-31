import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setAnimationStep,
  setIsAnimating,
  resetAnimation,
  setAnimationSpeed,
} from "../hooks/simulationSlice";
import GanttChart from "../components/GanttChart/GanttChart";
import QueueVisualizer from "../components/QueueVisualizer/QueueVisualizer";
import MetricsPanel from "../components/MetricsPanel/MetricsPanel";
import StepExplainer from "../components/common/StepExplainer";

const SPEED_OPTIONS = [0.5, 1, 2, 4];

function exportCSV(result) {
  if (!result || !result.processes) return;
  const rows = [
    [
      "Name",
      "Arrival",
      "Burst",
      "Priority",
      "Start",
      "Completion",
      "Waiting",
      "Turnaround",
      "Response",
    ],
    ...result.processes.map((p) => [
      p.name,
      p.arrivalTime,
      p.burstTime,
      p.priority ?? "",
      p.startTime ?? "",
      p.completionTime,
      p.waitingTime,
      p.turnaroundTime,
      p.responseTime,
    ]),
    [],
    ["Metric", "Value"],
    ["Algorithm", result.algorithm],
    ["Avg Waiting Time", result.metrics?.avgWaitingTime],
    ["Avg Turnaround Time", result.metrics?.avgTurnaroundTime],
    ["Avg Response Time", result.metrics?.avgResponseTime],
    ["CPU Utilization %", result.metrics?.cpuUtilization],
    ["Throughput", result.metrics?.throughput],
    ["Context Switches", result.metrics?.contextSwitches],
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flowcpu-${result.algorithm}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Visualization() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { result, animationStep, isAnimating, animationSpeed } = useSelector(
    (s) => s.simulation,
  );
  const timerRef = useRef(null);
  const totalSteps = result?.ganttChart?.length || 0;

  // Stable ref to avoid stale closure in setInterval
  const stepRef = useRef(animationStep);
  useEffect(() => {
    stepRef.current = animationStep;
  }, [animationStep]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (isAnimating && result) {
      timerRef.current = setInterval(
        () => {
          const next = stepRef.current + 1;
          if (next > totalSteps) {
            dispatch(setIsAnimating(false));
          } else {
            dispatch(setAnimationStep(next));
          }
        },
        Math.round(1200 / animationSpeed),
      );
    }
    return () => clearInterval(timerRef.current);
  }, [isAnimating, totalSteps, animationSpeed, dispatch, result]);

  if (!result) {
    return (
      <div className="page">
        <div className="empty-state" style={{ marginTop: "60px" }}>
          <div className="empty-icon">◈</div>
          <div className="empty-title">No simulation to display</div>
          <div className="empty-desc">
            Go to the dashboard and run a simulation first
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalTime = result.ganttChart?.[result.ganttChart.length - 1]?.end || 0;
  const idleSegments =
    result.ganttChart?.filter((s) => s.process === "IDLE") || [];
  const idleTime = idleSegments.reduce((a, s) => a + (s.end - s.start), 0);

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
          <div className="page-title">Visualization</div>
          <div
            className="page-subtitle"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--mono)",
                color: "var(--accent)",
                fontWeight: 700,
              }}
            >
              {result.algorithm}
            </span>
            <span style={{ color: "var(--text-2)" }}>·</span>
            <span>{totalSteps} segments</span>
            <span style={{ color: "var(--text-2)" }}>·</span>
            <span>total time {totalTime}ms</span>
            {idleTime > 0 && (
              <>
                <span style={{ color: "var(--text-2)" }}>·</span>
                <span style={{ color: "var(--amber)" }}>idle {idleTime}ms</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportCSV(result)}
            title="Export results to CSV"
          >
            ↓ CSV
          </button>
          <div
            style={{
              width: "1px",
              height: "24px",
              background: "var(--border)",
            }}
          />
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              className="btn btn-secondary btn-sm"
              style={
                animationSpeed === s
                  ? { borderColor: "var(--accent)", color: "var(--accent)" }
                  : {}
              }
              onClick={() => dispatch(setAnimationSpeed(s))}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* ── Playback Controls ── */}
      <div className="step-controls" style={{ marginBottom: "20px" }}>
        <button
          className="btn btn-secondary btn-sm"
          title="Reset to beginning"
          onClick={() => {
            dispatch(setIsAnimating(false));
            dispatch(resetAnimation());
          }}
        >
          ⏮
        </button>
        <button
          className="btn btn-secondary btn-sm"
          title="Step back"
          onClick={() => {
            dispatch(setIsAnimating(false));
            dispatch(setAnimationStep(Math.max(1, animationStep - 1)));
          }}
        >
          ◀
        </button>
        <button
          className="btn btn-primary btn-sm"
          style={{ minWidth: "72px" }}
          onClick={() => dispatch(setIsAnimating(!isAnimating))}
        >
          {isAnimating ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          title="Step forward"
          onClick={() => {
            dispatch(setIsAnimating(false));
            dispatch(setAnimationStep(Math.min(totalSteps, animationStep + 1)));
          }}
        >
          ▶
        </button>
        <button
          className="btn btn-secondary btn-sm"
          title="Jump to end"
          onClick={() => {
            dispatch(setIsAnimating(false));
            dispatch(setAnimationStep(0));
          }}
        >
          ⏭
        </button>
        <input
          type="range"
          className="step-slider"
          min={1}
          max={totalSteps}
          value={animationStep === 0 ? totalSteps : animationStep}
          onChange={(e) => {
            dispatch(setIsAnimating(false));
            dispatch(setAnimationStep(Number(e.target.value)));
          }}
        />
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            color: "var(--text-1)",
            minWidth: "80px",
            textAlign: "right",
          }}
        >
          {animationStep === 0
            ? `all ${totalSteps}`
            : `${animationStep} / ${totalSteps}`}
        </span>
      </div>

      {/* ── Step Explainer ── */}
      <div style={{ marginBottom: "20px" }}>
        <StepExplainer />
      </div>

      {/* ── Gantt Chart ── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header">
          <span className="card-title">Gantt Chart</span>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-2)",
                fontFamily: "var(--mono)",
              }}
            >
              span: {totalTime}ms
            </span>
            {idleTime > 0 && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--amber)",
                  fontFamily: "var(--mono)",
                }}
              >
                idle: {idleTime}ms ({((idleTime / totalTime) * 100).toFixed(1)}
                %)
              </span>
            )}
          </div>
        </div>
        <GanttChart />
      </div>

      {/* ── Queue + Quick Metrics ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div className="card">
          <div className="card-header">
            <span className="card-title">Queue State</span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-2)",
                fontFamily: "var(--mono)",
              }}
            >
              t ={" "}
              {result.ganttChart?.[
                Math.max(0, (animationStep || totalSteps) - 1)
              ]?.end ?? 0}
            </span>
          </div>
          <QueueVisualizer />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Key Metrics</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {[
              {
                label: "Avg Waiting",
                value: result.metrics?.avgWaitingTime?.toFixed(2),
                unit: "ms",
                color: "var(--accent)",
              },
              {
                label: "Avg Turnaround",
                value: result.metrics?.avgTurnaroundTime?.toFixed(2),
                unit: "ms",
                color: "var(--green)",
              },
              {
                label: "Avg Response",
                value: result.metrics?.avgResponseTime?.toFixed(2),
                unit: "ms",
                color: "var(--cyan)",
              },
              {
                label: "CPU Utilization",
                value: result.metrics?.cpuUtilization?.toFixed(1),
                unit: "%",
                color: "var(--amber)",
              },
              {
                label: "Throughput",
                value: result.metrics?.throughput?.toFixed(4),
                unit: "/ms",
                color: "var(--pink)",
              },
              {
                label: "Ctx Switches",
                value: result.metrics?.contextSwitches,
                unit: "",
                color: "var(--purple)",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="metric-card"
                style={{ borderLeft: `3px solid ${m.color}` }}
              >
                <div
                  className="metric-value"
                  style={{ color: m.color, fontSize: "18px" }}
                >
                  {m.value ?? "—"}
                  {m.unit && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-2)",
                        marginLeft: "3px",
                      }}
                    >
                      {m.unit}
                    </span>
                  )}
                </div>
                <div className="metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full Metrics + Table ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Full Metrics &amp; Process Table</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportCSV(result)}
          >
            ↓ Export CSV
          </button>
        </div>
        <MetricsPanel />
      </div>
    </div>
  );
}
