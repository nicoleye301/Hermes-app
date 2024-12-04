import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Sidebar({setCurrentUser}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null); // Set loggedIn to false
    navigate('/login'); // Redirect to login page after logout
  };

  return (
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

          {/* Add a link to the settings page. This link is represented in the sidebar with a gear icon. */}
          <Link to="/settings" className="d-block p-3 link-light text-decoration-none" title="Settings">
            <i className="bi-gear" style={styles.icon}></i>
          </Link>

          <button onClick={handleLogout} className="d-block p-3 link-light text-decoration-none border-0 bg-transparent" title="Logout" style={styles.logoutButton}>
            <i className="bi-box-arrow-right" style={styles.icon}></i>
          </button>
        </>
      </div>
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
};

export default Sidebar;
