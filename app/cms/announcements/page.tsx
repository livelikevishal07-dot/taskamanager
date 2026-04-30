import { Topbar } from '@/components/topbar'
import { AnnouncementsSection } from '@/components/announcements/announcements-section'
import { listAnnouncements } from '@/lib/db/announcements'

export const dynamic = 'force-dynamic'

export default async function AnnouncementsPage() {
  const announcements = await listAnnouncements()

  return (
    <>
      <Topbar
        title="Announcements"
        breadcrumb={[{ label: 'Home' }, { label: 'Announcements' }]}
      />
      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <AnnouncementsSection initialAnnouncements={announcements} />
      </main>
    </>
  )
}
