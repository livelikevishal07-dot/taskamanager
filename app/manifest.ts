import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'Officely',
    short_name:       'Officely',
    description:      'Office management — tasks, attendance, leave, bookings & admin',
    start_url:        '/?pwa=1',
    scope:            '/',
    display:          'standalone',
    orientation:      'portrait-primary',
    background_color: '#ffffff',
    theme_color:      '#6F5CFF',
    categories:       ['productivity', 'business'],
    icons: [
      {
        src:     '/icon.svg',
        sizes:   'any',
        type:    'image/svg+xml',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        purpose: 'any' as any,
      },
      {
        src:     '/icon-192.png',
        sizes:   '192x192',
        type:    'image/png',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        purpose: 'any maskable' as any,
      },
      {
        src:     '/icon-512.png',
        sizes:   '512x512',
        type:    'image/png',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        purpose: 'any maskable' as any,
      },
    ],
    shortcuts: [
      // ── Employee shortcuts ───────────────────────────────────────────────────
      {
        name:        'My Tasks',
        short_name:  'Tasks',
        url:         '/employee/tasks',
        description: 'View and manage your tasks',
      },
      {
        name:        'Attendance',
        short_name:  'Attendance',
        url:         '/employee/attendance',
        description: 'Mark your attendance',
      },
      {
        name:        'Bookings',
        short_name:  'Bookings',
        url:         '/employee/bookings',
        description: 'Log a new booking',
      },
      // ── Admin shortcuts ──────────────────────────────────────────────────────
      {
        name:        'Admin Dashboard',
        short_name:  'Admin',
        url:         '/cms',
        description: 'Admin control panel',
      },
      {
        name:        'Leave Management',
        short_name:  'Leave',
        url:         '/cms/leave',
        description: 'Review and approve leave requests',
      },
    ],
  }
}
