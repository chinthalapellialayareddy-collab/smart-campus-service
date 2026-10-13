import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Users,
  Clock,
  BarChart3,
  LogOut,
  Bell,
  Building,
  Shield,
  HelpCircle,
  FolderKanban
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['student', 'faculty', 'staff', 'admin'] },
    { name: 'New Complaint', to: '/complaints/new', icon: PlusCircle, roles: ['student', 'faculty', 'admin'] },
    { name: 'Complaints Directory', to: '/complaints', icon: FileText, roles: ['student', 'faculty', 'staff', 'admin'] },
    { name: 'SLA & Overdue', to: '/sla', icon: Clock, roles: ['staff', 'admin'] },
    { name: 'User Management', to: '/users', icon: Users, roles: ['admin'] },
    { name: 'Departments & Categories', to: '/categories', icon: FolderKanban, roles: ['admin'] },
    { name: 'Reports & Export', to: '/reports', icon: BarChart3, roles: ['faculty', 'staff', 'admin'] },
    { name: 'Notifications', to: '/notifications', icon: Bell, roles: ['student', 'faculty', 'staff', 'admin'], badge: unreadCount }
  ];

  const allowedNav = navItems.filter(item => !item.roles || item.roles.includes(user?.role));

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: '#fff',
            borderRadius: '12px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)'
          }}>
            <Building size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>CampusCare</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Complaint Service</div>
          </div>
        </div>

        {/* User Card in sidebar */}
        <div style={{ padding: '1.25rem', margin: '0.75rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#e0e7ff',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.875rem'
            }}>
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: '700' }}>
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {allowedNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  transition: 'var(--transition)'
                })}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.name}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--danger)',
                    color: '#fff',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.5rem',
                    fontWeight: '700'
                  }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout bottom */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Campus Portal /</span>
            <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
              {user?.department_name || 'General Campus'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NavLink
              to="/notifications"
              style={{
                position: 'relative',
                color: 'var(--text-muted)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none'
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'var(--danger)',
                  color: '#fff',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%'
                }} />
              )}
            </NavLink>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderLeft: '1px solid var(--border-color)',
              paddingLeft: '1rem'
            }}>
              <span className={`badge badge-${user?.role === 'admin' ? 'Emergency' : 'ASSIGNED'}`} style={{ textTransform: 'capitalize' }}>
                {user?.role}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.full_name}</span>
            </div>
          </div>
        </header>

        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
};
