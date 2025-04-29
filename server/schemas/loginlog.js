import mongoose from "mongoose";
const LoginLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null 
  },
  ip_address: String,
  timestamp: Date,
  status: { 
    type: String,
    enum: ['success', 'failure'] 
  },
  reason: String,
});

const LoginLog = mongoose.model("LoginLog", LoginLogSchema);

export default LoginLog;
