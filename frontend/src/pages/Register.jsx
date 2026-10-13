import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import { Building, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const res = await authAPI.register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top left, #e0e7ff 0%, #f8fafc 50%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
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
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#1e293b' }}>
            Create Campus Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Join the campus resolution service
          </p>
        </div>

        <div className="card" style={{ padding: '2.25rem', boxShadow: 'var(--shadow-xl)' }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              • {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="e.g. Emily Watson"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Campus Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-subtle)' }} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. name@gmail.com"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty / Professor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  name="phone"
                  placeholder="+1 555-0199"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-subtle)' }} />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="At least 6 characters"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-subtle)' }} />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Repeat your password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Creating Account...' : (
                <>Complete Registration <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
