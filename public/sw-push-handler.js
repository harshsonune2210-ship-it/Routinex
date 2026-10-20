// Web Push and background notification handler for DISCIPLINE OS
self.addEventListener('push', (event) => {
  let data = {
    title: 'DISCIPLINE OS Notification',
    body: 'Time to check your scheduled routine!',
    tag: 'discipline-os-routine',
    url: '/'
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'discipline-alert',
    renotify: true,
    vibrate: [250, 100, 250],
    data: data,
    actions: [
      { action: 'open', title: 'Open Discipline OS' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});
