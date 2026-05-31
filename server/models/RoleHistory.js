const mongoose = require('mongoose');

const roleHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    default: null
  },
  changedBy: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('RoleHistory', roleHistorySchema);
