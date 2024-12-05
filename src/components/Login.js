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
      {/* Logo */}
      <img src="/logo/hermes-logo.png" alt="App Logo" style={styles.logo} />
      {/* Catchphrase */}
      <h2 style={styles.tagline}>Connect instantly, chat effortlessly</h2>
      <div style={styles.loginBox}>
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
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '95vh',
    backgroundColor: '#202225',
    color: '#ffffff',
    textAlign: 'center',
    padding: '20px',
  },
  logo: {
    width: '200px',
    height: '200px',
    marginBottom: '20px',
  },
  tagline: {
    fontSize: '1.5rem',
    fontFamily: 'Courier New, Courier, monospace',
    marginBottom: '30px',
    color: '#7289da',
  },
  loginBox: {
    maxWidth: '400px',
    width: '100%',
    backgroundColor: '#2c2f33',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '15px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #42454a',
    backgroundColor: '#40444b',
    color: '#ffffff',
  },
  button: {
    padding: '15px',
    fontSize: '16px',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  buttonHover: {
    backgroundColor: '#5b6dae',
  },
  error: {
    color: 'red',
    fontSize: '14px',
    marginBottom: '10px',
  },
  link: {
    color: '#7289da',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default Login;
