# UniMatch Mobile App 📱

A React Native mobile app for the UniMatch university recommendation system.

## Features
- 🔐 Login / Sign Up with Supabase Auth
- 👤 4-Step Profile Setup (Academic, Geographic, Financial, Priorities)
- 🏠 Dashboard with AI-powered dataset recommendation
- 📊 University Rankings (QS, THE, ARWU) with search & filter
- 🏫 University Detail View

---

## Prerequisites

Make sure you have these installed:
- Node.js (v18+)
- Java JDK 17
- Android Studio + Android SDK
- React Native CLI

---

## Setup Instructions

### 1. Install dependencies
```bash
cd UniMatchApp
npm install
```

### 2. Configure Backend URL

Open `src/constants/index.js` and update `API_BASE_URL`:

```js
// For Android Emulator:
export const API_BASE_URL = 'http://10.0.2.2:8000';

// For Physical Android Device (replace with your PC's local IP):
export const API_BASE_URL = 'http://192.168.1.XXX:8000';

// For iOS Simulator:
export const API_BASE_URL = 'http://localhost:8000';
```

**To find your PC's local IP:**
- Windows: Run `ipconfig` in CMD → look for IPv4 address

### 3. Make sure your Python backend is running
```bash
cd UniMatch/python-backend
# Run your backend server on port 8000
python main.py  # or however your backend starts
```

### 4. Run on Android
```bash
# Start Metro bundler
npx react-native start

# In another terminal:
npx react-native run-android
```

### 5. Run on iOS (Mac only)
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## Project Structure

```
UniMatchApp/
├── App.js                          # Entry point
├── src/
│   ├── constants/index.js          # API URL, colors, options
│   ├── services/supabase.js        # Supabase client
│   ├── components/index.js         # Reusable UI components
│   ├── navigation/AppNavigator.js  # Navigation setup
│   └── screens/
│       ├── LoginScreen.js
│       ├── SignUpScreen.js
│       ├── ForgotPasswordScreen.js
│       ├── ProfileSetupScreen.js   # 4-step wizard
│       ├── DashboardScreen.js      # Main dashboard
│       └── RankingsScreen.js       # University rankings
```

---

## How It Connects to Your Web App

| Feature | Web (Vite+React) | Mobile (React Native) |
|---|---|---|
| Auth | Supabase Auth | Same Supabase credentials |
| Database | Supabase tables | Same Supabase tables |
| Backend API | localhost:8000 | 10.0.2.2:8000 (emulator) |
| Rankings | /rankings/:dataset | Rankings screen |
| Profile | /profile-setup | ProfileSetupScreen |

The mobile app uses the **exact same Supabase project and Python backend** as your web app — no backend changes needed!

---

## Common Issues

**"Network request failed" on emulator:**
→ Use `http://10.0.2.2:8000` not `localhost:8000`

**"Network request failed" on physical device:**
→ Use your PC's actual local IP address and make sure both are on same WiFi

**Supabase auth not working:**
→ Make sure you add your app's scheme to Supabase redirect URLs in the Supabase dashboard
