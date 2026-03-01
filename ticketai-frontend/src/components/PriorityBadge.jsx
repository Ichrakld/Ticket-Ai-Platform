// components/PriorityBadge.jsx
const priorityConfig = {
  Critique: { color: '#ff4d4f', label: 'Critical' },
  Élevé: { color: '#fa8c16', label: 'High' },
  Moyen: { color: '#fadb14', label: 'Medium', textColor: '#000' },
  Faible: { color: '#52c41a', label: 'Low' },
};

export default function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || { color: '#ccc', label: priority || 'Pending' };
  
  return (
    <span style={{
      ...styles.badge,
      backgroundColor: config.color,
      color: config.textColor || 'white',
    }}>
      {config.label}
    </span>
  );
}

const styles = {
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
  },
};