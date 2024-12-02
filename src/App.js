import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import Chat from './components/Chat';
import FriendList from './components/FriendList';
import './App.css'; // Global styles

function App() {
  const isLoggedIn = !!localStorage.getItem('username');

  return (
    <Router>
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar is static on the left */}
          {isLoggedIn && <Sidebar />}

          {/* Main content area */}
          <div className={`col-sm p-3 min-vh-100 content-area ${isLoggedIn ? 'logged-in' : ''}`}>
            <Routes>
              <Route path="/" element={<Navigate to={isLoggedIn ? "/chat" : "/login"} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/friends" element={<FriendList />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
