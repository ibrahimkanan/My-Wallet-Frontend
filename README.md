# My-Wallet-Frontend

A personal finance mobile application frontend built with **Expo (React Native)**, **TypeScript**, and **Expo Router**.

## Features & Architecture
- **Navigation**: Expo Router (file-based navigation)
- **State Management**: Zustand for global auth and user profile state
- **Secure Token Storage**: Expo SecureStore with support for rotating refresh tokens
- **API Client**: Axios instance with automatic Bearer token injection and a concurrency-safe 401 token refresh queue
- **Design System**: "Botanical Wealth & Quiet Luxury" identity (Nordic Pine `#0E7465`, Champagne Gold `#D4AF37`, Carmine Rose `#E11D48`, Lush Jade `#059669`, and tabular figures)

## Tech Stack
- **Framework**: Expo SDK 57 (React Native 0.86, React 19)
- **Routing**: Expo Router
- **Language**: TypeScript
- **State**: Zustand
- **Storage**: Expo SecureStore
- **Networking**: Axios

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `EXPO_PUBLIC_API_URL` points to your backend instance:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```
*(Note: If testing on a physical mobile device via Expo Go, use your computer's local network IP address, e.g. `http://192.168.1.X:3000`)*

### 3. Start Development Server
```bash
npx expo start
```
From the Expo CLI, press:
- `a` to run on Android emulator or connected device
- `i` to run on iOS simulator (macOS required)
- `w` to run in web browser
- Or scan the QR code with the Expo Go app on your physical phone
