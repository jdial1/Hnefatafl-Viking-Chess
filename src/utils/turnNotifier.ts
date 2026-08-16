import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { TURN_NOTIFY_BODY, TURN_NOTIFY_TITLE } from './fcmService';

const isNative = Capacitor.isNativePlatform();

export async function requestTurnNotifications(): Promise<void> {
  if (isNative) {
    await LocalNotifications.requestPermissions();
    return;
  }
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

export async function notifyTurn(): Promise<void> {
  if (document.visibilityState === 'visible') return;

  if (isNative) {
    await LocalNotifications.schedule({
      notifications: [{ id: Date.now() % 2 ** 31, title: TURN_NOTIFY_TITLE, body: TURN_NOTIFY_BODY }],
    });
    return;
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(TURN_NOTIFY_TITLE, { body: TURN_NOTIFY_BODY, icon: `${import.meta.env.BASE_URL}pwa-192x192.png` });
  }
}
