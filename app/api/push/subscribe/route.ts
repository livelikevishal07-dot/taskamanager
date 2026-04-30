import { NextRequest } from 'next/server'
import { z } from 'zod'
import { saveSubscription, deleteSubscription } from '@/lib/db/push-subscriptions'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const subscribeSchema = z.object({
  employee_id: z.string().uuid(),
  endpoint:    z.string().url(),
  p256dh:      z.string().min(1),
  auth:        z.string().min(1),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

/** POST — register a push subscription for an employee */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON')
    const input = subscribeSchema.parse(body)
    await saveSubscription(input)
    return ok({ subscribed: true })
  } catch (err) {
    return fromError(err)
  }
}

/** DELETE — unregister a push subscription */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON')
    const { endpoint } = unsubscribeSchema.parse(body)
    await deleteSubscription(endpoint)
    return ok({ unsubscribed: true })
  } catch (err) {
    return fromError(err)
  }
}
