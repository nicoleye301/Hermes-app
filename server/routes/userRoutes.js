const express = require('express');
const User = require('../models/User');
const router = express.Router();

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

// Get user's bio
router.get('/:username/bio', findUserByUsername, (req, res) => {
  res.status(200).json({
    success: true,
    bio: req.user.bio,
  });
});

// Update user's bio
router.put('/:username/bio', findUserByUsername, async (req, res) => {
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
router.get('/:username/nickname', findUserByUsername, (req, res) => {
  res.status(200).json({
    success: true,
    nickname: req.user.nickname,
  });
});

// Update user's nickname
router.put('/:username/nickname', findUserByUsername, async (req, res) => {
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

module.exports = router;
