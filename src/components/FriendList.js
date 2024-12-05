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
      <div style={styles.formContainer}>
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
      </div>
      
      <div style={styles.splitContainer}>
        <div style={styles.section}>
          <h2>Your Friends</h2>
          <ul style={styles.friendList}>
            {friends.map((friend) => (
              <li key={friend._id} style={styles.friendItem}>
                <img
                  src={`http://localhost:${port}${friend.profilePicture}`}
                  alt="Profile"
                  style={styles.profilePicture}
                />
                <div style={styles.friendInfo}>
                  <span style={styles.friendName}>{friend.username}</span>
                  {friend.lastMessageTimestamp && (
                    <div style={styles.timestamp}>
                      Last message: {new Date(friend.lastMessageTimestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.section}>
          <h2>Friend Requests</h2>
          <ul style={styles.friendList}>
            {friendRequests.map((request) => (
              <li key={request._id} style={styles.friendItem}>
                <img
                  src={`http://localhost:${port}${request.profilePicture}`}
                  alt="Profile"
                  style={styles.profilePicture}
                />
                <div style={styles.friendInfo}>
                  <span style={styles.friendName}>{request.username}</span>
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
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '50px auto',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    backgroundColor: '#2c2f33',
    color: '#ffffff',
  },
  formContainer: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  input: {
    margin: '10px 0',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #42454a',
    borderRadius: '4px',
    backgroundColor: '#40444b',
    color: '#ffffff',
    width: '80%',
    maxWidth: '400px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  splitContainer: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'space-between',
  },
  section: {
    flex: 1,
    padding: '20px',
    backgroundColor: '#36393f',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  friendList: {
    listStyle: 'none',
    padding: 0,
    marginTop: '20px',
  },
  friendItem: {
    padding: '15px',
    backgroundColor: '#42454a',
    marginBottom: '10px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    color: '#ffffff',
  },
  profilePicture: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    marginRight: '15px',
  },
  friendInfo: {
    flexGrow: 1,
  },
  friendName: {
    fontWeight: 'bold',
    fontSize: '1.1em',
  },
  requestButtons: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px',
  },
  timestamp: {
    fontSize: '12px',
    color: '#99aab5',
    marginTop: '5px',
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
