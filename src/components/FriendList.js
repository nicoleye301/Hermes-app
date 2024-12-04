import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const port = 5003;

function FriendList({ username }) {
  const [friendUsername, setFriendUsername] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect to login page if not logged in
  const navigate = useNavigate();
  useEffect(() => {
    if (!username) {
      navigate("/login");
    }
  }, [navigate, username]);

  // Fetch friends and their last message on component load
  useEffect(() => {
    const fetchFriendsWithLastMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:${port}/friends/${username}`);
        const friendsWithMessages = await Promise.all(response.data.map(async (friend) => {
          const messageResponse = await axios.get(`http://localhost:${port}/messages/${username}/${friend.username}`);
          const lastMessage = messageResponse.data[messageResponse.data.length - 1];
          return {
            ...friend,
            lastMessageTimestamp: lastMessage ? lastMessage.timestamp : null,
          };
        }));

        // Sort friends by last message timestamp, with latest first
        friendsWithMessages.sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));

        setFriends(friendsWithMessages);
      } catch (error) {
        console.error('Error fetching friends or messages:', error);
      }
    };
    fetchFriendsWithLastMessages();
  }, [username]);

  // Fetch friend requests on component load
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await axios.get(`http://localhost:${port}/friend-requests/${username}`);
        setFriendRequests(response.data);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };
    fetchFriendRequests();
  }, [username]);

  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`http://localhost:${port}/send-friend-request`, {
        username,
        targetUsername: friendUsername,
      });
      setSuccess(response.data.message);
      setFriendUsername(''); // Clear input
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError(error.response?.data?.message || 'Error sending friend request');
    }
  };

  const handleAcceptFriendRequest = async (requesterUsername) => {
    try {
      const response = await axios.post(`http://localhost:${port}/accept-friend-request`, {
        username,
        requesterUsername,
      });
      setSuccess(response.data.message);

      // Remove the accepted request from friendRequests
      setFriendRequests(friendRequests.filter(request => request.username !== requesterUsername));

      // Update friends list
      const updatedFriends = await axios.get(`http://localhost:${port}/friends/${username}`);
      setFriends(updatedFriends.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error accepting friend request');
    }
  };

  const handleRejectFriendRequest = async (requesterUsername) => {
    try {
      const response = await axios.post(`http://localhost:${port}/reject-friend-request`, {
        username,
        requesterUsername,
      });
      setSuccess(response.data.message);

      // Remove the rejected request from friendRequests
      setFriendRequests(friendRequests.filter(request => request.username !== requesterUsername));
    } catch (error) {
      setError(error.response?.data?.message || 'Error rejecting friend request');
    }
  };

  return (
    <div style={styles.container}>
      <h1>Friend List</h1>
      <form onSubmit={handleSendFriendRequest} style={styles.form}>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
        <input
          type="text"
          placeholder="Enter friend's username"
          value={friendUsername}
          onChange={(e) => setFriendUsername(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Send Friend Request</button>
      </form>
      <h2>Your Friends:</h2>
      <ul style={styles.friendList}>
        {friends.map((friend) => (
          <li key={friend._id} style={styles.friendItem}>
            <img
              src={`http://localhost:${port}${friend.profilePicture}`}
              alt="Profile"
              style={styles.profilePicture}
            />
            <div>
              <span>{friend.username}</span>
              {friend.lastMessageTimestamp && (
                <div style={styles.timestamp}>
                  Last message: {new Date(friend.lastMessageTimestamp).toLocaleString()}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <h2>Friend Requests:</h2>
      <ul style={styles.friendList}>
        {friendRequests.map((request) => (
          <li key={request._id} style={styles.friendItem}>
            <img
              src={`http://localhost:${port}${request.profilePicture}`}
              alt="Profile"
              style={styles.profilePicture}
            />
            {request.username}
            <div style={styles.requestButtons}>
              <button
                onClick={() => handleAcceptFriendRequest(request.username)}
                style={styles.acceptButton}
              >
                Accept
              </button>
              <button
                onClick={() => handleRejectFriendRequest(request.username)}
                style={styles.rejectButton}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    backgroundColor: '#2c2f33',
    color: '#ffffff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    margin: '10px 0',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #42454a',
    borderRadius: '4px',
    backgroundColor: '#40444b',
    color: '#ffffff',
  },
  button: {
    padding: '10px',
    fontSize: '16px',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  friendList: {
    listStyle: 'none',
    padding: 0,
    marginTop: '20px',
  },
  friendItem: {
    padding: '10px',
    backgroundColor: '#36393f',
    margin: '5px 0',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    color: '#ffffff',
  },
  profilePicture: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    marginRight: '10px',
  },
  requestButtons: {
    display: 'flex',
    gap: '10px',
  },
  timestamp: {
    fontSize: '12px',
    color: '#99aab5',
  },
  acceptButton: {
    padding: '5px 10px',
    backgroundColor: '#43b581',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  rejectButton: {
    padding: '5px 10px',
    backgroundColor: '#f04747',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    fontSize: '14px',
    marginBottom: '10px',
  },
  success: {
    color: 'green',
    fontSize: '14px',
    marginBottom: '10px',
  },
};

export default FriendList;
