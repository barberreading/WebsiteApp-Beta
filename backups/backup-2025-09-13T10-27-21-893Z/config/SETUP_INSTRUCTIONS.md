# Environment Setup Instructions

## Backend Environment
1. Copy backend/.env.example to backend/.env
2. Update the following variables:
   - MONGO_URI
   - JWT_SECRET
   - ADMIN_EMAIL
   - ADMIN_PASSWORD

## Frontend Environment
1. Copy frontend/.env.example to frontend/.env (if exists)
2. Update API endpoints if needed

## Database Setup
1. Ensure MongoDB is running
2. Restore database from backup if available
3. Run: npm run create-superuser (in backend directory)
