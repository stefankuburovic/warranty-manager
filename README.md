# Warranty Manager

A comprehensive mobile application for managing product warranties, receipts, and warranty expiration alerts. Built with React Native (Expo) and Node.js backend.

## 🚀 Features

### Core Functionality
- **Product Management**: Add, edit, and organize products with warranty information
- **Document Storage**: Upload and store receipts, warranty documents, and product images
- **Smart Notifications**: Automated warranty expiration alerts and reminders
- **Barcode Scanning**: Quick product addition via barcode/QR code scanning
- **OCR Receipt Scanning**: Extract product information from receipt images
- **Advanced Search**: Full-text search with filters, saved searches, and search history
- **Family Sharing**: Share products with family members and manage shared warranties
- **Multi-language Support**: English, Serbian (Latin & Cyrillic)
- **Dark Mode**: Complete theme support with system preference detection
- **Statistics & Analytics**: Visual charts and insights about your warranties
- **Export**: PDF export of warranty information

### Advanced Features
- **Advanced Search & Filters**: 
  - Full-text search with operators (AND, OR, NOT, quotes)
  - Multi-criteria filtering (category, store, price range, date ranges)
  - Saved search presets
  - Search history and suggestions
  
- **Notification System**:
  - Customizable notification preferences
  - Multiple notification channels (email, push, SMS)
  - Scheduled notifications
  - Notification history

- **Document Management**:
  - AWS S3 integration for document storage
  - Image optimization and compression
  - Document preview and sharing

## 📱 Tech Stack

### Frontend (Mobile App)
- **React Native** with Expo (~54.0.0)
- **React Navigation** for navigation
- **React Native Paper** for UI components
- **i18next** for internationalization
- **Expo Camera** for barcode scanning
- **Tesseract.js** for OCR
- **React Query** for data fetching

### Backend (API)
- **Node.js** with Express
- **PostgreSQL** database with Sequelize ORM
- **AWS S3** for file storage
- **Firebase Admin** for push notifications
- **JWT** for authentication
- **Bull** for job queues
- **Fuse.js** for fuzzy search

## 🏗️ Project Structure

```
warranty-manager/
├── warranty-app/          # React Native mobile app
│   ├── src/
│   │   ├── api/          # API client functions
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React contexts (Auth, Theme)
│   │   ├── navigation/ # Navigation configuration
│   │   ├── screens/    # Screen components
│   │   ├── services/   # Business logic services
│   │   ├── theme/      # Theme configuration
│   │   └── utils/      # Utility functions
│   └── assets/         # Images and static assets
│
├── warranty-app-backend/ # Node.js backend API
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── models/     # Sequelize models
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   ├── middleware/ # Express middleware
│   │   └── jobs/       # Background jobs
│   └── migrations/     # Database migrations
│
└── docs/                # Documentation
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Expo CLI (`npm install -g expo-cli`)
- AWS Account (for S3 storage)
- Firebase Project (for push notifications)
- Google OAuth Credentials

### Backend Setup

1. Navigate to backend directory:
```bash
cd warranty-app-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (create `.env` file):
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warranty_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Server
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000/api/v1
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to app directory:
```bash
cd warranty-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (update `src/constants/config.js`):
```javascript
export const API_URL = 'http://YOUR_IP_ADDRESS:3000/api/v1';
```

4. Start Expo development server:
```bash
npm start
```

5. Run on device/emulator:
```bash
npm run android  # Android
npm run ios      # iOS
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Project Setup Guide](docs/warranty_project_setup.md)
- [Database Setup](docs/DATABASE_SETUP.md)
- [Environment Setup](docs/ENV_SETUP.md)
- [Google OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md)
- [AWS S3 Setup](docs/AWS_S3_SETUP.md)
- [Firebase Setup](docs/FIREBASE_SETUP.md)
- [Advanced Search & Filters](docs/Advanced_Search_Filters_v1_9_0.md)
- [Multi-language Support](docs/multi_language_support.md)
- [Dark Mode Implementation](docs/dark_mode_implementation.md)
- [Architecture Overview](docs/warranty_app_architecture.md)

## 🔐 Authentication

The app supports multiple authentication methods:
- **Username/Password**: Traditional email/password authentication
- **Google OAuth**: Sign in with Google account
- **JWT Tokens**: Secure token-based authentication with refresh tokens

## 🌍 Internationalization

Supported languages:
- English (en)
- Serbian Latin (sr-Latn)
- Serbian Cyrillic (sr-Cyrl)

Language files are located in `warranty-app/src/i18n/locales/`

## 🎨 Theming

The app supports:
- Light mode
- Dark mode
- System preference detection

Theme configuration is in `warranty-app/src/theme/`

## 📊 Database Schema

The database includes tables for:
- Users and authentication
- Products and warranties
- Categories and stores
- Documents and attachments
- Notifications and alerts
- Family sharing
- Search history and saved searches

See `docs/warranty_db_diagram.mermaid` for visual schema.

## 🧪 Testing

```bash
# Backend tests
cd warranty-app-backend
npm test

# Frontend tests
cd warranty-app
npm test
```

## 📦 Building for Production

### Android
```bash
cd warranty-app
expo build:android
```

### iOS
```bash
cd warranty-app
expo build:ios
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👤 Author

Stefan Kuburovic

## 🙏 Acknowledgments

- Expo team for the amazing React Native framework
- React Native Paper for beautiful UI components
- All open-source contributors whose libraries made this project possible

