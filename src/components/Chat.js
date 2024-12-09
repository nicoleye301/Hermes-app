import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import socket from '../utils/socket';
import Modal from "react-modal";
import Select from "react-select";
const port = 5003;


function Chat({ username }) {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chatType, setChatType] = useState('individual'); // 'individual' or 'group'
  const [selectedChat, setSelectedChat] = useState(null); // Friend's username or group ID
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(null);
  const [notifications, setNotifications] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);


  // Reference to the messages container
  const messagesContainerRef = useRef(null);

  const createGroup = async (groupName, members) => {
    try {
      const response = await axios.post(`http://localhost:${port}/create-group`, {
        groupName,
        members,
      });
      setGroups(prevGroups => [...prevGroups, response.data]);
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  const handleCreateGroup = async () => {
    if (newGroupName && selectedFriends.length) {
      const memberUsernames = selectedFriends.map(friend => friend.value);
      try {
        await createGroup(newGroupName, [username, ...memberUsernames]);
        setIsModalOpen(false);
        setNewGroupName('');
        setSelectedFriends([]);
        await fetchFriendsAndGroups(username); // Fetch the updated group list after group creation
      } catch (error) {
        console.error('Error creating group:', error);
        alert('Error creating group. Please try again.');
      }
    } else {
      alert('Please provide a group name and select at least one friend.');
    }
  };

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
        const response = await axios.get(`http://localhost:5003/user/${username}`);
        setUserProfilePicture(response.data.profilePicture);
      } catch (error) {
        console.error('Error fetching user profile picture:', error);
      }
    };
    fetchUserProfile();
  }, [username]);

  const fetchFriendsAndGroups = async (username) => {
    try {
      const responseFriends = await axios.get(`http://localhost:5003/friends/${username}`);
      setFriends(responseFriends.data);

      const responseGroups = await axios.get(`http://localhost:5003/groups/${username}`);
      setGroups(responseGroups.data);
    } catch (error) {
      console.error('Error fetching friends or groups:', error);
    }
  };

  // Fetch friend list and group list on load
  useEffect(() => {
    fetchFriendsAndGroups(username);
  }, [username]);

  // Fetch chat history when an individual or group chat is selected
  useEffect(() => {
    if (chatType === 'individual' && selectedChat) {
      // Fetch messages for individual chat
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
    } else if (chatType === 'group' && selectedChat) {
      // Join the group chat room
      socket.emit('joinGroup', selectedChat);

      // Fetch group messages
      const fetchGroupMessages = async () => {
        try {
          const response = await axios.get(`http://localhost:5003/group-messages/${selectedChat}`);
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching group messages:', error);
        }
      };
      fetchGroupMessages();
    }
  }, [chatType, selectedChat, username]);

  // Handle new individual and group messages from Socket.IO
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      if (
        (newMessage.sender === username && newMessage.receiver === selectedChat) ||
        (newMessage.sender === selectedChat && newMessage.receiver === username) ||
        (newMessage.groupId === selectedChat)
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } else if (newMessage.receiver === username) {
        // Update notifications for the sender
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
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('receiveGroupMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('receiveGroupMessage', handleReceiveMessage);
    };
  }, [selectedChat, username]);

  // Scroll to the bottom of the messages container when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Send message to either individual or group
  const sendMessage = () => {
    if (message && selectedChat) {
      const messageData = {
        sender: username,
        content: message,
        senderProfilePicture: userProfilePicture,
      };

      if (chatType === 'individual') {
        messageData.receiver = selectedChat;
        socket.emit('sendMessage', messageData);
      } else if (chatType === 'group') {
        messageData.groupId = selectedChat;
        socket.emit('sendGroupMessage', messageData);
      }
      setMessage('');

      // Stop typing indicator after sending message
      handleStopTyping();
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!typing) {
      setTyping(true);
      if (chatType === 'individual') {
        socket.emit('typing', { sender: username, receiver: selectedChat });
      } else if (chatType === 'group') {
        socket.emit('typing', { sender: username });
      }
    }

    // Stop typing after 1 second
    setTimeout(handleStopTyping, 1000);
  };

  // Stop typing handler
  const handleStopTyping = () => {
    setTyping(false);
    if (chatType === 'individual') {
      socket.emit('stopTyping', { sender: username, receiver: selectedChat });
    } else if (chatType === 'group') {
      socket.emit('stopTyping', { sender: username });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Your Friends</h2>
        <button onClick={() => setIsModalOpen(true)} style={styles.createGroupButton}>
          Create Group
        </button>

        <ul style={styles.friendList}>
          {friends.map((friend) => (
              <li
                  key={friend.username}
                  style={styles.friendItem(selectedChat === friend.username)}
                  onClick={() => {
                    setSelectedChat(friend.username);
                    setChatType('individual');
                  }}
              >
                <img
                    src={`http://localhost:5003${friend.profilePicture}`}
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
          {groups.map((group) => (
              <li
                  key={group._id}
                  style={styles.friendItem(selectedChat === group._id)}
                  onClick={() => {
                    setSelectedChat(group._id);
                    setChatType('group');
                  }}
              >
                <div style={styles.friendInfo}>
                  <span>{group.groupName}</span>
                </div>
              </li>
          ))}
        </ul>
      </div>
      {/* Create Group Modal */}
      <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          style={styles.modal}
          contentLabel="Create Group"
      >
        <h2>Create a New Group</h2>
        <input
            type="text"
            placeholder="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            style={styles.modalInput}
        />
        <Select
            isMulti
            options={friends.map(friend => ({
              value: friend.username,
              label: friend.username,
            }))}
            styles={styles.select}
            placeholder="Select Friends"
            onChange={setSelectedFriends}
            value={selectedFriends}
        />
        <button onClick={handleCreateGroup} style={styles.modalButton}>
          Create Group
        </button>
        <button onClick={() => setIsModalOpen(false)} style={styles.modalButton}>
          Cancel
        </button>
      </Modal>
      <div style={styles.chatWindow}>
        {selectedChat ? (
          <>
            <h2>
              Chat with {chatType === 'individual' ? selectedChat : `Group: ${selectedChat}`}
            </h2>
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
