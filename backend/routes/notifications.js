// routes/notifications.js
import express from "express";
const noterouter = express.Router();

import AdminToken from "../models/AdminToken.js";
import { firebaseAdmin, sendNotification } from "../firebase.js";

noterouter.post("/save-admin-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });

    const doc = await AdminToken.findOneAndUpdate(
      { token },
      { token, lastUsedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ success: true, token: doc.token });
  } catch (err) {
    console.error("save-admin-token error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});
async function getAllAdminTokens() {
  const docs = await AdminToken.find({}, { token: 1, _id: 0 }).lean();
  return docs.map((d) => d.token);
}
async function removeInvalidTokens(tokensArr = []) {
  if (!tokensArr.length) return;
  await AdminToken.deleteMany({ token: { $in: tokensArr } });
}
export async function sendNotificationToAdmins(title, body, data = {}) {
  const tokens = await getAllAdminTokens();
  if (tokens.length === 0) {
    console.log("No tokens stored.");
    return { success: false };
  }

  // Use your working sendNotification helper instead of firebaseAdmin.messaging().sendMulticast
  try {
    const response = await sendNotification(tokens, title, body);

    // Clean up invalid tokens if response has them (for sendMulticast responses)
    if (response?.responses) {
      const invalid = [];
      response.responses.forEach((r, i) => {
        if (
          !r.success &&
          r.error &&
          (r.error.code === "messaging/invalid-registration-token" ||
            r.error.code === "messaging/registration-token-not-registered")
        ) {
          invalid.push(tokens[i]);
        }
      });
      await removeInvalidTokens(invalid);
    }

    return { success: true, response };
  } catch (err) {
    console.error("sendNotificationToAdmins error:", err);
    return { success: false, error: err.message };
  }
}
noterouter.post("/send-test", async (req, res) => {
  const { title = "Test Notification", body = "Hello Admin!", data = {} } =
    req.body;

  const result = await sendNotificationToAdmins(title, body, data);
  res.json(result);
});
export default noterouter;
