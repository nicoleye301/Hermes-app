import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const port = 5003; 
const baseURL = `http://localhost:${port}`;

function Login({ setCurrentUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (username && password) {
      try {
        // Send a request to the backend server to authenticate
        const response = await axios.post(`${baseURL}/login`, {
          username,
          password,
        });

        if (response.status === 200) {
          // Set the current user globally if login is successful
          setCurrentUser(username);
          navigate('/chat'); // Redirect to Chat
        }
      } catch (err) {
        // If login fails, display the error message
        if (err.response && err.response.status === 400) {
          setError('Invalid username or password');
        } else {
          setError('An unexpected error occurred. Please try again later.');
        }
      }
    } else {
      setError('Please enter valid credentials');
    }
  };

  return (
    <div style={styles.container}>
      <h1>Login</h1>
      <form onSubmit={handleLogin} style={styles.form}>
        {error && <p style={styles.error}>{error}</p>}
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>
      <p>
        Don't have an account?{' '}
        <span onClick={() => navigate('/signup')} style={styles.link}>
          Sign up
        </span>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    backgroundColor: '#2c2f33',
    color: '#ffffff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    margin: '10px 0',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #42454a',
    borderRadius: '4px',
    backgroundColor: '#40444b',
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
  },
  error: {
    color: 'red',
    fontSize: '14px',
    marginBottom: '10px',
  },
  link: {
    color: '#7289da',
    cursor: 'pointer',
  },
};

export default Login;
