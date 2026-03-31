/**
 * Highest Response Ratio Next (HRRN) - Non-Preemptive
 * Priority = (Waiting Time + Burst Time) / Burst Time = (Response Ratio)
 * Prevents starvation by aging waiting processes.
 */
const { calculateMetrics } = require('./fcfs');

function hrrn(processes) {
  if (!processes || processes.length === 0) return { gantt: [], completed: [], metrics: {} };

  const procs = processes.map((p) => ({ ...p }));
  const gantt = [];
  const completed = [];
  let currentTime = Math.min(...procs.map((p) => p.arrivalTime));
  let remaining = [...procs];
  let contextSwitches = 0;

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      gantt.push({ pid: 'IDLE', name: 'Idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    // Calculate response ratio for each available process
    const withRatio = available.map((p) => {
      const waitingTime = currentTime - p.arrivalTime;
      const responseRatio = (waitingTime + p.burstTime) / p.burstTime;
      return { ...p, responseRatio };
    });

    // Select process with highest response ratio (tie: earliest arrival)
    withRatio.sort((a, b) =>
      b.responseRatio !== a.responseRatio
        ? b.responseRatio - a.responseRatio
        : a.arrivalTime - b.arrivalTime
    );

    const proc = withRatio[0];
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

module.exports = { hrrn };
