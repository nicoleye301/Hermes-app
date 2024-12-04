import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {useNavigate} from "react-router-dom";

const port = 5003;
const baseURL = `http://localhost:${port}`;

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
          profilePicture: profilePicture, // Use the current profile picture
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
      <div style={styles.postsContainer}>
        {posts.map((post, index) => (
          <div key={index} style={styles.post}>
            <div style={styles.postHeader}>
              <img
                src={`http://localhost:${port}${post.profilePicture || '/uploads/profile-pictures/default.jpg'}`}
                alt="Profile"
                style={styles.postProfilePicture}
              />
              <strong>{post.username}</strong>
            </div>
            <p>{post.content}</p>
            <small>{new Date(post.createdAt).toLocaleString()}</small>
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
    height: '100%',
    overflowY: 'auto',
  },
  newPostContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '20px',
  },
  textarea: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #42454a',
    backgroundColor: '#40444b',
    color: '#ffffff',
    marginBottom: '10px',
    minHeight: '60px',
  },
  button: {
    alignSelf: 'flex-end',
    padding: '10px 20px',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  postsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  post: {
    padding: '20px',
    borderRadius: '10px',
    backgroundColor: '#2c2f33',
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  postProfilePicture: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '10px',
  },
};

export default PostPage;
