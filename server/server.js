const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Import Models
const User = require('./models/User'); // User model
const Message = require('./models/Message'); // Message model
const Post = require('./models/Post'); // Post model
const GroupMessage = require('./models/GroupMessage');
const Group = require('./models/Group');

// Initialize App
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Server is up and running!');
});


// Connect to MongoDB
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware to find user by username
async function findUserByUsername(req, res, next) {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
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
const uploadDir = path.join(__dirname, 'uploads/profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password and save the user
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
    // Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful', username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Send Friend Request
app.post('/send-friend-request', async (req, res) => {
  const { username, targetUsername } = req.body;

  try {
    const user = await User.findOne({ username });
    const targetUser = await User.findOne({ username: targetUsername });

    if (!user || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure friendRequests is properly initialized
    if (!targetUser.friendRequests) {
      targetUser.friendRequests = [];
    }

    // Check if friend request already exists
    if (targetUser.friendRequests.includes(user._id)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    targetUser.friendRequests.push(user._id);
    await targetUser.save();

    res.status(200).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Error sending friend request', error });
  }
});


// Accept Friend Request
app.post('/accept-friend-request', async (req, res) => {
  const { username, requesterUsername } = req.body;

  try {
    const user = await User.findOne({ username });
    const requester = await User.findOne({ username: requesterUsername });

    if (!user || !requester) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.friendRequests.includes(requester._id)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    user.friendRequests = user.friendRequests.filter(id => !id.equals(requester._id));
    user.friends.push(requester._id);
    requester.friends.push(user._id);

    await user.save();
    await requester.save();

    res.status(200).json({ message: 'Friend request accepted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting friend request', error });
  }
});

// Reject Friend Request
app.post('/reject-friend-request', async (req, res) => {
  const { username, requesterUsername } = req.body;

  try {
    const user = await User.findOne({ username });
    const requester = await User.findOne({ username: requesterUsername });

    if (!user || !requester) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.friendRequests.includes(requester._id)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    user.friendRequests = user.friendRequests.filter(id => !id.equals(requester._id));
    await user.save();

    res.status(200).json({ message: 'Friend request rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting friend request', error });
  }
});

// Get user's friends including their profile pictures and last message timestamp
app.get('/friends/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).populate('friends', 'username profilePicture');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friendsWithLastMessage = await Promise.all(user.friends.map(async (friend) => {
      const lastMessage = await Message.findOne({
        $or: [
          { sender: username, receiver: friend.username },
          { sender: friend.username, receiver: username },
        ],
      }).sort({ timestamp: -1 }).exec();

      return {
        ...friend.toObject(),
        lastMessageTimestamp: lastMessage ? lastMessage.timestamp : new Date(0), // default to 1970 if no message
      };
    }));

    res.json(friendsWithLastMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching friends', error });
  }
});


// Get user's friend requests
app.get('/friend-requests/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).populate('friendRequests', 'username profilePicture');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.friendRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching friend requests', error });
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
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

// Send a message to a friend
app.post('/message', async (req, res) => {
  const { sender, receiver, content } = req.body;

  try {
    // Check if sender and receiver are friends
    const user = await User.findOne({ username: sender }).populate('friends', 'username');
    const isFriend = user.friends.some((friend) => friend.username === receiver);

    if (!isFriend) {
      return res.status(403).json({ message: 'You can only message your friends' });
    }

    // Save the message with a timestamp
    const newMessage = new Message({ sender, receiver, content, timestamp: new Date() });
    await newMessage.save();

    res.status(201).json({ message: 'Message sent successfully', newMessage });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error });
  }
});

// Get user's bio
app.get('/user/:username/bio', findUserByUsername, (req, res) => {
  res.status(200).json({
    success: true,
    bio: req.user.bio || '',
  });
});

// Update user's bio
app.put('/user/:username/bio', findUserByUsername, async (req, res) => {
  const { bio } = req.body;

  try {
    req.user.bio = bio;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Bio updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update bio',
      error: error.message,
    });
  }
});

// Get user's nickname
app.get('/user/:username/nickname', findUserByUsername, (req, res) => {
  res.status(200).json({
    success: true,
    nickname: req.user.nickname || '',
  });
});

// Update user's nickname
app.put('/user/:username/nickname', findUserByUsername, async (req, res) => {
  const { nickname } = req.body;

  try {
    req.user.nickname = nickname;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Nickname updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update nickname',
      error: error.message,
    });
  }
});

// Add a post
app.post('/post', async (req, res) => {
  const { username, content } = req.body;

  try {
    console.log(`Saving post for user ${username}: ${content}`);
    const post = new Post({ username, content });
    await post.save();
    res.status(201).json({ message: 'Post added successfully' });
  } catch (error) {
    console.error('Error adding post:', error);
    res.status(500).json({ message: 'Error adding post', error });
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

    // Attach profile pictures to posts
    const postsWithProfilePics = posts.map(post => ({
      ...post.toObject(),
      profilePicture: userMap[post.username]?.profilePicture || '/uploads/profile-pictures/default.jpg'
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

app.get('/groups/:username', async (req, res) => {
  const { username } = req.params;
  console.log('Fetching groups for user:', username);
  const thisUser = await User.findOne({ username: username });
  try {
    const groups = await Group.find( {members: { $in: [thisUser._id] }});
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups', error });
  }
});


// Create a new group
app.post('/create-group', async (req, res) => {
  const { groupName, members ,owner} = req.body;

  try {
    // Find the user details for each username in the members array
    const memberDetails = await User.find({ username: { $in: members } }, 'username profilePicture');

    if (!memberDetails.length) {
      return res.status(400).json({ message: 'No valid members found' });
    }

    // Create the new group with member details
    const newGroup = new Group({
      groupName,
      members: memberDetails,
      owner
    });

    await newGroup.save();

    console.log('New group created successfully:', newGroup);

    // Send back the newly created group data
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Error creating group', error });
  }
});

// Add a member to a group
app.post('/group/:groupId/add-member', async (req, res) => {
  const { groupId } = req.params;
  const { username } = req.body;

  try {
    const group = await Group.findById(groupId);
    const user = await User.findOne({ username });

    if (!group || !user) {
      return res.status(404).json({ message: 'Group or user not found' });
    }

    if (!group.members.includes(user._id)) {
      group.members.push(user._id);
      await group.save();
      res.status(200).json({ message: 'Member added successfully' });
    } else {
      res.status(400).json({ message: 'User is already a member' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error adding member', error });
  }
});

// Get group details
app.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findById(groupId).populate('members', 'username profilePicture');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group', error });
  }
});

// Fetch group messages
app.get('/group-messages/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    // Find messages for the group
    const messages = await GroupMessage.find({ groupId }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group messages', error });
  }
});

// Delete a message
app.delete('/message/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { username } = req.body;

  try {
    // Find the message by ID
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the requester is the sender of the message
    if (message.sender !== username) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message', error });
  }
});

app.delete('/kick/:groupId/:userId', async (req, res) => {
    const { groupId, userId } = req.params;

    try {
        const group = await Group.findById(groupId);
        const user = await User.findById(userId);
        if (!group || !user) {
            return res.status(404).json({ message: 'Group or user not found' });
        }
        //if the user is in the members list
        if (group.members.includes(userId)) {
            group.members = group.members.filter((member) => member !== userId);
            await group.save();

            res.status(200).json({ message: 'User kicked successfully' });
        } else {
            res.status(400).json({ message: 'User is not a member' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error kicking user', error });
    }
});

// Update User's Password
app.put('/user/:username/password', async (req, res) => {
  const { username } = req.params;
  const { newPassword } = req.body;

  try {
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Failed to update password', error: error.message });
  }
});

app.delete('/user/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Find and delete the user
    const user = await User.findOneAndDelete({ username });

    if (!user) {
      console.error(`User not found for username: ${username}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete all related messages (sent or received)
    try {
      await Message.deleteMany({ $or: [{ sender: username }, { receiver: username }] });
      console.log(`Deleted all messages for user: ${username}`);
    } catch (messageError) {
      console.error(`Failed to delete messages for user ${username}:`, messageError);
    }

    // Delete all posts by the user
    try {
      await Post.deleteMany({ username });
      console.log(`Deleted all posts for user: ${username}`);
    } catch (postError) {
      console.error(`Failed to delete posts for user ${username}:`, postError);
    }

    // Remove user from friends list of their friends
    try {
      await User.updateMany(
        { friends: user._id },
        { $pull: { friends: user._id } }
      );
      console.log(`Removed user ${username} from friends lists of their friends`);
    } catch (friendError) {
      console.error(`Failed to remove user ${username} from friends lists:`, friendError);
    }

    // Remove user from friend requests list of other users
    try {
      await User.updateMany(
        { friendRequests: user._id },
        { $pull: { friendRequests: user._id } }
      );
      console.log(`Removed user ${username} from friend requests of other users`);
    } catch (friendRequestError) {
      console.error(`Failed to remove user ${username} from friend requests:`, friendRequestError);
    }

    // Remove user's profile picture from the filesystem if not the default one
    if (user.profilePicture && user.profilePicture !== '/uploads/profile-pictures/default.jpg') {
      const profilePicturePath = path.join(__dirname, user.profilePicture);
      if (fs.existsSync(profilePicturePath)) {
        fs.unlink(profilePicturePath, (err) => {
          if (err) {
            console.error('Failed to delete profile picture:', err);
          } else {
            console.log('Profile picture deleted successfully');
          }
        });
      } else {
        console.log('Profile picture not found, skipping deletion');
      }
    }

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account', error: error.message });
  }
});

// Socket.IO for Real-Time Chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a specific room based on the username
  socket.on('joinRoom', (username) => {
    console.log(`${username} joined room`);
    socket.join(username);
  });

  // Join a group room
  socket.on('joinGroup', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`User joined group: ${groupId}`);
  });

  // Listen for typing event
  socket.on('typing', ({ sender, receiver }) => {
    io.to(receiver).emit(`typing-${receiver}`, { sender });
  });

  // Listen for stopTyping event
  socket.on('stopTyping', ({ sender, receiver }) => {
    io.to(receiver).emit(`stopTyping-${receiver}`, { sender });
  });

  // Listen for messages
  socket.on('sendMessage', async (messageData) => {
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
        ...newMessage.toObject(),
        senderProfilePicture: senderUser.profilePicture,
        receiverProfilePicture: receiverUser.profilePicture,
      };

      // Emit the message to both the sender and the receiver
      io.to(sender).emit('receiveMessage', messageWithProfilePictures); // Emit to sender
      io.to(receiver).emit('receiveMessage', messageWithProfilePictures); // Emit to receiver
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Handle group messages
  socket.on('sendGroupMessage', async (messageData) => {
    try {
      const { groupId, sender, content } = messageData;

      // Save the group message to the database
      const newGroupMessage = new GroupMessage({
        groupId,
        sender,
        content,
      });
      await newGroupMessage.save();

      // Emit the message to everyone in the group
      const groupMessage = {
        sender,
        content,
        groupId,
        id: newGroupMessage._id,
        timestamp: new Date(),
      };

      io.to(`group_${groupId}`).emit('receiveGroupMessage', groupMessage);
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


// Start Server
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
