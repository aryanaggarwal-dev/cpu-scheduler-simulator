import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { simulateAPI, compareAPI, getHistoryAPI } from "../services/api";

// ── Async thunks ──────────────────────────────────────────────────────────

export const runSimulation = createAsyncThunk(
  "simulation/run",
  async ({ algorithm, processes, quantum }, { rejectWithValue }) => {
    try {
      const res = await simulateAPI({ algorithm, processes, quantum });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);

export const runComparison = createAsyncThunk(
  "simulation/compare",
  async ({ algorithms, processes, quantum }, { rejectWithValue }) => {
    try {
      const res = await compareAPI({ algorithms, processes, quantum });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);

export const fetchHistory = createAsyncThunk(
  "simulation/history",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getHistoryAPI(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);

// ── Default processes ─────────────────────────────────────────────────────
const PROCESS_COLORS = [
  "#6c63ff",
  "#22d3a0",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
  "#10b981",
];

const defaultProcesses = [
  {
    id: 0,
    name: "P1",
    arrivalTime: 0,
    burstTime: 8,
    priority: 3,
    color: PROCESS_COLORS[0],
  },
  {
    id: 1,
    name: "P2",
    arrivalTime: 1,
    burstTime: 4,
    priority: 1,
    color: PROCESS_COLORS[1],
  },
  {
    id: 2,
    name: "P3",
    arrivalTime: 2,
    burstTime: 9,
    priority: 4,
    color: PROCESS_COLORS[2],
  },
  {
    id: 3,
    name: "P4",
    arrivalTime: 3,
    burstTime: 5,
    priority: 2,
    color: PROCESS_COLORS[3],
  },
];

// ── Slice ─────────────────────────────────────────────────────────────────
const simulationSlice = createSlice({
  name: "simulation",
  initialState: {
    // Input state
    processes: defaultProcesses,
    algorithm: "FCFS",
    quantum: 2,
    nextId: defaultProcesses.length,

    // Result state
    result: null,
    comparisonResults: null,
    history: [],
    historyPagination: {},

    // Loading
    loading: false,
    compareLoading: false,
    historyLoading: false,
    error: null,

    // Animation
    animationStep: 0,
    isAnimating: false,
    animationSpeed: 1,
  },
  reducers: {
    setAlgorithm(state, { payload }) {
      state.algorithm = payload;
    },
    setQuantum(state, { payload }) {
      state.quantum = payload;
    },
    setAnimationSpeed(state, { payload }) {
      state.animationSpeed = payload;
    },

    addProcess(state) {
      const id = state.nextId++;
      state.processes.push({
        id,
        name: `P${id + 1}`,
        arrivalTime: 0,
        burstTime: 4,
        priority: 1,
        color: PROCESS_COLORS[id % PROCESS_COLORS.length],
      });
    },

    removeProcess(state, { payload: id }) {
      state.processes = state.processes.filter((p) => p.id !== id);
    },

    updateProcess(state, { payload: { id, field, value } }) {
      const proc = state.processes.find((p) => p.id === id);
      if (proc) proc[field] = value;
    },

    randomizeProcesses(state) {
      const count = Math.floor(Math.random() * 4) + 3; // 3–6
      state.processes = Array.from({ length: count }, (_, i) => ({
        id: i,
        name: `P${i + 1}`,
        arrivalTime: Math.floor(Math.random() * 8),
        burstTime: Math.floor(Math.random() * 10) + 1,
        priority: Math.floor(Math.random() * 5) + 1,
        color: PROCESS_COLORS[i % PROCESS_COLORS.length],
      }));
      state.nextId = count;
    },

    loadPreset(state, { payload }) {
      const presets = {
        demo: [
          {
            id: 0,
            name: "P1",
            arrivalTime: 0,
            burstTime: 8,
            priority: 3,
            color: PROCESS_COLORS[0],
          },
          {
            id: 1,
            name: "P2",
            arrivalTime: 1,
            burstTime: 4,
            priority: 1,
            color: PROCESS_COLORS[1],
          },
          {
            id: 2,
            name: "P3",
            arrivalTime: 2,
            burstTime: 9,
            priority: 4,
            color: PROCESS_COLORS[2],
          },
          {
            id: 3,
            name: "P4",
            arrivalTime: 3,
            burstTime: 5,
            priority: 2,
            color: PROCESS_COLORS[3],
          },
        ],
        starvation: [
          {
            id: 0,
            name: "P1",
            arrivalTime: 0,
            burstTime: 20,
            priority: 5,
            color: PROCESS_COLORS[0],
          },
          {
            id: 1,
            name: "P2",
            arrivalTime: 1,
            burstTime: 2,
            priority: 1,
            color: PROCESS_COLORS[1],
          },
          {
            id: 2,
            name: "P3",
            arrivalTime: 2,
            burstTime: 3,
            priority: 2,
            color: PROCESS_COLORS[2],
          },
          {
            id: 3,
            name: "P4",
            arrivalTime: 3,
            burstTime: 1,
            priority: 1,
            color: PROCESS_COLORS[3],
          },
        ],
        burst: [
          {
            id: 0,
            name: "P1",
            arrivalTime: 0,
            burstTime: 1,
            priority: 1,
            color: PROCESS_COLORS[0],
          },
          {
            id: 1,
            name: "P2",
            arrivalTime: 0,
            burstTime: 10,
            priority: 2,
            color: PROCESS_COLORS[1],
          },
          {
            id: 2,
            name: "P3",
            arrivalTime: 0,
            burstTime: 3,
            priority: 1,
            color: PROCESS_COLORS[2],
          },
          {
            id: 3,
            name: "P4",
            arrivalTime: 0,
            burstTime: 7,
            priority: 3,
            color: PROCESS_COLORS[3],
          },
          {
            id: 4,
            name: "P5",
            arrivalTime: 0,
            burstTime: 5,
            priority: 2,
            color: PROCESS_COLORS[4],
          },
        ],
      };
      if (presets[payload]) {
        state.processes = presets[payload];
        state.nextId = presets[payload].length;
      }
    },

    setAnimationStep(state, { payload }) {
      state.animationStep = payload;
    },
    setIsAnimating(state, { payload }) {
      state.isAnimating = payload;
    },
    resetAnimation(state) {
      state.animationStep = 0;
      state.isAnimating = false;
    },
    clearError(state) {
      state.error = null;
    },
    clearResult(state) {
      state.result = null;
      state.animationStep = 0;
    },
    loadPastSimulation(state, { payload }) {
      // Load a past simulation: set processes, algorithm, quantum, and result
      const { processes, algorithm, quantum, result } = payload;
      state.processes = processes;
      state.algorithm = algorithm;
      state.quantum = quantum || 2;
      state.result = result;
      state.animationStep = 0;
      state.isAnimating = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Simulate
      .addCase(runSimulation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(runSimulation.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.result = payload;
        state.animationStep = 0;
        state.isAnimating = false;
      })
      .addCase(runSimulation.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Compare
      .addCase(runComparison.pending, (state) => {
        state.compareLoading = true;
        state.error = null;
      })
      .addCase(runComparison.fulfilled, (state, { payload }) => {
        state.compareLoading = false;
        state.comparisonResults = payload;
      })
      .addCase(runComparison.rejected, (state, { payload }) => {
        state.compareLoading = false;
        state.error = payload;
      })
      // History
      .addCase(fetchHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchHistory.fulfilled, (state, { payload }) => {
        state.historyLoading = false;
        state.history = payload.data || [];
        state.historyPagination = payload.pagination || {};
      })
      .addCase(fetchHistory.rejected, (state) => {
        state.historyLoading = false;
      });
  },
});

export const {
  setAlgorithm,
  setQuantum,
  setAnimationSpeed,
  addProcess,
  removeProcess,
  updateProcess,
  randomizeProcesses,
  loadPreset,
  setAnimationStep,
  setIsAnimating,
  resetAnimation,
  clearError,
  clearResult,
  loadPastSimulation,
} = simulationSlice.actions;

export default simulationSlice.reducer;
