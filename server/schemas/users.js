import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  auth_method: { 
    type: String, 
    enum: ['manual', 'github'],
    default: 'manual' 
  },
  password: {
    type: String,
    required: function() {
      return this.auth_method === 'manual'; 
    }
  },
  github_id: {
    type: String,
    unique: true,
    sparse: true // ignores missing github_ids
  },
  createdAt: { 
    type: Date,
    default: Date.now 
  },
});

userSchema.pre("save", async function (next) {
  if (this.auth_method === 'manual' && this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.pre('validate', function(next) {
  if (this.auth_method === 'manual' && this.github_id) {
    return next(new Error('Manual users should not have a GitHub ID.'));
  }
  if (this.auth_method === 'github' && !this.github_id) {
    return next(new Error('GitHub users must have a GitHub ID.'));
  }
  next();
});

const USER = mongoose.model("users", userSchema);
export default USER;
