import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI, metadataAPI } from '../api/client';
import { Search, Filter, Plus, ArrowUpDown, Calendar, MapPin, Tag } from 'lucide-react';

export const ComplaintsList = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintsAPI.getAll({
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        category_id: categoryId || undefined
      });
      if (res.data.success) {
        setComplaints(res.data.complaints);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, locsRes] = await Promise.all([
          metadataAPI.getCategories(),
          metadataAPI.getLocations()
        ]);
        if (catsRes.data.success) setCategories(catsRes.data.categories);
        if (locsRes.data.success) setLocations(locsRes.data.locations);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, priority, categoryId]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Campus Complaints Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {user?.role === 'student' || user?.role === 'faculty'
              ? 'Showing all tickets raised by you'
              : user?.role === 'staff'
              ? 'Showing all maintenance tickets assigned to you'
              : 'Showing all campus-wide complaint tickets'}
          </p>
        </div>

        {['student', 'faculty', 'admin'].includes(user?.role) && (
          <Link to="/complaints/new" className="btn btn-primary">
            <Plus size={16} /> Lodge New Complaint
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search reference, title..."
              className="form-input"
              style={{ paddingLeft: '2rem', height: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="form-select"
            style={{ height: '38px' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REOPENED">REOPENED</option>
          </select>

          {/* Priority Filter */}
          <select
            className="form-select"
            style={{ height: '38px' }}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Emergency">Emergency</option>
          </select>

          {/* Category Filter */}
          <select
            className="form-select"
            style={{ height: '38px' }}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Filtering tickets...
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No complaints found matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Ticket Ref</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Title & Location</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Priority</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Staff Assigned</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '700', fontFamily: 'monospace', color: 'var(--primary)' }}>
                      {c.reference_no}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} /> {c.building_name} ({c.room_number})
                      </div>
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {c.category_name}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className={`badge priority-${c.priority}`}>{c.priority}</span>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className={`badge badge-${c.status}`}>{c.status}</span>
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: c.staff_name ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {c.staff_name || '— Unassigned —'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <Link to={`/complaints/${c.id}`} className="btn btn-secondary btn-sm">
                        View Details
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
