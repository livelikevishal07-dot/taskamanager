import { NextRequest } from 'next/server'
import { z } from 'zod'
import { sendPushToEmployees } from '@/lib/push'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const schema = z.object({
  employee_id: z.string().uuid(),
})

/** POST — send a test push notification to verify the pipeline works end-to-end */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON')
    const { employee_id } = schema.parse(body)

    await sendPushToEmployees([employee_id], {
      title: '🔔 Test Notification',
      body:  'Push notifications are working correctly!',
      url:   '/employee/dashboard',
    })

    return ok({ sent: true })
  } catch (err) {
    return fromError(err)
  }
}
