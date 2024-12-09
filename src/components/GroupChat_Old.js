// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import axios from 'axios';
// import { io } from 'socket.io-client';

// const socket = io('http://localhost:5003'); // Connect to the Socket.IO server

// function GroupChat() {
//   const { groupId } = useParams(); // Get the groupId from the URL
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [groupName, setGroupName] = useState('');

//   useEffect(() => {
//     // Fetch group messages and group name when the component loads
//     const fetchGroupData = async () => {
//       try {
//         const groupResponse = await axios.get(`http://localhost:5003/groups/${groupId}/messages`);
//         const groupInfoResponse = await axios.get(`http://localhost:5003/groups/${groupId}`);
//         setMessages(groupResponse.data); // Set fetched messages
//         setGroupName(groupInfoResponse.data.name); // Set group name
//       } catch (error) {
//         console.error('Error fetching group data:', error);
//       }
//     };

//     fetchGroupData();

//     // Join the group via Socket.IO
//     socket.emit('joinGroup', groupId);

//     // Listen for new messages
//     socket.on('receiveGroupMessage', (message) => {
//       setMessages((prevMessages) => [...prevMessages, message]); // Update the message list
//     });

//     return () => {
//       // Clean up when the component unmounts
//       socket.off('receiveGroupMessage');
//     };
//   }, [groupId]);

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     const sender = username; // Replace with the logged-in user
//     try {
//       // Send the message via the backend
//       await axios.post(`http://localhost:5003/groups/${groupId}/messages`, {
//         sender,
//         content: newMessage,
//       });

//       // Emit the message via Socket.IO
//       socket.emit('sendGroupMessage', {
//         groupId,
//         sender,
//         content: newMessage,
//       });

//       setNewMessage(''); // Clear the input field
//     } catch (error) {
//       console.error('Error sending message:', error);
//     }
//   };

//   return (
//     <div>
//       <h1>{groupName}</h1>
//       <div style={{ border: '1px solid #ccc', padding: '10px', height: '300px', overflowY: 'scroll' }}>
//         {messages.map((msg, index) => (
//           <p key={index}>
//             <strong>{msg.sender}:</strong> {msg.content}
//           </p>
//         ))}
//       </div>
//       <form onSubmit={handleSendMessage}>
//         <input
//           type="text"
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           placeholder="Type a message"
//           style={{ width: '80%', padding: '10px' }}
//         />
//         <button type="submit" style={{ padding: '10px' }}>
//           Send
//         </button>
//       </form>
//     </div>
//   );
// }

// export default GroupChat;
