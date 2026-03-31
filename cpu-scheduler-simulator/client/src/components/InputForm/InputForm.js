import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addProcess, removeProcess, updateProcess,
  randomizeProcesses, loadPreset, setAlgorithm, setQuantum,
} from '../../hooks/simulationSlice';

const ALGORITHMS = [
  { id: 'FCFS', name: 'FCFS', desc: 'First Come First Serve' },
  { id: 'SJF', name: 'SJF', desc: 'Shortest Job First' },
  { id: 'SRTF', name: 'SRTF', desc: 'Shortest Remaining Time' },
  { id: 'RR', name: 'Round Robin', desc: 'Time Quantum Based' },
  { id: 'HRRN', name: 'HRRN', desc: 'Highest Response Ratio' },
];

const PRESETS = [
  { id: 'demo', label: 'Demo' },
  { id: 'starvation', label: 'Starvation' },
  { id: 'burst', label: 'Burst' },
];

export default function InputForm() {
  const dispatch = useDispatch();
  const { processes, algorithm, quantum } = useSelector(s => s.simulation);

  const handleUpdate = (id, field, raw) => {
    const value = field === 'name' ? raw : Math.max(0, parseInt(raw) || 0);
    dispatch(updateProcess({ id, field, value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Algorithm Selector */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Algorithm</span>
        </div>
        <div className="algo-grid">
          {ALGORITHMS.map(a => (
            <button
              key={a.id}
              className={`algo-card ${algorithm === a.id ? 'selected' : ''}`}
              onClick={() => dispatch(setAlgorithm(a.id))}
            >
              <div className="algo-card-name">{a.name}</div>
              <div className="algo-card-desc">{a.desc}</div>
            </button>
          ))}
        </div>

        {algorithm === 'RR' && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>
              TIME QUANTUM
            </span>
            <input
              type="number"
              className="input-field"
              style={{ width: '80px' }}
              min={1}
              max={20}
              value={quantum}
              onChange={e => dispatch(setQuantum(Math.max(1, parseInt(e.target.value) || 1)))}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>ms</span>
          </div>
        )}
      </div>

      {/* Process Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Processes ({processes.length})</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => dispatch(randomizeProcesses())}>
              ↺ Random
            </button>
            {PRESETS.map(p => (
              <button key={p.id} className="btn btn-secondary btn-sm" onClick={() => dispatch(loadPreset(p.id))}>
                {p.label}
              </button>
            ))}
            <button className="btn btn-primary btn-sm" onClick={() => dispatch(addProcess())}>
              + Add
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Arrival</th>
                <th>Burst</th>
                <th>Priority</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {processes.map(proc => (
                <tr key={proc.id}>
                  <td style={{ width: '16px' }}>
                    <span
                      className="process-dot"
                      style={{ backgroundColor: proc.color }}
                    />
                  </td>
                  <td>
                    <input
                      className="input-field"
                      style={{ width: '60px' }}
                      value={proc.name}
                      onChange={e => handleUpdate(proc.id, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: '70px' }}
                      min={0}
                      value={proc.arrivalTime}
                      onChange={e => handleUpdate(proc.id, 'arrivalTime', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: '70px' }}
                      min={1}
                      value={proc.burstTime}
                      onChange={e => handleUpdate(proc.id, 'burstTime', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: '70px' }}
                      min={1}
                      value={proc.priority}
                      onChange={e => handleUpdate(proc.id, 'priority', e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)', padding: '4px 8px' }}
                      onClick={() => dispatch(removeProcess(proc.id))}
                      disabled={processes.length <= 1}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary row */}
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'var(--bg-2)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          gap: '24px',
          fontSize: '12px',
          color: 'var(--text-2)',
          fontFamily: 'var(--mono)',
        }}>
          <span>Total burst: <span style={{ color: 'var(--text-0)' }}>{processes.reduce((a, p) => a + p.burstTime, 0)}</span></span>
          <span>Max arrival: <span style={{ color: 'var(--text-0)' }}>{Math.max(...processes.map(p => p.arrivalTime))}</span></span>
          <span>Avg burst: <span style={{ color: 'var(--text-0)' }}>{(processes.reduce((a, p) => a + p.burstTime, 0) / processes.length).toFixed(1)}</span></span>
        </div>
      </div>
    </div>
  );
}
