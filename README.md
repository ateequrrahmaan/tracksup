# TracksUp - Production Supply Chain Management

TracksUp is a supply chain management and order tracking platform designed for suppliers and retailers.

## Features
- Real-time order tracking
- Inventory and product management
- Employee assignment and performance tracking
- Digital invoicing and payment tracking
- Secure RBAC (Role-Based Access Control) via Firebase

## Deployment Guide

### Prerequisites
1. **Firebase Project**: Create a Firebase project and enable Firestore and Authentication (Google login).
2. **Environment Variables**: Set the variables in your hosting provider's dashboard (Netlify, Render, Railway, etc.).

### Environment Variables
See `.env.example` for the complete list. Key variables include:

**Frontend (VITE_ prefix):**
- `VITE_FIREBASE_API_KEY`: Found in Firebase Project Settings.
- `VITE_FIREBASE_PROJECT_ID`: Found in Firebase Project Settings.
- `VITE_API_URL`: URL of your hosted backend (e.g., `https://api.yourdomain.com`).

**Backend:**
- `FIREBASE_PROJECT_ID`: Same as frontend.
- `FIREBASE_CLIENT_EMAIL`: From a Firebase Service Account JSON.
- `FIREBASE_PRIVATE_KEY`: From a Firebase Service Account JSON (ensure it includes `-----BEGIN PRIVATE KEY-----`).
- `PORT`: (Optional) Port to run the server on (defaults to 3000).
- `CORS_ORIGIN`: Allowed frontend URL (e.g., `https://yourdomain.netlify.app`).

### Hosting on Netlify (Frontend Only)
Netlify can host the static frontend.
1. Connect your GitHub repo to Netlify.
2. Set the **Build Command** to `npm run build:client`.
3. Set the **Publish directory** to `dist`.
4. Add the `VITE_` environment variables in **Site Settings > Build & deploy > Environment**.
5. **Note**: The backend must be hosted separately (e.g., Render, Railway) and `VITE_API_URL` must point to it.

### Hosting on Render/Railway (Full-Stack)
These providers support persistent Node.js servers.
1. Connect your GitHub repo.
2. Set the **Build Command** to `npm install && npm run build`.
3. Set the **Start Command** to `npm start`.
4. Add all environment variables from `.env.example`.

## Development
```bash
npm install
npm run dev
```

## License
MIT
