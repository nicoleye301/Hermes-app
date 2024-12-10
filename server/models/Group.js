const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  owner: { type: String, required: true }, // Owner of the group
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Members of the group
  createdAt: { type: Date, default: Date.now },
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;