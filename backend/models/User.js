const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar:   { type: String, default: '' },
  favorites:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  watchHistory: [{
    item:     { type: mongoose.Schema.Types.ObjectId, refPath: 'watchHistory.itemType' },
    itemType: { type: String, enum: ['Movie', 'Channel'] },
    progress: { type: Number, default: 0 }, // segundos vistos
    watchedAt:{ type: Date, default: Date.now },
  }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
