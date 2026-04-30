import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function BookingsRedirect() {
  redirect('/cms/bookings/analysis')
}
