/**
 * Shortest Remaining Time First (SRTF) - Preemptive SJF
 * At every time unit the process with the least remaining burst time runs.
 * A new arrival preempts the current process if it has a shorter remaining time.
 */
const { calculateMetrics } = require('./fcfs');

function srtf(processes) {
  if (!processes || processes.length === 0) return { gantt: [], completed: [], metrics: {} };

  const procs = processes.map((p) => ({
    ...p,
    remaining: p.burstTime,
    startTime: null,
    firstRun: false,
  }));

  const gantt = [];
  const completed = [];
  let contextSwitches = 0;
  let currentTime = Math.min(...procs.map((p) => p.arrivalTime));
  let remaining = [...procs];
  let currentProc = null;
  let sliceStart = currentTime;

  while (remaining.length > 0 || currentProc) {
    const available = remaining.filter((p) => p.arrivalTime <= currentTime);

    // ── Handle idle CPU ───────────────────────────────────────────────────
    if (available.length === 0 && !currentProc) {
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      mergeOrPush(gantt, { pid: 'IDLE', name: 'Idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      sliceStart = currentTime;
      continue;
    }

    // ── Pick best process ─────────────────────────────────────────────────
    let nextProc = currentProc; // default: keep running the same one
    if (available.length > 0) {
      const best = available.reduce((min, p) =>
        p.remaining < min.remaining ||
        (p.remaining === min.remaining && p.arrivalTime < min.arrivalTime)
          ? p : min
      );
      // Preempt only if a different process is strictly shorter
      if (!currentProc || best.remaining < currentProc.remaining) {
        nextProc = best;
      }
    }

    // ── Context switch ────────────────────────────────────────────────────
    if (nextProc !== currentProc) {
      // Flush outgoing slice
      if (currentProc && currentTime > sliceStart) {
        mergeOrPush(gantt, {
          pid: currentProc.id, name: currentProc.name,
          start: sliceStart, end: currentTime, color: currentProc.color,
        });
        contextSwitches++;
      }
      currentProc = nextProc;
      sliceStart = currentTime;
    }

    // Guard: if still no process (shouldn't happen after idle check above)
    if (!currentProc) {
      currentTime++;
      continue;
    }

    // ── Mark first execution ──────────────────────────────────────────────
    if (!currentProc.firstRun) {
      currentProc.startTime = currentTime;
      currentProc.firstRun = true;
    }

    // ── Execute 1 time unit ───────────────────────────────────────────────
    currentProc.remaining--;
    currentTime++;

    // ── Process completion ────────────────────────────────────────────────
    if (currentProc.remaining === 0) {
      mergeOrPush(gantt, {
        pid: currentProc.id, name: currentProc.name,
        start: sliceStart, end: currentTime, color: currentProc.color,
      });
      contextSwitches++;

      completed.push({
        ...currentProc,
        completionTime: currentTime,
        turnaroundTime: currentTime - currentProc.arrivalTime,
        waitingTime: currentTime - currentProc.arrivalTime - currentProc.burstTime,
        responseTime: currentProc.startTime - currentProc.arrivalTime,
      });

      remaining = remaining.filter((p) => p.id !== currentProc.id);
      currentProc = null;
      sliceStart = currentTime;
    }
  }

  return { gantt, completed, metrics: calculateMetrics(completed, contextSwitches, currentTime) };
}

function mergeOrPush(gantt, entry) {
  if (gantt.length > 0) {
    const last = gantt[gantt.length - 1];
    if (last.pid === entry.pid && last.end === entry.start) {
      last.end = entry.end;
      return;
    }
  }
  gantt.push(entry);
}

module.exports = { srtf };
