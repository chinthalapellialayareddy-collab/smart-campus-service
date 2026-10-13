import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../api/client';
import { BarChart3, Download, Calendar, Filter, FileSpreadsheet } from 'lucide-react';

export const ReportsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.getSummary({ priority: priority || undefined, status: status || undefined });
      if (res.data.success) {
        setRecords(res.data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [priority, status]);

  const handleDownloadCsv = () => {
    window.open(reportsAPI.getExportUrl(), '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Campus Analytics & Export Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Comprehensive institutional resolution reporting and CSV data exports.
          </p>
        </div>

        <button onClick={handleDownloadCsv} className="btn btn-primary">
          <Download size={16} /> Export CSV Report
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: '180px', height: '36px' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            className="form-select"
            style={{ width: '180px', height: '36px' }}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>
      </div>

      {/* Report Records Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Compiling report data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Reference</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Subject & Area</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Priority</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Logged By</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Resolved On</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>
                      {r.reference_no}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: '600' }}>{r.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.building_name} ({r.room_number})</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem' }}>{r.category_name}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span className={`badge priority-${r.priority}`}>{r.priority}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem' }}>{r.complainant_name}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : 'Pending'}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right', fontWeight: '700', color: '#f59e0b' }}>
                      {r.feedback_rating ? `⭐ ${r.feedback_rating}/5` : '—'}
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
