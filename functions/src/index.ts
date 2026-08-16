import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onValueWritten } from 'firebase-functions/v2/database';

initializeApp();

const TITLE = 'Your Turn!';
const BODY = 'It is your turn to move in Hnefatafl.';

export const notifyTurn = onValueWritten('/rooms/{roomId}', async (event) => {
  const after = event.data.after.val() as {
    status?: string;
    lastMoveAt?: number;
    lastMoveBy?: string;
    players?: Record<string, unknown>;
  } | null;
  const before = event.data.before.val() as { lastMoveAt?: number } | null;
  if (!after || after.status !== 'playing' || !after.lastMoveBy || !after.lastMoveAt) return;
  if (after.lastMoveAt === before?.lastMoveAt) return;

  const opponentId = Object.keys(after.players ?? {}).find((id) => id !== after.lastMoveBy);
  if (!opponentId) return;

  const snap = await getFirestore().doc(`users/${opponentId}`).get();
  const tokens = Object.keys((snap.data()?.fcmTokens ?? {}) as Record<string, unknown>);
  if (tokens.length === 0) return;

  await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title: TITLE, body: BODY },
    webpush: { fcmOptions: { link: '/' } },
  });
});
