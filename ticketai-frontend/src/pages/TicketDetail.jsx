// src/pages/TicketDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import PriorityBadge from '../components/PriorityBadge';
import { formatDate, getStatusColor } from '../utils/helpers';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
      console.error(err);
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
      fetchTicketDetails(); // Refresh comments
    } catch (err) {
      alert('Failed to add comment: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === ticket.status) return; // No change
    
    setUpdatingStatus(true);
    try {
      // Use the dedicated status endpoint from your backend
      await api.patch(`/tickets/${id}/status/`, { 
        status: newStatus 
      });
      
      setSuccessMessage(`✅ Status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh ticket details
      await fetchTicketDetails();
    } catch (err) {
      console.error('Status update error:', err.response?.data);
      alert('Failed to update status: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssign = async (userId) => {
    if (!userId) return;
    
    try {
      await api.patch(`/tickets/${id}/assign/`, { 
        assigned_to: userId 
      });
      
      setSuccessMessage('✅ Ticket assigned successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      await fetchTicketDetails();
    } catch (err) {
      alert('Failed to assign ticket: ' + (err.response?.data?.message || 'Server error'));
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this ticket?')) return;
    
    try {
      await api.patch(`/tickets/${id}/archive/`);
      setSuccessMessage('✅ Ticket archived successfully');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      alert('Failed to archive ticket: ' + (err.response?.data?.message || 'Server error'));
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!ticket) return <div style={styles.error}>Ticket not found</div>;

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
          <button 
            style={styles.closeSuccessBtn}
            onClick={() => setSuccessMessage('')}
          >
            ✕
          </button>
        </div>
      )}

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>{ticket.title}</h1>
          <PriorityBadge priority={ticket.priority_score} />
        </div>

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <button 
            style={styles.archiveBtn}
            onClick={handleArchive}
            title="Archive ticket"
          >
            🗄️ Archive
          </button>
        </div>

        {/* Metadata */}
        <div style={styles.metadata}>
          <span style={styles.metaItem}>
            <strong>Status:</strong>
            <select
              style={{
                ...styles.statusSelect,
                backgroundColor: getStatusColor(ticket.status),
                color: 'white',
                opacity: updatingStatus ? 0.7 : 1,
              }}
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
            >
              <option value="open">Open</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            {updatingStatus && <span style={styles.updatingText}>Updating...</span>}
          </span>
          
          <span style={styles.metaItem}>
            <strong>Category:</strong> {ticket.category || 'Classifying...'}
          </span>
          
          <span style={styles.metaItem}>
            <strong>Priority:</strong> {ticket.priority_score || 'N/A'}
          </span>
          
          <span style={styles.metaItem}>
            <strong>Created by:</strong> {ticket.created_by?.email || 'N/A'}
          </span>
          
          <span style={styles.metaItem}>
            <strong>Created at:</strong> {formatDate(ticket.created_at)}
          </span>
          
          {ticket.assigned_to && (
            <span style={styles.metaItem}>
              <strong>Assigned to:</strong> {ticket.assigned_to.email}
            </span>
          )}
          
          {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
            <span style={styles.metaItem}>
              <strong>Updated:</strong> {formatDate(ticket.updated_at)}
            </span>
          )}
        </div>

        {/* AI Analysis */}
        {ticket.ai_analysis && (
          <div style={styles.aiSection}>
            <h3 style={styles.aiTitle}>🤖 AI Analysis</h3>
            <div style={styles.aiContent}>
              <p><strong>Confidence:</strong> {ticket.ai_analysis.confidence || ticket.ai_analysis.confidence_score || 'N/A'}%</p>
              <p><strong>Suggested Category:</strong> {ticket.ai_analysis.suggested_category || ticket.ai_analysis.category || 'N/A'}</p>
              {ticket.ai_analysis.keywords && (
                <p><strong>Keywords:</strong> {Array.isArray(ticket.ai_analysis.keywords) 
                  ? ticket.ai_analysis.keywords.join(', ') 
                  : ticket.ai_analysis.keywords}
                </p>
              )}
              {ticket.ai_analysis.summary && (
                <p><strong>Summary:</strong> {ticket.ai_analysis.summary}</p>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div style={styles.descriptionSection}>
          <h3 style={styles.sectionTitle}>Description</h3>
          <p style={styles.description}>{ticket.description}</p>
        </div>

        {/* Comments Section */}
        <div style={styles.commentsSection}>
          <h3 style={styles.sectionTitle}>Comments ({comments.length})</h3>
          
          {/* Comment form */}
          <form onSubmit={handleAddComment} style={styles.commentForm}>
            <textarea
              style={styles.commentInput}
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
                ...(submitting || !comment.trim() ? styles.commentBtnDisabled : {})
              }}
              disabled={submitting || !comment.trim()}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {/* Comments list */}
          <div style={styles.commentsList}>
            {comments.length === 0 ? (
              <p style={styles.noComments}>No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={styles.comment}>
                  <div style={styles.commentHeader}>
                    <strong>{c.user?.email || 'Anonymous'}</strong>
                    <span style={styles.commentDate}>{formatDate(c.created_at)}</span>
                  </div>
                  <p style={styles.commentText}>{c.text}</p>
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
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '30px 20px',
    position: 'relative',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#1890ff',
    cursor: 'pointer',
    fontSize: '16px',
    marginBottom: '20px',
    padding: '8px 0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'color 0.3s',
    ':hover': {
      color: '#40a9ff',
    },
  },
  successMessage: {
    background: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '8px',
    padding: '12px 20px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#52c41a',
    fontSize: '14px',
    animation: 'slideDown 0.3s ease-out',
  },
  closeSuccessBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 5px',
    ':hover': {
      color: '#666',
    },
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#333',
    flex: 1,
    wordBreak: 'break-word',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '20px',
  },
  archiveBtn: {
    padding: '6px 16px',
    background: '#faad14',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'background 0.3s',
    ':hover': {
      background: '#ffc53d',
    },
  },
  metadata: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '25px',
  },
  metaItem: {
    fontSize: '14px',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '5px',
  },
  statusSelect: {
    marginLeft: '8px',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    outline: 'none',
    transition: 'opacity 0.3s',
    ':disabled': {
      cursor: 'not-allowed',
    },
  },
  updatingText: {
    marginLeft: '8px',
    fontSize: '12px',
    color: '#1890ff',
    fontStyle: 'italic',
  },
  aiSection: {
    background: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '25px',
  },
  aiTitle: {
    margin: '0 0 15px 0',
    color: '#52c41a',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  aiContent: {
    fontSize: '14px',
    lineHeight: '1.8',
  },
  descriptionSection: {
    marginBottom: '30px',
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    color: '#333',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '8px',
  },
  description: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#444',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  commentsSection: {
    borderTop: '1px solid #eee',
    paddingTop: '25px',
  },
  commentForm: {
    marginBottom: '25px',
  },
  commentInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '10px',
    resize: 'vertical',
    fontFamily: 'inherit',
    ':focus': {
      borderColor: '#1890ff',
      outline: 'none',
    },
  },
  commentBtn: {
    padding: '8px 24px',
    background: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background 0.3s',
    ':hover': {
      background: '#40a9ff',
    },
  },
  commentBtnDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
    ':hover': {
      background: '#ccc',
    },
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  comment: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#666',
  },
  commentDate: {
    color: '#888',
    fontSize: '12px',
  },
  commentText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#444',
    margin: 0,
    wordBreak: 'break-word',
  },
  noComments: {
    textAlign: 'center',
    color: '#888',
    padding: '40px',
    background: '#fafafa',
    borderRadius: '8px',
    fontStyle: 'italic',
  },
  error: {
    textAlign: 'center',
    color: '#f5222d',
    padding: '50px',
    fontSize: '18px',
  },
};

// Add animations
const globalStyles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = globalStyles;
  document.head.appendChild(style);
}