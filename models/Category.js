const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['expense', 'income'],
    required: true
  },
  icon: {
    type: String,
    default: 'default-icon'
  },
  color: {
    type: String,
    default: '#000000'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure unique category names per user
categorySchema.index({ name: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);