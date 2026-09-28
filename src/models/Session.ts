import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    role: { type: String, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String },
    lastActive: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Create an index to automatically expire sessions after 24 hours of inactivity
SessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.Session || mongoose.model("Session", SessionSchema);
