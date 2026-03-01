// components/LoadingSpinner.jsx
export default function LoadingSpinner() {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>Loading...</p>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #1890ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  text: {
    marginTop: '20px',
    color: '#666',
    fontSize: '16px',
  },
};

// Add this to your global CSS or index.css
// @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }