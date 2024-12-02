import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('username'); // Clear user data
    navigate('/login'); // Redirect to login page
  };

  const isLoggedIn = !!localStorage.getItem('username');

  return (
    <div className="col-sm-auto bg-light sticky-top">
      <div className="d-flex flex-sm-column flex-row flex-nowrap bg-light align-items-center sticky-top">
        {/* Logo here later */}
        <Link to="/" className="d-block p-3 link-dark text-decoration-none" title="Hermes" data-bs-toggle="tooltip" data-bs-placement="right">
          <i className="bi-bootstrap fs-1"></i> {/* Replace with a Hermes logo if available */}
        </Link>

        {/* Navigation Links */}
        <ul className="nav nav-pills nav-flush flex-sm-column flex-row flex-nowrap mb-auto mx-auto text-center align-items-center">
          <li className="nav-item">
            <Link to="/chat" className="nav-link py-3 px-2" title="Chat" data-bs-toggle="tooltip" data-bs-placement="right">
              <i className="bi-chat-dots fs-1"></i>
            </Link>
          </li>
          <li>
            <Link to="/friends" className="nav-link py-3 px-2" title="Friends" data-bs-toggle="tooltip" data-bs-placement="right">
              <i className="bi-people fs-1"></i>
            </Link>
          </li>
          <li>
            <Link to="/settings" className="nav-link py-3 px-2" title="Settings" data-bs-toggle="tooltip" data-bs-placement="right">
              <i className="bi-gear fs-1"></i>
            </Link>
          </li>
        </ul>

        {/* User Menu */}
        {isLoggedIn && (
          <div className="dropdown mt-3">
            <a href="#" className="d-flex align-items-center justify-content-center p-3 link-dark text-decoration-none dropdown-toggle" id="dropdownUser3" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi-person-circle h2"></i>
            </a>
            <ul className="dropdown-menu text-small shadow" aria-labelledby="dropdownUser3">
              <li><a className="dropdown-item" href="#">Profile</a></li>
              <li><a className="dropdown-item" href="#">Settings</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
