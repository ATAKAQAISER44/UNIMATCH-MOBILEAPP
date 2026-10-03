# UniMatch – Run Guide (Expo SDK 57 + FastAPI)

## Versions
- Expo SDK 57, React Native 0.86.3, React 19.2.3, React Navigation 7
- Expo Go app 57.x on your phone
- Python 3.12+ for the backend (your machine uses 3.14 – fine)

## 1. Backend (terminal 1)

The backend must be started from inside the `python-backend` folder,
because the CSV paths are relative to it.

```powershell
cd python-backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Next time you only need:

```powershell
cd python-backend
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

You should see `[STARTUP] Datasets cached in ...s`.

Note: never copy a `venv` folder to another computer or folder – it stops
working. Always recreate it with the commands above.

## 2. Frontend (terminal 2)

```powershell
npm install
npx expo start -c
```

Scan the QR code with Expo Go. Use `-c` (clear cache) once after updating
the project; afterwards plain `npx expo start` is fine.

## 3. Backend address – automatic

You no longer need to edit an IP address. The app uses the same laptop IP
that Expo shows under the QR code (for example `exp://192.168.131.162:8081`)
and connects to port 8000 on it. In the Expo terminal you will see:

```
[API] Backend URL: http://192.168.131.162:8000
```

To force a different address, create a file named `.env` in the project root:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.8:8000
```

then restart with `npx expo start -c`.
(Tunnel mode cannot reach a local backend – use LAN mode.)

## 4. If the app says "Cannot reach the UniMatch server"

1. Is uvicorn running with `--host 0.0.0.0`?
2. On the phone's browser open `http://<laptop-ip>:8000/health`.
   - If it does not open: Windows Firewall is blocking it. Allow Python on
     **Private** networks (Windows Security → Firewall → Allow an app), and
     make sure your Wi-Fi is set to *Private*, not *Public*.
3. Phone and laptop must be on the same Wi-Fi (not guest Wi-Fi, not mobile data).

## Wrong commands
`npx start expo`, `npm start expo`, `npm expo start`, `uvicorn main:app`
