# Warranty App Backend

Backend API for the Warranty Manager mobile application built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Update the following variables:
- Database credentials (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
- JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- AWS S3 credentials (if using S3 for file storage)
- CORS allowed origins

### 3. Setup Database

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE warranty_app;
CREATE USER warranty_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE warranty_app TO warranty_user;
\q
```

### 4. Run Database Migrations

The app uses Sequelize's `sync()` method which will automatically create tables. For production, consider using migrations.

### 5. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication
- `POST /api/v1/auth/google` - Google OAuth login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile

### Products
- `GET /api/v1/products` - Get all products (authenticated)
- `GET /api/v1/products/:id` - Get product by ID (authenticated)
- `POST /api/v1/products` - Create product (authenticated)
- `PUT /api/v1/products/:id` - Update product (authenticated)
- `DELETE /api/v1/products/:id` - Delete product (authenticated)

### Stores
- `GET /api/v1/stores` - Get all stores (authenticated)
- `POST /api/v1/stores` - Create store (authenticated)

### Documents
- `POST /api/v1/documents` - Upload document (authenticated)
- `GET /api/v1/documents/product/:product_id` - Get product documents (authenticated)
- `DELETE /api/v1/documents/:id` - Delete document (authenticated)

## Health Check

```bash
curl http://localhost:3000/health
```

## Project Structure

```
warranty-app-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Sequelize models
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── app.js           # Express app setup
├── server.js            # Server entry point
└── package.json
```

## Next Steps

1. Set up Google OAuth credentials in Google Cloud Console
2. Configure AWS S3 or Cloudinary for document storage
3. Seed initial data (categories, stores) using the seed file
4. Deploy to production server

