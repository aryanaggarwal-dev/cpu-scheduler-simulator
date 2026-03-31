import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

const ALGO_RULES = {
  FCFS: (seg, allProcs, step) => {
    if (seg.process === 'IDLE') return `CPU idle — no processes have arrived yet.`;
    const proc = allProcs.find(p => p.name === seg.process);
    return `Selected ${seg.process} — arrived first (t=${proc?.arrivalTime ?? '?'}). FCFS dispatches in strict arrival order.`;
  },
  SJF: (seg, allProcs, step) => {
    if (seg.process === 'IDLE') return `CPU idle — waiting for a process to arrive.`;
    const proc = allProcs.find(p => p.name === seg.process);
    return `Selected ${seg.process} (burst=${proc?.burstTime ?? '?'}) — shortest burst among ready processes. SJF minimises average waiting time.`;
  },
  SRTF: (seg, allProcs, step) => {
    if (seg.process === 'IDLE') return `CPU idle — no processes ready.`;
    const proc = allProcs.find(p => p.name === seg.process);
    return `Running ${seg.process} — has the shortest remaining time at t=${seg.start}. A new arrival can preempt this if it arrives with less remaining burst.`;
  },
  RR: (seg, allProcs, step, quantum) => {
    if (seg.process === 'IDLE') return `CPU idle — ready queue is empty.`;
    const duration = seg.end - seg.start;
    const preempted = duration === quantum;
    return `Dispatched ${seg.process} for ${duration}ms${preempted ? ` (full quantum=${quantum} — preempted, returned to back of queue)` : ` (completed burst, no preemption needed)`}.`;
  },
  HRRN: (seg, allProcs, step) => {
    if (seg.process === 'IDLE') return `CPU idle — no processes ready.`;
    const proc = allProcs.find(p => p.name === seg.process);
    return `Selected ${seg.process} — highest response ratio at t=${seg.start}. HRRN ages waiting processes to prevent starvation.`;
  },
};

export default function StepExplainer() {
  const result = useSelector(s => s.simulation.result);
  const animationStep = useSelector(s => s.simulation.animationStep);
  const inputProcesses = useSelector(s => s.simulation.processes);

  const explanation = useMemo(() => {
    if (!result) return null;
    const { ganttChart, algorithm, processes, quantum } = result;
    if (!ganttChart || ganttChart.length === 0) return null;

    const step = animationStep === 0 ? ganttChart.length - 1 : Math.max(0, animationStep - 1);
    const seg = ganttChart[step];
    if (!seg) return null;

    const allProcs = processes || inputProcesses;
    const ruleFn = ALGO_RULES[algorithm] || (() => `Step ${step + 1}: executing ${seg.process}.`);
    const text = ruleFn(seg, allProcs, step, quantum);

    // Build a snapshot of what was ready at seg.start
    const ready = allProcs
      .filter(p => p.arrivalTime <= seg.start)
      .map(p => {
        const alreadyDone = processes?.find(r => r.name === p.name)?.completionTime <= seg.start;
        return { ...p, done: alreadyDone };
      });

    return { seg, step, totalSteps: ganttChart.length, text, ready, algorithm };
  }, [result, animationStep, inputProcesses]);

  if (!explanation) return null;

  const { seg, step, totalSteps, text, ready, algorithm } = explanation;
  const activeProc = ready.find(p => p.name === seg.process && !p.done);

  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700,
          color: 'var(--text-2)', letterSpacing: '2px',
        }}>
          STEP {step + 1}/{totalSteps}
        </span>
        <span style={{
          padding: '2px 8px', borderRadius: '12px', fontSize: '10px',
          fontFamily: 'var(--mono)', fontWeight: 700,
          background: 'var(--accent-dim)', color: 'var(--accent)',
        }}>t={seg.start}→{seg.end}</span>
        {seg.process !== 'IDLE' && (
          <span style={{
            padding: '2px 8px', borderRadius: '12px', fontSize: '10px',
            fontFamily: 'var(--mono)', fontWeight: 700,
            background: `${activeProc?.color || 'var(--accent)'}22`,
            color: activeProc?.color || 'var(--accent)',
          }}>{seg.process}</span>
        )}
      </div>

      {/* Explanation text */}
      <div style={{ fontSize: '13px', color: 'var(--text-1)', lineHeight: 1.6 }}>
        {text}
      </div>

      {/* Ready queue at this moment */}
      {ready.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-2)', fontFamily: 'var(--mono)', letterSpacing: '1px' }}>
            READY AT t={seg.start}:
          </span>
          {ready.map(p => (
            <span key={p.name} style={{
              padding: '2px 8px', borderRadius: '10px', fontSize: '11px',
              fontFamily: 'var(--mono)', fontWeight: 700,
              background: p.done ? 'var(--bg-3)' : `${p.color}18`,
              border: `1px solid ${p.done ? 'var(--border)' : p.color + '55'}`,
              color: p.done ? 'var(--text-2)' : p.color,
              textDecoration: p.done ? 'line-through' : 'none',
            }}>
              {p.name}{p.done ? '✓' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
