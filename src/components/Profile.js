import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const port = 5003;
const baseURL = `http://localhost:${port}`;

const Profile = () => {
  const [username] = useState(localStorage.getItem('username'));
  const [bio, setBio] = useState('');
  const [nickname, setNickname] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [error, setError] = useState(null);

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
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profilePicture', file);

      try {
        const response = await axios.put(`${baseURL}/user/${username}/profile-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          setProfilePicture(`${baseURL}${response.data.profilePicture}`);
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
      <h1>{username}'s Profile</h1>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <div style={styles.profilePictureContainer}>
        <img
          src={profilePicture}
          alt="Profile"
          style={styles.profilePicture}
        />
        <input type="file" onChange={handleProfilePictureChange} style={styles.fileInput} />
      </div>

      <div style={styles.section}>
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
          <p>{bio || 'No bio yet'}</p>
        )}
        {!isEditingBio && <button style={styles.button} onClick={handleEditBio}>Edit Bio</button>}
      </div>

      <div style={styles.section}>
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
          <p>{nickname || 'No nickname yet'}</p>
        )}
        {!isEditingNickname && <button style={styles.button} onClick={handleEditNickname}>Edit Nickname</button>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    backgroundColor: '#2c2f33',
    color: '#ffffff',
  },
  profilePictureContainer: {
    marginBottom: '20px',
  },
  profilePicture: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  fileInput: {
    marginTop: '10px',
    color: '#ffffff',
  },
  button: {
    padding: '10px',
    fontSize: '16px',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
    marginRight: '10px',
  },
  section: {
    margin: '20px 0',
    textAlign: 'left',
  },
  input: {
    padding: '8px',
    fontSize: '16px',
    border: '1px solid #42454a',
    borderRadius: '4px',
    width: '100%',
    marginBottom: '10px',
    backgroundColor: '#40444b',
    color: '#ffffff',
  },
  textarea: {
    padding: '8px',
    fontSize: '16px',
    border: '1px solid #42454a',
    borderRadius: '4px',
    width: '100%',
    marginBottom: '10px',
    minHeight: '100px',
    backgroundColor: '#40444b',
    color: '#ffffff',
  },
};

export default Profile;
