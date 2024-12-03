import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import Chat from './components/Chat';
import FriendList from './components/FriendList';
import PostPage from './components/PostPage';
import Profile from './components/Profile';
import './App.css';

function App() {
  // Check if the user is logged in
  const isLoggedIn = !!localStorage.getItem('username');

  return (
    <Router>
      <div className="app-container">
        
        {isLoggedIn && <div className="sidebar"><Sidebar /></div>}
        
        
        <div className={`content-container ${isLoggedIn ? 'logged-in' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to={isLoggedIn ? "/chat" : "/login"} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {isLoggedIn ? (
              <>
                <Route path="/chat" element={<Chat />} />
                <Route path="/friends" element={<FriendList />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/posts" element={<PostPage />} />
              </>
            ) : (
              <>
                <Route path="/chat" element={<Navigate to="/login" />} />
                <Route path="/friends" element={<Navigate to="/login" />} />
                <Route path="/profile" element={<Navigate to="/login" />} />
                <Route path="/posts" element={<Navigate to="/login" />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
