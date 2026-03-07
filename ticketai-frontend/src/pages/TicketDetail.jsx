import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const priorityColors = { 
  Critique: '#ff4d4f', 
  Élevé: '#fa8c16', 
  Moyen: '#fadb14', 
  Faible: '#52c41a' 
};

const getStatusColor = (status) => {
  const colors = {
    'Ouvert': '#1890ff',
    'En cours': '#fa8c16',
    'Résolu': '#52c41a',
    'Fermé': '#888',
  };
  return colors[status] || '#ccc';
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString();
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const canModify = user?.role === 'Technicien' || user?.role === 'Admin';

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${id}/`);
      setTicket(res.data.ticket || res.data);
      setComments(res.data.comments || []);
    } catch (err) {
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/tickets/${id}/comments/`, { text: comment });
      setComment('');
      setSuccessMessage('✅ Comment added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchTicketDetails();
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === ticket.status) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/tickets/${id}/status/`, { status: newStatus });
      setSuccessMessage(`✅ Status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchTicketDetails();
    } catch (err) {
      alert('Failed to update status: Server error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this ticket?')) return;
    try {
      await api.post(`/tickets/${id}/archive/`);
      setSuccessMessage('✅ Ticket archived');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      alert('Failed to archive ticket');
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: 50 }}>Loading...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red', marginTop: 50 }}>{error}</p>;
  if (!ticket) return <p style={{ textAlign: 'center', marginTop: 50 }}>Ticket not found</p>;

  return (
    <div style={styles.container}>
      {/* Back button */}
      <button style={styles.backBtn} onClick={() => navigate('/')}>
        ← Back to Dashboard
      </button>

      {/* Success message */}
      {successMessage && (
        <div style={styles.successMessage}>
          <span>{successMessage}</span>
          <button style={styles.closeBtn} onClick={() => setSuccessMessage('')}>✕</button>
        </div>
      )}

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>{ticket.title}</h1>
          <span style={{
            padding: '4px 14px',
            borderRadius: 12,
            background: priorityColors[ticket.priority_score] || '#ccc',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 13,
          }}>
            {ticket.priority_score || 'Pending'}
          </span>
        </div>

        {/* Archive button — Admin only */}
        {user?.role === 'Admin' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button style={styles.archiveBtn} onClick={handleArchive}>
              🗄️ Archive
            </button>
          </div>
        )}

        {/* Metadata */}
        <div style={styles.metadata}>

          {/* Status */}
          <div style={styles.metaItem}>
            <strong>Status:</strong>
            {canModify ? (
              <>
                <select
                  style={{
                    ...styles.statusSelect,
                    backgroundColor: getStatusColor(ticket.status),
                    opacity: updatingStatus ? 0.7 : 1,
                  }}
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                >
                  <option value="Ouvert">Ouvert</option>
                  <option value="En cours">En cours</option>
                  <option value="Résolu">Résolu</option>
                  <option value="Fermé">Fermé</option>
                </select>
                {updatingStatus && <span style={styles.updatingText}>Updating...</span>}
              </>
            ) : (
              <span style={{
                marginLeft: 8,
                padding: '4px 12px',
                borderRadius: 20,
                background: getStatusColor(ticket.status),
                color: 'white',
                fontSize: 13,
                fontWeight: 'bold',
              }}>
                {ticket.status}
              </span>
            )}
          </div>

          <div style={styles.metaItem}>
            <strong>Category:</strong> {ticket.category || 'Classifying...'}
          </div>

          <div style={styles.metaItem}>
            <strong>Priority:</strong> {ticket.priority_score || 'N/A'}
          </div>

          <div style={styles.metaItem}>
            <strong>Created by:</strong> {ticket.created_by?.email || 'N/A'}
          </div>

          <div style={styles.metaItem}>
            <strong>Created at:</strong> {formatDate(ticket.created_at)}
          </div>

          {ticket.assigned_to && (
            <div style={styles.metaItem}>
              <strong>Assigned to:</strong> {ticket.assigned_to.email}
            </div>
          )}
        </div>

        {/* Description */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Description</h3>
          <p style={styles.description}>{ticket.description}</p>
        </div>

        {/* Comments */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Comments ({comments.length})</h3>
          <form onSubmit={handleAddComment}>
            <textarea
              style={styles.textarea}
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="3"
              disabled={submitting}
            />
            <button
              type="submit"
              style={{
                ...styles.commentBtn,
                ...(submitting || !comment.trim() ? { background: '#ccc', cursor: 'not-allowed' } : {}),
              }}
              disabled={submitting || !comment.trim()}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            {comments.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', padding: 30 }}>
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={styles.comment}>
                  <div style={styles.commentHeader}>
                    <strong>{c.user?.email || 'Anonymous'}</strong>
                    <span style={{ color: '#888', fontSize: 12 }}>{formatDate(c.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#444' }}>{c.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: '30px 20px' },
  backBtn: { background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', fontSize: 16, marginBottom: 20 },
  successMessage: { background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: '12px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#52c41a' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 18 },
  card: { background: 'white', borderRadius: 12, padding: 30, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { margin: 0, fontSize: 26, color: '#333', flex: 1 },
  archiveBtn: { padding: '6px 16px', background: '#faad14', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' },
  metadata: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15, padding: 20, background: '#f8f9fa', borderRadius: 8, marginBottom: 25 },
  metaItem: { fontSize: 14, color: '#666', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  statusSelect: { marginLeft: 8, padding: '5px 10px', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 'bold', color: 'white', outline: 'none' },
  updatingText: { fontSize: 12, color: '#1890ff', fontStyle: 'italic' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, color: '#333', borderBottom: '2px solid #f0f0f0', paddingBottom: 8, marginBottom: 15 },
  description: { fontSize: 15, lineHeight: 1.8, color: '#444', whiteSpace: 'pre-wrap' },
  textarea: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 10, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  commentBtn: { padding: '8px 24px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' },
  comment: { background: '#f8f9fa', padding: 15, borderRadius: 8, border: '1px solid #eee', marginBottom: 12 },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 },
};