"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyTurn = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const database_1 = require("firebase-functions/v2/database");
(0, app_1.initializeApp)();
const TITLE = 'Your Turn!';
const BODY = 'It is your turn to move in Hnefatafl.';
exports.notifyTurn = (0, database_1.onValueWritten)('/rooms/{roomId}', async (event) => {
    const after = event.data.after.val();
    const before = event.data.before.val();
    if (!after || after.status !== 'playing' || !after.lastMoveBy || !after.lastMoveAt)
        return;
    if (after.lastMoveAt === before?.lastMoveAt)
        return;
    const opponentId = Object.keys(after.players ?? {}).find((id) => id !== after.lastMoveBy);
    if (!opponentId)
        return;
    const snap = await (0, firestore_1.getFirestore)().doc(`users/${opponentId}`).get();
    const tokens = Object.keys((snap.data()?.fcmTokens ?? {}));
    if (tokens.length === 0)
        return;
    await (0, messaging_1.getMessaging)().sendEachForMulticast({
        tokens,
        notification: { title: TITLE, body: BODY },
        webpush: { fcmOptions: { link: '/' } },
    });
});
