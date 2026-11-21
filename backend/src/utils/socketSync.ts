/**
 * GlowGoodly Storefront Real-Time Socket Sync Utility
 * Emits "storefront:updated" and legacy sync events to all connected clients
 * whenever any admin module creates, updates, or deletes data.
 */

export function emitStorefrontUpdate(req: any, type: string, payload?: any) {
  try {
    const io = req?.app?.get?.("io");
    if (io) {
      const syncEvent = {
        type,
        timestamp: Date.now(),
        ...(payload || {})
      };
      // Primary event requested by user
      io.emit("storefront:updated", syncEvent);
      // Backward compatibility events
      io.emit("data:sync", syncEvent);
      io.emit("glowgoodly:data-sync", syncEvent);
      io.emit("content_updated", syncEvent);
      io.emit("data_sync", syncEvent);
    }
  } catch (err) {
    console.warn("Could not emit storefront update:", err);
  }
}
