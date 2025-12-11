importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA7VhYuX1pnETjymKtld7g-S3c9-5i511I",
  authDomain: "pharmacy-admin1.firebaseapp.com",
  projectId: "pharmacy-admin1",
  storageBucket: "pharmacy-admin1.firebasestorage.app",
  messagingSenderId: "670700167326",
  appId: "1:670700167326:web:8ea22be99d2c7348c49b8f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo.png",
  });
});
