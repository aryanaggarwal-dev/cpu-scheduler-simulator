import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function GanttChart({ result: resultProp, animationStep: stepProp }) {
  const storeResult = useSelector(s => s.simulation.result);
  const storeStep = useSelector(s => s.simulation.animationStep);

  const result = resultProp || storeResult;
  const animationStep = stepProp !== undefined ? stepProp : storeStep;

  const { ganttData, processes } = useMemo(() => {
    if (!result) return { ganttData: [], processes: [] };
    return {
      ganttData: result.ganttChart || [],
      processes: result.processes || [],
    };
  }, [result]);

  if (!result || ganttData.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◈</div>
        <div className="empty-title">No simulation data</div>
        <div className="empty-desc">Run a simulation to see the Gantt chart timeline</div>
      </div>
    );
  }

  const totalTime = ganttData[ganttData.length - 1]?.end || 1;
  const visibleUntil = animationStep === 0 ? totalTime : (ganttData[animationStep - 1]?.end || totalTime);

  // Tick marks
  const tickCount = Math.min(totalTime, 30);
  const tickStep = Math.ceil(totalTime / tickCount);
  const ticks = [];
  for (let t = 0; t <= totalTime; t += tickStep) ticks.push(t);
  if (ticks[ticks.length - 1] !== totalTime) ticks.push(totalTime);

  const toPercent = (t) => `${(t / totalTime) * 100}%`;

  return (
    <div className="gantt-wrapper">
      <div className="gantt-chart" style={{ padding: '4px 0' }}>
        {/* Combined timeline row */}
        <div className="gantt-row">
          <div className="gantt-label">ALL</div>
          <div className="gantt-bar-track" style={{ height: '40px' }}>
            {ganttData.map((seg, idx) => {
              const visible = seg.end <= visibleUntil || animationStep === 0;
              const isIdle = seg.process === 'IDLE';
              const proc = processes.find(p => p.name === seg.process);
              const color = proc?.color || '#6c63ff';
              const left = toPercent(seg.start);
              const width = `calc(${toPercent(seg.end - seg.start)} - 2px)`;
              return (
                <div
                  key={idx}
                  className={`gantt-segment ${isIdle ? 'gantt-idle' : ''}`}
                  style={{
                    left,
                    width,
                    backgroundColor: isIdle ? 'transparent' : color,
                    opacity: visible ? 1 : 0.15,
                  }}
                  title={`${seg.process}: ${seg.start}–${seg.end}`}
                >
                  {!isIdle && (seg.end - seg.start) > totalTime / 15 ? seg.process : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-process rows */}
        {processes.map(proc => {
          const procSegs = ganttData.filter(s => s.process === proc.name);
          if (procSegs.length === 0) return null;
          return (
            <div key={proc.name} className="gantt-row">
              <div className="gantt-label" style={{ color: proc.color }}>{proc.name}</div>
              <div className="gantt-bar-track">
                {procSegs.map((seg, idx) => {
                  const visible = seg.end <= visibleUntil || animationStep === 0;
                  return (
                    <div
                      key={idx}
                      className="gantt-segment"
                      style={{
                        left: toPercent(seg.start),
                        width: `calc(${toPercent(seg.end - seg.start)} - 2px)`,
                        backgroundColor: proc.color,
                        opacity: visible ? 1 : 0.1,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* IDLE row */}
        {ganttData.some(s => s.process === 'IDLE') && (
          <div className="gantt-row">
            <div className="gantt-label" style={{ color: 'var(--text-2)' }}>IDLE</div>
            <div className="gantt-bar-track">
              {ganttData.filter(s => s.process === 'IDLE').map((seg, idx) => (
                <div
                  key={idx}
                  className="gantt-segment gantt-idle"
                  style={{
                    left: toPercent(seg.start),
                    width: `calc(${toPercent(seg.end - seg.start)} - 2px)`,
                    opacity: (seg.end <= visibleUntil || animationStep === 0) ? 1 : 0.1,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tick marks */}
        <div className="gantt-row" style={{ marginTop: '6px' }}>
          <div style={{ width: '40px' }} />
          <div style={{ flex: 1, position: 'relative', height: '16px' }}>
            {ticks.map(t => (
              <div
                key={t}
                style={{
                  position: 'absolute',
                  left: toPercent(t),
                  fontSize: '9px',
                  fontFamily: 'var(--mono)',
                  color: 'var(--text-2)',
                  transform: 'translateX(-50%)',
                  userSelect: 'none',
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px', paddingLeft: '40px' }}>
          {processes.map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-1)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: p.color, display: 'inline-block' }} />
              {p.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
