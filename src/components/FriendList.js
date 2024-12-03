import React, { useState, useEffect } from 'react';
import axios from 'axios';

const port = 5003;

function FriendList({username}) {
  const [friendUsername, setFriendUsername] = useState('');
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch friends on component load
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get(`http://localhost:${port}/friends/${username}`);
        setFriends(response.data);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };
    fetchFriends();
  }, [username]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`http://localhost:${port}/add-friend`, {
        username,
        friendUsername,
      });
      setSuccess(response.data.message);
      setFriendUsername(''); // Clear input

      // Update friends list
      const updatedFriends = await axios.get(`http://localhost:${port}/friends/${username}`);
      setFriends(updatedFriends.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding friend');
    }
  };

  return (
    <div style={styles.container}>
      <h1>Friend List</h1>
      <form onSubmit={handleAddFriend} style={styles.form}>
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
        <button type="submit" style={styles.button}>Add Friend</button>
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
            {friend.username}
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
