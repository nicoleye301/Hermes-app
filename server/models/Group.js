// Group model
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Using references to the User model
  createdAt: { type: Date, default: Date.now },
});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
