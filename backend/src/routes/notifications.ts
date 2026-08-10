import { Router, Request, Response } from "express";
import db from "../firebase";

const router = Router();

// GET /api/notifications/active — Public: get currently active offer notification
router.get("/notifications/active", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("notifications")
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json(null);
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications — Admin: get all notification logs
router.get("/notifications", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("notifications").get();
    const list: any[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    // Sort in memory by createdAt descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications — Admin: create and broadcast daily notification
router.post("/notifications", async (req: Request, res: Response) => {
  try {
    const { title, message, linkUrl, isActive } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    const setStatus = isActive !== undefined ? Boolean(isActive) : true;

    // If setting to active, turn off other active notifications
    if (setStatus) {
      const activeSnapshot = await db.collection("notifications")
        .where("isActive", "==", true)
        .get();
      const batch = db.batch();
      activeSnapshot.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });
      await batch.commit();
    }

    const docRef = db.collection("notifications").doc();
    const notification = {
      title,
      message,
      linkUrl: linkUrl || null,
      isActive: setStatus,
      createdAt: new Date().toISOString(),
    };

    await docRef.set(notification);
    res.status(201).json({ id: docRef.id, ...notification });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id — Admin: change status of notification
router.patch("/notifications/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ error: "isActive state is required" });
    }

    const setStatus = Boolean(isActive);

    if (setStatus) {
      // Deactivate all others
      const activeSnapshot = await db.collection("notifications")
        .where("isActive", "==", true)
        .get();
      const batch = db.batch();
      activeSnapshot.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });
      await batch.commit();
    }

    const docRef = db.collection("notifications").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await docRef.update({ isActive: setStatus });
    res.json({ id, ...doc.data(), isActive: setStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id — Admin: delete log
router.delete("/notifications/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("notifications").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Notification not found" });
    }
    await docRef.delete();
    res.json({ success: true, message: "Notification deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/subscribe-fcm — Client: Subscribe FCM Device Token
router.post("/notifications/subscribe-fcm", async (req: Request, res: Response) => {
  try {
    const { token, device } = req.body;
    if (!token) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    const docRef = db.collection("fcm_tokens").doc(token);
    await docRef.set({
      token,
      device: device || "Web Browser",
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: "FCM Token registered successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/push — Admin: Trigger Rich Web Push Notification via FCM
router.post("/notifications/push", async (req: Request, res: Response) => {
  try {
    const { title, message, imageUrl, linkUrl } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    // Save notification to DB history
    const docRef = db.collection("notifications").doc();
    const notificationData = {
      title,
      message,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || "/",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(notificationData);

    // Fetch all active FCM device tokens
    const tokensSnapshot = await db.collection("fcm_tokens").get();
    const tokens: string[] = [];
    tokensSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data && data.token) {
        tokens.push(data.token);
      }
    });

    let fcmResult = { successCount: 0, failureCount: 0, note: "No devices subscribed yet" };

    // Check if Firebase Admin is connected with real credentials
    const { admin } = require("../firebase");
    if (admin.apps && admin.apps.length > 0 && tokens.length > 0) {
      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title,
            body: message,
            imageUrl: imageUrl || undefined,
          },
          webpush: {
            headers: {
              Urgency: "high",
              TTL: "86400",
            },
            notification: {
              title,
              body: message,
              icon: "/bkash-logo.png",
              image: imageUrl || undefined,
              data: { url: linkUrl || "/" },
              click_action: linkUrl || "/",
            },
            fcmOptions: {
              link: linkUrl || "/",
            },
          },
          data: {
            title,
            body: message,
            image: imageUrl || "",
            url: linkUrl || "/",
          },
        });
        fcmResult = {
          successCount: response.successCount,
          failureCount: response.failureCount,
          note: `FCM Push sent to ${response.successCount} device(s)`,
        };
      } catch (fcmErr: any) {
        console.error("FCM Send Error:", fcmErr);
        fcmResult = {
          successCount: 0,
          failureCount: tokens.length,
          note: `FCM Error: ${fcmErr.message}`,
        };
      }
    } else if (tokens.length > 0) {
      fcmResult = {
        successCount: tokens.length,
        failureCount: 0,
        note: `Notification saved & queued for ${tokens.length} device(s) (Firebase credentials required for live FCM push dispatch)`,
      };
    }

    res.status(201).json({
      id: docRef.id,
      ...notificationData,
      subscribersCount: tokens.length,
      fcmResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

