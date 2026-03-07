// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TicketCard from '../components/TicketCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Check for success message from ticket creation
  useEffect(() => {
    const message = sessionStorage.getItem('ticketSuccess');
    if (message) {
      setSuccessMessage(message);
      // Clear the message from sessionStorage
      sessionStorage.removeItem('ticketSuccess');
      
      // Auto-hide the message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, []);

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
    if (filter !== 'all' && ticket.status?.toLowerCase() !== filter) {
      return false;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return ticket.title?.toLowerCase().includes(term) ||
             ticket.description?.toLowerCase().includes(term);
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
      {/* Success Message Banner */}
      {successMessage && (
        <div style={styles.successBanner}>
          <span style={styles.successIcon}>✅</span>
          <span style={styles.successText}>{successMessage}</span>
          <button 
            style={styles.closeBtn}
            onClick={() => setSuccessMessage('')}
          >
            ✕
          </button>
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>🎫 My Tickets</h1>
        <button style={styles.createBtn} onClick={() => navigate('/create')}>
          + New Ticket
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="🔍 Search tickets..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          style={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="open">Ouvert</option>
          <option value="in progress">En cours</option>
          <option value="resolved">Résolu</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsContainer}>
        <div style={{...styles.statCard, background: '#e6f7ff', borderLeft: '4px solid #1890ff'}}>
          <span style={styles.statNumber}>{stats.total}</span>
          <span style={styles.statLabel}>Total Tickets</span>
        </div>
        <div style={{...styles.statCard, background: '#fff7e6', borderLeft: '4px solid #fa8c16'}}>
          <span style={styles.statNumber}>{stats.open}</span>
          <span style={styles.statLabel}>Ouvert</span>
        </div>
        <div style={{...styles.statCard, background: '#f6ffed', borderLeft: '4px solid #52c41a'}}>
          <span style={styles.statNumber}>{stats.resolved}</span>
          <span style={styles.statLabel}>Résolu</span>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No tickets found</p>
          {searchTerm && (
            <button style={styles.clearBtn} onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          )}
          {tickets.length === 0 && (
            <button style={styles.createFirstBtn} onClick={() => navigate('/create')}>
              Create Your First Ticket
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
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '30px 20px',
    position: 'relative',
  },
  successBanner: {
    background: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 12px rgba(82, 196, 26, 0.2)',
    animation: 'slideDown 0.3s ease-out',
    position: 'relative',
  },
  successIcon: {
    fontSize: '20px',
  },
  successText: {
    flex: 1,
    color: '#52c41a',
    fontSize: '15px',
    fontWeight: '500',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 8px',
    ':hover': {
      color: '#666',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#333',
  },
  createBtn: {
    padding: '10px 24px',
    background: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
    ':hover': {
      background: '#40a9ff',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
    },
  },
  filterBar: {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #f0f0f0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.3s',
    ':focus': {
      borderColor: '#1890ff',
      outline: 'none',
      boxShadow: '0 2px 8px rgba(24, 144, 255, 0.1)',
    },
  },
  filterSelect: {
    padding: '12px 16px',
    border: '2px solid #f0f0f0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    minWidth: '150px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    ':focus': {
      borderColor: '#1890ff',
      outline: 'none',
    },
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '30px',
  },
  statCard: {
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: 'transform 0.3s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  emptyText: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '20px',
  },
  clearBtn: {
    padding: '10px 24px',
    background: 'transparent',
    border: '2px solid #1890ff',
    color: '#1890ff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginRight: '10px',
    transition: 'all 0.3s',
    ':hover': {
      background: '#e6f7ff',
    },
  },
  createFirstBtn: {
    padding: '12px 28px',
    background: '#52c41a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)',
    ':hover': {
      background: '#73d13d',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(82, 196, 26, 0.4)',
    },
  },
};

// Add animation to your global CSS
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
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = globalStyles;
  document.head.appendChild(style);
}