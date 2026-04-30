// Officely — Service Worker for Web Push notifications
// Placed in /public so it's served at the root scope (/)

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Officely', body: event.data.text() }
  }

  const {
    title = 'Officely',
    body  = '',
    icon  = '/icon-192.png',
    url   = '/',
  } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      data: { url },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        // Focus an already-open tab if one exists
        for (const client of list) {
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) client.navigate(url)
            return
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) return clients.openWindow(url)
      })
  )
})
