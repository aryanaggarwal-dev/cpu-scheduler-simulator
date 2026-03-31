const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");
const { fcfs } = require("../services/fcfs");
const { sjf } = require("../services/sjf");
const { srtf } = require("../services/srtf");
const { roundRobin } = require("../services/roundRobin");
const { hrrn } = require("../services/hrrn");

// Mongoose model (optional — graceful fallback if no DB)
let Simulation;
try {
  Simulation = require("../models/Simulation");
} catch (_) {}

// ── Validation schema ──────────────────────────────────────────────────────
const processSchema = Joi.object({
  id: Joi.number().integer().min(0).required(),
  name: Joi.string().max(16).required(),
  arrivalTime: Joi.number().integer().min(0).required(),
  burstTime: Joi.number().integer().min(1).required(),
  priority: Joi.number().integer().min(1).optional(),
  color: Joi.string().optional(),
});

const simulateSchema = Joi.object({
  algorithm: Joi.string().valid("FCFS", "SJF", "SRTF", "RR", "HRRN").required(),
  processes: Joi.array().items(processSchema).min(1).max(20).required(),
  quantum: Joi.number().integer().min(1).max(20).optional(),
});

const compareSchema = Joi.object({
  algorithms: Joi.array()
    .items(Joi.string().valid("FCFS", "SJF", "SRTF", "RR", "HRRN"))
    .min(2)
    .required(),
  processes: Joi.array().items(processSchema).min(1).max(20).required(),
  quantum: Joi.number().integer().min(1).max(20).optional(),
});

// ── Algorithm dispatcher ───────────────────────────────────────────────────
function runAlgorithm(algorithm, processes, quantum) {
  switch (algorithm) {
    case "FCFS":
      return fcfs(processes);
    case "SJF":
      return sjf(processes);
    case "SRTF":
      return srtf(processes);
    case "RR":
      return roundRobin(processes, quantum || 2);
    case "HRRN":
      return hrrn(processes);
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

// ── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/simulate
 */
async function simulate(req, res, next) {
  try {
    const { error, value } = simulateSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });

    const { algorithm, processes, quantum } = value;
    const result = runAlgorithm(algorithm, processes, quantum);

    // Normalize gantt entries: backend uses { pid, name, start, end }
    // Frontend expects ganttChart: [{ process, start, end }]
    const ganttChart = (result.gantt || []).map((g) => ({
      process: g.pid === "IDLE" ? "IDLE" : g.name,
      start: g.start,
      end: g.end,
    }));

    // completed[] → processes[] with all timing fields intact
    const enrichedProcesses = (result.completed || []).map((p) => ({
      id: p.id,
      name: p.name,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      color: p.color,
      startTime: p.startTime,
      completionTime: p.completionTime,
      turnaroundTime: p.turnaroundTime,
      waitingTime: p.waitingTime,
      responseTime: p.responseTime,
    }));

    const record = {
      id: uuidv4(),
      algorithm,
      quantum: algorithm === "RR" ? quantum || 2 : undefined,
      processes: enrichedProcesses,
      ganttChart,
      metrics: result.metrics,
      gantt: result.gantt,
      completed: result.completed,
    };

    // Persist if DB available
    if (Simulation) {
      try {
        const savedDoc = await Simulation.create(record);
        console.log("✓ Simulation saved to MongoDB:", savedDoc.id);
      } catch (dbErr) {
        console.error("✗ MongoDB save error:", dbErr.message);
        // Continue regardless - return result to frontend
      }
    } else {
      console.warn("⚠ MongoDB Simulation model not available");
    }

    // Emit via Socket.io for real-time updates
    if (req.io) {
      req.io.emit("simulation:complete", {
        algorithm,
        metrics: result.metrics,
      });
    }

    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/compare
 */
async function compare(req, res, next) {
  try {
    const { error, value } = compareSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });

    const { algorithms, processes, quantum } = value;

    const resultsArray = algorithms.map((algo) => {
      const r = runAlgorithm(algo, processes, quantum);
      const ganttChart = (r.gantt || []).map((g) => ({
        process: g.pid === "IDLE" ? "IDLE" : g.name,
        start: g.start,
        end: g.end,
      }));
      const enrichedProcesses = (r.completed || []).map((p) => ({
        id: p.id,
        name: p.name,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        color: p.color,
        startTime: p.startTime,
        completionTime: p.completionTime,
        turnaroundTime: p.turnaroundTime,
        waitingTime: p.waitingTime,
        responseTime: p.responseTime,
      }));
      return {
        algorithm: algo,
        processes: enrichedProcesses,
        ganttChart,
        metrics: r.metrics,
      };
    });

    res.json({ success: true, data: resultsArray });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/history
 */
async function getHistory(req, res, next) {
  try {
    if (!Simulation) return res.json({ success: true, data: [] });

    const { page = 1, limit = 10, algorithm } = req.query;
    const filter = algorithm ? { algorithm } : {};

    const docs = await Simulation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Simulation.countDocuments(filter);

    res.json({
      success: true,
      data: docs,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/save
 */
async function saveSimulation(req, res, next) {
  try {
    if (!Simulation)
      return res
        .status(503)
        .json({ success: false, error: "Database not available" });

    const doc = await Simulation.findOneAndUpdate(
      { id: req.body.id },
      { $set: { saved: true, label: req.body.label } },
      { new: true },
    );
    if (!doc) return res.status(404).json({ success: false, error: 'Simulation not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/history/:id
 */
async function deleteSimulation(req, res, next) {
  try {
    if (!Simulation)
      return res
        .status(503)
        .json({ success: false, error: "Database not available" });
    const result = await Simulation.findOneAndDelete({ id: req.params.id });
    if (!result) return res.status(404).json({ success: false, error: 'Simulation not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  simulate,
  compare,
  getHistory,
  saveSimulation,
  deleteSimulation,
};
