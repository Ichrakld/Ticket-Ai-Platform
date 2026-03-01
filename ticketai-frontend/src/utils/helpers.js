// src/utils/helpers.js

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Get priority color
export const getPriorityColor = (priority) => {
  const colors = {
    Critique: '#ff4d4f',
    Élevé: '#fa8c16',
    Moyen: '#fadb14',
    Faible: '#52c41a',
  };
  return colors[priority] || '#ccc';
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    open: '#1890ff',
    'in progress': '#fa8c16',
    resolved: '#52c41a',
    closed: '#888',
  };
  return colors[status?.toLowerCase()] || '#ccc';
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate random color
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Parse JWT token
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded) return true;
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

// Group tickets by status
export const groupTicketsByStatus = (tickets) => {
  return tickets.reduce((groups, ticket) => {
    const status = ticket.status || 'unknown';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(ticket);
    return groups;
  }, {});
};

// Group tickets by priority
export const groupTicketsByPriority = (tickets) => {
  return tickets.reduce((groups, ticket) => {
    const priority = ticket.priority_score || 'unknown';
    if (!groups[priority]) {
      groups[priority] = [];
    }
    groups[priority].push(ticket);
    return groups;
  }, {});
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};