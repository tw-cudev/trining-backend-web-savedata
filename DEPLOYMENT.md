# FileVault - Production Deployment Guide

## Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- Cloudinary account (https://cloudinary.com)
- Vercel account (https://vercel.com)
- Git installed

## System Overview

**Backend:** Node.js + Express + MongoDB (Vercel Compatible)
**Frontend:** Vanilla HTML/CSS/JavaScript
**Storage:** Cloudinary (500MB files)
**Database:** MongoDB Atlas

## Quick Start - Local Development

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/file-storage
JWT_SECRET=your-super-secret-key
PORT=5000
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start:
```bash
npm run dev
# Backend runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
# Option A: Simple http server
python -m http.server 3000

# Option B: Node http-server
npx http-server -p 3000
```

Visit http://localhost:3000/index.html

## Database Setup - MongoDB Atlas

### Create Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Login
3. Create new project "FileVault"
4. Create M0 free tier cluster
5. Create database user with strong password
6. Whitelist your IP (+ 0.0.0.0/0 for Vercel)
7. Copy connection string

### Connection String Format

```
mongodb+srv://username:password@cluster.mongodb.net/file-storage?retryWrites=true&w=majority
```

## Cloud Storage - Cloudinary

### Setup Account

1. Go to https://cloudinary.com
2. Sign up (free tier: 25GB/month)
3. Dashboard → Copy credentials:
   - Cloud Name
   - API Key
   - API Secret

### Configure

Add to `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Production Deployment - Vercel

### Deploy Backend

```bash
cd backend
npm install -g vercel
vercel login
vercel
```

### Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
MONGO_URI = mongodb+srv://...
JWT_SECRET = (generate strong 32+ char random string)
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
FRONTEND_URL = https://your-frontend-domain.com
```

### Redeploy

```bash
vercel --prod
```

Get backend URL: `https://your-project.vercel.app`

### Deploy Frontend

Update `frontend/script.js`:

```javascript
const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:5000/api"
  : "https://your-backend-vercel-url.vercel.app/api"
```

#### Option A: Vercel

```bash
cd frontend
vercel
```

#### Option B: GitHub + Vercel

1. Push `frontend` to GitHub
2. Vercel Dashboard → New Project
3. Select GitHub repo
4. Deploy

#### Option C: Netlify

1. Push to GitHub
2. Go to netlify.com
3. New site from Git
4. Deploy

## Testing Deployment

### 1. Test Registration

```
1. Visit https://your-frontend-domain.com
2. Register new account
3. First account becomes admin
4. Check email confirmation (optional)
```

### 2. Test User Features

```
- Upload file (test with image, PDF, video)
- Download file
- Delete file
- Preview file
- Search files
- Sort files
- Update profile
```

### 3. Test Admin Features

```
1. Create second user account
2. Login as first user (admin)
3. Navigate to admin dashboard
4. View all users
5. Search users
6. Manage user roles
7. Disable/enable users
8. Delete users
9. Delete any file
10. View activity logs
11. Check storage stats
```

## Production Checklist

### Security

- [ ] Change `JWT_SECRET` to 32+ character random string
- [ ] MongoDB: Whitelist only necessary IPs
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set CORS to specific frontend domain only
- [ ] Rotate API keys quarterly
- [ ] Enable MongoDB backups

### Performance

- [ ] Monitor Vercel deployment analytics
- [ ] Check MongoDB query performance
- [ ] Monitor Cloudinary storage usage
- [ ] Set up error tracking (optional: Sentry)
- [ ] Test file upload performance

### Monitoring

- [ ] Vercel logs dashboard
- [ ] MongoDB Atlas alerts
- [ ] Cloudinary usage dashboard
- [ ] User activity logs
- [ ] Error tracking

## Troubleshooting

### MongoDB Connection Failed

```
Error: MongoError: connect ECONNREFUSED

Solution:
1. Verify connection string in .env
2. Whitelist your IP in MongoDB Atlas
3. Check username/password are correct
4. On Vercel: whitelist 0.0.0.0/0
```

### Cloudinary Upload Fails

```
Error: Unauthorized / Invalid credentials

Solution:
1. Verify CLOUDINARY_CLOUD_NAME is correct
2. Check CLOUDINARY_API_KEY
3. Check CLOUDINARY_API_SECRET
4. Ensure environment variables are deployed
```

### CORS Errors

```
Error: Access to XMLHttpRequest blocked by CORS

Solution:
1. Update FRONTEND_URL to your domain
2. Redeploy backend
3. Check browser console for full error
4. Verify frontend URL exactly matches
```

### Files Not Uploading

```
Error: Upload fails silently

Solution:
1. Check file size (max 500MB)
2. Check Cloudinary account isn't full
3. Verify API credentials
4. Check browser console for errors
5. Test with small image file
```

## API Reference

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files` - List user files
- `GET /api/files/:fileId` - File details
- `DELETE /api/files/:fileId` - Delete file

### Admin (role: "admin" required)
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId` - User details
- `PATCH /api/admin/users/:userId/role` - Change role
- `PATCH /api/admin/users/:userId/disable` - Disable user
- `PATCH /api/admin/users/:userId/enable` - Enable user
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/files` - List all files
- `DELETE /api/admin/files/:fileId` - Delete file
- `GET /api/admin/stats` - Dashboard stats

## Database Schema

### Users Collection

```javascript
{
  email: String (required, unique),
  phone: String (optional, unique),
  password: String (hashed),
  fullName: String,
  role: String ("admin" or "user"),
  status: String ("active" or "disabled"),
  totalStorageUsed: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Files Collection

```javascript
{
  userId: ObjectId (ref: User),
  fileName: String,
  originalName: String,
  fileSize: Number,
  fileType: String,
  mimeType: String,
  storageUrl: String (Cloudinary URL),
  uploadDate: Date,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Activity Logs Collection

```javascript
{
  userId: ObjectId (ref: User),
  action: String,
  fileId: ObjectId (optional),
  metadata: Object,
  timestamp: Date
}
```

## Vercel Configuration Details

The backend includes `vercel.json` for Vercel deployment:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    }
  ]
}
```

Access backend routes via: `https://your-project.vercel.app/api/auth/login`

## Support & Resources

- **MongoDB:** https://docs.mongodb.com
- **Cloudinary:** https://cloudinary.com/documentation
- **Vercel:** https://vercel.com/docs
- **Express:** https://expressjs.com
