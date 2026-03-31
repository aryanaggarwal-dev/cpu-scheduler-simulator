import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

function ProcessSlot({ proc, isActive }) {
  if (!proc) {
    return (
      <div className="queue-slot empty">
        <span style={{ fontSize: '18px', opacity: 0.3 }}>□</span>
      </div>
    );
  }
  return (
    <div
      className={`queue-slot ${proc ? 'occupied' : 'empty'}`}
      style={isActive ? {
        borderColor: proc.color,
        background: `${proc.color}22`,
        color: proc.color,
        boxShadow: `0 0 16px ${proc.color}55`,
      } : {
        borderColor: proc.color,
        background: `${proc.color}15`,
        color: proc.color,
      }}
      title={`${proc.name} | Burst: ${proc.burstTime}`}
    >
      {proc.name}
    </div>
  );
}

export default function QueueVisualizer() {
  const result = useSelector(s => s.simulation.result);
  const animationStep = useSelector(s => s.simulation.animationStep);
  const allProcesses = useSelector(s => s.simulation.processes);

  const state = useMemo(() => {
    if (!result) return null;
    const { ganttChart, processes } = result;
    if (!ganttChart || ganttChart.length === 0) return null;

    const step = animationStep === 0 ? ganttChart.length - 1 : Math.max(0, animationStep - 1);
    const currentSeg = ganttChart[step];
    const currentTime = currentSeg?.end || 0;

    const procMap = {};
    (processes || allProcesses).forEach(p => { procMap[p.name] = p; });

    const arrivedNames = new Set(allProcesses.filter(p => p.arrivalTime <= currentTime).map(p => p.name));
    const runningName = currentSeg?.process !== 'IDLE' ? currentSeg?.process : null;
    const completedNames = new Set(processes?.filter(p => p.completionTime <= (currentSeg?.start ?? 0)).map(p => p.name) || []);

    const readyQueue = Array.from(arrivedNames)
      .filter(name => name !== runningName && !completedNames.has(name))
      .map(name => procMap[name])
      .filter(Boolean);

    const completedProcs = Array.from(completedNames).map(name => procMap[name]).filter(Boolean);
    const cpuProc = runningName && procMap[runningName] ? procMap[runningName] : null;

    return { readyQueue, cpuProc, completedProcs, currentTime, currentSeg };
  }, [result, animationStep, allProcesses]);

  if (!result) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◉</div>
        <div className="empty-title">Queue visualizer</div>
        <div className="empty-desc">Run a simulation to see process queue states</div>
      </div>
    );
  }

  const { readyQueue, cpuProc, completedProcs, currentTime } = state || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Time indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-2)' }}>TIME</span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: '22px', fontWeight: 700,
          color: 'var(--accent)',
        }}>t = {currentTime}</span>
      </div>

      {/* CPU */}
      <div>
        <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-2)', marginBottom: '8px', letterSpacing: '2px' }}>
          CPU CORE
        </div>
        <div style={{
          padding: '20px',
          background: 'var(--bg-2)',
          border: `2px solid ${cpuProc ? cpuProc.color : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          transition: 'all 0.3s ease',
          boxShadow: cpuProc ? `0 0 24px ${cpuProc.color}33` : 'none',
        }}>
          {cpuProc ? (
            <>
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '50%',
                background: `${cpuProc.color}22`,
                border: `3px solid ${cpuProc.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700,
                color: cpuProc.color,
                animation: 'pulse 1.5s ease infinite',
              }}>
                {cpuProc.name}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 700, color: 'var(--text-0)' }}>
                  {cpuProc.name} — Executing
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>
                  Burst: {cpuProc.burstTime}ms · Priority: {cpuProc.priority}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="badge badge-green" style={{ animation: 'pulse 1.5s ease infinite' }}>● BUSY</span>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'var(--bg-3)', border: '2px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', opacity: 0.4,
              }}>⬡</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--text-2)' }}>IDLE</div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}>IDLE</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ready Queue */}
      <div>
        <div style={{
          fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-2)',
          marginBottom: '8px', letterSpacing: '2px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>READY QUEUE</span>
          <span style={{ color: 'var(--accent)' }}>{readyQueue?.length || 0} waiting</span>
        </div>
        {readyQueue && readyQueue.length > 0 ? (
          <div className="queue-container">
            <div className="queue-arrow">→</div>
            {readyQueue.map((proc, i) => (
              <React.Fragment key={proc.name}>
                <ProcessSlot proc={proc} />
                {i < readyQueue.length - 1 && <div className="queue-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '16px',
            background: 'var(--bg-2)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-2)',
            fontFamily: 'var(--mono)',
          }}>
            EMPTY
          </div>
        )}
      </div>

      {/* Completed */}
      <div>
        <div style={{
          fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-2)',
          marginBottom: '8px', letterSpacing: '2px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>COMPLETED</span>
          <span style={{ color: 'var(--green)' }}>{completedProcs?.length || 0} done</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(completedProcs || []).map(proc => (
            <div key={proc.name} style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: `${proc.color}15`,
              border: `1px solid ${proc.color}44`,
              color: proc.color,
              fontSize: '12px',
              fontFamily: 'var(--mono)',
              fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span>✓</span>
              {proc.name}
            </div>
          ))}
          {(!completedProcs || completedProcs.length === 0) && (
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>—</span>
          )}
        </div>
      </div>
    </div>
  );
}
