import { getDashboardSnapshot } from '@/lib/db/dashboard'
import { fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return ok(await getDashboardSnapshot())
  } catch (err) {
    return fromError(err)
  }
}
