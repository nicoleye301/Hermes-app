import React, { useState, useEffect, useRef } from 'react';
import { useGroup } from '../context/GroupContext'; // Custom group context
import socket from '../utils/socket';
import Modal from 'react-modal';
import Select from 'react-select';
import axios from 'axios';

const port = 5003;

function GroupChat({ username }) {
  const { groups, createGroup, fetchGroups, isLoading } = useGroup();
  const [friends, setFriends] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const messagesContainerRef = useRef(null);

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
    if (username) fetchFriends();
  }, [username]);

  // Fetch group messages when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(`http://localhost:${port}/group-messages/${selectedGroup}`);
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching group messages:', error);
        }
      };
      fetchMessages();

      // Join the group room via Socket.IO
      socket.emit('joinGroup', selectedGroup);

      // Listen for new messages for this group
      const handleReceiveGroupMessage = (newMessage) => {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      };

      socket.on('receiveGroupMessage', handleReceiveGroupMessage);

      // Clean up when unselecting or changing groups
      return () => {
        socket.off('receiveGroupMessage', handleReceiveGroupMessage);
      };
    }
  }, [selectedGroup]);

  // Handle group creation
  const handleCreateGroup = async () => {
    if (newGroupName && selectedFriends.length) {
      const memberUsernames = selectedFriends.map(friend => friend.value);
      try {
        await createGroup(newGroupName, [username, ...memberUsernames]);
        setIsModalOpen(false);
        setNewGroupName('');
        setSelectedFriends([]);
        fetchGroups(); // Fetch the updated group list after group creation
      } catch (error) {
        console.error('Error creating group:', error);
        alert('Error creating group. Please try again.');
      }
    } else {
      alert('Please provide a group name and select at least one friend.');
    }
  };

  // Handle sending a group message
  const sendMessage = () => {
    if (message && selectedGroup) {
      const messageData = {
        groupId: selectedGroup,
        sender: username,
        content: message,
      };
      socket.emit('sendGroupMessage', messageData);
      //setMessages(prevMessages => [...prevMessages, messageData]); // Display the message instantly on the UI
      setMessage('');
    }
  };

  // Scroll to the bottom of the messages container when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Your Groups</h2>
        <button onClick={() => setIsModalOpen(true)} style={styles.createGroupButton}>
          Create Group
        </button>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ul style={styles.groupList}>
            {groups.map((group) => (
              <li
                key={group._id}
                style={{
                  ...styles.groupItem,
                  backgroundColor: selectedGroup === group._id ? '#7289da' : '#2c2f33',
                  color: selectedGroup === group._id ? '#ffffff' : '#99aab5',
                }}
                onClick={() => setSelectedGroup(group._id)}
              >
                <span>{group.groupName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={styles.chatWindow}>
        {selectedGroup ? (
          <>
            <h2>Group Chat</h2>
            <div style={styles.messagesContainer} ref={messagesContainerRef}>
              <div style={styles.messages}>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    style={msg.sender === username ? styles.sentMessageContainer : styles.receivedMessageContainer}
                  >
                    <p style={msg.sender === username ? styles.sentMessage : styles.receivedMessage}>
                      <strong>{msg.sender}: </strong>{msg.content}
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
          <h2>Select a group to start chatting</h2>
        )}
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
  createGroupButton: {
    padding: '10px',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  chatWindow: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    backgroundColor: '#36393f',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '20px',
  },
  input: {
    padding: '10px',
    marginTop: '10px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#40444b',
    color: 'white',
    flex: 1,
  },
  button: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
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
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #42454a',
      width: '400px',
    },
  },
  modalInput: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '5px',
    border: '1px solid #42454a',
    backgroundColor: '#40444b',
    color: '#ffffff',
  },
  modalButton: {
    padding: '10px',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  select: {
    control: (styles) => ({
      ...styles,
      backgroundColor: '#40444b',
      borderColor: '#42454a',
      color: '#ffffff',
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: '#2c2f33',
      color: '#ffffff',
    }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected ? '#7289da' : isFocused ? '#42454a' : '#2c2f33',
      color: isSelected ? '#ffffff' : '#99aab5',
    }),
    multiValue: (styles) => ({
      ...styles,
      backgroundColor: '#7289da',
    }),
    multiValueLabel: (styles) => ({
      ...styles,
      color: '#ffffff',
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      color: '#ffffff',
      ':hover': {
        backgroundColor: '#99aab5',
        color: 'black',
      },
    }),
  },
};

export default GroupChat;
