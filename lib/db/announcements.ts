import 'server-only'
import { db } from './supabase'
import { sendPushToAll } from '@/lib/push'

export type AnnouncementType = 'announcement' | 'event' | 'holiday' | 'info'

export interface Announcement {
  id: string
  title: string
  body: string | null
  type: AnnouncementType
  pinned: boolean
  created_at: string
  updated_at: string
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await db()
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Announcement[]
}

export async function createAnnouncement(input: {
  title: string
  body?: string | null
  type?: AnnouncementType
  pinned?: boolean
}): Promise<Announcement> {
  const { data, error } = await db()
    .from('announcements')
    .insert(input)
    .select('*')
    .single()
  if (error) throw error

  // Broadcast push to every subscribed employee — best-effort, never throws.
  const announcement = data as Announcement
  sendPushToAll({
    title: '📢 New Announcement',
    body:  announcement.title,
    url:   '/employee/dashboard',
  }).catch(() => {})

  return announcement
}

export async function updateAnnouncement(
  id: string,
  input: Partial<{
    title: string
    body: string | null
    type: AnnouncementType
    pinned: boolean
  }>
): Promise<Announcement> {
  const { data, error } = await db()
    .from('announcements')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Announcement
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await db().from('announcements').delete().eq('id', id)
  if (error) throw error
}
