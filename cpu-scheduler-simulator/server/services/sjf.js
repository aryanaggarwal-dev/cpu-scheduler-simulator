/**
 * Shortest Job First (SJF) - Non-Preemptive
 * At each decision point, pick the ready process with the smallest burst time.
 */
const { calculateMetrics } = require('./fcfs');

function sjf(processes) {
  if (!processes || processes.length === 0) return { gantt: [], completed: [], metrics: {} };

  const procs = processes.map((p) => ({ ...p, remaining: p.burstTime }));
  const gantt = [];
  const completed = [];
  let currentTime = 0;
  let contextSwitches = 0;
  let remaining = [...procs];

  while (remaining.length > 0) {
    // All processes that have arrived
    const available = remaining.filter((p) => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      // CPU idle - jump to next arrival
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      gantt.push({ pid: 'IDLE', name: 'Idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    // Pick shortest burst (tie-break: earliest arrival, then id)
    available.sort((a, b) =>
      a.burstTime !== b.burstTime
        ? a.burstTime - b.burstTime
        : a.arrivalTime !== b.arrivalTime
        ? a.arrivalTime - b.arrivalTime
        : a.id - b.id
    );

    const proc = available[0];
    remaining = remaining.filter((p) => p.id !== proc.id);

    const startTime = currentTime;
    const endTime = startTime + proc.burstTime;

    gantt.push({ pid: proc.id, name: proc.name, start: startTime, end: endTime, color: proc.color });
    currentTime = endTime;
    contextSwitches++;

    completed.push({
      ...proc,
      startTime,
      completionTime: endTime,
      turnaroundTime: endTime - proc.arrivalTime,
      waitingTime: startTime - proc.arrivalTime,
      responseTime: startTime - proc.arrivalTime,
    });
  }

  return { gantt, completed, metrics: calculateMetrics(completed, contextSwitches, currentTime) };
}

module.exports = { sjf };
