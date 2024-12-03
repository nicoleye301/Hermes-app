import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import Chat from './components/Chat';
import FriendList from './components/FriendList';
import Profile from './components/Profile';
import './App.css'; // Global styles

function App() {
  const isLoggedIn = !!localStorage.getItem('username');

  return (
    <Router>
      <div className="app-container">
        {isLoggedIn && <Sidebar />} {/* Sidebar should always be on the left */}
        <div className="content-container">
          <Routes>
            <Route path="/" element={<Navigate to={isLoggedIn ? "/chat" : "/login"} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/friends" element={<FriendList />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
