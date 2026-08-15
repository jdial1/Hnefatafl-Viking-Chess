import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const isNative = Capacitor.isNativePlatform();

const TITLE = 'Your Turn!';
const BODY = 'It is your turn to move in Hnefatafl.';

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
      notifications: [{ id: Date.now() % 2 ** 31, title: TITLE, body: BODY }],
    });
    return;
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(TITLE, { body: BODY, icon: '/pwa-192x192.png' });
  }
}
