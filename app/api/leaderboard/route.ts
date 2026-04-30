import { NextRequest } from 'next/server'
import { getLeaderboard } from '@/lib/db/leaderboard'
import { fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get('period')
    const period = raw === 'weekly' ? 'weekly' : 'monthly'
    return ok(await getLeaderboard(period))
  } catch (err) {
    return fromError(err)
  }
}
