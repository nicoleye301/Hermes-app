import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const port = 5003;
const baseURL = `http://localhost:${port}`; 

const Profile = () => {
  const [username] = useState(localStorage.getItem('username'));
  const [bio, setBio] = useState('Loading...');
  const [nickname, setNickname] = useState('Loading...');
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [error, setError] = useState(null);

  const fetchBio = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/user/${username}/bio`);
      setBio(response.data.bio || '');
      setError(null);
    } catch (error) {
      console.error("Failed to load user bio", error);
      setError('Failed to load bio. Please try again.');
      setBio('');
    }
  }, [username]);

  const fetchNickname = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/user/${username}/nickname`);
      setNickname(response.data.nickname || '');
      setError(null);
    } catch (error) {
      console.error("Failed to load user nickname", error);
      setError('Failed to load nickname. Please try again.');
      setNickname('');
    }
  }, [username]);

  useEffect(() => {
    fetchBio();
    fetchNickname();
  }, [fetchBio, fetchNickname]);

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
        setError(response.data.message || 'Update failed. Please try again.');
      }
    } catch (error) {
      console.error("Failed to update bio", error);
      setError('Failed to update bio. Please try again.');
    }
  };

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
        setError(response.data.message || 'Update failed. Please try again.');
      }
    } catch (error) {
      console.error("Failed to update nickname", error);
      setError('Failed to update nickname. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <h1>{username}'s Profile</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
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
