/**
 * Round Robin (RR) Scheduling Algorithm - Preemptive
 * Each process gets a fixed time quantum. Preempted processes go back to the ready queue.
 */
const { calculateMetrics } = require('./fcfs');

function roundRobin(processes, quantum = 2) {
  if (!processes || processes.length === 0) return { gantt: [], completed: [], metrics: {} };
  if (quantum < 1) quantum = 1;

  const procs = processes.map((p) => ({
    ...p,
    remaining: p.burstTime,
    startTime: null,
    firstRun: false,
  }));

  // Sort by arrival time initially
  procs.sort((a, b) => a.arrivalTime - b.arrivalTime);

  const gantt = [];
  const completed = [];
  let contextSwitches = 0;
  let currentTime = procs[0].arrivalTime;
  const readyQueue = [];
  let procPool = [...procs]; // not-yet-enqueued processes

  // Enqueue all processes arriving at or before currentTime
  const enqueue = (time) => {
    const arrived = procPool.filter((p) => p.arrivalTime <= time);
    arrived.forEach((p) => readyQueue.push(p));
    procPool = procPool.filter((p) => p.arrivalTime > time);
  };

  enqueue(currentTime);

  while (readyQueue.length > 0 || procPool.length > 0) {
    if (readyQueue.length === 0) {
      // CPU idle
      const nextArrival = Math.min(...procPool.map((p) => p.arrivalTime));
      gantt.push({ pid: 'IDLE', name: 'Idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      enqueue(currentTime);
      continue;
    }

    const proc = readyQueue.shift();

    // First run → record response time
    if (!proc.firstRun) {
      proc.startTime = currentTime;
      proc.firstRun = true;
    }

    const execTime = Math.min(quantum, proc.remaining);
    const start = currentTime;
    const end = start + execTime;

    gantt.push({ pid: proc.id, name: proc.name, start, end, color: proc.color });
    contextSwitches++;
    currentTime = end;
    proc.remaining -= execTime;

    // Enqueue any processes that arrived during this quantum
    enqueue(currentTime);

    if (proc.remaining === 0) {
      completed.push({
        ...proc,
        completionTime: currentTime,
        turnaroundTime: currentTime - proc.arrivalTime,
        waitingTime: currentTime - proc.arrivalTime - proc.burstTime,
        responseTime: proc.startTime - proc.arrivalTime,
      });
    } else {
      // Process preempted — goes to back of queue
      readyQueue.push(proc);
    }
  }

  return { gantt, completed, metrics: calculateMetrics(completed, contextSwitches, currentTime) };
}

module.exports = { roundRobin };
