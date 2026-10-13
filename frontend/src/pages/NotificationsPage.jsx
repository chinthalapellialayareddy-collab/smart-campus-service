import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, MessageSquare, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshNotifications } = useAuth();

  const fetchNotifs = async () => {
    try {
      const res = await notificationsAPI.getAll();
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAll = async () => {
    try {
      await notificationsAPI.markAllRead();
      refreshNotifications();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingle = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      refreshNotifications();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>In-App Notifications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Real-time status updates on your campus maintenance tickets.
          </p>
        </div>

        <button onClick={handleMarkAll} className="btn btn-secondary btn-sm">
          <CheckCheck size={16} /> Mark All as Read
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading notification feed...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ margin: '0 auto 0.5rem auto' }} />
            <div>No notifications found.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  borderBottom: '1px solid var(--border-color)',
                  background: n.is_read ? 'transparent' : '#f8fafc',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: n.type === 'ACTION_REQUIRED' ? '#fee2e2' : '#e0e7ff',
                    color: n.type === 'ACTION_REQUIRED' ? 'var(--danger)' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {n.type === 'ACTION_REQUIRED' ? <AlertCircle size={18} /> : <Info size={18} />}
                  </div>

                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {n.complaint_id && (
                    <Link to={`/complaints/${n.complaint_id}`} className="btn btn-secondary btn-sm">
                      View Ticket
                    </Link>
                  )}
                  {!n.is_read && (
                    <button onClick={() => handleMarkSingle(n.id)} className="btn btn-sm" style={{ background: '#f1f5f9' }}>
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
