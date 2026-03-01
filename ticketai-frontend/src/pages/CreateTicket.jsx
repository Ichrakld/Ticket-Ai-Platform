// src/pages/CreateTicket.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CreateTicket() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    if (form.title.length < 5) {
      setError('Title must be at least 5 characters');
      return false;
    }
    if (form.description.length < 10) {
      setError('Description must be at least 10 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await api.post('/tickets/', form);
      
      // Store success message in sessionStorage before redirect
      sessionStorage.setItem('ticketSuccess', '✅ Ticket created successfully!');
      
      // Redirect to dashboard
      navigate('/');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating ticket');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🆕 Create New Ticket</h2>
        
        {error && (
          <div style={styles.errorAlert}>
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input
              style={styles.input}
              placeholder="e.g., Login page not working"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              disabled={loading}
              required
            />
            <small style={styles.hint}>
              Minimum 5 characters ({form.title.length}/5)
            </small>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Description *</label>
            <textarea
              style={{...styles.input, ...styles.textarea}}
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              disabled={loading}
              required
              rows="5"
            />
            <small style={styles.hint}>
              Minimum 10 characters ({form.description.length}/10)
            </small>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Category (Optional)</label>
            <select
              style={styles.input}
              value={form.category}
              onChange={(e) => setForm({...form, category: e.target.value})}
              disabled={loading}
            >
              <option value="">Auto-classify by AI</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature Request</option>
              <option value="support">Support</option>
              <option value="billing">Billing</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(loading && styles.submitBtnDisabled),
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loadingContent}>
                <span style={styles.spinner}></span>
                🤖 AI is analyzing...
              </span>
            ) : (
              'Submit Ticket'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 64px)',
    background: '#f0f2f5',
    padding: '20px',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '600px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '28px',
    color: '#333',
  },
  errorAlert: {
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    color: '#f5222d',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'border-color 0.3s',
    ':focus': {
      borderColor: '#722ed1',
      outline: 'none',
    },
  },
  textarea: {
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  hint: {
    display: 'block',
    marginTop: '5px',
    color: '#888',
    fontSize: '12px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: '#722ed1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
    marginTop: '10px',
    ':hover': {
      background: '#5b21b6',
    },
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  loadingContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid #ffffff',
    borderTop: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};