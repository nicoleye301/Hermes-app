const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Members of the group
  createdAt: { type: Date, default: Date.now },
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;