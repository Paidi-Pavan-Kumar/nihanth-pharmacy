// models/AdminToken.js
import mongoose from "mongoose";

const AdminTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.AdminToken || mongoose.model("AdminToken", AdminTokenSchema);


