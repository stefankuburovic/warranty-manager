# Warranty Management App - Complete Architecture

## Technology Stack

### Mobile App (Frontend)
- **Framework**: React Native with Expo
  - Cross-platform (iOS + Android)
  - Easier deployment and updates
  - Good community support in Serbia
  - Camera and file system APIs built-in

- **State Management**: Redux Toolkit or Zustand
- **Navigation**: React Navigation
- **UI Library**: React Native Paper or NativeBase
- **Image Handling**: 
  - `expo-image-picker` for capturing/selecting photos
  - `expo-camera` for direct camera access
  - `react-native-image-crop-picker` for editing
- **Authentication**: `@react-oauth/google` or Firebase Auth
- **Storage**: AsyncStorage for local caching

### Backend (API)
- **Framework**: Node.js + Express.js OR Django REST Framework
  - Node.js: Better for real-time features, JavaScript ecosystem
  - Django: Built-in admin panel, better ORM, Python OCR libraries

- **Database**: PostgreSQL
  - Robust, open-source
  - Good JSON support for flexible fields
  - Strong data integrity

- **Authentication**: 
  - Google OAuth 2.0
  - JWT tokens for session management
  
- **Cloud Storage**: 
  - AWS S3 or Cloudinary
  - For receipts, warranty documents, product images

- **OCR Service**: 
  - Google Cloud Vision API
  - Azure Computer Vision
  - Tesseract.js (open-source alternative)

### Infrastructure
- **API Hosting**: Railway, Render, or DigitalOcean
- **Database**: Managed PostgreSQL (same provider)
- **CDN**: Cloudflare for image delivery
- **Push Notifications**: Firebase Cloud Messaging (FCM)

---

## API Endpoints Design

### Base URL: `https://api.warranty-app.com/v1`

### Authentication
```
POST   /auth/google
       Body: { id_token: "google_jwt_token" }
       Response: { access_token, refresh_token, user }

POST   /auth/refresh
       Body: { refresh_token }
       Response: { access_token }

POST   /auth/logout
       Headers: Authorization: Bearer {token}
       Response: { success: true }

GET    /auth/me
       Headers: Authorization: Bearer {token}
       Response: { user object }
```

### Users
```
GET    /users/profile
       Response: User profile data

PUT    /users/profile
       Body: { full_name, phone_number }
       Response: Updated user

DELETE /users/account
       Response: { success: true }
```

### Products
```
GET    /products
       Query: ?page=1&limit=20&category=electronics&status=active&sort=purchase_date
       Response: { products[], total, page, pages }

GET    /products/:id
       Response: Product with documents and store info

POST   /products
       Body: {
         product_name, brand, model_number, serial_number,
         purchase_date, purchase_price, currency,
         warranty_duration_months, category_id, store_id, notes
       }
       Response: Created product

PUT    /products/:id
       Body: Same as POST
       Response: Updated product

DELETE /products/:id
       Response: { success: true }

GET    /products/expiring
       Query: ?days=30
       Response: Products expiring within specified days

GET    /products/expired
       Response: Products with expired warranties

GET    /products/stats
       Response: {
         total_products, active_warranties, expired_warranties,
         total_spent, categories_breakdown, stores_breakdown
       }
```

### Documents
```
GET    /products/:product_id/documents
       Response: Array of documents for product

POST   /products/:product_id/documents
       Body: FormData with file + metadata
       Fields: { file, document_type, is_primary }
       Response: Created document with URLs

GET    /documents/:id
       Response: Document metadata + signed URL

DELETE /documents/:id
       Response: { success: true }

POST   /documents/:id/ocr
       Response: { extracted_data: { date, amount, store, items[] } }

PUT    /documents/:id/primary
       Mark document as primary receipt
       Response: Updated document
```

### Stores
```
GET    /stores
       Query: ?search=tehnomanija&city=Belgrade
       Response: Array of stores

GET    /stores/:id
       Response: Store details + products purchased there

POST   /stores
       Body: {
         store_name, store_chain, address, city,
         phone, website, logo_url
       }
       Response: Created store

PUT    /stores/:id
       Body: Same as POST
       Response: Updated store

GET    /stores/suggestions
       Query: ?q=tehn
       Response: Autocomplete suggestions based on user's history
```

### Categories
```
GET    /categories
       Response: Array of all categories

GET    /categories/:id
       Response: Category with products count

POST   /categories (Admin only)
       Body: { category_name, icon_name, default_warranty_months }
       Response: Created category
```

### Warranty Alerts
```
GET    /alerts
       Query: ?upcoming=true
       Response: Array of upcoming alerts

PUT    /alerts/:id/dismiss
       Response: { success: true }

POST   /products/:id/alerts
       Body: { alert_type, days_before }
       Response: Created alert

DELETE /alerts/:id
       Response: { success: true }
```

### Search
```
GET    /search
       Query: ?q=samsung&type=products
       Response: Unified search across products, stores, brands

GET    /search/suggestions
       Query: ?q=sam
       Response: Autocomplete suggestions
```

---

## Authentication Flow (Google Only)

### Mobile App Flow:
1. User clicks "Sign in with Google"
2. App opens Google Sign-In via Expo AuthSession
3. User authenticates with Google
4. Google returns `id_token`
5. App sends `id_token` to `/auth/google`
6. Backend:
   - Verifies token with Google
   - Checks if user exists (by Google ID or email)
   - Creates new user if doesn't exist
   - Generates JWT access + refresh tokens
7. App stores tokens in AsyncStorage
8. App uses access token for all subsequent requests

### Token Refresh Flow:
- Access token expires in 1 hour
- Refresh token expires in 30 days
- App automatically refreshes before expiration
- If refresh fails, redirect to login

---

## Database Modifications for Google Auth

### Updated USERS table:
```sql
users {
  user_id (PK)
  google_id (UNIQUE, INDEXED) -- Google's unique user ID
  email (UNIQUE)
  full_name
  profile_picture_url -- From Google
  phone_number
  created_at
  updated_at
  last_login_at
}
```

**Remove**: `password_hash` field (not needed with Google-only auth)

---

## Mobile App Key Libraries

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "react-native": "0.73.0",
    "expo-auth-session": "~5.4.0",
    "expo-image-picker": "~14.7.0",
    "expo-camera": "~14.1.0",
    "expo-file-system": "~16.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "react-native-paper": "^5.11.0",
    "axios": "^1.6.0",
    "react-query": "^3.39.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-calendars": "^1.1305.0",
    "react-native-chart-kit": "^6.12.0"
  }
}
```

---

## Security Considerations

1. **JWT Storage**: Store tokens in AsyncStorage with encryption
2. **HTTPS Only**: All API calls over HTTPS
3. **Rate Limiting**: Implement on all endpoints (especially auth)
4. **File Upload Limits**: Max 10MB per file, validate MIME types
5. **CORS**: Restrict to mobile app origins
6. **Token Expiration**: Short-lived access tokens (1 hour)
7. **Image Sanitization**: Scan uploaded files for malware
8. **SQL Injection**: Use parameterized queries
9. **Google Token Verification**: Always verify tokens server-side

---

## Deployment Checklist

### Backend
- [ ] Set up PostgreSQL database
- [ ] Configure Google OAuth credentials
- [ ] Set up S3/Cloudinary bucket
- [ ] Configure environment variables
- [ ] Set up error logging (Sentry)
- [ ] Deploy to Railway/Render
- [ ] Set up automated backups
- [ ] Configure SSL certificate

### Mobile App
- [ ] Configure Google Sign-In (Android + iOS)
- [ ] Set up Expo project
- [ ] Configure app.json with proper bundle IDs
- [ ] Test on physical devices
- [ ] Set up Expo EAS Build
- [ ] Submit to Google Play Store
- [ ] Submit to Apple App Store

### Post-Launch
- [ ] Monitor error rates
- [ ] Set up analytics (Google Analytics, Mixpanel)
- [ ] User feedback system
- [ ] Regular database backups
- [ ] Performance monitoring