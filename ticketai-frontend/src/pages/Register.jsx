// src/pages/Register.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    password_confirm: '',
    acceptTerms: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Password strength checker
  useEffect(() => {
    let strength = 0;
    if (form.password.length >= 8) strength++;
    if (form.password.match(/[a-z]/)) strength++;
    if (form.password.match(/[A-Z]/)) strength++;
    if (form.password.match(/[0-9]/)) strength++;
    if (form.password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  }, [form.password]);

  const getStrengthColor = () => {
    const colors = ['#ff4d4f', '#ff7a45', '#faad14', '#52c41a', '#1890ff'];
    return colors[passwordStrength - 1] || '#ddd';
  };

  const getStrengthText = () => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return texts[passwordStrength - 1] || 'Enter password';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!form.email || !form.password || !form.password_confirm) {
      setError('Please fill in all fields');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (form.password !== form.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    if (!form.acceptTerms) {
      setError('You must accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        password_confirm: form.password_confirm
      });
      
      setSuccess('Registration successful! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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

      {/* Register Card */}
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>✨</span>
          </div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join TicketAI to manage your tickets</p>
        </div>

        {/* Messages */}
        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.alertIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.successAlert}>
            <span style={styles.alertIcon}>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Register Form */}
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
                disabled={loading || success}
                required
              />
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
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                disabled={loading || success}
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
            
            {/* Password strength meter */}
            {form.password && (
              <div style={styles.strengthMeter}>
                <div style={styles.strengthBar}>
                  <div style={{
                    ...styles.strengthFill,
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: getStrengthColor()
                  }}></div>
                </div>
                <span style={{
                  ...styles.strengthText,
                  color: getStrengthColor()
                }}>
                  {getStrengthText()}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>✓</span>
              Confirm Password
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                style={{
                  ...styles.input,
                  ...(form.password_confirm && {
                    borderColor: form.password === form.password_confirm ? '#52c41a' : '#ff4d4f'
                  })
                }}
                placeholder="Confirm your password"
                value={form.password_confirm}
                onChange={(e) => setForm({...form, password_confirm: e.target.value})}
                disabled={loading || success}
                required
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {form.password_confirm && (
              <span style={{
                ...styles.matchIndicator,
                color: form.password === form.password_confirm ? '#52c41a' : '#ff4d4f'
              }}>
                {form.password === form.password_confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
              </span>
            )}
          </div>

          {/* Terms and Conditions */}
          <label style={styles.termsLabel}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={form.acceptTerms}
              onChange={(e) => setForm({...form, acceptTerms: e.target.checked})}
              disabled={loading || success}
            />
            <span style={styles.termsText}>
              I accept the <Link to="/terms" style={styles.termsLink}>Terms of Service</Link> and{' '}
              <Link to="/privacy" style={styles.termsLink}>Privacy Policy</Link>
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(loading || success) && styles.submitButtonDisabled
            }}
            disabled={loading || success}
          >
            {loading ? (
              <span style={styles.loadingContent}>
                <span style={styles.spinner}></span>
                Creating Account...
              </span>
            ) : success ? (
              '✓ Registration Successful!'
            ) : (
              'Create Account'
            )}
          </button>

          {/* Login link */}
          <div style={styles.loginContainer}>
            <span style={styles.loginText}>Already have an account?</span>
            <Link to="/login" style={styles.loginLink}>
              Sign in
            </Link>
          </div>
        </form>

        {/* Password requirements */}
        <div style={styles.requirementsBox}>
          <p style={styles.requirementsTitle}>📋 Password Requirements:</p>
          <ul style={styles.requirementsList}>
            <li style={form.password.length >= 8 ? styles.requirementMet : styles.requirement}>
              ✓ At least 8 characters
            </li>
            <li style={/[a-z]/.test(form.password) ? styles.requirementMet : styles.requirement}>
              ✓ One lowercase letter
            </li>
            <li style={/[A-Z]/.test(form.password) ? styles.requirementMet : styles.requirement}>
              ✓ One uppercase letter
            </li>
            <li style={/[0-9]/.test(form.password) ? styles.requirementMet : styles.requirement}>
              ✓ One number
            </li>
            <li style={/[^a-zA-Z0-9]/.test(form.password) ? styles.requirementMet : styles.requirement}>
              ✓ One special character
            </li>
          </ul>
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
    background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
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
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'slideUp 0.5s ease-out',
    zIndex: 10,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '25px',
  },
  logoContainer: {
    width: '70px',
    height: '70px',
    background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    transform: 'rotate(5deg)',
    animation: 'shake 0.5s ease-in-out',
  },
  logoIcon: {
    fontSize: '36px',
    transform: 'rotate(-5deg)',
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
  successAlert: {
    background: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#52c41a',
    fontSize: '14px',
    animation: 'slideUp 0.3s ease-out',
  },
  alertIcon: {
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
      borderColor: '#43cea2',
      background: 'white',
      boxShadow: '0 4px 12px rgba(67, 206, 162, 0.1)',
    },
    ':disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
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
  strengthMeter: {
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  strengthBar: {
    flex: 1,
    height: '6px',
    background: '#f0f0f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    transition: 'width 0.3s, background-color 0.3s',
  },
  strengthText: {
    fontSize: '12px',
    fontWeight: '600',
    minWidth: '70px',
  },
  matchIndicator: {
    fontSize: '12px',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  termsLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#43cea2',
  },
  termsText: {
    lineHeight: '1.5',
  },
  termsLink: {
    color: '#185a9d',
    textDecoration: 'none',
    fontWeight: '500',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
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
      boxShadow: '0 8px 20px rgba(67, 206, 162, 0.4)',
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
  loginContainer: {
    textAlign: 'center',
    marginTop: '20px',
    padding: '20px 0 0',
    borderTop: '1px solid #eee',
  },
  loginText: {
    color: '#666',
    fontSize: '14px',
    marginRight: '5px',
  },
  loginLink: {
    color: '#43cea2',
    fontSize: '14px',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.3s',
    ':hover': {
      color: '#185a9d',
      textDecoration: 'underline',
    },
  },
  requirementsBox: {
    marginTop: '20px',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '12px',
    fontSize: '13px',
  },
  requirementsTitle: {
    margin: '0 0 10px',
    fontWeight: '600',
    color: '#495057',
  },
  requirementsList: {
    margin: 0,
    paddingLeft: '20px',
    listStyle: 'none',
  },
  requirement: {
    color: '#adb5bd',
    marginBottom: '4px',
    fontSize: '12px',
  },
  requirementMet: {
    color: '#52c41a',
    marginBottom: '4px',
    fontSize: '12px',
  },
};

// Add keyframes to document head (same as Login page)