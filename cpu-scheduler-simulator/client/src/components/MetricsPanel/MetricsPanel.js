import React from 'react';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const METRIC_CONFIGS = [
  { key: 'avgWaitingTime', label: 'Avg Waiting Time', unit: 'ms', color: 'var(--accent)' },
  { key: 'avgTurnaroundTime', label: 'Avg Turnaround', unit: 'ms', color: 'var(--green)' },
  { key: 'avgResponseTime', label: 'Avg Response', unit: 'ms', color: 'var(--cyan)' },
  { key: 'cpuUtilization', label: 'CPU Utilization', unit: '%', color: 'var(--amber)' },
  { key: 'throughput', label: 'Throughput', unit: 'proc/ms', color: 'var(--pink)' },
  { key: 'contextSwitches', label: 'Context Switches', unit: '', color: 'var(--purple)' },
];

function MetricCard({ label, value, unit, color }) {
  const display = typeof value === 'number'
    ? unit === '%' ? value.toFixed(1)
    : unit === 'proc/ms' ? value.toFixed(4)
    : value.toFixed(2)
    : '—';

  return (
    <div className="metric-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="metric-value" style={{ color }}>
        {display}
        <span style={{ fontSize: '14px', color: 'var(--text-2)', marginLeft: '4px', fontWeight: 400 }}>{unit}</span>
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--bg-3)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '8px 12px',
      fontSize: '12px', fontFamily: 'var(--mono)',
    }}>
      <div style={{ color: 'var(--text-1)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill, marginTop: '2px' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function MetricsPanel({ result: resultProp }) {
  const storeResult = useSelector(s => s.simulation.result);
  const result = resultProp || storeResult;

  if (!result || !result.metrics) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◫</div>
        <div className="empty-title">No metrics yet</div>
        <div className="empty-desc">Run a simulation to view performance metrics</div>
      </div>
    );
  }

  const { metrics, processes } = result;

  // Per-process bar chart data
  const processChartData = (processes || []).map(p => ({
    name: p.name,
    waiting: +(p.waitingTime || 0).toFixed(2),
    turnaround: +(p.turnaroundTime || 0).toFixed(2),
    response: +(p.responseTime || 0).toFixed(2),
    color: p.color,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Key metrics grid */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {METRIC_CONFIGS.map(m => (
          <MetricCard
            key={m.key}
            label={m.label}
            value={metrics[m.key]}
            unit={m.unit}
            color={m.color}
          />
        ))}
      </div>

      {/* Per-process waiting & turnaround chart */}
      {processChartData.length > 0 && (
        <div className="card" style={{ padding: '16px' }}>
          <div className="card-header">
            <span className="card-title">Per-Process Times</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={processChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--mono)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--mono)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="waiting" name="Waiting" radius={[3, 3, 0, 0]}>
                {processChartData.map((p, i) => (
                  <Cell key={i} fill={p.color} fillOpacity={0.7} />
                ))}
              </Bar>
              <Bar dataKey="turnaround" name="Turnaround" radius={[3, 3, 0, 0]} fill="var(--green)" fillOpacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', paddingLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-2)' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '2px', display: 'inline-block' }} />
              Waiting Time
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-2)' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--green)', borderRadius: '2px', display: 'inline-block', opacity: 0.4 }} />
              Turnaround Time
            </div>
          </div>
        </div>
      )}

      {/* Process detail table */}
      <div className="card" style={{ padding: '16px' }}>
        <div className="card-header">
          <span className="card-title">Process Details</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Process</th>
              <th>Arrival</th>
              <th>Burst</th>
              <th>Completion</th>
              <th>Waiting</th>
              <th>Turnaround</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>
            {(processes || []).map(p => (
              <tr key={p.name}>
                <td>
                  <span className="process-dot" style={{ backgroundColor: p.color }} />
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{p.name}</span>
                </td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-1)' }}>{p.arrivalTime}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-1)' }}>{p.burstTime}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-0)' }}>{p.completionTime}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>{(p.waitingTime || 0).toFixed(0)}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>{(p.turnaroundTime || 0).toFixed(0)}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)' }}>{(p.responseTime || 0).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
