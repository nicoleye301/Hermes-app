import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const baseURL = `https://hermes-backend-69ja.onrender.com`;

function Settings({ username }) {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleDeleteAccount = async () => {
    try {
      const response = await axios.delete(`${baseURL}/user/${username}`);
      if (response.status === 200) {
        setMessage('Account deleted successfully.');
        // Redirect to login page or home page after account deletion
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      setMessage('Failed to delete account. Please try again.');
    }
  };

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
        <button
          className="btn btn-danger w-100 mt-4"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete My Account
        </button>
      </div>
      {message && <p className="mt-3 text-center" style={styles.message}>{message}</p>}

      {/* Confirmation Dialog for Deleting Account */}
      {showDeleteDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialogBox}>
            <h3 style={styles.dialogTitle}>Are you sure you want to delete your account?</h3>
            <p style={styles.dialogMessage}>This action cannot be undone, and all your data will be permanently removed.</p>
            <div style={styles.dialogButtons}>
              <button onClick={handleDeleteAccount} style={styles.dialogConfirm}>
                Confirm
              </button>
              <button onClick={() => setShowDeleteDialog(false)} style={styles.dialogCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  dialogBox: {
    backgroundColor: '#36393f',
    color: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    width: '300px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
  dialogTitle: {
    marginBottom: '15px',
    textAlign: 'center',
  },
  dialogMessage: {
    marginBottom: '15px',
    textAlign: 'center',
    color: '#99aab5',
  },
  dialogButtons: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  dialogConfirm: {
    backgroundColor: '#ff5555',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
  },
  dialogCancel: {
    backgroundColor: '#40444b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
  },
};

export default Settings;
