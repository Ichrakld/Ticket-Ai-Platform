// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import TicketCard from '../components/TicketCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const message = sessionStorage.getItem('ticketSuccess');
    if (message) {
      setSuccessMessage(message);
      sessionStorage.removeItem('ticketSuccess');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/');
      setTickets(res.data.results || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (ticket.is_archived) return false;
    if (filter !== 'all' && ticket.status?.toLowerCase() !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return ticket.title?.toLowerCase().includes(term) || ticket.description?.toLowerCase().includes(term);
    }
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Ouvert').length,
    inProgress: tickets.filter(t => t.status === 'En cours').length,
    resolved: tickets.filter(t => t.status === 'Résolu').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={styles.container}>
      {successMessage && (
        <div style={styles.successBanner}>
          <span style={styles.successIcon}>✅</span>
          <span style={styles.successText}>{successMessage}</span>
          <button style={styles.closeBtn} onClick={() => setSuccessMessage('')}>✕</button>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🎫 Mes Tickets</h1>
          {user && <p style={styles.subtitle}>Connecté en tant que <strong>{user.email}</strong></p>}
        </div>
        <button style={styles.createBtn} onClick={() => navigate('/create')}>
          + Nouveau ticket
        </button>
      </div>

      {/* Barre de recherche + filtre */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="🔍 Rechercher un ticket..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select style={styles.filterSelect} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="ouvert">Ouvert</option>
          <option value="en cours">En cours</option>
          <option value="résolu">Résolu</option>
          <option value="fermé">Fermé</option>
        </select>
      </div>

      {/* Stats */}
      <div style={styles.statsContainer}>
        <div style={{ ...styles.statCard, background: '#e6f7ff', borderLeft: '4px solid #1890ff' }}>
          <span style={styles.statNumber}>{stats.total}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
        <div style={{ ...styles.statCard, background: '#fff7e6', borderLeft: '4px solid #fa8c16' }}>
          <span style={styles.statNumber}>{stats.open}</span>
          <span style={styles.statLabel}>Ouverts</span>
        </div>
        <div style={{ ...styles.statCard, background: '#fffbe6', borderLeft: '4px solid #faad14' }}>
          <span style={styles.statNumber}>{stats.inProgress}</span>
          <span style={styles.statLabel}>En cours</span>
        </div>
        <div style={{ ...styles.statCard, background: '#f6ffed', borderLeft: '4px solid #52c41a' }}>
          <span style={styles.statNumber}>{stats.resolved}</span>
          <span style={styles.statLabel}>Résolus</span>
        </div>
      </div>

      {/* Liste */}
      {filteredTickets.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Aucun ticket trouvé</p>
          {searchTerm && (
            <button style={styles.clearBtn} onClick={() => setSearchTerm('')}>Effacer la recherche</button>
          )}
          {tickets.length === 0 && (
            <button style={styles.createFirstBtn} onClick={() => navigate('/create')}>
              Créer mon premier ticket
            </button>
          )}
        </div>
      ) : (
        filteredTickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={(id) => navigate(`/tickets/${id}`)}
          />
        ))
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '30px 20px' },
  successBanner: {
    background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px',
    padding: '16px 20px', marginBottom: '20px', display: 'flex',
    alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(82,196,26,0.2)',
  },
  successIcon: { fontSize: '20px' },
  successText: { flex: 1, color: '#52c41a', fontSize: '15px', fontWeight: '500' },
  closeBtn: { background: 'none', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  title: { margin: 0, fontSize: '28px', color: '#333' },
  subtitle: { margin: '4px 0 0', fontSize: '14px', color: '#888' },
  createBtn: { padding: '10px 24px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(24,144,255,0.3)' },
  filterBar: { display: 'flex', gap: '15px', marginBottom: '25px' },
  searchInput: { flex: 1, padding: '12px 16px', border: '2px solid #f0f0f0', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  filterSelect: { padding: '12px 16px', border: '2px solid #f0f0f0', borderRadius: '8px', fontSize: '14px', background: 'white', minWidth: '160px', cursor: 'pointer' },
  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '15px', marginBottom: '30px' },
  statCard: { padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  statNumber: { display: 'block', fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '5px' },
  statLabel: { fontSize: '13px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
  emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  emptyText: { color: '#999', fontSize: '16px', marginBottom: '20px' },
  clearBtn: { padding: '10px 24px', background: 'transparent', border: '2px solid #1890ff', color: '#1890ff', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' },
  createFirstBtn: { padding: '12px 28px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};