import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA7VhYuX1pnETjymKtld7g-S3c9-5i511I",
  authDomain: "pharmacy-admin1.firebaseapp.com",
  projectId: "pharmacy-admin1",
  storageBucket: "pharmacy-admin1.firebasestorage.app",
  messagingSenderId: "670700167326",
  appId: "1:670700167326:web:8ea22be99d2c7348c49b8f",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Ask notification permission + return token
export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey:
        "BLTBHxPKKI66jcIxYgSL_PVI1h_7eRTlgWQxP6FgDMdrT9IBXbrIQ81pTfZZi4s6bWGKjs86VMSbgsuzV4Po8ZY",
    });
    return token;
  } catch (err) {
    console.error("Token error:", err);
  }
};

// Listen to messages when admin panel is open
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
