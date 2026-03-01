// components/TicketCard.jsx
import PriorityBadge from './PriorityBadge';

export default function TicketCard({ ticket, onClick }) {
  return (
    <div style={styles.card} onClick={() => onClick(ticket.id)}>
      <div style={styles.header}>
        <h3 style={styles.title}>{ticket.title}</h3>
        <PriorityBadge priority={ticket.priority_score} />
      </div>
      
      <p style={styles.description}>
        {ticket.description.length > 100
          ? `${ticket.description.substring(0, 100)}...`
          : ticket.description}
      </p>
      
      <div style={styles.footer}>
        <span style={styles.meta}>
          📁 {ticket.category || 'Classifying...'}
        </span>
        <span style={styles.meta}>
          🔵 {ticket.status}
        </span>
        <span style={styles.meta}>
          🕒 {new Date(ticket.created_at).toLocaleDateString()}
        </span>
      </div>
      
      {ticket.ai_analysis && (
        <div style={styles.aiTag}>
          🤖 AI Processed
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: 'white',
    padding: '20px',
    marginBottom: '15px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
  },
  description: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '15px',
  },
  footer: {
    display: 'flex',
    gap: '15px',
    fontSize: '13px',
  },
  meta: {
    color: '#888',
  },
  aiTag: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '11px',
    color: '#722ed1',
    background: '#f0f0ff',
    padding: '2px 8px',
    borderRadius: '12px',
  },
};