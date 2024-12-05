import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const baseURL = `https://hermes-backend-69ja.onrender.com`;

function PostPage({ username }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [profilePicture, setProfilePicture] = useState('/uploads/profile-pictures/default.jpg');

  // Redirect to login page if not logged in
  const navigate = useNavigate();
  useEffect(() => {
    if (!username) {
      navigate("/login");
    }
  }, [navigate, username]);

  // Fetch posts from friends when the component mounts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${baseURL}/posts/${username}`);
        if (response.status === 200) {
          setPosts(response.data); // Set posts in state
        } else {
          console.error('Failed to fetch posts: ', response);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${baseURL}/user/${username}`);
        if (response.status === 200) {
          setProfilePicture(response.data.profilePicture);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (username) {
      fetchPosts(); // Fetch posts if username is available
      fetchUserProfile(); // Fetch profile picture if username is available
    }
  }, [username]);

  // Handle adding a new post
  const handleAddPost = async () => {
    if (newPost.trim() !== '') {
      try {
        const response = await axios.post(`${baseURL}/post`, { username, content: newPost });
        const newPostData = {
          username,
          content: newPost,
          createdAt: new Date(),
          profilePicture: profilePicture,
        };

        // Add the new post at the top of the list
        setPosts((prevPosts) => [newPostData, ...prevPosts]);
        setNewPost(''); // Clear input
      } catch (error) {
        console.error('Error adding post:', error);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.newPostContainer}>
        <img
          src={`${baseURL}${profilePicture}`}
          alt="Profile"
          style={styles.newPostProfilePicture}
        />
        <div style={styles.newPostInputWrapper}>
          <textarea
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            style={styles.textarea}
          />
          <button onClick={handleAddPost} style={styles.button}>
            Post
          </button>
        </div>
      </div>

      <div style={styles.postsContainer}>
        {posts.map((post, index) => (
          <div key={index} style={styles.postCard}>
            <div style={styles.postHeader}>
              <img
                src={`${baseURL}${post.profilePicture || '/uploads/profile-pictures/default.jpg'}`}
                alt="Profile"
                style={styles.postProfilePicture}
              />
              <div style={styles.postUserInfo}>
                <strong style={styles.username}>{post.username}</strong>
                <small style={styles.timestamp}>{new Date(post.createdAt).toLocaleString()}</small>
              </div>
            </div>
            <div style={styles.postContent}>
              <p style={styles.postText}>{post.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#36393f',
    color: '#ffffff',
    minHeight: '100vh',
    overflowY: 'auto',
  },
  newPostContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#2c2f33',
    borderRadius: '15px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  newPostProfilePicture: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    marginRight: '15px',
  },
  newPostInputWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    width: '100%',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #42454a',
    backgroundColor: '#40444b',
    color: '#ffffff',
    marginBottom: '10px',
    minHeight: '80px',
    fontSize: '1rem',
    resize: 'none',
  },
  button: {
    alignSelf: 'flex-end',
    padding: '10px 20px',
    backgroundColor: '#7289da',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  postsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  postCard: {
    padding: '20px',
    borderRadius: '15px',
    backgroundColor: '#2c2f33',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.2s',
  },
  postCardHover: {
    transform: 'scale(1.02)',
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  },
  postProfilePicture: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    marginRight: '15px',
  },
  postUserInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  username: {
    fontSize: '1.2rem',
    color: '#ffffff',
  },
  timestamp: {
    fontSize: '0.9rem',
    color: '#99aab5',
  },
  postContent: {
    marginTop: '10px',
  },
  postText: {
    fontSize: '1.1rem',
    lineHeight: '1.6',
  },
};

export default PostPage;
