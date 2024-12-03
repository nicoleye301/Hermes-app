import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('username'); // Clear user data
    navigate('/login'); // Redirect to login page
  };

  const isLoggedIn = !!localStorage.getItem('username'); // Check if user is logged in

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <Link to="/" style={styles.link}>
          Hermes
        </Link>
      </div>
      <div style={styles.navLinks}>
      {isLoggedIn ? (
  <>
    <Link to="/chat" style={styles.link}>
      Chat
    </Link>
    <Link to="/friends" style={styles.link}>
      Friends
    </Link>
    <Link to="/create-group" style={styles.link}>
      Create Group
    </Link>
    <Link to="/groups" style={styles.link}>
      Groups
    </Link>
    <button onClick={handleLogout} style={styles.logoutButton}>
      Logout
    </button>
  </>
) : (
  <>
    <Link to="/login" style={styles.link}>
      Login
    </Link>
    <Link to="/signup" style={styles.link}>
      Signup
    </Link>
  </>
)}

      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: '10px 20px',
    color: 'white',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  navLinks: {
    display: 'flex',
    gap: '15px',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default Navbar;
