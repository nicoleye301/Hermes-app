// import React, { useState } from 'react';

// function CreateGroup({username}) {
//   const [groupName, setGroupName] = useState('');
//   const [members, setMembers] = useState('');

//   const handleCreateGroup = async () => {
//     try {
//       const response = await fetch('/groups', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name: groupName,
//           admin: username, // Current logged-in user as admin
//           members: members.split(',').map((member) => member.trim()), // Convert comma-separated string to array
//         }),
//       });

//       if (response.ok) {
//         alert('Group created successfully!');
//         setGroupName('');
//         setMembers('');
//       } else {
//         const data = await response.json();
//         alert(`Error: ${data.message}`);
//       }
//     } catch (error) {
//       console.error(error);
//       alert('An error occurred while creating the group.');
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <h2>Create a Group</h2>
//       <input
//         type="text"
//         placeholder="Group Name"
//         value={groupName}
//         onChange={(e) => setGroupName(e.target.value)}
//         style={styles.input}
//       />
//       <input
//         type="text"
//         placeholder="Members (comma-separated usernames)"
//         value={members}
//         onChange={(e) => setMembers(e.target.value)}
//         style={styles.input}
//       />
//       <button onClick={handleCreateGroup} style={styles.button}>
//         Create Group
//       </button>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     padding: '20px',
//     maxWidth: '400px',
//     margin: '0 auto',
//   },
//   input: {
//     display: 'block',
//     width: '100%',
//     padding: '10px',
//     margin: '10px 0',
//     border: '1px solid #ccc',
//     borderRadius: '4px',
//   },
//   button: {
//     padding: '10px 20px',
//     backgroundColor: '#7289da',
//     color: 'white',
//     border: 'none',
//     borderRadius: '4px',
//     cursor: 'pointer',
//   },
// };

// export default CreateGroup;
