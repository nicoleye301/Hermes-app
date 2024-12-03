import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const port = 5003;
const socket = io(`http://localhost:${port}`);

function Chat() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const username = localStorage.getItem('username');

// Fetch logged-in user's profile picture on load
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:${port}/user/${username}`);
        setUserProfilePicture(response.data.profilePicture);
      } catch (error) {
        console.error('Error fetching user profile picture:', error);
      }
    };
    fetchUserProfile();
  }, [username]);

// Fetch friend list on load
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

// Fetch chat history when a friend is selected
  useEffect(() => {
    if (selectedFriend) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(`http://localhost:${port}/messages/${username}/${selectedFriend}`);
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      fetchMessages();
    }
  }, [selectedFriend, username]);

// Handle new messages from Socket.IO
useEffect(() => {
  socket.on('receiveMessage', (newMessage) => {
    if (
      (newMessage.sender === username && newMessage.receiver === selectedFriend) ||
      (newMessage.sender === selectedFriend && newMessage.receiver === username)
    ) {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    }
  });

  return () => socket.off('receiveMessage');
}, [selectedFriend, username]);



// Send message
const sendMessage = () => {
  if (message && selectedFriend) {
    const messageData = {
      sender: username,
      receiver: selectedFriend,
      content: message,
      senderProfilePicture: userProfilePicture,
    };

    // Emit the message through Socket.IO
    socket.emit('sendMessage', messageData);

    // Clear the input field
    setMessage('');
  }
};


  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Your Friends</h2>
        <ul style={styles.friendList}>
          {friends.map((friend) => (
            <li
              key={friend._id}
              style={styles.friendItem(selectedFriend === friend.username)}
              onClick={() => setSelectedFriend(friend.username)}
            >
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
      <div style={styles.chatWindow}>
        {selectedFriend ? (
          <>
            <h2>Chat with {selectedFriend}</h2>
            <div style={styles.messages}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={msg.sender === username ? styles.sentMessageContainer : styles.receivedMessageContainer}>
                  <img
                    src={`http://localhost:${port}${msg.senderProfilePicture}`}
                    alt="Profile"
                    style={styles.messageProfilePicture}
                  />
                  <p style={msg.sender === username ? styles.sentMessage : styles.receivedMessage}>
                    <strong>{msg.sender}:</strong> {msg.content}
                  </p>
                </div>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={styles.input}
            />
            <button onClick={sendMessage} style={styles.button}>
              Send
            </button>
          </>
        ) : (
          <h2>Select a friend to start chatting</h2>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '95vh',
  },
  sidebar: {
    width: '20%',
    backgroundColor: '#2c2f33',
    padding: '20px',
    color: '#ffffff',
    overflowY: 'auto',
  },
  chatWindow: {
    width: '80%',
    padding: '10px',
    backgroundColor: '#36393f',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  friendList: {
    listStyle: 'none',
    padding: 0,
    color: '#ffffff',
  },
  friendItem: (isSelected) => ({
    padding: '10px',
    backgroundColor: isSelected ? '#7289da' : '#2c2f33',
    color: isSelected ? '#ffffff' : '#99aab5',
    cursor: 'pointer',
    marginBottom: '5px',
    borderRadius: '4px',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
  }),
  profilePicture: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    marginRight: '10px',
  },
  messages: {
    flexGrow: 1,
    overflowY: 'scroll',
    border: '1px solid #42454a',
    marginBottom: '10px',
    padding: '10px',
    backgroundColor: '#2c2f33',
    borderRadius: '8px',
  },
  sentMessageContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: '10px',
  },
  receivedMessageContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: '10px',
  },
  messageProfilePicture: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    marginRight: '10px',
  },
  sentMessage: {
    textAlign: 'right',
    color: '#7289da',
  },
  receivedMessage: {
    textAlign: 'left',
    color: '#ffffff',
  },
  input: {
    padding: '10px',
    border: '1px solid #42454a',
    borderRadius: '5px',
    backgroundColor: '#40444b',
    color: '#ffffff',
  },
  button: {
    padding: '10px',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
  },
};

export default Chat;
