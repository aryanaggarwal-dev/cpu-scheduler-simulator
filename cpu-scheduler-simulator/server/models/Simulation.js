const mongoose = require("mongoose");

const processSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    arrivalTime: Number,
    burstTime: Number,
    priority: Number,
    color: String,
    startTime: Number,
    completionTime: Number,
    turnaroundTime: Number,
    waitingTime: Number,
    responseTime: Number,
  },
  { _id: false },
);

const ganttEntrySchema = new mongoose.Schema(
  {
    pid: mongoose.Schema.Types.Mixed,
    name: String,
    start: Number,
    end: Number,
    color: String,
  },
  { _id: false },
);

const metricsSchema = new mongoose.Schema(
  {
    avgWaitingTime: Number,
    avgTurnaroundTime: Number,
    avgResponseTime: Number,
    cpuUtilization: Number,
    throughput: Number,
    contextSwitches: Number,
    totalTime: Number,
  },
  { _id: false },
);

const simulationSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, required: true, index: true },
    algorithm: {
      type: String,
      enum: ["FCFS", "SJF", "SRTF", "RR", "HRRN"],
      required: true,
    },
    quantum: Number,
    processes: [processSchema],
    ganttChart: [
      {
        process: String,
        start: Number,
        end: Number,
      },
    ],
    metrics: metricsSchema,
    gantt: [ganttEntrySchema],
    completed: [processSchema],
    saved: { type: Boolean, default: false },
    label: String,
  },
  {
    timestamps: true,
    strict: false, // Allow additional fields
  },
);

simulationSchema.index({ createdAt: -1 });
simulationSchema.index({ algorithm: 1 });

module.exports = mongoose.model("Simulation", simulationSchema);
