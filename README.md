# FileVault - Secure Cloud Storage SaaS

Production-ready file storage application with role-based admin control, secure authentication, and cloud storage integration.

## Features

### User Features
- **Authentication:** Email/phone registration and login
- **File Management:** Upload, download, delete, preview
- **File Operations:** Search, sort, view details
- **Account Settings:** Profile management, storage tracking
- **Security:** JWT tokens, password hashing

### Admin Features
- **User Management:** View, search, manage all users
- **Role Control:** Assign admin/user roles dynamically
- **Account Control:** Enable/disable user accounts
- **File Management:** Delete any file across users
- **Activity Tracking:** View all system activities
- **Statistics:** Dashboard with usage analytics

## Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (no framework)
- Responsive design, smooth animations
- Zero external dependencies

**Backend:**
- Node.js 16+
- Express.js API server
- MongoDB database
- Cloudinary file storage
- JWT authentication
- Bcrypt password hashing

**Deployment:**
- Vercel (backend & frontend)
- MongoDB Atlas
- Cloudinary

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB account (MongoDB Atlas)
- Cloudinary account

### Local Development

1. **Clone & Setup Backend**
```bash
cd backend
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/file-storage
JWT_SECRET=your-secret-key-here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
FRONTEND_URL=http://localhost:3000
```

3. **Start Backend**
```bash
npm run dev
```

4. **Start Frontend**
```bash
cd frontend
python -m http.server 3000
# or: npx http-server -p 3000
```

5. **Visit Application**
```
http://localhost:3000/index.html
```

## First Time Setup

1. **Register:** First account automatically becomes admin
2. **Login:** Use email/phone and password
3. **Admin Dashboard:** Admin users see admin panel
4. **User Dashboard:** Regular users see file management

## Project Structure

```
.
├── backend/
│   ├── server.js           # Main Express app
│   ├── vercel.json         # Vercel configuration
│   ├── package.json        # Dependencies
│   ├── .env.example        # Environment template
│   ├── models/
│   │   ├── User.js         # User schema
│   │   ├── File.js         # File schema
│   │   └── ActivityLog.js  # Activity log schema
│   ├── routes/
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── admin.js        # Admin endpoints
│   │   └── files.js        # File endpoints
│   ├── middleware/
│   │   └── auth.js         # Auth & admin middleware
│   └── utils/
│       └── cloudStorage.js # Cloudinary integration
│
└── frontend/
    ├── index.html          # Main application
    ├── script.js           # Application logic
    ├── style.css           # Styles & animations
    └── .env.example        # Environment template
```

## API Endpoints

### Authentication
```
POST   /api/auth/register         # Create account
POST   /api/auth/login            # Login
GET    /api/auth/me               # Get current user
```

### Files (User)
```
POST   /api/files/upload          # Upload file
GET    /api/files                 # List user files
GET    /api/files/:fileId         # Get file details
DELETE /api/files/:fileId         # Delete own file
```

### Admin
```
GET    /api/admin/users           # List all users
GET    /api/admin/users/:userId   # User details
PATCH  /api/admin/users/:userId/role        # Change role
PATCH  /api/admin/users/:userId/disable     # Disable user
PATCH  /api/admin/users/:userId/enable      # Enable user
DELETE /api/admin/users/:userId   # Delete user
GET    /api/admin/files           # List all files
DELETE /api/admin/files/:fileId   # Delete any file
GET    /api/admin/stats           # Dashboard stats
```

## Security Features

- **Password Security:** Bcrypt hashing (10 salt rounds)
- **Authentication:** JWT tokens with 7-day expiration
- **Authorization:** Role-based access control
- **Validation:** Email format & password strength validation
- **Account Status:** Active/disabled user management
- **Activity Logging:** All actions tracked with metadata
- **Token Verification:** Protected middleware on all routes

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step deployment guide.

### Quick Deploy to Vercel

**Backend:**
```bash
cd backend
vercel --prod
```

**Frontend:**
```bash
cd frontend
vercel --prod
```

## Configuration

### Environment Variables

**Backend (.env):**
```
MONGO_URI              # MongoDB connection string
JWT_SECRET             # JWT signing secret (32+ chars)
PORT                   # Server port (default: 5000)
FRONTEND_URL           # Frontend domain for CORS
CLOUDINARY_CLOUD_NAME  # Cloudinary cloud name
CLOUDINARY_API_KEY     # Cloudinary API key
CLOUDINARY_API_SECRET  # Cloudinary API secret
```

**Frontend (script.js):**
```
API_BASE_URL           # Backend API endpoint
```

## Database

### Collections
- **users:** User accounts and profiles
- **files:** File metadata and references
- **activitylogs:** User action history

### Indexes
- users: email (unique), phone (unique)
- files: userId, uploadDate
- activitylogs: userId, timestamp

## Performance

- File upload: Multipart form data with progress tracking
- Search: Case-insensitive MongoDB regex queries
- Pagination: Configurable limit & skip
- Caching: Activity logs limited to last 20 entries
- Storage: 500MB file limit per upload

## Error Handling

- Validation errors: 400 Bad Request
- Authentication errors: 401 Unauthorized
- Authorization errors: 403 Forbidden
- Not found errors: 404 Not Found
- Server errors: 500 Internal Server Error
- User-friendly error messages in frontend

## Development

### Available Scripts

**Backend:**
```bash
npm run dev    # Start with nodemon
npm start      # Production start
```

**Frontend:**
No build process required. Open `index.html` in browser or use HTTP server.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Limitations

- File size limit: 500MB per file
- Storage per user: Determined by Cloudinary plan
- Concurrent uploads: Limited by browser
- Database: MongoDB Atlas limitations
- API rate limiting: Not implemented (add as needed)

## Future Enhancements

- Email verification
- Password reset flow
- Two-factor authentication
- OAuth integrations
- File sharing & collaboration
- Folder organization
- Advanced analytics
- Export data as ZIP
- Audit log exports

## License

MIT License - Free to use and modify

## Support

For issues or questions:
1. Check browser console for errors
2. Review backend logs in Vercel
3. Verify all environment variables are set
4. Check MongoDB & Cloudinary connections
5. Create issue in repository

## Security Disclosure

Found a security issue? Please email security@example.com instead of using issue tracker.
