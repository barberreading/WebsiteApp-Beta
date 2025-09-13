# Production Deployment Guide

## Prerequisites

- Node.js 16+ installed
- MongoDB instance (local or cloud)
- PM2 for process management (recommended)
- Nginx for reverse proxy (recommended)
- SSL certificate for HTTPS

## Environment Setup

### Backend Configuration

1. Copy the production environment template:
   ```bash
   cp backend/.env.production backend/.env
   ```

2. Update the `.env` file with your production values:
   - Set a strong `JWT_SECRET`
   - Configure your MongoDB connection string
   - Set admin credentials for superuser creation
   - Configure CORS with your frontend domain

### Frontend Configuration

1. Copy the production environment template:
   ```bash
   cp frontend/.env.production frontend/.env.production.local
   ```

2. Update the production environment file:
   - Set `REACT_APP_API_URL` to your backend API URL
   - Configure other application-specific settings

## Build Process

### Backend

```bash
cd backend
npm install --production
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

## Database Setup

1. Ensure MongoDB is running
2. Create the superuser account:
   ```bash
   cd backend
   npm run create-superuser
   ```

## Process Management with PM2

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Create PM2 ecosystem file (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [{
       name: 'staff-management-backend',
       script: './backend/server.js',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       },
       instances: 'max',
       exec_mode: 'cluster',
       watch: false,
       max_memory_restart: '1G'
     }]
   };
   ```

3. Start the application:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Nginx Configuration

Create an Nginx configuration file (`/etc/nginx/sites-available/staff-management`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend (React build)
    location / {
        root /path/to/WebsiteApp/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads {
        alias /path/to/WebsiteApp/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Security Checklist

- [ ] Strong JWT secret configured
- [ ] Admin credentials set via environment variables
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall configured to allow only necessary ports
- [ ] MongoDB secured with authentication
- [ ] Regular security updates scheduled
- [ ] Backup strategy implemented
- [ ] Monitoring and logging configured

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
pm2 status
```

### Application Health
The application provides a health check endpoint at `/api/health`

## Backup Strategy

Use the built-in backup system:
```bash
node backup-restore.js create
```

Schedule regular backups using cron:
```bash
# Add to crontab (crontab -e)
0 2 * * * cd /path/to/WebsiteApp && node backup-restore.js create
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Check if another process is using port 5000
2. **MongoDB connection failed**: Verify MongoDB is running and connection string is correct
3. **Frontend not loading**: Check if build files exist in `frontend/build`
4. **API requests failing**: Verify CORS configuration and API URL

### Logs

- PM2 logs: `pm2 logs`
- Application logs: Check `backend/logs/` directory
- Nginx logs: `/var/log/nginx/`

## Performance Optimization

1. Enable gzip compression in Nginx
2. Configure proper caching headers
3. Use CDN for static assets
4. Monitor database performance
5. Implement rate limiting
6. Use connection pooling for database

## Updates and Maintenance

1. Create backup before updates
2. Test updates in staging environment
3. Use blue-green deployment for zero downtime
4. Monitor application after updates
5. Keep dependencies updated for security