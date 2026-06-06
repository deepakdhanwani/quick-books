# Quick Books — Mobile App

Subscriber app built with **Expo SDK 54**. Use **Expo Go** on your phone for development.

**Port:** `9092`

## Setup

```bash
cp .env.example .env
npm install
```

## Run with Expo Go

```bash
npx expo start --port 9092
```

Or simply:

```bash
npm start
```

1. Install **Expo Go (SDK 54)** on your phone
2. Run the command above
3. Scan the QR code shown in the terminal

## Other commands

```bash
npx expo start --android --port 9092
npx expo start --ios --port 9092
npx expo start --tunnel --port 9092
```

## API URL

Set `EXPO_PUBLIC_API_URL` in `.env` (backend runs on port **9090**):

| Environment | Value |
|-------------|-------|
| Same machine (web) | `http://localhost:9090` |
| Android emulator | `http://10.0.2.2:9090` |
| Physical device (same Wi-Fi) | `http://<your-pc-ip>:9090` |
