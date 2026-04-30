import { Suspense } from 'react'

import { Topbar } from '@/components/topbar'
import { SettingsNav } from '@/components/settings/settings-nav'
import { SettingsContent } from '@/components/settings/settings-content'

export default function SettingsPage() {
  return (
    <>
      <Topbar
        title="Settings"
        breadcrumb={[{ label: 'Home' }, { label: 'Settings' }]}
      />
      <main className="px-4 py-4 sm:px-8 sm:py-6">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <Suspense fallback={null}>
            <SettingsNav />
          </Suspense>
          <Suspense fallback={null}>
            <SettingsContent />
          </Suspense>
        </div>
      </main>
    </>
  )
}
