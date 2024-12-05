import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const baseURL = `https://hermes-backend-69ja.onrender.com`;


function Settings({ username }) {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePassword = async () => {
    // Confirm the user is logged in before they can change their password.
    if (!username) {
      console.log(username); // Used for debugging purposes.
      setMessage('You must be logged in to change your password');
      return;
    }

    try {
      // Send the newly created password to the server-side endpoint.
      const response = await axios.put(`${baseURL}/user/${username}/password`, {
        newPassword,
      });

      // Display a success/failure message to the user upon new password submission.
      setMessage(response.data.message || 'Password updated successfully!');
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      setMessage('Failed to update password. Please try again.');
    }
  };

  // Format content for the settings UI page.
  return (
    <div style={styles.container}>
      <h1 className="mb-4" style={styles.heading}>Settings</h1>
      <p style={styles.loggedInText}>Logged in as: <span style={styles.username}>{username}</span></p>
      <div style={styles.card} className="shadow p-4 rounded">
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">
            New Password:
          </label>
          <input
            type="password"
            className="form-control"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.input}
          />
        </div>
        <button
          className="btn btn-primary w-100"
          onClick={handleChangePassword}
        >
          Change Password
        </button>
      </div>
      {message && <p className="mt-3 text-center" style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '500px',
    margin: '50px auto',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    color: '#ffffff',
    backgroundColor: '#2c2f33',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  heading: {
    color: '#7289da',
  },
  loggedInText: {
    marginBottom: '20px',
    fontSize: '16px',
    color: '#99aab5',
  },
  username: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#36393f',
    borderRadius: '8px',
  },
  input: {
    marginTop: '10px',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #42454a',
    backgroundColor: '#40444b',
    color: '#ffffff',
  },
  message: {
    fontSize: '14px',
    color: '#7289da',
  },
};

export default Settings;
