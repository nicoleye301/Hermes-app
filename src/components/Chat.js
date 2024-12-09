import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import socket from '../utils/socket';
const port = 5003;

function Chat({ username }) {
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // Friend's username
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [notifications, setNotifications] = useState({});
  const messagesContainerRef = useRef(null);

  const navigate = useNavigate();

  // Redirect to login page if not logged in
  useEffect(() => {
    if (!username) {
      navigate("/login");
    }
  }, [navigate, username]);

  // Fetch logged-in user's profile picture on load
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:5003/user/${username}`);
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
        const response = await axios.get(`http://localhost:5003/friends/${username}`);
        setFriends(response.data);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };
    fetchFriends();
  }, [username]);

  // Fetch chat history when an individual chat is selected
  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(`http://localhost:5003/messages/${username}/${selectedChat}`);
          setMessages(response.data);
          setNotifications((prev) => ({ ...prev, [selectedChat]: 0 })); // Reset notifications
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      fetchMessages();
    }
  }, [selectedChat, username]);

  // Handle new individual messages from Socket.IO
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      if (
        (newMessage.sender === username && newMessage.receiver === selectedChat) ||
        (newMessage.sender === selectedChat && newMessage.receiver === username)
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } else if (newMessage.receiver === username) {
        // Update notifications for the sender
        setNotifications((prev) => ({
          ...prev,
          [newMessage.sender]: (prev[newMessage.sender] || 0) + 1,
        }));
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [selectedChat, username]);

  // Scroll to the bottom of the messages container when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message to individual
  const sendMessage = () => {
    if (message && selectedChat) {
      const messageData = {
        sender: username,
        receiver: selectedChat,
        content: message,
        senderProfilePicture: userProfilePicture,
      };
      socket.emit('sendMessage', messageData);
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
              key={friend.username}
              style={styles.friendItem(selectedChat === friend.username)}
              onClick={() => setSelectedChat(friend.username)}
            >
              <img
                src={`http://localhost:${port}${friend.profilePicture}`}
                alt="Profile"
                style={styles.profilePicture}
              />
              <div style={styles.friendInfo}>
                <span>{friend.username}</span>
                {notifications[friend.username] > 0 && (
                  <span style={styles.notificationBadge}>
                    {notifications[friend.username]}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div style={styles.chatWindow}>
        {selectedChat ? (
          <>
            <h2>Chat with {selectedChat}</h2>
            <div style={styles.messagesContainer} ref={messagesContainerRef}>
              <div style={styles.messages}>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    style={
                      msg.sender === username
                        ? styles.sentMessageContainer
                        : styles.receivedMessageContainer
                    }
                  >
                    <img
                      src={`http://localhost:5003${msg.senderProfilePicture}`}
                      alt="Profile"
                      style={styles.messageProfilePicture}
                    />
                    <p
                      style={
                        msg.sender === username
                          ? styles.sentMessage
                          : styles.receivedMessage
                      }
                    >
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
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
          <h2>Select a chat to start messaging</h2>
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
    position: 'relative',
  }),
  profilePicture: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    marginRight: '10px',
  },
  notificationBadge: {
    position: 'absolute',
    right: '10px',
    top: '10px',
    backgroundColor: '#7289da',
    color: '#ffffff',
    borderRadius: '50%',
    padding: '5px 8px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  messagesContainer: {
    flexGrow: 1,
    overflowY: 'scroll',
    border: '1px solid #42454a',
    marginBottom: '10px',
    padding: '10px',
    backgroundColor: '#2c2f33',
    borderRadius: '8px',
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingBottom: '20px',
  },
  typingIndicator: {
    fontStyle: 'italic',
    marginBottom: '10px',
    color: '#7289da',
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
