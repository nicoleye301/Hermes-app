const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Import Models
const User = require('./models/User'); // User model
const Message = require('./models/Message'); // Message model
const Group = require('./models/Group'); // Group model

// Initialize App
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Connect to MongoDB
mongoose.connect('mongodb+srv://nicoleye301:XgHVNsrpmFTh2ZV6@cluster0.05bnf.mongodb.net/hermes-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware for group validation
async function validateGroupMembership(req, res, next) {
  const { groupId } = req.params;
  const userId = req.body.sender || req.query.userId;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error validating group membership', error });
  }
}

// Storage for Profile Pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-pictures');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.username}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Upload instance for profile picture storage
const upload = multer({ storage });

// Ensure Directory Exists
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads/profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    res.status(200).json({ message: 'Login successful', username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// ========== Friend Management ==========

// Add a friend
app.post('/add-friend', async (req, res) => {
  const { username, friendUsername } = req.body;
  try {
    const user = await User.findOne({ username });
    const friend = await User.findOne({ username: friendUsername });
    if (!user || !friend) {
      return res.status(404).json({ message: 'User or friend not found' });
    }
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }
    user.friends.push(friend._id);
    friend.friends.push(user._id);
    await user.save();
    await friend.save();
    res.status(200).json({ message: 'Friend added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding friend', error });
  }
});

// Get user's friends including their profile pictures
app.get('/friends/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).populate('friends', 'username profilePicture');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching friends', error });
  }
});

// Fetch messages between friends with profile pictures
app.get('/messages/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    // Find messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1 });

    // Get user details including profile pictures
    const users = await User.find({
      username: { $in: [user1, user2] }
    });

    const userMap = {};
    users.forEach(user => {
      userMap[user.username] = {
        profilePicture: user.profilePicture
      };
    });

    const messagesWithProfilePics = messages.map(message => ({
      ...message.toObject(),
      senderProfilePicture: userMap[message.sender]?.profilePicture,
      receiverProfilePicture: userMap[message.receiver]?.profilePicture
    }));

    res.json(messagesWithProfilePics);
  } catch (error) {
    res.status(500).json({ message: 'Error creating group', error });
  }
});


// Fetch all groups for a user
app.get('/groups/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const userGroups = await Group.find({ members: username }).populate('members', 'username');
    res.json(userGroups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups', error });
  }
});

// Fetch messages for a specific group
app.get('/groups/:groupId/messages', validateGroupMembership, async (req, res) => {
  const { groupId } = req.params;
  try {
    const messages = await Message.find({ group: groupId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group messages', error });
  }
});

// Send a message to a group
app.post('/groups/:groupId/messages', validateGroupMembership, async (req, res) => {
  const { groupId } = req.params;
  const { sender, content } = req.body;
  try {
    const message = new Message({ sender, group: groupId, content });
    await message.save();
    res.status(201).json({ message: 'Message sent to group successfully', message });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error });
  }
});

// Get posts from friends and the user with profile pic
app.get('/posts/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Find the user and populate friends
    const user = await User.findOne({ username }).populate('friends', 'username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get usernames of friends and include the user's own username
    const friendUsernames = user.friends.map(friend => friend.username);
    friendUsernames.push(username); // Include the user's own posts

    // Find posts by the user and their friends
    const posts = await Post.find({ username: { $in: friendUsernames } }).sort({ createdAt: -1 });

    // Get user profile pictures for each post
    const users = await User.find({
      username: { $in: friendUsernames }
    });

    const userMap = {};
    users.forEach(user => {
      userMap[user.username] = {
        profilePicture: user.profilePicture
      };
    });

    const postsWithProfilePics = posts.map(post => ({
      ...post.toObject(),
      profilePicture: userMap[post.username]?.profilePicture
    }));

    res.json(postsWithProfilePics);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error });
  }
});

// Update User's Profile Picture
app.put('/user/:username/profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the file was uploaded successfully
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please try again.' });
    }

    // Update the user's profile picture path
    user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    await user.save();

    res.status(200).json({ success: true, profilePicture: user.profilePicture });
  } catch (error) {
    console.error('Failed to update profile picture:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile picture', error: error.message });
  }
});

// Get user's profile data (bio, nickname, profile picture)
app.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      username: user.username,
      bio: user.bio,
      nickname: user.nickname,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

//Socket.io 
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Listen for group messages
  socket.on('sendGroupMessage', async (messageData) => {
    const { groupId, sender, content } = messageData;
    try {
      const { sender, receiver, content } = messageData;

      // Save the message in the database
      const newMessage = new Message({ sender, receiver, content });
      await newMessage.save();

      // Fetch sender and receiver's profile pictures
      const senderUser = await User.findOne({ username: sender });
      const receiverUser = await User.findOne({ username: receiver });

      // Add profile picture data to the message object
      const messageWithProfilePictures = {
        sender,
        receiver,
        content,
        senderProfilePicture: senderUser?.profilePicture,
        receiverProfilePicture: receiverUser?.profilePicture,
        timestamp: newMessage.timestamp,
      };

      // Emit the message to both sender and receiver
      io.to(socket.id).emit('receiveMessage', messageWithProfilePictures);
      socket.broadcast.emit('receiveMessage', messageWithProfilePictures);
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});




// ========== Start the Server ==========
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
