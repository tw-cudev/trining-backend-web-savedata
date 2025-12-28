# FileVault - Production Setup Guide

## Prerequisites

Before you begin, ensure you have:
- Node.js 16+ installed
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- Cloudinary account (https://cloudinary.com)
- Vercel account (https://vercel.com)
- Git installed

## Local Development Setup

### 1. Clone and Install Backend

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env` file:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/file-storage
JWT_SECRET=your-super-secret-key-change-in-production
PORT=5000
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Start Backend Development Server

```bash
npm run dev
# Server runs on http://localhost:5000
```

### 4. Frontend Setup

The frontend is vanilla HTML/CSS/JavaScript. Simply:

1. Open `frontend/index.html` in a browser
2. Or use a local server:

```bash
cd frontend
npx http-server
# Server runs on http://localhost:8080
```

Update the `API_BASE_URL` in `frontend/script.js` to match your backend URL.

## Database Setup - MongoDB Atlas

### 1. Create MongoDB Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new project: "FileVault"
4. Create a cluster (free tier available)
5. Create database user with username and password
6. Get connection string

### 2. Initialize Database

The application automatically creates collections on first use. No manual setup needed.

**Collections created:**
- `users` - User accounts and profiles
- `files` - File metadata and storage references
- `activitylogs` - User activity tracking

## Cloud Storage Setup - Cloudinary

### 1. Create Cloudinary Account

1. Go to https://cloudinary.com
2. Sign up (free tier available)
3. Go to Dashboard
4. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure in .env

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Deployment - Vercel (Backend)

### 1. Prepare Backend for Vercel

Backend is already configured as Vercel-compatible with:
- `vercel.json` configuration file
- Module exports instead of server.listen()
- API route structure

### 2. Deploy Backend to Vercel

```bash
cd backend
npm install -g vercel
vercel login
vercel
```

### 3. Set Environment Variables on Vercel

In Vercel dashboard:

1. Go to Settings → Environment Variables
2. Add all variables from your `.env` file:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `FRONTEND_URL` (your frontend domain)

### 4. Redeploy After Setting Variables

```bash
vercel --prod
```

## Deployment - Vercel (Frontend)

### 1. Prepare Frontend

Update `frontend/script.js`:

Change:
```javascript
const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:5000/api"
  : `${window.location.origin}/api`
```

To:
```javascript
const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:5000/api"
  : "https://your-backend-vercel-url/api"
```

### 2. Deploy Frontend

Option A: Vercel Static Hosting

```bash
cd frontend
vercel
```

Option B: GitHub + Vercel

1. Push frontend folder to GitHub
2. Connect GitHub to Vercel
3. Deploy automatically

## Testing the Deployment

### 1. Test Registration

1. Go to your deployed app
2. Create new account (first account becomes admin)
3. Verify email works

### 2. Test File Upload

1. Login as regular user
2. Upload test file
3. Verify file appears in list
4. Test download and delete

### 3. Test Admin Panel

1. Create second user
2. Login as first user (admin)
3. Access admin dashboard
4. Verify user management works
5. Test file deletion
6. Check activity logs

## Production Checklist

### Security
- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Enable MongoDB IP whitelist
- [ ] Set CORS properly for frontend domain
- [ ] Use HTTPS for all connections
- [ ] Rotate API keys regularly

### Performance
- [ ] Enable MongoDB caching
- [ ] Set up CDN for static assets
- [ ] Configure file size limits
- [ ] Monitor API response times
- [ ] Set up error tracking (Sentry)

### Monitoring
- [ ] Enable Vercel analytics
- [ ] Set up MongoDB alerts
- [ ] Monitor storage usage
- [ ] Track user activity

### Data
- [ ] Set up MongoDB backups
- [ ] Document data retention policies
- [ ] Implement data export for users
- [ ] Set up GDPR compliance

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoError: connect ECONNREFUSED`

**Solution:**
1. Check connection string in `.env`
2. Verify IP is whitelisted in MongoDB Atlas
3. Ensure credentials are correct

### Cloudinary Upload Fails

**Error:** `Cloudinary authentication failed`

**Solution:**
1. Verify API credentials
2. Check file size limits (500MB max)
3. Ensure multer configuration is correct

### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Update `FRONTEND_URL` in backend
2. Ensure backend CORS middleware includes frontend URL
3. Check browser console for full error

### Files Not Persisting

**Error:** Files disappear after page refresh

**Solution:**
1. Ensure MongoDB is connected
2. Check API response for errors
3. Verify file record is in database

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files` - List user files
- `GET /api/files/:fileId` - Get file details
- `DELETE /api/files/:fileId` - Delete file

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId` - Get user details
- `PATCH /api/admin/users/:userId/role` - Change role
- `PATCH /api/admin/users/:userId/disable` - Disable user
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/files` - List all files
- `DELETE /api/admin/files/:fileId` - Delete any file
- `GET /api/admin/stats` - Get dashboard stats

## Support

For issues or questions:
1. Check error messages in browser console
2. Review server logs in Vercel dashboard
3. Verify all environment variables are set
4. Check API connectivity
