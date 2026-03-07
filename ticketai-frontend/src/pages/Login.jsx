// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Animation effect for form entrance
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple validation
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('last_login_time', new Date().toISOString());
      login(res.data.user, res.data.access, res.data.refresh);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background decoration */}
      <div style={styles.background}>
        <div style={styles.circle1}></div>
        <div style={styles.circle2}></div>
        <div style={styles.circle3}></div>
      </div>

      {/* Login Card */}
      <div style={styles.card}>
        {/* Header with icon */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>🎫</span>
          </div>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Sign in to continue to TicketAI</p>
        </div>

        {/* Error message */}
        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email Field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>📧</span>
              Email Address
            </label>
            <div style={styles.inputWrapper}>
              <input
                type="email"
                style={styles.input}
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                disabled={loading}
                required
              />
              {form.email && <span style={styles.inputCheck}>✓</span>}
            </div>
          </div>

          {/* Password Field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🔒</span>
              Password
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                style={styles.input}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                disabled={loading}
                required
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" style={styles.checkbox} />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(loading && styles.submitButtonDisabled)
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loadingContent}>
                <span style={styles.spinner}></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Register link */}
          <div style={styles.registerContainer}>
            <span style={styles.registerText}>Don't have an account?</span>
            <Link to="/register" style={styles.registerLink}>
              Create account
            </Link>
          </div>
        </form>

        {/* Demo credentials */}
        <div style={styles.demoBox}>
          <p style={styles.demoTitle}>🎯 Demo Credentials</p>
          <p style={styles.demoText}>Email: demo@ticketai.com</p>
          <p style={styles.demoText}>Password: demo123</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '20px',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    top: '-100px',
    right: '-100px',
    animation: 'float 6s ease-in-out infinite',
  },
  circle2: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    bottom: '-50px',
    left: '-50px',
    animation: 'float 8s ease-in-out infinite',
  },
  circle3: {
    position: 'absolute',
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'pulse 4s ease-in-out infinite',
  },
  card: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'slideUp 0.5s ease-out',
    zIndex: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logoContainer: {
    width: '70px',
    height: '70px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    transform: 'rotate(-5deg)',
    animation: 'shake 0.5s ease-in-out',
  },
  logoIcon: {
    fontSize: '36px',
    transform: 'rotate(5deg)',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  errorAlert: {
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#f5222d',
    fontSize: '14px',
    animation: 'shake 0.3s ease-in-out',
  },
  errorIcon: {
    fontSize: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#444',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  labelIcon: {
    fontSize: '16px',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    transition: 'all 0.3s',
    outline: 'none',
    background: '#f8f9fa',
    ':focus': {
      borderColor: '#667eea',
      background: 'white',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
    },
    ':disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
  },
  inputCheck: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#52c41a',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  passwordToggle: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: 0,
    opacity: 0.6,
    transition: 'opacity 0.3s',
    ':hover': {
      opacity: 1,
    },
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#667eea',
  },
  forgotLink: {
    color: '#667eea',
    fontSize: '14px',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.3s',
    ':hover': {
      color: '#764ba2',
      textDecoration: 'underline',
    },
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.3s, box-shadow 0.3s',
    marginTop: '10px',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
    },
  },
  submitButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    ':hover': {
      transform: 'none',
      boxShadow: 'none',
    },
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
  registerContainer: {
    textAlign: 'center',
    marginTop: '20px',
    padding: '20px 0 0',
    borderTop: '1px solid #eee',
  },
  registerText: {
    color: '#666',
    fontSize: '14px',
    marginRight: '5px',
  },
  registerLink: {
    color: '#667eea',
    fontSize: '14px',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.3s',
    ':hover': {
      color: '#764ba2',
      textDecoration: 'underline',
    },
  },
  demoBox: {
    marginTop: '20px',
    padding: '16px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)',
    borderRadius: '12px',
    textAlign: 'center',
  },
  demoTitle: {
    margin: '0 0 8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057',
  },
  demoText: {
    margin: '4px 0',
    fontSize: '13px',
    color: '#6c757d',
    fontFamily: 'monospace',
  },
};

// Add keyframes to your global CSS or create a style tag
const globalStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.5); opacity: 0.1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
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