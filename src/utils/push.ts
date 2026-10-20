// Client Web Push and Browser Notification helpers

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export async function registerWebPushSubscription(userId: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Service workers or Push not supported in this browser environment');
      return false;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return false;
    }

    // Fetch public VAPID key
    const res = await fetch('/api/push/vapid-key');
    if (!res.ok) return false;
    const { publicKey } = await res.json();
    if (!publicKey) return false;

    // Get registration
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey.buffer as ArrayBuffer,
      });
    }

    // Send subscription to backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ subscription }),
    });

    return true;
  } catch (err) {
    console.error('[Push] Failed to register web push:', err);
    return false;
  }
}

export function showLocalNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });
    } catch {
      // Fallback inside serviceWorker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            ...options,
          });
        }).catch(() => {});
      }
    }
  }
}
