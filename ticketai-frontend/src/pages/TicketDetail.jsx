// src/pages/TicketDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const priorityColors = {
  Critique: '#ff4d4f',
  Élevé: '#fa8c16',
  Moyen: '#fadb14',
  Faible: '#52c41a',
};

const getStatusColor = (status) => ({
  Ouvert: '#1890ff',
  'En cours': '#fa8c16',
  Résolu: '#52c41a',
  Fermé: '#888',
}[status] || '#ccc');

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('fr-FR');
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
  const isAdmin = user?.role === 'Admin';

  useEffect(() => { fetchTicketDetails(); }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${id}/`);
      setTicket(res.data.ticket || res.data);
      setComments(res.data.comments || []);
    } catch (err) {
      setError('Impossible de charger les détails du ticket');
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3500); };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/tickets/${id}/comments/`, { text: comment });
      setComment('');
      flash('✅ Commentaire ajouté');
      fetchTicketDetails();
    } catch { alert('Erreur lors de l\'ajout du commentaire'); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === ticket.status) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/tickets/${id}/status/`, { status: newStatus });
      flash(`✅ Statut mis à jour : ${newStatus}`);
      await fetchTicketDetails();
    } catch { alert('Erreur lors de la mise à jour du statut'); }
    finally { setUpdatingStatus(false); }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archiver ce ticket ?')) return;
    try {
      await api.post(`/tickets/${id}/archive/`);
      flash('✅ Ticket archivé');
      setTimeout(() => navigate('/'), 1500);
    } catch { alert('Erreur lors de l\'archivage'); }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>Chargement...</p>;
  if (error) return <p style={{ textAlign: 'center', color: '#f5222d', marginTop: 50 }}>{error}</p>;
  if (!ticket) return <p style={{ textAlign: 'center', marginTop: 50 }}>Ticket introuvable</p>;

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/')}>← Retour</button>

      {successMessage && (
        <div style={styles.successMessage}>
          <span>{successMessage}</span>
          <button style={styles.closeBtn} onClick={() => setSuccessMessage('')}>✕</button>
        </div>
      )}

      <div style={styles.card}>
        {/* En-tête */}
        <div style={styles.header}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ color: '#888', fontSize: 13 }}>Ticket #{ticket.id}</span>
              {ticket.is_archived && <span style={{ background: '#f0f0f0', color: '#888', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>🗄 Archivé</span>}
            </div>
            <h1 style={styles.title}>{ticket.title}</h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {ticket.priority_score && (
              <span style={{ padding: '4px 14px', borderRadius: 20, background: priorityColors[ticket.priority_score] || '#ccc', color: 'white', fontWeight: 'bold', fontSize: 13 }}>
                {ticket.priority_score}
              </span>
            )}
            {isAdmin && !ticket.is_archived && (
              <button style={styles.archiveBtn} onClick={handleArchive}>🗄 Archiver</button>
            )}
          </div>
        </div>

        {/* Métadonnées */}
        <div style={styles.metadata}>
          {/* Statut */}
          <div style={styles.metaItem}>
            <strong>Statut :</strong>
            {canModify ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  style={{ ...styles.statusSelect, backgroundColor: getStatusColor(ticket.status), opacity: updatingStatus ? 0.7 : 1 }}
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus || ticket.is_archived}
                >
                  <option value="Ouvert">Ouvert</option>
                  <option value="En cours">En cours</option>
                  <option value="Résolu">Résolu</option>
                  <option value="Fermé">Fermé</option>
                </select>
                {updatingStatus && <span style={styles.updatingText}>Mise à jour...</span>}
              </div>
            ) : (
              <span style={{ marginLeft: 8, padding: '4px 12px', borderRadius: 20, background: getStatusColor(ticket.status), color: 'white', fontSize: 13, fontWeight: 'bold' }}>
                {ticket.status}
              </span>
            )}
          </div>

          <div style={styles.metaItem}><strong>Catégorie :</strong> <span style={{ marginLeft: 6 }}>{ticket.category || '⏳ Classification en cours...'}</span></div>
          <div style={styles.metaItem}><strong>Créé par :</strong> <span style={{ marginLeft: 6 }}>{ticket.created_by?.email || 'N/A'}</span></div>
          <div style={styles.metaItem}><strong>Créé le :</strong> <span style={{ marginLeft: 6 }}>{formatDate(ticket.created_at)}</span></div>
          {ticket.assigned_to && (
            <div style={styles.metaItem}><strong>Assigné à :</strong> <span style={{ marginLeft: 6, color: '#52c41a', fontWeight: 600 }}>{ticket.assigned_to.email}</span></div>
          )}
        </div>

        {/* Description */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📝 Description</h3>
          <p style={styles.description}>{ticket.description}</p>
        </div>

        {/* Commentaires */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💬 Commentaires ({comments.length})</h3>

          {!ticket.is_archived && (
            <form onSubmit={handleAddComment} style={{ marginBottom: 24 }}>
              <textarea
                style={styles.textarea}
                placeholder="Ajouter un commentaire..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
                disabled={submitting}
              />
              <button
                type="submit"
                style={{ ...styles.commentBtn, ...((submitting || !comment.trim()) ? { background: '#ccc', cursor: 'not-allowed' } : {}) }}
                disabled={submitting || !comment.trim()}
              >
                {submitting ? 'Envoi...' : 'Publier le commentaire'}
              </button>
            </form>
          )}

          {comments.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', padding: 30 }}>
              Aucun commentaire pour l'instant.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={styles.comment}>
                <div style={styles.commentHeader}>
                  <strong style={{ color: '#333' }}>{c.user?.email || 'Anonyme'}</strong>
                  <span style={{ color: '#888', fontSize: 12 }}>{formatDate(c.created_at)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.6 }}>{c.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: '30px 20px' },
  backBtn: { background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', fontSize: 15, marginBottom: 20, padding: 0 },
  successMessage: { background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: '12px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#52c41a' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 18 },
  card: { background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 },
  title: { margin: 0, fontSize: 24, color: '#222', lineHeight: 1.4 },
  archiveBtn: { padding: '6px 16px', background: '#faad14', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 },
  metadata: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16, padding: 20, background: '#f8f9fa', borderRadius: 8, marginBottom: 28 },
  metaItem: { fontSize: 14, color: '#555', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  statusSelect: { marginLeft: 8, padding: '5px 10px', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 'bold', color: 'white', outline: 'none' },
  updatingText: { fontSize: 12, color: '#1890ff', fontStyle: 'italic' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 17, color: '#333', borderBottom: '2px solid #f0f0f0', paddingBottom: 8, marginBottom: 16 },
  description: { fontSize: 15, lineHeight: 1.8, color: '#444', whiteSpace: 'pre-wrap', background: '#fafafa', padding: 16, borderRadius: 8, border: '1px solid #f0f0f0' },
  textarea: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 10, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  commentBtn: { padding: '8px 24px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' },
  comment: { background: '#f8f9fa', padding: 16, borderRadius: 8, border: '1px solid #eee', marginBottom: 12 },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 },
};