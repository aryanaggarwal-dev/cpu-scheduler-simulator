# FlowCPU — CPU Scheduling Algorithms Visualizer

An interactive, full-stack web application that simulates and animates 5 CPU scheduling algorithms in real time. Built with the MERN stack.

---

## Features

- **5 Scheduling Algorithms**: FCFS, SJF, SRTF, Round Robin, HRRN
- **Animated Gantt Chart** with per-process rows and step-by-step playback
- **Queue Visualizer** showing CPU state, Ready Queue, and Completed processes at each step
- **Metrics Dashboard** with Avg Waiting, Turnaround, Response Time, CPU Utilization, Throughput, Context Switches
- **System Motherboard** — SVG animation of CPU, RAM, Cache, Scheduler, I/O with live data buses
- **Algorithm Comparison** — run all 5 algorithms on the same process set, compare with bar/radar charts
- **Simulation History** — past runs saved to MongoDB
- **Step Controls** — play, pause, scrub, speed (0.5×–4×) on all animated views
- **Random & Preset processes** — instant test data generation

---

## Project Structure

```
cpu-scheduler-simulator/
├── client/                  # React frontend
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js           # Router + sidebar layout
│   │   ├── index.js         # Entry point
│   │   ├── components/
│   │   │   ├── InputForm/        # Algorithm selector + process table
│   │   │   ├── GanttChart/       # Animated timeline
│   │   │   ├── QueueVisualizer/  # CPU / Ready Queue / Completed
│   │   │   ├── MetricsPanel/     # KPI cards + per-process chart
│   │   │   ├── Motherboard/      # SVG system simulation
│   │   │   └── common/
│   │   │       └── Notifications.js
│   │   ├── hooks/
│   │   │   ├── store.js          # Redux store
│   │   │   ├── simulationSlice.js
│   │   │   └── uiSlice.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js      # /
│   │   │   ├── Visualization.js  # /visualize
│   │   │   ├── MotherboardPage.js # /motherboard
│   │   │   ├── ComparisonPage.js # /compare
│   │   │   └── HistoryPage.js    # /history
│   │   ├── services/api.js       # Axios client
│   │   └── styles/global.css     # Full design system
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                  # Express backend
│   ├── index.js             # Express + Socket.io + MongoDB
│   ├── controllers/
│   │   └── simulationController.js
│   ├── routes/
│   │   └── simulationRoutes.js
│   ├── services/            # Pure algorithm implementations
│   │   ├── fcfs.js
│   │   ├── sjf.js
│   │   ├── srtf.js
│   │   ├── roundRobin.js
│   │   └── hrrn.js
│   ├── models/
│   │   └── Simulation.js    # Mongoose schema
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── .env
│   └── Dockerfile
│
├── docker-compose.yml
├── package.json             # Root monorepo scripts
└── README.md
```

---

## Quick Start

### Option 1 — Local Development

**Prerequisites**: Node 18+, MongoDB running locally

```bash
# 1. Clone and install
git clone <repo-url>
cd cpu-scheduler-simulator
npm run install:all

# 2. Configure server environment
# server/.env is pre-configured for local MongoDB:
#   PORT=5000
#   MONGO_URI=mongodb://localhost:27017/cpu-scheduler
#   CLIENT_URL=http://localhost:3000

# 3. Start both servers concurrently
npm install          # installs concurrently
npm run dev

# Frontend → http://localhost:3000
# Backend  → http://localhost:5000
```

> **No MongoDB?** The server starts fine without it. Algorithms run fully in-memory; only History saving is disabled.

### Option 2 — Docker

```bash
docker-compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:5000
# MongoDB  → localhost:27017
```

---

## API Reference

### `POST /api/simulate`

Run a single algorithm.

**Request:**

```json
{
  "algorithm": "FCFS",
  "processes": [
    {
      "id": 0,
      "name": "P1",
      "arrivalTime": 0,
      "burstTime": 8,
      "priority": 3,
      "color": "#6c63ff"
    }
  ],
  "quantum": 2
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "algorithm": "FCFS",
    "ganttChart": [{ "process": "P1", "start": 0, "end": 8 }],
    "processes": [
      {
        "name": "P1",
        "completionTime": 8,
        "turnaroundTime": 8,
        "waitingTime": 0,
        "responseTime": 0
      }
    ],
    "metrics": {
      "avgWaitingTime": 0,
      "avgTurnaroundTime": 8,
      "avgResponseTime": 0,
      "cpuUtilization": 100,
      "throughput": 0.125,
      "contextSwitches": 1,
      "totalTime": 8
    }
  }
}
```

### `POST /api/compare`

Run multiple algorithms on the same process set. Returns an array.

**Request:**

```json
{
  "algorithms": ["FCFS", "SJF", "SRTF", "RR", "HRRN"],
  "processes": [...],
  "quantum": 2
}
```

**Response:** `{ "success": true, "data": [ { "algorithm": "FCFS", "ganttChart": [...], "processes": [...], "metrics": {...} }, ... ] }`

### `GET /api/history?page=1&limit=10&algorithm=FCFS`

Fetch saved simulations (requires MongoDB).

### `GET /api/health`

Health check: `{ "status": "ok", "timestamp": "..." }`

---

## Algorithms

| Algorithm   | Type           | Starvation | Context Switches |
| ----------- | -------------- | ---------- | ---------------- |
| FCFS        | Non-preemptive | No         | Low              |
| SJF         | Non-preemptive | Yes        | Low              |
| SRTF        | Preemptive     | Yes        | High             |
| Round Robin | Preemptive     | No         | High             |
| HRRN        | Non-preemptive | No         | Low              |

**HRRN** computes response ratio `(waitingTime + burstTime) / burstTime` at each decision point, naturally preventing starvation by aging waiting processes.

---

## How Animation Works

Each simulation returns a `ganttChart` array — one entry per execution segment. The `animationStep` in Redux (0 = show all, N = show first N segments) drives:

- **GanttChart**: segments beyond `animationStep` are ghosted (opacity 0.1)
- **QueueVisualizer**: derives CPU state, ready queue, and completed list from `ganttChart[step-1]`
- **Motherboard SVG**: component glow, particle buses, queue text all react to current step

Playback is driven by `setInterval` with a stable `useRef` to avoid stale closure bugs. Speed multiplier divides the base interval (1200ms for Visualization, 1000ms for Motherboard).

---

## Tech Stack

| Layer              | Technology                          |
| ------------------ | ----------------------------------- |
| Frontend framework | React 18                            |
| State management   | Redux Toolkit                       |
| Routing            | React Router v6                     |
| Charts             | Recharts                            |
| Animations         | CSS keyframes + SVG `animateMotion` |
| HTTP client        | Axios                               |
| Real-time          | Socket.io client                    |
| Backend            | Node.js + Express                   |
| Validation         | Joi                                 |
| Database           | MongoDB + Mongoose                  |
| Real-time server   | Socket.io                           |
| Containerization   | Docker + nginx                      |
| Fonts              | Space Mono + DM Sans                |
