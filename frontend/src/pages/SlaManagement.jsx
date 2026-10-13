import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../api/client';
import { Link } from 'react-router-dom';
import { Clock, AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export const SlaManagement = () => {
  const [slas, setSlas] = useState([]);
  const [overdueComplaints, setOverdueComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPriority, setEditingPriority] = useState(null);
  const [targetHours, setTargetHours] = useState('');

  const fetchSlaData = async () => {
    try {
      const res = await analyticsAPI.getSlaList();
      if (res.data.success) {
        setSlas(res.data.slas);
        setOverdueComplaints(res.data.overdueComplaints);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlaData();
  }, []);

  const handleUpdateSla = async (priority) => {
    try {
      await analyticsAPI.updateSla(priority, { target_hours: targetHours });
      setEditingPriority(null);
      fetchSlaData();
    } catch (err) {
      alert('Failed to update SLA configuration.');
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading SLA benchmarks...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>SLA Benchmarks & Overdue Monitor</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Configure institutional resolution thresholds and review breached tickets.
        </p>
      </div>

      {/* SLA Target Hours Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {slas.map((s) => (
          <div key={s.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span className={`badge priority-${s.priority}`}>{s.priority}</span>
              <Clock size={18} color="var(--text-muted)" />
            </div>

            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              {s.target_hours} <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-muted)' }}>Hours</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {s.description}
            </p>

            {editingPriority === s.priority ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.8rem' }}
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                />
                <button onClick={() => handleUpdateSla(s.priority)} className="btn btn-primary btn-sm">
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingPriority(s.priority); setTargetHours(s.target_hours); }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                Edit Duration
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Overdue Incidents Alert Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} color="var(--danger)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--danger)' }}>
            Active Overdue Complaints ({overdueComplaints.length})
          </h3>
        </div>

        {overdueComplaints.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#16a34a' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontWeight: '700' }}>All tickets within SLA target duration!</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Zero breached deadlines at this time.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Reference</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Title</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Priority</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Deadline Was</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Technician</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {overdueComplaints.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '700', fontFamily: 'monospace', color: 'var(--danger)' }}>
                      {c.reference_no}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{c.title}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge priority-${c.priority}`}>{c.priority}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--danger)', fontWeight: '600', fontSize: '0.8rem' }}>
                      {new Date(c.sla_deadline).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                      {c.staff_name || 'Unassigned'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <Link to={`/complaints/${c.id}`} className="btn btn-secondary btn-sm">
                        Inspect <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
