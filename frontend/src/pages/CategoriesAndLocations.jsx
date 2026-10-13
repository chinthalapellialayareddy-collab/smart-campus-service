import React, { useState, useEffect } from 'react';
import { metadataAPI } from '../api/client';
import { FolderKanban, MapPin, Plus } from 'lucide-react';

export const CategoriesAndLocations = () => {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          metadataAPI.getCategories(),
          metadataAPI.getLocations()
        ]);
        if (catRes.data.success) setCategories(catRes.data.categories);
        if (locRes.data.success) setLocations(locRes.data.locations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading campus infrastructure metadata...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Campus Categories & Facilities</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Overview of maintenance routing departments and physical campus locations.
        </p>
      </div>

      <div className="grid-2">
        {/* Categories */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderKanban size={20} color="var(--primary)" /> Complaint Categories ({categories.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categories.map((c) => (
              <div key={c.id} style={{ padding: '0.875rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{c.name}</span>
                  <span className={`badge priority-${c.default_priority}`}>{c.default_priority}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: '600' }}>
                  Responsible: {c.department_name || 'General Maintenance'} (Target SLA: {c.sla_hours}h)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} color="var(--secondary)" /> Campus Locations & Buildings ({locations.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {locations.map((loc) => (
              <div key={loc.id} style={{ padding: '0.875rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                  {loc.building_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {loc.block} • {loc.floor} • <strong>{loc.room_number}</strong>
                </div>
                {loc.details && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {loc.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
