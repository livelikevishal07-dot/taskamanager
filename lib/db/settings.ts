import 'server-only'

import { db } from './supabase'

export interface WorkspaceSettings {
  id: string
  workspace_name: string
  owner_name: string
  timezone: string
  week_starts_on: 'Sunday' | 'Monday'
  working_hours_start: string
  working_hours_end: string
  created_at: string
  updated_at: string
}

export interface NotificationSetting {
  id: string
  event_key: string
  label: string
  hint: string | null
  email_enabled: boolean
  app_enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface AdminSession {
  id: string
  device: string
  location: string
  last_seen_at: string
  is_current: boolean
  created_at: string
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  const { data, error } = await db()
    .from('workspace_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .single()
  if (error) throw error
  return data as WorkspaceSettings
}

export async function updateWorkspaceSettings(
  input: Partial<
    Pick<
      WorkspaceSettings,
      | 'workspace_name'
      | 'timezone'
      | 'week_starts_on'
      | 'working_hours_start'
      | 'working_hours_end'
    >
  >
): Promise<WorkspaceSettings> {
  const { data, error } = await db()
    .from('workspace_settings')
    .update(input)
    .eq('id', SETTINGS_ID)
    .select()
    .single()
  if (error) throw error
  return data as WorkspaceSettings
}

export async function listNotificationSettings(): Promise<NotificationSetting[]> {
  const { data, error } = await db()
    .from('notification_settings')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as NotificationSetting[]
}

export async function updateNotificationSettings(
  rows: Array<Pick<NotificationSetting, 'event_key' | 'email_enabled' | 'app_enabled'>>
): Promise<NotificationSetting[]> {
  const client = db()
  for (const row of rows) {
    const { error } = await client
      .from('notification_settings')
      .update({
        email_enabled: row.email_enabled,
        app_enabled: row.app_enabled,
      })
      .eq('event_key', row.event_key)
    if (error) throw error
  }
  return listNotificationSettings()
}

export async function listAdminSessions(): Promise<AdminSession[]> {
  const { data, error } = await db()
    .from('admin_sessions')
    .select('*')
    .order('is_current', { ascending: false })
    .order('last_seen_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AdminSession[]
}

export async function deleteAdminSession(id: string): Promise<void> {
  const { error } = await db()
    .from('admin_sessions')
    .delete()
    .eq('id', id)
    .eq('is_current', false)
  if (error) throw error
}

export async function deleteOtherAdminSessions(): Promise<void> {
  const { error } = await db()
    .from('admin_sessions')
    .delete()
    .eq('is_current', false)
  if (error) throw error
}
