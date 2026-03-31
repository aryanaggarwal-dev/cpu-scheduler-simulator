import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setAnimationStep, setIsAnimating, resetAnimation, setAnimationSpeed } from '../hooks/simulationSlice';
import Motherboard from '../components/Motherboard/Motherboard';

export default function MotherboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { result, animationStep, isAnimating, animationSpeed } = useSelector(s => s.simulation);
  const totalSteps = result?.ganttChart?.length || 0;
  const timerRef = useRef(null);
  const stepRef = useRef(animationStep);
  useEffect(() => { stepRef.current = animationStep; }, [animationStep]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (isAnimating && result) {
      timerRef.current = setInterval(() => {
        const next = stepRef.current + 1;
        if (next > totalSteps) {
          dispatch(setIsAnimating(false));
        } else {
          dispatch(setAnimationStep(next));
        }
      }, Math.round(1000 / (animationSpeed || 1)));
    }
    return () => clearInterval(timerRef.current);
  }, [isAnimating, totalSteps, animationSpeed, dispatch, result]);

  if (!result) {
    return (
      <div className="page">
        <div className="empty-state" style={{ marginTop: '60px' }}>
          <div className="empty-icon">◉</div>
          <div className="empty-title">No system state</div>
          <div className="empty-desc">Run a simulation first to see the system animation</div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">System Simulation</div>
          <div className="page-subtitle">Interactive motherboard view — CPU, Memory, Scheduler</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[0.5, 1, 2, 4].map(s => (
            <button
              key={s}
              className={`btn btn-secondary btn-sm`}
              style={animationSpeed === s ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
              onClick={() => dispatch(setAnimationSpeed(s))}
            >{s}×</button>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={() => dispatch(resetAnimation())}>⏮ Reset</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => dispatch(setIsAnimating(!isAnimating))}
          >
            {isAnimating ? '⏸ Pause' : '▶ Animate'}
          </button>
        </div>
      </div>

      {/* Step slider */}
      <div className="step-controls" style={{ marginBottom: '20px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-2)' }}>STEP</span>
        <input
          type="range"
          className="step-slider"
          min={0}
          max={totalSteps}
          value={animationStep}
          onChange={e => {
            dispatch(setIsAnimating(false));
            dispatch(setAnimationStep(Number(e.target.value)));
          }}
        />
        <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-1)', minWidth: '80px' }}>
          {animationStep === 0 ? 'final' : `${animationStep} / ${totalSteps}`}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => dispatch(setAnimationStep(Math.max(0, animationStep - 1)))}
        >◀</button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => dispatch(setAnimationStep(Math.min(totalSteps, animationStep + 1)))}
        >▶</button>
      </div>

      {/* Motherboard */}
      <Motherboard />

      {/* Legend */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <span className="card-title">Component Legend</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { color: 'var(--accent)', name: 'CPU Core', desc: 'Executes the active process' },
            { color: 'var(--cyan)', name: 'Memory / RAM', desc: 'Holds PCB of all processes' },
            { color: 'var(--purple)', name: 'L2 Cache', desc: 'Stores scheduler state' },
            { color: '#6c63ff', name: 'Scheduler', desc: 'Decides next process to run' },
            { color: 'var(--green)', name: 'Ready Queue', desc: 'Processes waiting for CPU' },
            { color: 'var(--green)', name: 'Completed', desc: 'Finished processes' },
          ].map(item => (
            <div key={item.name} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '3px',
                background: item.color, flexShrink: 0, marginTop: '3px',
              }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-0)' }}>{item.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
