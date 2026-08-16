# Hnefatæfl (Viking Chess)

[Play in the browser](https://jdial1.github.io/Hnefatafl-Viking-Chess/) · [Download the Android APK](https://github.com/jdial1/Hnefatafl-Viking-Chess/releases/latest)

Hnefatafl (pronounced *nef-ah-tah-fel*) is a Norse strategy game on an 11×11 board. Two unequal forces hunt different victories: a surrounded king trying to reach a corner, and a larger host trying to take him before he does.

This repo is a Fetlar-rules client for the web and Android, with online matchmaking.

## How it is played

Pieces move like rooks: any number of open squares, orthogonally, with no leaping. Capture is custodial — flank an enemy on two opposite sides. Corner refuges and an empty throne count as hostile for captures. Walking between two enemies on purpose is safe.

| Side | Force | Victory |
| --- | --- | --- |
| Defenders | 12 soldiers and the King, starting in the center | Escort the King to any of the four corner refuges |
| Attackers | 24 soldiers, starting on the edges | Surround and capture the King |

On or beside the central throne the King needs a four-sided surround. On open tiles a two-sided capture is enough.

## Play

- **Web:** [jdial1.github.io/Hnefatafl-Viking-Chess](https://jdial1.github.io/Hnefatafl-Viking-Chess/)
- **Android:** [latest release](https://github.com/jdial1/Hnefatafl-Viking-Chess/releases/latest) — a debug APK named `Hnefatafl-Viking-Chess_VERSION.apk`, published on version tags (`v*`). Enable install from unknown sources, then open the file.
- **Online:** queue for a match as a guest. Google sign-in is optional and stores win/loss records on the account.
- **Sandbox:** local board from the header, for learning the rules without a second player.

## Project

React, Vite, and TypeScript in the browser. Capacitor wraps the same build for Android. Live games use Firebase Auth, Realtime Database, and Firestore. There is no separate Node game server.

Each main-branch build deploys the site to GitHub Pages. Pushing a `v*` tag builds the Android APK and attaches it to that GitHub release as `Hnefatafl-Viking-Chess_VERSION.apk`.
