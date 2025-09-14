# Security Guidelines

## 🚨 URGENT: Credential Rotation Required

The following MongoDB Atlas credentials were exposed in previous commits and must be rotated immediately:
- Username: `barberreading`
- Password: `CP41wgaa3ADAw3oV`
- Cluster: `eca0.jvyy1in.mongodb.net`

### Immediate Actions Required:

#### Step 1: Access MongoDB Atlas
1. Go to https://cloud.mongodb.com/
2. Log in with your MongoDB Atlas account
3. Select your project containing the `eca0` cluster

#### Step 2: Rotate Database User Credentials
1. Navigate to **Database Access** in the left sidebar
2. Find the user `barberreading`
3. Click **Edit** next to the user
4. Click **Edit Password**
5. Generate a new strong password (recommended: 20+ characters)
6. Save the new password securely
7. Click **Update User**

#### Step 3: Update Environment Variables
1. Update your production `.env` file with the new connection string:
   ```
   MONGO_URI=mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net/[DATABASE]?retryWrites=true&w=majority&appName=[APP_NAME]
   ```
2. Restart your application to use the new credentials
3. Test the connection to ensure it works

#### Step 4: Verify and Clean Up
1. Confirm your application connects successfully
2. Monitor MongoDB Atlas logs for any connection issues
3. The old password is now invalid and cannot be used

#### Alternative: Create New User (Recommended)
1. In **Database Access**, click **Add New Database User**
2. Choose **Password** authentication
3. Create username: `webapp_prod_user`
4. Generate a strong password
5. Set **Database User Privileges** to appropriate level
6. Add user to your IP Access List if needed
7. Update your `.env` with the new user credentials
8. Test the connection
9. **Delete the old `barberreading` user** once confirmed working

## Environment Variable Management

### Production Deployment
Never commit production credentials to version control. Use these methods:

#### Option 1: Server Environment Variables
```bash
export MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/database"
export JWT_SECRET="your-super-secure-jwt-secret"
```

#### Option 2: Docker Secrets
```yaml
version: '3.8'
services:
  app:
    image: your-app
    environment:
      - MONGO_URI_FILE=/run/secrets/mongo_uri
    secrets:
      - mongo_uri
secrets:
  mongo_uri:
    external: true
```

#### Option 3: Cloud Provider Secrets
- **AWS**: Use AWS Secrets Manager or Parameter Store
- **Azure**: Use Azure Key Vault
- **Google Cloud**: Use Secret Manager
- **Heroku**: Use Config Vars

### Local Development
1. Copy `.env.example` to `.env`
2. Fill in your development credentials
3. Never commit `.env` files

## File Security Checklist

### ✅ Secured Files
- All script files now use `process.env.MONGO_URI`
- `.env.production` added to `.gitignore`
- Hardcoded credentials removed from:
  - `backend/create_sample_bookings.js`
  - `backend/scripts/search_data.js`
  - `backend/scripts/clear_all_bookings.js`
  - `backend/get_users.js`
  - `backend/get_bookings.js`
  - `backend/scripts/create_test_admin.js`
  - `backend/reset_password.js`
  - `backend/scripts/clear_leave_requests_and_alerts.js`

### 🔍 Regular Security Audits
Run these commands regularly to check for exposed secrets:
```bash
# Check for potential secrets in code
grep -r "mongodb+srv://" . --exclude-dir=node_modules
grep -r "password" . --exclude-dir=node_modules --include="*.js"

# Use tools like git-secrets or truffleHog
npm install -g git-secrets
git secrets --scan
```

## Best Practices

1. **Use Strong Passwords**: Minimum 16 characters with mixed case, numbers, and symbols
2. **Rotate Credentials**: Change passwords every 90 days
3. **Principle of Least Privilege**: Give database users only necessary permissions
4. **Monitor Access**: Enable MongoDB Atlas monitoring and alerts
5. **Use Connection Limits**: Set maximum connection limits in MongoDB Atlas
6. **Enable IP Whitelisting**: Restrict database access to known IP addresses

## Emergency Response

If credentials are exposed:
1. **Immediately rotate** all exposed credentials
2. **Check access logs** for unauthorized usage
3. **Update all applications** with new credentials
4. **Monitor for suspicious activity**
5. **Document the incident** for future prevention

## Contact

For security concerns, contact the development team immediately.

---
**Last Updated**: January 2025
**Next Review**: April 2025