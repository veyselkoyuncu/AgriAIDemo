// ─────────────────────────────────────────────────────────────────────────────
// Per-User Processing Queue — Sprint 2.5, Item 2
// ─────────────────────────────────────────────────────────────────────────────
//
// A single user must never have multiple conversations being processed
// simultaneously. This module provides an in-memory locking mechanism
// per WhatsApp phone number.
//
// If a request arrives while the same user is already being processed,
// the new requests waits for the previous one to complete (sequential processing).
// ─────────────────────────────────────────────────────────────────────────────

const userLocks = new Map<string, Promise<void>>();

/**
 * Acquire a processing lock for a specific user.
 * If the user is already being processed, wait for the previous
 * operation to finish before proceeding.
 *
 * Returns a release function that must be called when processing completes.
 *
 * Usage:
 *   const release = await acquireUserLock(phone);
 *   try { ... process ... }
 *   finally { release(); }
 */
export async function acquireUserLock(phone: string): Promise<() => void> {
  const key = phone.trim();

  // Get the current lock (promise) for this user, if any
  const existingLock = userLocks.get(key);

  // Create a new promise that will resolve when this request is done
  let releaseFn!: () => void;
  const newLock = new Promise<void>((resolve) => {
    releaseFn = resolve;
  });

  // Set the new lock BEFORE waiting, so subsequent requests queue behind us
  userLocks.set(key, newLock);

  // If there was a previous lock, wait for it to complete
  if (existingLock) {
    console.log(`[QUEUE] User ${key.slice(-4)} waiting — previous request still processing.`);
    await existingLock;
    console.log(`[QUEUE] User ${key.slice(-4)} lock acquired.`);
  }

  // Return the release function
  return () => {
    releaseFn();
    // Only clean up the map entry if it still points to our lock
    // (prevent race conditions with newer locks)
    if (userLocks.get(key) === newLock) {
      userLocks.delete(key);
    }
  };
}

/**
 * Check if a user is currently being processed (non-blocking).
 */
export function isUserProcessing(phone: string): boolean {
  return userLocks.has(phone.trim());
}
