const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

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

// ========== User Authentication ==========

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

// Get user's friends
app.get('/friends/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).populate('friends', 'username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching friends', error });
  }
});

// ========== Group Chat Functionality ==========

// Create a new group
app.post('/groups', async (req, res) => {
  const { name, admin, members } = req.body;
  try {
    const group = new Group({ name, admin, members });
    await group.save();
    res.status(201).json({ message: 'Group created successfully', group });
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

// ========== Real-Time Messaging with Socket.IO ==========

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Listen for group messages
  socket.on('sendGroupMessage', async (messageData) => {
    const { groupId, sender, content } = messageData;
    try {
      const group = await Group.findById(groupId);
      if (!group.members.includes(sender)) {
        console.error('User not a member of the group');
        return;
      }
      const message = new Message({ sender, group: groupId, content });
      await message.save();
      io.emit(`groupMessage:${groupId}`, message);
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
