import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Sidebar({ setCurrentUser }) {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  const handleLogout = () => {
    setCurrentUser(null); // Set loggedIn to false
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <div>
      <div style={styles.sidebar}>
        <div style={styles.iconContainer}>
          <>
            <Link to="/chat" className="d-block p-3 link-light text-decoration-none" title="Chat">
              <i className="bi-chat-dots" style={styles.icon}></i>
            </Link>
            <Link to="/friends" className="d-block p-3 link-light text-decoration-none" title="Friends">
              <i className="bi-people" style={styles.icon}></i>
            </Link>
            <Link to="/profile" className="d-block p-3 link-light text-decoration-none" title="Profile">
              <i className="bi-person-circle" style={styles.icon}></i>
            </Link>
            <Link to="/posts" className="d-block p-3 link-light text-decoration-none" title="Posts">
              <i className="bi-card-text" style={styles.icon}></i>
            </Link>
            <Link to="/settings" className="d-block p-3 link-light text-decoration-none" title="Settings">
              <i className="bi-gear" style={styles.icon}></i>
            </Link>
            <button
              onClick={() => setShowDialog(true)}
              className="d-block p-3 link-light text-decoration-none border-0 bg-transparent"
              title="Logout"
              style={styles.logoutButton}
            >
              <i className="bi-box-arrow-right" style={styles.icon}></i>
            </button>
          </>
        </div>
      </div>

      {/* Confirm quit */}
      {showDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialogBox}>
            <h3 style={styles.dialogTitle}>Are you sure you want to logout?</h3>
            <div style={styles.dialogButtons}>
              <button onClick={handleLogout} style={styles.dialogConfirm}>
                Confirm
              </button>
              <button onClick={() => setShowDialog(false)} style={styles.dialogCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '80px',
    backgroundColor: '#2c2f33',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
    padding: '10px 0',
    boxShadow: '2px 0 5px rgba(0, 0, 0, 0.2)',
    zIndex: 100,
  },
  iconContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    fontSize: '28px',
    color: '#7289da',
  },
  logoutButton: {
    marginTop: 'auto',
    outline: 'none',
    cursor: 'pointer',
  },
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  dialogBox: {
    backgroundColor: '#36393f',
    color: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    width: '300px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
  dialogTitle: {
    marginBottom: '15px',
    textAlign: 'center',
  },
  dialogButtons: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  dialogConfirm: {
    backgroundColor: '#7289da',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
  },
  dialogCancel: {
    backgroundColor: '#40444b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
  },
};

export default Sidebar;
