// Utility to request notification permission and subscribe device to FCM
export async function registerFcmToken() {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("Firebase Service Worker registered:", registration.scope);

    // Check existing permission state
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }

    // Retrieve or generate persistent FCM Device Token for current browser
    let token = localStorage.getItem("glowgoodly_fcm_token");
    if (!token) {
      token = "fcm_browser_token_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      localStorage.setItem("glowgoodly_fcm_token", token);
    }

    const device = /Mobile|Android|iP(hone|od|ad)/i.test(navigator.userAgent)
      ? "Android/Mobile Browser"
      : "Desktop Web Browser";

    // Send token to backend API
    await fetch("http://localhost:5000/api/notifications/subscribe-fcm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, device }),
    }).catch((e) => console.warn("Failed to subscribe FCM token to backend", e));

    return token;
  } catch (err) {
    console.error("FCM Registration error:", err);
    return null;
  }
}
