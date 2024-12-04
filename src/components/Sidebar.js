import React, {useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Sidebar({setCurrentUser}) {
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
            <button onClick={()=>setShowDialog(true)} className="d-block p-3 link-light text-decoration-none border-0 bg-transparent" title="Logout" style={styles.logoutButton}>
              <i className="bi-box-arrow-right" style={styles.icon}></i>
            </button>
          </>
        </div>
      </div>

      {/* Confirm quit */}
      {showDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h3>Are you sure you want to logout?</h3>
              <div className="dialog-buttons">
                <button onClick={handleLogout} className="dialog-confirm">
                  Confirm
                </button>
                <button onClick={() => setShowDialog(false)} className="dialog-cancel">
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
};

export default Sidebar;
