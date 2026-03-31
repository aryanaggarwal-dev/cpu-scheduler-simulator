/**
 * First Come First Serve (FCFS) Scheduling Algorithm
 * Non-preemptive: processes execute in arrival order until completion.
 */

/**
 * @param {Array} processes - Array of { id, name, arrivalTime, burstTime, priority? }
 * @returns {Object} { gantt, completed, metrics }
 */
function fcfs(processes) {
  if (!processes || processes.length === 0) return emptyResult();

  // Sort by arrival time (ties broken by original order / id)
  const sorted = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime ? a.arrivalTime - b.arrivalTime : a.id - b.id
  );

  const gantt = [];        // [{ pid, name, start, end }]
  const completed = [];    // enriched process objects
  let currentTime = 0;
  let contextSwitches = 0;

  for (const proc of sorted) {
    // CPU must wait if process hasn't arrived yet
    if (currentTime < proc.arrivalTime) {
      gantt.push({ pid: 'IDLE', name: 'Idle', start: currentTime, end: proc.arrivalTime });
      currentTime = proc.arrivalTime;
    }

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

function calculateMetrics(completed, contextSwitches, totalTime) {
  const n = completed.length;
  if (n === 0) return {};

  const avgWaiting = completed.reduce((s, p) => s + p.waitingTime, 0) / n;
  const avgTurnaround = completed.reduce((s, p) => s + p.turnaroundTime, 0) / n;
  const avgResponse = completed.reduce((s, p) => s + p.responseTime, 0) / n;

  const firstArrival = Math.min(...completed.map((p) => p.arrivalTime));
  const lastCompletion = Math.max(...completed.map((p) => p.completionTime));
  const span = lastCompletion - firstArrival || 1;

  const busyTime = completed.reduce((s, p) => s + p.burstTime, 0);
  const cpuUtilization = (busyTime / (totalTime - firstArrival)) * 100;
  const throughput = n / span;

  return {
    avgWaitingTime: +avgWaiting.toFixed(2),
    avgTurnaroundTime: +avgTurnaround.toFixed(2),
    avgResponseTime: +avgResponse.toFixed(2),
    cpuUtilization: +cpuUtilization.toFixed(2),
    throughput: +throughput.toFixed(4),
    contextSwitches,
    totalTime,
  };
}

function emptyResult() {
  return { gantt: [], completed: [], metrics: {} };
}

module.exports = { fcfs, calculateMetrics };
