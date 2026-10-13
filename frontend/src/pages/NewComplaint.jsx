import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metadataAPI, complaintsAPI } from '../api/client';
import { PlusCircle, Upload, MapPin, Tag, AlertCircle, ArrowLeft } from 'lucide-react';

export const NewComplaint = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location_id: '',
    priority: 'Medium'
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, locsRes] = await Promise.all([
          metadataAPI.getCategories(),
          metadataAPI.getLocations()
        ]);
        if (catsRes.data.success) {
          setCategories(catsRes.data.categories);
          if (catsRes.data.categories.length > 0) {
            setFormData(prev => ({ ...prev, category_id: catsRes.data.categories[0].id }));
          }
        }
        if (locsRes.data.success) {
          setLocations(locsRes.data.locations);
          if (locsRes.data.locations.length > 0) {
            setFormData(prev => ({ ...prev, location_id: locsRes.data.locations[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load form metadata:', err);
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMetadata();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      return setError('Please provide both complaint title and detailed description.');
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
      data.append('category_id', formData.category_id);
      data.append('location_id', formData.location_id);
      data.append('priority', formData.priority);

      for (let i = 0; i < files.length; i++) {
        data.append('attachments', files[i]);
      }

      const res = await complaintsAPI.create(data);
      if (res.data.success) {
        navigate(`/complaints/${res.data.complaint.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading form options...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Submit Campus Complaint</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Report an issue to the maintenance and facilities department.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {error && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            • {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Complaint Title */}
          <div className="form-group">
            <label className="form-label">Complaint Title / Summary *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Water leakage in 2nd floor science lab ceiling"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Complaint Category *</label>
              <select
                name="category_id"
                className="form-select"
                value={formData.category_id}
                onChange={handleChange}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.department_name || 'Campus Wide'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Urgency / Priority *</label>
              <select
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">Low - Minor aesthetic issue</option>
                <option value="Medium">Medium - Standard repair</option>
                <option value="High">High - Disrupting academic schedule</option>
                <option value="Emergency">Emergency - Hazard to student safety</option>
              </select>
            </div>
          </div>

          {/* Campus Location */}
          <div className="form-group">
            <label className="form-label">Exact Campus Location *</label>
            <select
              name="location_id"
              className="form-select"
              value={formData.location_id}
              onChange={handleChange}
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.building_name} - {loc.block} ({loc.floor}, {loc.room_number})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Description of Problem *</label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe what is broken, how long the issue has persisted, and any relevant details..."
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* File Uploads (Images) */}
          <div className="form-group">
            <label className="form-label">Supporting Photographs (Max 3, up to 5MB each)</label>
            <div style={{
              border: '2px dashed var(--border-color)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              background: 'var(--bg-main)'
            }}>
              <Upload size={28} color="var(--primary)" style={{ margin: '0 auto 0.5rem auto' }} />
              <input
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                style={{ fontSize: '0.85rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                JPG, PNG, WEBP files supported
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ minWidth: '160px' }}>
              {submitting ? 'Registering Ticket...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
