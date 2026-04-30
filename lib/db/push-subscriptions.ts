import 'server-only'
import { db } from './supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PushSubscriptionRow {
  id:          string
  employee_id: string
  endpoint:    string
  p256dh:      string
  auth:        string
  created_at:  string
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Save (or update) a push subscription for an employee.
 *  Uses upsert on `endpoint` so the same device never gets duplicate rows. */
export async function saveSubscription(input: {
  employee_id: string
  endpoint:    string
  p256dh:      string
  auth:        string
}): Promise<void> {
  const { error } = await db()
    .from('push_subscriptions')
    .upsert(input, { onConflict: 'endpoint' })
  if (error) throw error
}

/** Remove a subscription by its endpoint URL (called on unsubscribe or 410 response). */
export async function deleteSubscription(endpoint: string): Promise<void> {
  const { error } = await db()
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
  if (error) throw error
}

/** Get all subscriptions for a set of employees (used when assigning tasks). */
export async function getSubscriptionsForEmployees(
  employeeIds: string[],
): Promise<PushSubscriptionRow[]> {
  if (employeeIds.length === 0) return []
  const { data, error } = await db()
    .from('push_subscriptions')
    .select('*')
    .in('employee_id', employeeIds)
  if (error) throw error
  return (data ?? []) as PushSubscriptionRow[]
}

/** Get every subscription in the system (used for broadcast announcements). */
export async function getAllSubscriptions(): Promise<PushSubscriptionRow[]> {
  const { data, error } = await db()
    .from('push_subscriptions')
    .select('*')
  if (error) throw error
  return (data ?? []) as PushSubscriptionRow[]
}
