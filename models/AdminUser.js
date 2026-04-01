const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema(
  {
    username:     { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 50 },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ['super', 'admin'], default: 'admin' },
    lastLoginAt:  { type: Date },
    loginCount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminUser', adminUserSchema);
