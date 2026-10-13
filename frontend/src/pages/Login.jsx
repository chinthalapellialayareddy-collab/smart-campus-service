import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import { Building, ShieldCheck, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.login({ email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top left, #e0e7ff 0%, #f8fafc 50%, #e2e8f0 100%)',
      padding: '1.5rem'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo / Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: '#fff',
            boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)',
            marginBottom: '1rem'
          }}>
            <Building size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.02em' }}>
            Campus Complaint Service
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Student, Faculty & Maintenance Staff Portal
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2.25rem', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(255,255,255,0.8)' }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>•</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Campus Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-subtle)' }} />
                <input
                  type="email"
                  required
                  placeholder="e.g. name@gmail.com"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-subtle)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : (
                <>Sign In to Campus Portal <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              <Sparkles size={14} /> Quick Demo Access (1-Click)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDemoAccount('admin@campus.edu')}
                className="btn btn-secondary btn-sm"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('faculty1@gmail.com')}
                className="btn btn-secondary btn-sm"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('name@gmail.com')}
                className="btn btn-secondary btn-sm"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('staff1@gmail.com')}
                className="btn btn-secondary btn-sm"
              >
                Maintenance Staff
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
            Register as Student / Faculty
          </Link>
        </div>
      </div>
    </div>
  );
};
