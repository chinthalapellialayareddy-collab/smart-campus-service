import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI, metadataAPI } from '../api/client';
import {
  ArrowLeft,
  Clock,
  User,
  MapPin,
  Tag,
  Send,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Star,
  Image as ImageIcon,
  MessageSquare,
  Wrench,
  ShieldCheck
} from 'lucide-react';

export const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Staff assignment for admin
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Close & Feedback form
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');

  // Reopen reason
  const [reopenReason, setReopenReason] = useState('');

  // Resolution modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('Issue has been inspected and resolved successfully.');

  // Action status loading
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await complaintsAPI.getById(id);
      if (res.data.success) {
        setComplaint(res.data.complaint);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    if (user?.role === 'admin') {
      metadataAPI.getStaffUsers().then((res) => {
        if (res.data.success) {
          setStaffList(res.data.staff);
        }
      });
    }
  }, [id, user]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await complaintsAPI.addComment(id, { comment_text: commentText });
      setCommentText('');
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Staff workflow actions
  const handleAcceptAssignment = async () => {
    setActionLoading(true);
    try {
      await complaintsAPI.accept(id);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      await complaintsAPI.startProgress(id, { notes: 'Technician has initiated on-site repair work.' });
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start progress.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenResolveModal = () => {
    setResolveNotes('Issue has been inspected and resolved successfully.');
    setShowResolveModal(true);
  };

  const handleResolveComplaint = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setActionLoading(true);
    try {
      await complaintsAPI.resolve(id, {
        resolution_notes: resolveNotes.trim() || 'Issue resolved successfully by maintenance technician.'
      });
      setShowResolveModal(false);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  // User confirm and close
  const handleCloseTicket = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await complaintsAPI.close(id, { rating: feedbackRating, feedback_comments: feedbackComments });
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reopen
  const handleReopenTicket = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    setActionLoading(true);
    try {
      await complaintsAPI.reopen(id, { reason: reopenReason });
      setReopenReason('');
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reopen ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin assign
  const handleAdminAssign = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    setActionLoading(true);
    try {
      await complaintsAPI.assign(id, { staff_id: selectedStaffId });
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign staff.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading complaint records...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <AlertTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 1rem auto' }} />
        <h3>Unable to access complaint</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Not found.'}</p>
        <button onClick={() => navigate('/complaints')} className="btn btn-secondary">
          Return to Complaints
        </button>
      </div>
    );
  }

  const isAssignedStaff = user?.role === 'staff' && complaint.assigned_staff_id === user?.id;
  const isOwner = complaint.user_id === user?.id;
  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={() => navigate('/complaints')} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> All Complaints
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge priority-${complaint.priority}`}>{complaint.priority} Priority</span>
          <span className={`badge badge-${complaint.status}`}>{complaint.status}</span>
        </div>
      </div>

      {/* Main Ticket Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--primary)', fontSize: '0.9rem' }}>
              {complaint.reference_no}
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '0.25rem', color: '#1e293b' }}>
              {complaint.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>👤 Raised by <strong>{complaint.complainant_name}</strong> ({complaint.complainant_role})</span>
              <span>📍 {complaint.building_name} ({complaint.room_number})</span>
              <span>📂 {complaint.category_name}</span>
            </div>
          </div>

          {complaint.sla_deadline && (
            <div style={{ textAlign: 'right', background: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                SLA Deadline
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: new Date(complaint.sla_deadline) < new Date() && !['RESOLVED', 'CLOSED'].includes(complaint.status) ? 'var(--danger)' : 'var(--text-main)' }}>
                {new Date(complaint.sla_deadline).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Problem Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.5rem' }}>
            Problem Description
          </h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem', color: '#334155' }}>
            {complaint.description}
          </p>
        </div>

        {/* Supporting Attachments */}
        {complaint.attachments && complaint.attachments.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.5rem' }}>
              Attached Photographs ({complaint.attachments.length})
            </h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {complaint.attachments.map((att) => (
                <a
                  key={att.id}
                  href={`http://localhost:5000${att.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}
                >
                  <ImageIcon size={16} />
                  <span>{att.stored_filename}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({att.attachment_type})</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Staff Information */}
        <div style={{
          background: complaint.staff_name ? '#f8fafc' : '#fffbeb',
          border: complaint.staff_name ? '1px solid var(--border-color)' : '1px solid #fde68a',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: complaint.staff_name ? 'var(--text-muted)' : '#b45309', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>
              {complaint.staff_name ? 'Assigned Maintenance Personnel' : '⚠️ Pending Admin Assignment'}
            </div>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginTop: '0.2rem' }}>
              {complaint.staff_name ? (
                <span style={{ color: '#0f172a' }}>🔧 {complaint.staff_name} ({complaint.staff_email})</span>
              ) : (
                <span style={{ color: '#d97706' }}>Awaiting Administrator to assign appropriate department technician</span>
              )}
            </div>
          </div>

          {/* Admin manual assign form */}
          {isAdmin && (
            <form onSubmit={handleAdminAssign} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#fff', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>Admin Action:</span>
              <select
                className="form-select"
                required
                style={{ fontSize: '0.85rem', height: '36px', minWidth: '220px' }}
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="">Choose Respected Staff Member...</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.full_name} — {st.department_name} (Active: {st.active_workload})
                  </option>
                ))}
              </select>
              <button type="submit" disabled={actionLoading || !selectedStaffId} className="btn btn-primary btn-sm" style={{ fontWeight: '700', height: '36px' }}>
                {complaint.staff_name ? 'Reassign Staff' : 'Assign to Staff'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Role Action Panes */}
      {/* 1. Maintenance Staff Workflow Controls */}
      {isAssignedStaff && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={18} /> Staff Action Panel
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '1rem' }}>
            Update your operational status on this campus maintenance ticket:
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {complaint.status === 'ASSIGNED' && (
              <button onClick={handleAcceptAssignment} disabled={actionLoading} className="btn btn-primary">
                Accept Assignment Ticket
              </button>
            )}
            {['ASSIGNED', 'ACCEPTED'].includes(complaint.status) && (
              <button onClick={handleStartWork} disabled={actionLoading} className="btn btn-primary">
                Mark Work In Progress
              </button>
            )}
            {['ACCEPTED', 'IN_PROGRESS', 'REOPENED'].includes(complaint.status) && (
              <button onClick={handleOpenResolveModal} disabled={actionLoading} className="btn btn-success">
                <CheckCircle size={16} /> Mark as Resolved
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Complainant Resolution Confirmation & Rating Form */}
      {(isOwner || isAdmin) && complaint.status === 'RESOLVED' && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#15803d', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} /> Resolution Confirmation & Feedback
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '1rem' }}>
            The technician reported this issue resolved. Please rate the service quality and confirm closure.
          </p>

          <form onSubmit={handleCloseTicket}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#166534' }}>Service Rating * (Mandatory):</label>
              <select
                className="form-select"
                required
                style={{ width: '160px', fontWeight: '600' }}
                value={feedbackRating}
                onChange={(e) => setFeedbackRating(e.target.value)}
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
                <option value="3">⭐⭐⭐ 3 - Satisfactory</option>
                <option value="2">⭐⭐ 2 - Poor</option>
                <option value="1">⭐ 1 - Very Bad</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#166534', fontWeight: '700' }}>
                Resolution Feedback Remarks * (Mandatory)
              </label>
              <textarea
                required
                rows={3}
                placeholder="Required: Please explain whether the repair was successful, technician behavior, and your overall satisfaction..."
                className="form-textarea"
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" disabled={actionLoading || !feedbackComments.trim()} className="btn btn-success" style={{ fontWeight: '700' }}>
                <CheckCircle size={16} /> Submit Feedback & Close Ticket
              </button>
            </div>
          </form>

          {/* Reopen option */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>
              Issue not satisfactorily solved?
            </div>
            <form onSubmit={handleReopenTicket} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Reason why issue is still not fixed..."
                className="form-input"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
              <button type="submit" disabled={actionLoading || !reopenReason} className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }}>
                <RotateCcw size={14} /> Reopen Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Review if already closed */}
      {complaint.feedback && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#fffbeb', borderColor: '#fef3c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#b45309' }}>
            <Star size={18} fill="#f59e0b" color="#f59e0b" /> User Review: {complaint.feedback.rating} / 5 Stars
          </div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
            "{complaint.feedback.comments || 'No written remarks provided.'}"
          </div>
        </div>
      )}

      {/* Timeline & Comments Grid */}
      <div className="grid-2">
        {/* Comments Box */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={18} /> Follow-up Comments & Discussion
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.25rem' }}>
            {complaint.comments && complaint.comments.length > 0 ? (
              complaint.comments.map((cm) => (
                <div
                  key={cm.id}
                  style={{
                    background: cm.user_id === user?.id ? '#f0fdf4' : 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      {cm.author_name} ({cm.author_role})
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(cm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>{cm.comment_text}</div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                No follow-up comments yet.
              </div>
            )}
          </div>

          <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Add note or comment..."
              className="form-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" disabled={submittingComment || !commentText.trim()} className="btn btn-primary">
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Audit Status History */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Status Audit Trail
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {complaint.history && complaint.history.length > 0 ? (
              complaint.history.map((h) => (
                <div key={h.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '5px' }} />
                  <div>
                    <div>
                      <strong>{h.new_status}</strong> by {h.updater_name} ({h.updater_role})
                    </div>
                    {h.notes && <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{h.notes}</div>}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      {new Date(h.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No history records.</p>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Notes Modal */}
      {showResolveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '0.6rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Mark Complaint as Resolved
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                  Provide completion details so complainant and admin can verify the fix.
                </p>
              </div>
            </div>

            <form onSubmit={handleResolveComplaint}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Resolution Notes / Work Performed *
                </label>
                <textarea
                  required
                  rows={4}
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    borderColor: 'var(--border-color)'
                  }}
                  placeholder="Describe the actions taken to resolve this problem..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  disabled={actionLoading}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-success"
                  style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <CheckCircle size={16} />
                  {actionLoading ? 'Updating Status...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
