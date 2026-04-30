import 'server-only'
import webpush from 'web-push'
import {
  deleteSubscription,
  getAllSubscriptions,
  getSubscriptionsForEmployees,
  type PushSubscriptionRow,
} from './db/push-subscriptions'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string
  body:  string
  url?:  string   // deep-link opened when the notification is tapped
  icon?: string
}

// ── Lazy VAPID init ───────────────────────────────────────────────────────────
// setVapidDetails is called on first use (not at module load) so the build
// phase never crashes when env vars are absent.

let vapidReady = false

function ensureVapid() {
  if (vapidReady) return
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) throw new Error('VAPID keys are not configured in environment variables.')
  webpush.setVapidDetails('mailto:admin@officely.app', pub, priv)
  vapidReady = true
}

// ── Internal delivery ────────────────────────────────────────────────────────

async function deliver(sub: PushSubscriptionRow, payload: PushPayload): Promise<void> {
  ensureVapid()
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    )
  } catch (err: any) {
    // 404 / 410 = subscription expired or unregistered — clean it up silently
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await deleteSubscription(sub.endpoint).catch(() => {})
    }
    // Push is best-effort: swallow all other errors so one bad sub
    // never blocks the rest of the batch.
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Send a push notification to one or more specific employees (e.g. task assignees). */
export async function sendPushToEmployees(
  employeeIds: string[],
  payload: PushPayload,
): Promise<void> {
  if (employeeIds.length === 0) return
  const subs = await getSubscriptionsForEmployees(employeeIds)
  if (subs.length === 0) return
  await Promise.allSettled(subs.map((s) => deliver(s, payload)))
}

/** Broadcast a push notification to every subscribed employee (e.g. announcements). */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  const subs = await getAllSubscriptions()
  if (subs.length === 0) return
  await Promise.allSettled(subs.map((s) => deliver(s, payload)))
}
