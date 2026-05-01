import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth-admin'
import { AdminMobileMenuProvider } from '@/app/cms/mobile-menu-context'
import { AdminShell } from '@/components/admin-shell'
import { RouteRefresher } from '@/components/route-refresher'
import { PwaRegister } from '@/components/pwa-register'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard — second layer behind the edge middleware.
  // If someone crafts a malformed cookie that slips past the edge check,
  // this Node.js HMAC verification will still block them.
  if (!isAdminAuthenticated()) redirect('/admin-login')

  return (
    <AdminMobileMenuProvider>
      <PwaRegister />
      <RouteRefresher />
      <AdminShell>{children}</AdminShell>
    </AdminMobileMenuProvider>
  )
}
