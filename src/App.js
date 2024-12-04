import React, {useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import Chat from './components/Chat';
import FriendList from './components/FriendList';
import PostPage from './components/PostPage';
import Profile from './components/Profile';
import Settings from './components/Settings'; // Import Settings component
import './App.css';

function App() {
  // current username as a global variable that changes dynamically
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar is visible only if the user is logged in */}
        {currentUser && <Sidebar setCurrentUser={setCurrentUser} />}

        <div className={`content-container ${currentUser ? 'logged-in' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to={currentUser ? "/chat" : "/login"} />} />
            <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/chat" element={<Chat username={currentUser} />} />
            <Route path="/friends" element={<FriendList username={currentUser} />} />
            <Route path="/profile" element={<Profile username={currentUser} />} />
            <Route path="/posts" element={<PostPage username={currentUser} />} />
            <Route path="/settings" element={<Settings username={currentUser} />} /> {/* New Settings Route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
