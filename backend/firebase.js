// backend/firebase.js
import admin from "firebase-admin";

// Convert env private key correctly
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_CERT,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// EXPORT FULL ADMIN + custom function
export const firebaseAdmin = admin;

// Robust sendNotification with fallbacks
export const sendNotification = async (tokens, title, body) => {
  const messageMulticast = {
    notification: { title, body },
    tokens,
  };

  try {
    // 1) Try modular API with app instance
    try {
      const mod = await import("firebase-admin/messaging").catch(() => null);
      const getMessaging = mod?.getMessaging ?? undefined;
      if (typeof getMessaging === "function") {
        const messagingInstance = getMessaging(app);
        if (messagingInstance && typeof messagingInstance.sendMulticast === "function") {
          console.log("Using modular sendMulticast");
          return await messagingInstance.sendMulticast(messageMulticast);
        }
      }
    } catch (e) {
      console.log("Modular API attempt failed:", e.message);
    }

    // 2) Try legacy admin.messaging()
    if (typeof admin.messaging === "function") {
      const legacy = admin.messaging();

      if (legacy && typeof legacy.sendMulticast === "function") {
        console.log("Using legacy sendMulticast");
        return await legacy.sendMulticast(messageMulticast);
      }

      // 3) Fallback: send per-token using messaging.send
      if (legacy && typeof legacy.send === "function") {
        console.log("Using per-token send fallback");
        const results = await Promise.all(
          tokens.map(async (token) => {
            try {
              const msg = { token, notification: { title, body } };
              const res = await legacy.send(msg);
              console.log(res)
              return { success: true, result: res };
            } catch (err) {
              return { success: false, error: err };
            }
          })
        );
        return {
          successCount: results.filter((r) => r.success).length,
          failureCount: results.filter((r) => !r.success).length,
          results,
        };
      }

      // 4) Very old fallback: sendToDevice
      if (legacy && typeof legacy.sendToDevice === "function") {
        console.log("Using legacy sendToDevice");
        const payload = { notification: { title, body } };
        return await legacy.sendToDevice(tokens, payload);
      }
    }

    throw new Error(
      "No suitable messaging.sendMulticast/send/sendToDevice method available. Ensure firebase-admin is installed and up-to-date."
    );
  } catch (err) {
    console.error("sendNotification error:", err);
    throw err;
  }
};
