import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const baseURL = `https://hermes-backend-69ja.onrender.com`;
let socket;

function Chat({ username }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(null);
  const [notifications, setNotifications] = useState({});
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [friendProfile, setFriendProfile] = useState(null);

  // Reference to the messages container
  const messagesContainerRef = useRef(null);

  // Redirect to login page if not logged in
  const navigate = useNavigate();
  useEffect(() => {
    if (!username) {
      navigate('/login');
    }
  }, [navigate, username]);

  // Initialize socket connection and handle listeners
  useEffect(() => {
    if (!socket) {
      socket = io(baseURL);
    }

    if (username) {
      socket.emit('joinRoom', username);

      // Listen for incoming messages
      socket.on('receiveMessage', (newMessage) => {
        // Filter messages based on the selected friend
        if (
          (newMessage.sender === selectedFriend && newMessage.receiver === username) ||
          (newMessage.sender === username && newMessage.receiver === selectedFriend)
        ) {
          setMessages((prevMessages) => {
            if (!prevMessages.find((msg) => msg._id === newMessage._id)) {
              return [...prevMessages, newMessage];
            }
            return prevMessages;
          });
        }

        // Update notifications if the message is for the current user but not in the current chat
        if (newMessage.receiver === username && newMessage.sender !== selectedFriend) {
          setNotifications((prev) => ({
            ...prev,
            [newMessage.sender]: (prev[newMessage.sender] || 0) + 1,
          }));
        }

        if (newMessage.receiver === username || newMessage.sender === username) {
          const friendToMove = newMessage.sender === username ? newMessage.receiver : newMessage.sender;
          setFriends((prevFriends) => {
            const updatedFriends = prevFriends.map((friend) =>
              friend.username === friendToMove
                ? { ...friend, lastMessageTimestamp: new Date().toISOString() }
                : friend
            );
            return updatedFriends
              .filter(Boolean)
              .sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));
          });
        }
      });

      // Handle typing indicators
      socket.on(`typing-${username}`, ({ sender }) => {
        if (sender === selectedFriend) {
          setIsTyping(sender);
        }
      });

      socket.on(`stopTyping-${username}`, ({ sender }) => {
        if (sender === selectedFriend) {
          setIsTyping(null);
        }
      });

      return () => {
        // Cleanup socket listeners on component unmount
        socket.off('receiveMessage');
        socket.off(`typing-${username}`);
        socket.off(`stopTyping-${username}`);
      };
    }
  }, [username, selectedFriend, isTyping]);

  // Scroll to the bottom of the messages container when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch logged-in user's profile picture on load
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${baseURL}/user/${username}`);
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
        const response = await axios.get(`${baseURL}/friends/${username}`);
        const sortedFriends = response.data.sort(
          (a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
        );
        setFriends(sortedFriends);
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
          const response = await axios.get(`${baseURL}/messages/${username}/${selectedFriend}`);
          setMessages(response.data);
          setNotifications((prev) => ({ ...prev, [selectedFriend]: 0 }));
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      fetchMessages();
    }
  }, [selectedFriend, username]);

  // Fetch friend's profile when clicking the "View Profile" button
  const openFriendProfile = async () => {
    try {
      const response = await axios.get(`${baseURL}/user/${selectedFriend}`);
      setFriendProfile(response.data);
      setIsBubbleOpen(true);
    } catch (error) {
      console.error('Error fetching friend profile:', error);
    }
  };

  // Send message
  const sendMessage = () => {
    if (message && selectedFriend) {
      const messageData = {
        sender: username,
        receiver: selectedFriend,
        content: message,
        senderProfilePicture: userProfilePicture,
        timestamp: new Date().toISOString(),
      };

      // Emit the message through Socket.IO without updating UI immediately to avoid duplicates
      if (socket) {
        socket.emit('sendMessage', messageData);
      }
      setMessage('');
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (socket && !typing) {
      setTyping(true);
      socket.emit('typing', { sender: username, receiver: selectedFriend });
    }

    setTimeout(() => {
      if (socket) {
        setTyping(false);
        socket.emit('stopTyping', { sender: username, receiver: selectedFriend });
      }
    }, 1000);
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`${baseURL}/message/${messageId}`, {
        data: { username },
      });
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatFullDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.chatHeader}>Messages</h2>
        <ul style={styles.friendList}>
          {friends.map((friend) => (
            <li
              key={friend.username}
              style={styles.friendItem(selectedFriend === friend.username)}
              onClick={() => setSelectedFriend(friend.username)}
            >
              <img
                src={`${baseURL}${friend.profilePicture}`}
                alt="Profile"
                style={styles.profilePicture}
              />
              <div style={styles.friendInfo}>
                <span>{friend.username}</span>
                {notifications[friend.username] > 0 && (
                  <div style={styles.notificationBubble}>
                    {notifications[friend.username]}
                  </div>
                )}
                <br />
                <span style={styles.timestamp}>
                  {friend.lastMessageTimestamp
                    ? new Date(friend.lastMessageTimestamp).toLocaleString()
                    : 'No messages yet'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div style={styles.chatWindow}>
        {selectedFriend ? (
          <>
            <div style={styles.chatHeader}>
              <h2 style={styles.chatHeaderText}>{selectedFriend}</h2>
              <button onClick={openFriendProfile} style={styles.viewProfileButton}>
                View Profile
              </button>
            </div>
            <div style={styles.messagesContainer} ref={messagesContainerRef}>
              <div style={styles.messages}>
                {messages.map((msg, index) => (
                  <div
                    key={`${msg._id}-${index}`}
                    style={
                      msg.sender === username ? styles.sentMessageContainer : styles.receivedMessageContainer
                    }
                    onMouseEnter={() => setHoveredMessageId(msg._id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div
                      style={
                        msg.sender === username
                          ? styles.sentMessageBubble
                          : styles.receivedMessageBubble
                      }
                    >
                      <div style={styles.message}>
                        <p style={styles.messageText}>{msg.content}</p>
                      </div>
                    </div>
                    <div style={styles.messageInfo}>
                      {msg.sender === username && hoveredMessageId === msg._id && (
                        <button
                          onClick={() => deleteMessage(msg._id)}
                          style={styles.deleteButton}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                      <span style={styles.timestampOutside}>{formatTime(msg.timestamp)}</span>
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
          <h2 style={styles.chatHeader}>Select a friend to start chatting</h2>
        )}
      </div>

      {/* Central Overlay for showing friend profile */}
      {isBubbleOpen && friendProfile && (
        <div style={styles.profileOverlay}>
          <div style={styles.profileOverlayContent}>
            <h2>{friendProfile.username}</h2>
            <img
              src={`${baseURL}${friendProfile.profilePicture}`}
              alt="Profile"
              style={styles.profilePictureExtraLarge}
            />
            <p style={styles.profileText}><strong>Bio:</strong> {friendProfile.bio || 'No bio available'}</p>
            <p style={styles.profileText}><strong>Nickname:</strong> {friendProfile.nickname || 'No nickname available'}</p>
            <button onClick={() => setIsBubbleOpen(false)} style={styles.closeOverlayButton}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
  },
  sidebar: {
    width: '25%',
    backgroundColor: '#2c2f33',
    padding: '20px',
    color: '#ffffff',
    overflowY: 'auto',
  },
  chatWindow: {
    width: '75%',
    padding: '20px',
    backgroundColor: '#36393f',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  chatHeader: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  chatHeaderText: {
    margin: 0,
  },
  viewProfileButton: {
    position: 'absolute',
    right: 0,
    padding: '8px 12px',
    backgroundColor: '#4e5d94',
    color: '#ffffff',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
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
  profilePictureExtraLarge: {
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    marginBottom: '20px',
  },
  notificationBubble: {
    backgroundColor: '#ff5555',
    color: '#ffffff',
    borderRadius: '50%',
    padding: '5px 10px',
    fontSize: '0.8em',
    position: 'absolute',
    top: '-5px',
    right: '-10px',
    zIndex: 1,
  },
  timestamp: {
    fontSize: '0.8em',
    color: '#99aab5',
  },
  messagesContainer: {
    flexGrow: 1,
    overflowY: 'scroll',
    marginBottom: '10px',
    padding: '10px',
    backgroundColor: '#36393f',
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
    marginBottom: '5px',
  },
  receivedMessageContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: '5px',
  },
  sentMessageBubble: {
    backgroundColor: '#7289da',
    color: '#ffffff',
    padding: '10px',
    borderRadius: '15px',
    maxWidth: '60%',
    position: 'relative',
  },
  receivedMessageBubble: {
    backgroundColor: '#40444b',
    color: '#ffffff',
    padding: '10px',
    borderRadius: '15px',
    maxWidth: '60%',
    position: 'relative',
  },
  message: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  messageText: {
    marginBottom: '5px',
  },
  messageInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '5px',
  },
  timestampOutside: {
    fontSize: '0.7em',
    color: 'rgba(204, 204, 204, 0.7)',
    marginTop: '5px',
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
  profileOverlay: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    padding: '40px',
    backgroundColor: '#2c2f33',
    color: '#ffffff',
    borderRadius: '15px',
    boxShadow: '0px 0px 25px rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
    textAlign: 'center',
  },
  profileOverlayContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  profileText: {
    textAlign: 'center',
    marginBottom: '15px',
    maxWidth: '90%',
    overflowWrap: 'break-word',
    color: '#b9bbbe',
  },
  closeOverlayButton: {
    padding: '10px 20px',
    backgroundColor: '#ff5555',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '15px',
  },
};

export default Chat;
