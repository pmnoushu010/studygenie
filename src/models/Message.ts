import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },     // username of sender
  senderRole: { type: String, required: true },   // 'superadmin' or 'student'
  receiverId: { type: String, required: true },   // username of receiver
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
