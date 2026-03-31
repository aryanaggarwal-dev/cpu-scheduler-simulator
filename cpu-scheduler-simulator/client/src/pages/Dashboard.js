import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { runSimulation, clearError } from '../hooks/simulationSlice';
import { addNotification } from '../hooks/uiSlice';
import InputForm from '../components/InputForm/InputForm';

const ALGO_INFO = {
  FCFS:  { type: 'Non-preemptive', bestFor: 'Batch systems, simple queues',       risk: 'Convoy effect with long jobs' },
  SJF:   { type: 'Non-preemptive', bestFor: 'Minimising average wait time',       risk: 'Starvation of long processes' },
  SRTF:  { type: 'Preemptive',     bestFor: 'Optimal average wait (theoretically)', risk: 'High context switch overhead' },
  RR:    { type: 'Preemptive',     bestFor: 'Time-sharing, fair scheduling',       risk: 'High TAT if quantum too small' },
  HRRN:  { type: 'Non-preemptive', bestFor: 'Balanced fairness + efficiency',     risk: 'Higher complexity than FCFS/SJF' },
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { processes, algorithm, quantum, loading, error, result } = useSelector(s => s.simulation);
  const info = ALGO_INFO[algorithm] || {};

  const totalBurst = processes.reduce((a, p) => a + p.burstTime, 0);
  const maxArrival = processes.length ? Math.max(...processes.map(p => p.arrivalTime)) : 0;
  const avgBurst = processes.length ? (totalBurst / processes.length).toFixed(1) : 0;

  const handleRun = async () => {
    if (processes.length === 0) return;
    dispatch(clearError());
    const action = await dispatch(runSimulation({ algorithm, processes, quantum }));
    if (runSimulation.fulfilled.match(action)) {
      dispatch(addNotification({ type: 'success', message: `${algorithm} simulation complete — ${processes.length} processes scheduled.` }));
      navigate('/visualize');
    } else {
      dispatch(addNotification({ type: 'error', message: action.payload || 'Simulation failed' }));
    }
  };

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Simulation Dashboard</div>
          <div className="page-subtitle">Configure processes and select a scheduling algorithm</div>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleRun}
          disabled={loading || processes.length === 0}
        >
          {loading
            ? <><span className="spinner" style={{ width: '16px', height: '16px' }} /> Simulating…</>
            : <>▶ Run {algorithm}</>}
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px',
          background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius)', color: 'var(--red)',
          fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>⚠</span> {error}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: 'var(--red)' }}
            onClick={() => dispatch(clearError())}>✕</button>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left — Input Form */}
        <InputForm />

        {/* Right — Sidebar panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Process Stats */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <span className="card-title">Process Summary</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Processes', value: processes.length, color: 'var(--accent)' },
                { label: 'Total Burst', value: `${totalBurst}ms`, color: 'var(--green)' },
                { label: 'Avg Burst', value: `${avgBurst}ms`, color: 'var(--cyan)' },
                { label: 'Max Arrival', value: `t=${maxArrival}`, color: 'var(--amber)' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--bg-2)', borderRadius: 'var(--radius)',
                  padding: '12px', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-2)', marginTop: '3px', letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Algorithm Info */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <span className="card-title">Algorithm Info</span>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700,
                padding: '3px 8px', borderRadius: '20px',
                background: 'var(--accent-dim)', color: 'var(--accent)',
              }}>{algorithm}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-2)', minWidth: '60px', paddingTop: '1px' }}>Type</span>
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: 'var(--text-0)',
                  padding: '2px 8px', borderRadius: '10px',
                  background: info.type === 'Preemptive' ? 'var(--red-dim)' : 'var(--green-dim)',
                  color: info.type === 'Preemptive' ? 'var(--red)' : 'var(--green)',
                }}>{info.type}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-2)', minWidth: '60px', paddingTop: '1px' }}>Best for</span>
                <span style={{ fontSize: '11px', color: 'var(--text-1)', lineHeight: 1.5 }}>{info.bestFor}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-2)', minWidth: '60px', paddingTop: '1px' }}>Risk</span>
                <span style={{ fontSize: '11px', color: 'var(--amber)', lineHeight: 1.5 }}>{info.risk}</span>
              </div>
            </div>
          </div>

          {/* Last Result Quick View */}
          {result && (
            <div className="card animate-fadeIn" style={{ borderLeft: '3px solid var(--green)' }}>
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <span className="card-title">Last Result</span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--green)' }}>
                  {result.algorithm}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Avg Wait', value: result.metrics?.avgWaitingTime?.toFixed(2) + 'ms', color: 'var(--accent)' },
                  { label: 'Avg TAT', value: result.metrics?.avgTurnaroundTime?.toFixed(2) + 'ms', color: 'var(--green)' },
                  { label: 'CPU Util', value: result.metrics?.cpuUtilization?.toFixed(1) + '%', color: 'var(--amber)' },
                  { label: 'Ctx SW', value: result.metrics?.contextSwitches, color: 'var(--purple)' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{m.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700, color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-secondary btn-sm btn-full"
                style={{ marginTop: '14px' }}
                onClick={() => navigate('/visualize')}
              >View Full Visualization →</button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <span className="card-title">Quick Actions</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm btn-full" onClick={() => navigate('/compare')}>
                ◫ Compare All Algorithms
              </button>
              <button className="btn btn-secondary btn-sm btn-full" onClick={() => navigate('/motherboard')}>
                ◉ System View
              </button>
              <button className="btn btn-secondary btn-sm btn-full" onClick={() => navigate('/history')}>
                ◷ Simulation History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
