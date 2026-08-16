import { Capacitor } from '@capacitor/core';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';
import { app } from './firebase';
import { statsService } from './statsService';

const TITLE = 'Your Turn!';
const BODY = 'It is your turn to move in Hnefatafl.';

export const TURN_NOTIFY_TITLE = TITLE;
export const TURN_NOTIFY_BODY = BODY;

let messaging: Messaging | null = null;
let currentToken: string | null = null;

async function webMessaging(): Promise<Messaging | null> {
  if (Capacitor.isNativePlatform()) return null;
  if (!(await isSupported())) return null;
  if (!messaging) messaging = getMessaging(app);
  return messaging;
}

export async function registerFcmToken(uid: string): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
      await FirebaseMessaging.requestPermissions();
      const { token } = await FirebaseMessaging.getToken();
      if (!token) return;
      currentToken = token;
      await statsService.saveFcmToken(uid, token, 'android');
      return;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) return;
    const instance = await webMessaging();
    if (!instance) return;
    const registration = await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}firebase-messaging-sw.js`
    );
    const token = await getToken(instance, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return;
    currentToken = token;
    await statsService.saveFcmToken(uid, token, 'web');
  } catch {
    /* permission denied or unsupported */
  }
}

export async function unregisterFcmToken(uid: string | null): Promise<void> {
  if (!uid || !currentToken) {
    currentToken = null;
    return;
  }
  const token = currentToken;
  currentToken = null;
  await statsService.removeFcmToken(uid, token).catch(() => undefined);
}
