import React, {useEffect, useRef, useState} from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Modal from "react-modal";
import Select from "react-select";

const baseURL = `https://hermes-backend-69ja.onrender.com`;
let socket;

function Chat({ username }) {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(null);
  const [notifications, setNotifications] = useState({});
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [friendProfile, setFriendProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [chatType, setChatType] = useState('individual'); // 'individual' or 'group'
  const [activeTab, setActiveTab] = useState('individual'); // tab status 
  const [isKickUserOpen, setIsKickUserOpen] = useState(false);
  const [kickUser, setKickUser] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

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
    const handleReceiveMessage = (newMessage) => {
      // Filter messages based on the selected friend or group
      if (
          (newMessage.sender === selectedChat && newMessage.receiver === username) ||
          (newMessage.sender === username && newMessage.receiver === selectedChat) ||
          (newMessage.groupId === selectedChat)
      ) {
        setMessages((prevMessages) => {
          if (prevMessages.find((msg) => msg._id === newMessage.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      }

      // Update notifications for group messages
      if (newMessage.groupId && newMessage.groupId !== selectedChat) {
        setNotifications((prev) => ({
          ...prev,
          [newMessage.groupId]: (prev[newMessage.groupId] || 0) + 1,
        }));
      }

      // Re-sort chat list for group messages
      if (newMessage.groupId) {
        setGroups((prevGroups) =>
            prevGroups
                .map((group) =>
                    group._id === newMessage.groupId
                        ? { ...group, lastMessageTimestamp: newMessage.timestamp }
                        : group
                )
                .sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp))
        );
      }

      // Re-sort chat list for individual messages
      if (!(newMessage.groupId === selectedChat) && (newMessage.receiver === username || newMessage.sender === username)) {
        const friendToMove = newMessage.sender === username ? newMessage.receiver : newMessage.sender;
        setFriends((prevFriends) =>
            prevFriends
                .map((friend) =>
                    friend.username === friendToMove
                        ? { ...friend, lastMessageTimestamp: new Date().toISOString() }
                        : friend
                )
                .sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp))
        );
      }
    };

    if (!socket) {
      socket = io(baseURL);
    }

    if (username) {
      socket.emit('joinRoom', username);

      // Listen for incoming messages
      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('receiveGroupMessage', handleReceiveMessage);

      // Handle typing indicators
      socket.on(`typing-${username}`, ({ sender }) => {
        if (sender === selectedChat) {
          setIsTyping(sender);
        }
      });

      socket.on(`stopTyping-${username}`, ({ sender }) => {
        if (sender === selectedChat) {
          setIsTyping(null);
        }
      });

      return () => {
        // Cleanup socket listeners on component unmount
        socket.off('receiveMessage');
        socket.off('receiveGroupMessage');
        socket.off(`typing-${username}`);
        socket.off(`stopTyping-${username}`);
      };
    }
  }, [username, selectedChat, isTyping]);

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

  const fetchChats = async (username) => {  
    try {
      // Fetch friend list
      const response = await axios.get(`${baseURL}/friends/${username}`);
      const sortedFriends = response.data.sort(
          (a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
      );
      setFriends(sortedFriends);

    // Fetch group list
    const groupResponse = await axios.get(`${baseURL}/groups/${username}`);
    const sortedGroups = groupResponse.data.sort(
      (a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
    );
    setGroups(sortedGroups); // Ensure groups are sorted by timestamp
  } catch (error) {
    console.error('Error fetching chats:', error);
  }
};

  // Fetch friend list on load
  useEffect(() => {
    fetchChats(username);
  }, [username]);

  // Fetch chat history when a friend is selected
  useEffect(() => {
    if (selectedChat) {
      if(chatType === 'individual'){
        const fetchMessages = async () => {
          try {
            const response = await axios.get(`${baseURL}/messages/${username}/${selectedChat}`);
            setMessages(response.data);
            setNotifications((prev) => ({ ...prev, [selectedChat]: 0 }));
          } catch (error) {
            console.error('Error fetching messages:', error);
          }
        };
        fetchMessages();
      }
      else if(chatType === 'group') {
        socket.emit('joinGroup', selectedChat);
        // Fetch group messages
        const fetchGroupMessages = async () => {
          try {
            const response = await axios.get(`${baseURL}/group-messages/${selectedChat}`);
            setMessages(response.data);
            // TODO: Update notifications for group messages
          } catch (error) {
            console.error('Error fetching group messages:', error);
          }
        };
        fetchGroupMessages();
      }
    }
  }, [chatType, selectedChat, username]);

  const createGroup = async (groupName, members) => {
    try {
      const response = await axios.post(`${baseURL}/create-group`, {
        groupName,
        members,
        owner: username
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
        await fetchChats(username); // Fetch the updated group list after group creation
      } catch (error) {
        console.error('Error creating group:', error);
        alert('Error creating group. Please try again.');
      }
    } else {
      alert('Please provide a group name and select at least one friend.');
    }
  };

  // Fetch friend's profile when clicking the "View Profile" button
  const openFriendProfile = async () => {
    try {
      const response = await axios.get(`${baseURL}/user/${selectedChat}`);
      setFriendProfile(response.data);
      setIsBubbleOpen(true);
    } catch (error) {
      console.error('Error fetching friend profile:', error);
    }
  };

  const kickUserFromGroup = async () => {
    try {
      //userId is whom to be removed
      await axios.delete(`${baseURL}/kick/${selectedChat}/${kickUser}`).then((res) => {
        alert('User removed successfully');
        setIsKickUserOpen(false);
      });
    } catch (error) {
      console.error('Error kicking user from group:', error);
      throw error;
    }
  };

  // Send message
  const sendMessage = () => {
    if (message && selectedChat) {
      const messageData = {
        sender: username,
        content: message,
        senderProfilePicture: userProfilePicture,
        timestamp: new Date().toISOString(),
      };

      // Emit the message through Socket.IO without updating UI immediately to avoid duplicates
      if (socket) {
        if(chatType === 'individual'){
          messageData.receiver = selectedChat;
          socket.emit('sendMessage', messageData);
        }
        else if(chatType === 'group'){
          messageData.groupId = selectedChat;
          socket.emit('sendGroupMessage', messageData);
        }
      }
      setMessage('');
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
  
    if (socket && !typing) {
      setTyping(true);
      if (chatType === 'individual') {
        socket.emit('typing', { sender: username, receiver: selectedChat });
      } else if (chatType === 'group') {
        socket.emit('typing', { sender: username, groupId: selectedChat });
      }
    }
  
    setTimeout(() => {
      if (socket) {
        setTyping(false);
        if (chatType === 'individual') {
          socket.emit('stopTyping', { sender: username, receiver: selectedChat });
        } else if (chatType === 'group') {
          socket.emit('stopTyping', { sender: username, groupId: selectedChat });
        }
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

  function getGroupMembers() {
    axios.get(`${baseURL}/group/${selectedChat}`)
      .then((response) => {
        setGroupMembers(response.data.members);
      })
      .catch((error) => {
        console.error('Error fetching group members:', error);
      });
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.chatHeader}>Messages</h2>
        {/* Add Tab Switch on Top */}
        <div style={styles.tabBar}>
          <button
            style={activeTab === 'individual' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('individual')}
          >
            Friends
          </button>
          <button
            style={activeTab === 'group' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('group')}
          >
            Group Chats
          </button>
          {/* Create Group Icon - Visible Only in Group Tab */}
          {activeTab === 'group' && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={styles.createGroupIcon}
              title="Create Group"
            >
              <i className="bi bi-plus-circle"></i>
            </button>
          )}

        </div>
        <ul style={styles.friendList}>
        {activeTab === 'individual'
          ? friends.map((friend) => (
              <li
                key={friend.username}
                style={styles.friendItem(selectedChat === friend.username)}
                onClick={() => {
                  setSelectedChat(friend.username);
                  setChatType('individual');
                }}
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
            ))
          : groups.map((group) => (
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
                  <br />
                  <span style={styles.timestamp}>
                    {group.lastMessageTimestamp
                      ? new Date(group.lastMessageTimestamp).toLocaleString()
                      : 'No messages yet'}
                  </span>
                </div>
              </li>
            ))}
      </ul>
      </div>
      <div style={styles.chatWindow}>
        {selectedChat ? (
          <>
            <div style={styles.chatHeader}>
            <h2 style={styles.chatHeaderText}>
              {chatType === 'individual'
                ? `Chat with ${selectedChat}`
                : `${groups.find(group => group._id === selectedChat)?.groupName || 'Unknown Group'}`}
            </h2>
              {chatType === 'individual' ?
                <>
                  <button onClick={openFriendProfile} style={styles.viewProfileButton}>
                    View Profile
                  </button>
                </> :
                <>
                  <button onClick={() => {
                    setIsKickUserOpen(true);
                    getGroupMembers();
                  }} style={styles.viewProfileButton}>
                    Remove User
                  </button>
                </>
              }
            </div>
            <div style={styles.messagesContainer} ref={messagesContainerRef}>
              <div style={styles.messages}>
                {messages.map((msg, index) => (
                  <div
                    key={`${msg._id}-${index}`}
                    style={
                      msg.sender === username
                        ? styles.sentMessageContainer
                        : styles.receivedMessageContainer
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
                      <span style={styles.timestampOutside}>
                        {formatTime(msg.timestamp)}
                      </span>
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

      <Modal
          isOpen={isKickUserOpen}
          onRequestClose={() => setIsKickUserOpen(false)}
          style={styles.modal}
          contentLabel="Remove User"
      >
        <h2>Remove User</h2>
        <select onChange={(e) => setKickUser(e.target.value)} value={kickUser}>
          <option value="">Select Member</option>
          {groupMembers.map((member, index) => {
            return <option key={index} value={member._id}>
              {member.username}
            </option>
          })
          }
        </select>
        <button onClick={kickUserFromGroup} style={styles.modalButton}>
          Remove User
        </button>
        <button onClick={() => setIsKickUserOpen(false)} style={styles.modalButton}>
          Cancel
        </button>
      </Modal>
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
    width: '45px',
    height: '45px',
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
    top: '5px',
    right: '10px',
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
    backgroundColor: '#40444b',
    borderRadius: '5px',
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
  createGroupIcon: {
    position: 'absolute',
    top: '50%', 
    right: '5px', 
    transform: 'translateY(-50%)', 
    fontSize: '1rem', 
    color: '#7289da',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  createGroupIconHover: {
    color: '#5b6dae', 
  },  
  tabBar: {
    display: 'flex',
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: '5px',
    borderBottom: '1px solid #42454a',
    paddingBottom: '5px',
    position: 'relative',
    paddingRight: '0px', 
  },      
  tab: {
    flex: 1,
    padding: '3px 5px', 
    textAlign: 'center',
    cursor: 'pointer',
    color: '#99aab5',
    backgroundColor: '#2c2f33',
    border: 'none',
    borderRadius: '2px', 
    margin: '0 2px', 
    fontSize: '0.8rem', 
    transition: 'all 0.2s',
    fontWeight: 'normal', 
  },
  activeTab: {
    flex: 1,
    padding: '3px 5px',
    textAlign: 'center',
    cursor: 'pointer',
    color: '#ffffff',
    backgroundColor: '#7289da',
    border: 'none',
    borderRadius: '2px',
    margin: '0 2px',
    fontSize: '0.8rem',
    fontWeight: 'bold', 
    boxShadow: '0px 0px 2px rgba(114, 137, 218, 0.7)', 
  }, 
  modal: {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#2c2f33',
      color: '#ffffff',
      borderRadius: '15px',
      padding: '30px',
      boxShadow: '0px 0px 25px rgba(0, 0, 0, 0.6)',
      maxWidth: '600px',
      width: '90%',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
  },
  select: {
    control: (base) => ({
      ...base,
      backgroundColor: '#40444b',
      color: '#ffffff',
      border: '1px solid #42454a',
      borderRadius: '5px',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#2c2f33',
      color: '#ffffff',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#7289da' : state.isFocused ? '#42454a' : '#2c2f33',
      color: '#ffffff',
      cursor: 'pointer',
    }),
  },
};

export default Chat;
