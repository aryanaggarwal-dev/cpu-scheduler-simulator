import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";

const W = 800;
const H = 540;

// Component positions
const LAYOUT = {
  cpu: { x: 300, y: 200, w: 200, h: 140 },
  ram: { x: 60, y: 60, w: 180, h: 120 },
  cache: { x: 60, y: 220, w: 160, h: 90 },
  scheduler: { x: 560, y: 60, w: 180, h: 120 },
  queue: { x: 560, y: 220, w: 180, h: 120 },
  completed: { x: 300, y: 420, w: 200, h: 80 },
  io: { x: 60, y: 380, w: 140, h: 80 },
};

function DataBus({ from, to, active, color = "#6c63ff", animated = true }) {
  const x1 = from.x,
    y1 = from.y,
    x2 = to.x,
    y2 = to.y;
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={active ? color : "rgba(255,255,255,0.07)"}
        strokeWidth={active ? 2 : 1}
        strokeDasharray={animated && active ? "6 4" : "none"}
        style={
          animated && active ? { animation: "flow 0.8s linear infinite" } : {}
        }
      />
      {active && (
        <circle r="4" fill={color} style={{ opacity: 0.9 }}>
          <animateMotion
            dur="1.2s"
            repeatCount="indefinite"
            path={`M${x1},${y1} L${x2},${y2}`}
          />
        </circle>
      )}
    </g>
  );
}

function ComponentBox({
  x,
  y,
  w,
  h,
  title,
  subtitle,
  color = "#6c63ff",
  active,
  children,
}) {
  const glow = active ? `0 0 20px ${color}44` : "none";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={active ? `${color}18` : "rgba(22,24,33,0.9)"}
        stroke={active ? color : "rgba(255,255,255,0.08)"}
        strokeWidth={active ? 2 : 1}
        filter={active ? `drop-shadow(0 0 8px ${color}55)` : "none"}
        style={{ transition: "all 0.4s ease" }}
      />
      <text
        x={x + w / 2}
        y={y + 20}
        textAnchor="middle"
        fill={active ? color : "rgba(255,255,255,0.5)"}
        fontSize="10"
        fontFamily="'Space Mono', monospace"
        fontWeight="700"
        letterSpacing="1.5"
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={x + w / 2}
          y={y + 36}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize="9"
          fontFamily="'Space Mono', monospace"
        >
          {subtitle}
        </text>
      )}
      {children}
    </g>
  );
}

export default function Motherboard() {
  const result = useSelector((s) => s.simulation.result);
  const animationStep = useSelector((s) => s.simulation.animationStep);
  const allProcesses = useSelector((s) => s.simulation.processes);
  const algorithm = useSelector((s) => s.simulation.algorithm);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 800);
    return () => clearInterval(t);
  }, []);

  // Compute current state
  const gantt = result?.ganttChart || [];
  const processes = result?.processes || allProcesses;

  const stepIdx =
    animationStep === 0 ? gantt.length - 1 : Math.max(0, animationStep - 1);

  const currentSeg = gantt[stepIdx];
  const currentTime = currentSeg?.end || 0;
  const activeProcName =
    currentSeg?.process !== "IDLE" ? currentSeg?.process : null;
  const activeProc = processes.find((p) => p.name === activeProcName);
  const isCpuBusy = !!activeProcName;

  const completedNames = new Set(
    (result?.processes || [])
      .filter((p) => p.completionTime <= (currentSeg?.start || 0))
      .map((p) => p.name),
  );
  const arrivedNames = new Set(
    processes.filter((p) => p.arrivalTime <= currentTime).map((p) => p.name),
  );
  const readyQueue = Array.from(arrivedNames).filter(
    (n) => n !== activeProcName && !completedNames.has(n),
  );

  const cpuColor = activeProc?.color || "#6c63ff";
  const L = LAYOUT;

  // Bus connection points
  const buses = [
    {
      from: { x: L.ram.x + L.ram.w, y: L.ram.y + L.ram.h / 2 },
      to: { x: L.cpu.x, y: L.cpu.y + L.cpu.h / 2 },
      active: isCpuBusy,
    },
    {
      from: { x: L.cache.x + L.cache.w, y: L.cache.y + L.cache.h / 2 },
      to: { x: L.cpu.x, y: L.cpu.y + L.cpu.h * 0.7 },
      active: isCpuBusy,
    },
    {
      from: { x: L.cpu.x + L.cpu.w, y: L.cpu.y + 50 },
      to: { x: L.scheduler.x, y: L.scheduler.y + L.scheduler.h / 2 },
      active: true,
    },
    {
      from: { x: L.cpu.x + L.cpu.w, y: L.cpu.y + 90 },
      to: { x: L.queue.x, y: L.queue.y + L.queue.h / 2 },
      active: readyQueue.length > 0,
    },
    {
      from: { x: L.cpu.x + L.cpu.w / 2, y: L.cpu.y + L.cpu.h },
      to: { x: L.completed.x + L.completed.w / 2, y: L.completed.y },
      active: completedNames.size > 0,
    },
    {
      from: { x: L.io.x + L.io.w, y: L.io.y + L.io.h / 2 },
      to: { x: L.cpu.x, y: L.cpu.y + L.cpu.h * 0.9 },
      active: false,
      color: "#06b6d4",
    },
  ];

  return (
    <div
      style={{
        position: "relative",
        background: "var(--bg-1)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--text-1)",
            letterSpacing: "2px",
          }}
        >
          SYSTEM SIMULATION
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "11px",
            fontFamily: "var(--mono)",
          }}
        >
          <span style={{ color: "var(--text-2)" }}>t = {currentTime}</span>
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "10px",
              background: isCpuBusy ? "var(--green-dim)" : "var(--bg-3)",
              color: isCpuBusy ? "var(--green)" : "var(--text-2)",
              animation: isCpuBusy ? "pulse 1.5s ease infinite" : "none",
            }}
          >
            {isCpuBusy ? "● RUNNING" : "○ IDLE"}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block", background: "var(--bg-1)" }}
      >
        <defs>
          <style>{`
            @keyframes flow { 0% { stroke-dashoffset: 10; } 100% { stroke-dashoffset: 0; } }
            @keyframes pulse-svg { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          `}</style>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid background */}
        {Array.from({ length: 16 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 34}
            x2={W}
            y2={i * 34}
            stroke="rgba(255,255,255,0.025)"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * 34}
            y1={0}
            x2={i * 34}
            y2={H}
            stroke="rgba(255,255,255,0.025)"
            strokeWidth={1}
          />
        ))}

        {/* Data buses */}
        {buses.map((b, i) => (
          <DataBus
            key={i}
            from={b.from}
            to={b.to}
            active={b.active}
            color={b.color}
          />
        ))}

        {/* RAM */}
        <ComponentBox
          x={L.ram.x}
          y={L.ram.y}
          w={L.ram.w}
          h={L.ram.h}
          title="MEMORY / RAM"
          subtitle={`${processes.length} processes`}
          color="#06b6d4"
          active={isCpuBusy}
        >
          <g>
            {processes.slice(0, 6).map((p, i) => (
              <g key={p.name}>
                <rect
                  x={L.ram.x + 10 + (i % 3) * 56}
                  y={L.ram.y + 48 + Math.floor(i / 3) * 34}
                  width={48}
                  height={26}
                  rx={4}
                  fill={`${p.color}22`}
                  stroke={
                    arrivedNames.has(p.name) ? p.color : "rgba(255,255,255,0.1)"
                  }
                  strokeWidth={1}
                />
                <text
                  x={L.ram.x + 10 + (i % 3) * 56 + 24}
                  y={L.ram.y + 48 + Math.floor(i / 3) * 34 + 17}
                  textAnchor="middle"
                  fill={p.color}
                  fontSize="10"
                  fontFamily="'Space Mono', monospace"
                  fontWeight="700"
                >
                  {p.name}
                </text>
              </g>
            ))}
          </g>
        </ComponentBox>

        {/* Cache */}
        <ComponentBox
          x={L.cache.x}
          y={L.cache.y}
          w={L.cache.w}
          h={L.cache.h}
          title="L2 CACHE"
          subtitle="scheduler state"
          color="#8b5cf6"
          active={isCpuBusy}
        >
          <text
            x={L.cache.x + L.cache.w / 2}
            y={L.cache.y + 58}
            textAnchor="middle"
            fill="#8b5cf6"
            fontSize="11"
            fontFamily="'Space Mono', monospace"
          >
            {algorithm}
          </text>
          <text
            x={L.cache.x + L.cache.w / 2}
            y={L.cache.y + 74}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize="9"
            fontFamily="'Space Mono', monospace"
          >
            algorithm
          </text>
        </ComponentBox>

        {/* I/O */}
        <ComponentBox
          x={L.io.x}
          y={L.io.y}
          w={L.io.w}
          h={L.io.h}
          title="I/O DEVICE"
          subtitle=""
          color="#06b6d4"
          active={false}
        >
          <text
            x={L.io.x + L.io.w / 2}
            y={L.io.y + 52}
            textAnchor="middle"
            fill="rgba(6,182,212,0.5)"
            fontSize="20"
          >
            ◷
          </text>
        </ComponentBox>

        {/* CPU (center) */}
        <ComponentBox
          x={L.cpu.x}
          y={L.cpu.y}
          w={L.cpu.w}
          h={L.cpu.h}
          title="CPU CORE"
          color={cpuColor}
          active={isCpuBusy}
        >
          {/* Pulsing CPU circle */}
          <circle
            cx={L.cpu.x + L.cpu.w / 2}
            cy={L.cpu.y + 72}
            r={isCpuBusy ? 34 : 28}
            fill={isCpuBusy ? `${cpuColor}22` : "rgba(255,255,255,0.03)"}
            stroke={isCpuBusy ? cpuColor : "rgba(255,255,255,0.1)"}
            strokeWidth={isCpuBusy ? 2 : 1}
            style={{
              transition: "all 0.5s ease",
              animation: isCpuBusy ? "pulse-svg 1.2s ease infinite" : "none",
            }}
          />
          <text
            x={L.cpu.x + L.cpu.w / 2}
            cy={L.cpu.y + 72}
            y={L.cpu.y + (isCpuBusy ? 76 : 76)}
            textAnchor="middle"
            fill={isCpuBusy ? cpuColor : "rgba(255,255,255,0.2)"}
            fontSize={isCpuBusy ? "16" : "12"}
            fontFamily="'Space Mono', monospace"
            fontWeight="700"
            style={{ transition: "all 0.4s ease" }}
          >
            {isCpuBusy ? activeProcName : "IDLE"}
          </text>
          {isCpuBusy && (
            <text
              x={L.cpu.x + L.cpu.w / 2}
              y={L.cpu.y + 116}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="9"
              fontFamily="'Space Mono', monospace"
            >
              executing
            </text>
          )}
        </ComponentBox>

        {/* Scheduler */}
        <ComponentBox
          x={L.scheduler.x}
          y={L.scheduler.y}
          w={L.scheduler.w}
          h={L.scheduler.h}
          title="SCHEDULER"
          subtitle={algorithm}
          color="#6c63ff"
          active={true}
        >
          <text
            x={L.scheduler.x + L.scheduler.w / 2}
            y={L.scheduler.y + 64}
            textAnchor="middle"
            fill="rgba(108,99,255,0.8)"
            fontSize="11"
            fontFamily="'Space Mono', monospace"
          >
            {isCpuBusy ? `→ ${activeProcName}` : "selecting..."}
          </text>
          <text
            x={L.scheduler.x + L.scheduler.w / 2}
            y={L.scheduler.y + 82}
            textAnchor="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize="9"
            fontFamily="'Space Mono', monospace"
          >
            {result?.metrics?.contextSwitches || 0} ctx switches
          </text>
        </ComponentBox>

        {/* Ready Queue */}
        <ComponentBox
          x={L.queue.x}
          y={L.queue.y}
          w={L.queue.w}
          h={L.queue.h}
          title="READY QUEUE"
          color="#22d3a0"
          active={readyQueue.length > 0}
        >
          <text
            x={L.queue.x + L.queue.w / 2}
            y={L.queue.y + 56}
            textAnchor="middle"
            fill={readyQueue.length > 0 ? "#22d3a0" : "rgba(255,255,255,0.2)"}
            fontSize={readyQueue.length > 0 ? "18" : "12"}
            fontFamily="'Space Mono', monospace"
            fontWeight="700"
          >
            {readyQueue.length > 0 ? readyQueue.join(" · ") : "EMPTY"}
          </text>
          <text
            x={L.queue.x + L.queue.w / 2}
            y={L.queue.y + 76}
            textAnchor="middle"
            fill="rgba(255,255,255,0.2)"
            fontSize="9"
            fontFamily="'Space Mono', monospace"
          >
            {readyQueue.length} waiting
          </text>
        </ComponentBox>

        {/* Completed */}
        <ComponentBox
          x={L.completed.x}
          y={L.completed.y}
          w={L.completed.w}
          h={L.completed.h}
          title="COMPLETED"
          color="#22d3a0"
          active={completedNames.size > 0}
        >
          <text
            x={L.completed.x + L.completed.w / 2}
            y={L.completed.y + 52}
            textAnchor="middle"
            fill="#22d3a0"
            fontSize="11"
            fontFamily="'Space Mono', monospace"
          >
            {completedNames.size > 0
              ? `✓ ${Array.from(completedNames).join(" ")}`
              : "—"}
          </text>
        </ComponentBox>

        {/* Label at bottom */}
        <text
          x={W / 2}
          y={H - 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.1)"
          fontSize="10"
          fontFamily="'Space Mono', monospace"
          letterSpacing="3"
        >
          FLOWCPU SYSTEM SIMULATOR
        </text>
      </svg>
    </div>
  );
}
