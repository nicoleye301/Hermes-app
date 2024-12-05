import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const port = 5003;
const baseURL = `http://localhost:${port}`;

const Profile = ({ username }) => {
  const [bio, setBio] = useState('');
  const [nickname, setNickname] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [error, setError] = useState(null);
  const [isChangingPicture, setIsChangingPicture] = useState(false);
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // Redirect to login page if not logged in
  const navigate = useNavigate();
  useEffect(() => {
    if (!username) {
      navigate("/login");
    }
  }, [navigate, username]);

  // Fetch user profile data from the backend
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/user/${username}`);
      if (response.status === 200) {
        setBio(response.data.bio || '');
        setNickname(response.data.nickname || '');
        setProfilePicture(`${baseURL}${response.data.profilePicture || '/uploads/profile-pictures/default.jpg'}`);
        setError(null);
      } else {
        throw new Error('Unable to fetch profile data');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setError('Failed to load user profile. Please try again.');
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, username]);

  // Handle Edit Bio
  const handleEditBio = () => {
    setIsEditingBio(true);
    setNewBio(bio);
  };

  const handleSaveBio = async () => {
    try {
      const response = await axios.put(`${baseURL}/user/${username}/bio`, { bio: newBio });
      if (response.data.success) {
        setBio(newBio);
        setIsEditingBio(false);
        setError(null);
      } else {
        throw new Error(response.data.message || 'Update failed. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update bio:', error);
      setError('Failed to update bio. Please try again.');
    }
  };

  // Handle Edit Nickname
  const handleEditNickname = () => {
    setIsEditingNickname(true);
    setNewNickname(nickname);
  };

  const handleSaveNickname = async () => {
    try {
      const response = await axios.put(`${baseURL}/user/${username}/nickname`, { nickname: newNickname });
      if (response.data.success) {
        setNickname(newNickname);
        setIsEditingNickname(false);
        setError(null);
      } else {
        throw new Error(response.data.message || 'Update failed. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update nickname:', error);
      setError('Failed to update nickname. Please try again.');
    }
  };

  // Handle Profile Picture Upload
  const handleProfilePictureChange = async () => {
    if (newProfilePicture) {
      const formData = new FormData();
      formData.append('profilePicture', newProfilePicture);

      try {
        const response = await axios.put(`${baseURL}/user/${username}/profile-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          setProfilePicture(`${baseURL}${response.data.profilePicture}`);
          setNewProfilePicture(null);
          setShowOverlay(false);
          setError(null);
        } else {
          throw new Error('Failed to update profile picture. Please try again.');
        }
      } catch (error) {
        console.error('Failed to update profile picture:', error);
        setError('Failed to update profile picture. Please try again.');
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.profileContainer}>
        <div style={styles.cover}>
          <div
            style={styles.avatar}
            onMouseEnter={() => setIsChangingPicture(true)}
            onMouseLeave={() => setIsChangingPicture(false)}
            onClick={() => setShowOverlay(true)}
          >
            <img src={profilePicture} alt="Profile" style={styles.profilePicture} />
            {isChangingPicture && (
              <div style={styles.changePictureText}>
                Change Profile
              </div>
            )}
          </div>
        </div>

        {showOverlay && (
          <div style={styles.uploadOverlay}>
            <h3 style={styles.uploadTitle}>Current Profile Picture</h3>
            <img
              src={newProfilePicture ? URL.createObjectURL(newProfilePicture) : profilePicture}
              alt="Current Profile"
              style={styles.overlayProfilePicture}
            />
            <label style={styles.uploadLabel}>
              Choose New Picture
              <input
                type="file"
                style={styles.fileInput}
                onChange={(e) => {
                  setNewProfilePicture(e.target.files[0]);
                }}
              />
            </label>
            <button style={styles.uploadButton} onClick={handleProfilePictureChange}>
              Confirm
            </button>
            <button style={styles.cancelButton} onClick={() => setShowOverlay(false)}>
              Cancel
            </button>
          </div>
        )}

        <div style={styles.profileDetails}>
          <h1 style={styles.username}>{username}</h1>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.bioContainer}>
            <strong>Bio:</strong>
            {isEditingBio ? (
              <div>
                <textarea
                  style={styles.textarea}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                />
                <button style={styles.button} onClick={handleSaveBio}>Save</button>
                <button style={styles.button} onClick={() => setIsEditingBio(false)}>Cancel</button>
              </div>
            ) : (
              <p style={styles.bioText}>{bio || 'No bio yet'}</p>
            )}
            {!isEditingBio && (
              <button style={styles.button} onClick={handleEditBio}>Edit Bio</button>
            )}
          </div>

          <div style={styles.nicknameContainer}>
            <strong>Nickname:</strong>
            {isEditingNickname ? (
              <div>
                <input
                  style={styles.input}
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                />
                <button style={styles.button} onClick={handleSaveNickname}>Save</button>
                <button style={styles.button} onClick={() => setIsEditingNickname(false)}>Cancel</button>
              </div>
            ) : (
              <p style={styles.nicknameText}>{nickname || 'No nickname yet'}</p>
            )}
            {!isEditingNickname && (
              <button style={styles.button} onClick={handleEditNickname}>Edit Nickname</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#2c2f33',
    padding: '2rem',
  },
  profileContainer: {
    width: '100%',
    maxWidth: '800px',
    borderRadius: '20px',
    overflow: 'hidden',
    backgroundColor: '#36393f',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  cover: {
    height: '200px',
    background: 'linear-gradient(150deg, #7289da 20%, #5865f2 100%)',
    position: 'relative',
  },
  avatar: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: '#2c2f33',
    overflow: 'hidden',
    position: 'absolute',
    bottom: '-75px',
    left: '50%',
    transform: 'translateX(-50%)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  changePictureText: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.7)',
    color: '#ffffff',
    padding: '5px 10px',
    borderRadius: '5px',
    fontSize: '0.9rem',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    cursor: 'pointer',
    display: 'block',
    margin: '1rem 0',
    color: '#7289da',
  },
  uploadOverlay: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#2c2f33',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    textAlign: 'center',
  },
  uploadTitle: {
    color: '#ffffff',
    marginBottom: '1rem',
  },
  overlayProfilePicture: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '1rem',
  },
  uploadButton: {
    padding: '10px 20px',
    margin: '5px',
    border: 'none',
    borderRadius: '5px',
    background: '#5865f2',
    color: '#ffffff',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '10px 20px',
    margin: '5px',
    border: 'none',
    borderRadius: '5px',
    background: '#ff5555',
    color: '#ffffff',
    cursor: 'pointer',
  },
  profileDetails: {
    paddingTop: '100px',
    paddingBottom: '2rem',
    textAlign: 'center',
    color: '#ffffff',
  },
  username: {
    fontSize: '2rem',
    color: '#ffffff',
    marginBottom: '1rem',
  },
  error: {
    color: '#ff5555',
    marginBottom: '10px',
  },
  bioContainer: {
    marginTop: '2rem',
  },
  bioText: {
    padding: '0.5rem 1rem',
    background: '#42454a',
    borderRadius: '10px',
    marginBottom: '1rem',
    lineHeight: '1.5',
    maxWidth: '600px',
    margin: '0 auto',
    overflowWrap: 'break-word',
    color: '#b9bbbe',
  },
  nicknameContainer: {
    marginTop: '2rem',
  },
  nicknameText: {
    padding: '0.5rem 1rem',
    background: '#42454a',
    borderRadius: '10px',
    marginBottom: '1rem',
    lineHeight: '1.5',
    maxWidth: '600px',
    margin: '0 auto',
    overflowWrap: 'break-word',
    color: '#b9bbbe',
  },
  textarea: {
    width: '100%',
    maxWidth: '600px',
    minHeight: '100px',
    padding: '10px',
    marginBottom: '1rem',
    borderRadius: '10px',
    border: '1px solid #555555',
    backgroundColor: '#2c2f33',
    color: '#ffffff',
    resize: 'none',
  },
  input: {
    width: '100%',
    maxWidth: '600px',
    padding: '10px',
    marginBottom: '1rem',
    borderRadius: '10px',
    border: '1px solid #555555',
    backgroundColor: '#2c2f33',
    color: '#ffffff',
  },
  button: {
    padding: '10px 20px',
    margin: '5px',
    border: 'none',
    borderRadius: '5px',
    background: '#5865f2',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
};

export default Profile;
