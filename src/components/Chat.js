import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import 'bootstrap-icons/font/bootstrap-icons.css';

const port = 5003;
const socket = io(`http://localhost:${port}`);

function Chat({ username }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(null);
  const [notifications, setNotifications] = useState({});
  const [hoveredMessageId, setHoveredMessageId] = useState(null); // Track hovered message

  // Reference to the messages container
  const messagesContainerRef = useRef(null);

  // Redirect to login page if not logged in
  const navigate = useNavigate();
  useEffect(() => {
    if (!username) {
      navigate("/login");
    }
  }, [navigate, username]);

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
          // Reset notifications for the selected friend
          setNotifications((prev) => ({ ...prev, [selectedFriend]: 0 }));
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
      // Only add the message if it doesn't already exist in the state
      setMessages((prevMessages) => {
        if (!prevMessages.find((msg) => msg._id === newMessage._id)) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });

      // Update notifications for the sender if it's not the selected friend
      if (newMessage.receiver === username && newMessage.sender !== selectedFriend) {
        setNotifications((prev) => ({
          ...prev,
          [newMessage.sender]: (prev[newMessage.sender] || 0) + 1,
        }));
      }

      // Move the friend to the top of the friend list if they sent or received a new message
      if (newMessage.receiver === username || newMessage.sender === username) {
        const friendToMove = newMessage.sender === username ? newMessage.receiver : newMessage.sender;
        setFriends((prevFriends) => {
          const updatedFriends = prevFriends.filter((friend) => friend.username !== friendToMove);
          const friendToAdd = prevFriends.find((friend) => friend.username === friendToMove);
          return [friendToAdd, ...updatedFriends].filter(Boolean); // Ensure friendToAdd exists
        });
      }
    });

    socket.on(`typing-${username}`, ({ sender }) => {
      setIsTyping(sender);
    });

    socket.on(`stopTyping-${username}`, ({ sender }) => {
      if (isTyping === sender) {
        setIsTyping(null);
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.off(`typing-${username}`);
      socket.off(`stopTyping-${username}`);
    };
  }, [selectedFriend, username, isTyping]);

  // Scroll to the bottom of the messages container when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
      setMessage('');
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!typing) {
      setTyping(true);
      socket.emit('typing', { sender: username, receiver: selectedFriend });
    }

    // Stop typing after 1 second
    setTimeout(() => {
      setTyping(false);
      socket.emit('stopTyping', { sender: username, receiver: selectedFriend });
    }, 1000);
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`http://localhost:${port}/message/${messageId}`, {
        data: { username }, // Pass the username to verify if the sender is deleting
      });
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
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
              style={styles.friendItem(selectedFriend === friend.username)}
              onClick={() => setSelectedFriend(friend.username)}
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
        {selectedFriend ? (
          <>
            <h2>Chat with {selectedFriend}</h2>
            <div style={styles.messagesContainer} ref={messagesContainerRef}>
              <div style={styles.messages}>
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    style={msg.sender === username ? styles.sentMessageContainer : styles.receivedMessageContainer}
                    onMouseEnter={() => setHoveredMessageId(msg._id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div style={styles.message}>
                      <img
                        src={`http://localhost:${port}${msg.senderProfilePicture}`}
                        alt="Profile"
                        style={styles.messageProfilePicture}
                      />
                      <p style={msg.sender === username ? styles.sentMessage : styles.receivedMessage}>
                        {msg.content}
                      </p>
                      {msg.sender === username && hoveredMessageId === msg._id && (
                        <button
                          onClick={() => deleteMessage(msg._id)}
                          style={styles.deleteButton}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div style={styles.typingIndicator}>
                    {isTyping} is typing...
                  </div>
                )}
              </div>
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
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
    gap: '5px',
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
    marginBottom: '5px',
  },
  receivedMessageContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: '5px',
  },
  messageProfilePicture: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    marginRight: '5px',
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
  deleteButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ff5555',
    cursor: 'pointer',
    fontSize: '14px',
  },
  message: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    position: 'relative',
  },
};

export default Chat;
