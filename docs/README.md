# Warranty Manager - Complete Project

A full-stack warranty management application with a Node.js/Express backend and React Native mobile app.

## Project Structure

```
warranty-manager/
├── warranty-app-backend/    # Backend API (Node.js + Express + PostgreSQL)
├── warranty-app/            # Mobile App (React Native + Expo)
└── docs/                    # Project documentation
```

## Quick Start

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd warranty-app-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your configuration (see `warranty-app-backend/README.md`)

4. Setup PostgreSQL database (see setup instructions in docs)

5. Start the server:
   ```bash
   npm run dev
   ```

### Mobile App Setup

1. Navigate to mobile app directory:
   ```bash
   cd warranty-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update `src/constants/config.js` with your backend URL and Google OAuth credentials

4. Start Expo:
   ```bash
   npm start
   ```

## Features

- ✅ Google OAuth authentication
- ✅ Product warranty tracking
- ✅ Document upload (receipts, warranty cards)
- ✅ Warranty expiry date calculation
- ✅ Product CRUD operations
- ✅ Store and category management

## Documentation

- [Backend Setup Guide](./warranty-app-backend/README.md)
- [Mobile App Setup Guide](./warranty-app/README.md)
- [Project Architecture](./docs/warranty_app_architecture.md)
- [Database Schema](./warranty_db_diagram.mermaid)

## Next Steps

1. Configure Google OAuth credentials
2. Set up AWS S3 or Cloudinary for document storage
3. Implement OCR for receipt scanning
4. Add push notifications for warranty expiry alerts
5. Deploy to production

## Development

### Backend
- Server runs on `http://localhost:3000`
- API endpoints: `/api/v1/*`
- Health check: `GET /health`

### Mobile App
- Development server: Expo DevTools
- Test on device: Scan QR code with Expo Go app
- Test on simulator: `npx expo run:ios` or `npx expo run:android`

## Environment Variables

### Backend (.env)
- Database configuration
- JWT secrets
- Google OAuth credentials
- AWS S3 credentials (optional)
- CORS allowed origins

### Mobile App (src/constants/config.js)
- API_URL
- Google OAuth Client IDs (iOS, Android, Web)

## License

MIT

