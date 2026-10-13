import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, complaintsAPI } from '../api/client';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  TrendingUp,
  Star,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, complaintsRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          complaintsAPI.getAll({ limit: 5 })
        ]);
        if (dashRes.data.success) {
          setData(dashRes.data);
        }
        if (complaintsRes.data.success) {
          setRecentComplaints(complaintsRes.data.complaints);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ color: 'var(--primary)', fontWeight: '600' }}>Loading Dashboard Insights...</div>
      </div>
    );
  }

  const metrics = data?.metrics || { total: 0, pending: 0, resolved: 0, overdue: 0, averageRating: '5.0' };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem 2.5rem',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            <span>Role:</span> <span style={{ textTransform: 'uppercase' }}>{user?.role}</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Welcome back, {user?.full_name}!
          </h1>
          <p style={{ color: '#c7d2fe', fontSize: '0.925rem', maxWidth: '600px' }}>
            {user?.role === 'staff'
              ? 'Review your active maintenance assignments, update progress, and log completion reports.'
              : user?.role === 'admin'
              ? 'Campus-wide operations overview: Monitor pending SLAs, track staff workloads, and oversee campus facilities.'
              : 'Report campus infrastructure, electrical, IT, or sanitation issues and track resolution in real-time.'}
          </p>
        </div>

        {['student', 'faculty', 'admin'].includes(user?.role) && (
          <Link to="/complaints/new" className="btn btn-primary" style={{ background: '#ffffff', color: 'var(--primary)', fontWeight: '700', padding: '0.75rem 1.25rem', border: 'none' }}>
            <PlusCircle size={18} /> Lodge Complaint
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#e0e7ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Tickets</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{metrics.total}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>In Progress / Pending</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{metrics.pending}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Resolved & Closed</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{metrics.resolved}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: metrics.overdue > 0 ? '#fee2e2' : '#f1f5f9', color: metrics.overdue > 0 ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Overdue SLAs</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: metrics.overdue > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{metrics.overdue}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Breakdown + Recent complaints list */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {/* Left Column: Category Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Category Breakdown</h3>
            <TrendingUp size={18} color="var(--text-muted)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data?.categoryDistribution && data.categoryDistribution.length > 0 ? (
              data.categoryDistribution.map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '500' }}>{cat.category_name}</span>
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{cat.count}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (cat.count / (metrics.total || 1)) * 100)}%`,
                        background: 'linear-gradient(90deg, #4f46e5, #06b6d4)',
                        borderRadius: '99px'
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No categorized complaint data yet.</p>
            )}
          </div>

          {/* User Feedback score snippet */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Satisfaction Score</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={18} fill="#f59e0b" color="#f59e0b" />
                {metrics.averageRating} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>/ 5.0</span>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metrics.totalReviews || 0} reviews</span>
          </div>
        </div>

        {/* Right 2 Columns: Recent Complaints Table */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Active & Recent Complaints</h3>
            <Link to="/complaints" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {recentComplaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              No campus complaints recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentComplaints.map((c) => (
                <Link
                  key={c.id}
                  to={`/complaints/${c.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, flex: 1, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.75rem', color: 'var(--primary)' }}>
                        {c.reference_no}
                      </span>
                      <span className={`badge priority-${c.priority}`}>{c.priority}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {c.category_name}</span>
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      📍 {c.building_name} ({c.room_number})
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                    <span style={{ fontSize: '0.725rem', fontWeight: '600', color: c.status === 'SUBMITTED' ? '#d97706' : c.status === 'RESOLVED' ? '#16a34a' : 'var(--text-muted)' }}>
                      {c.status === 'SUBMITTED'
                        ? '⏳ Needs Admin Assignment'
                        : c.status === 'RESOLVED'
                        ? '⭐ Feedback Required'
                        : c.staff_name ? `Staff: ${c.staff_name}` : 'Unassigned'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
