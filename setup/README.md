# Environment Setup

This folder contains environment-specific configuration templates for the Tutoring Center Scheduler application.

## Folder Structure

- `dev/` - Development environment configuration
- `prod/` - Production environment configuration

## Usage

### Development Setup
```bash
# Copy the development template to root directory
cp setup/dev/.env.template .env

# Edit the .env file with your local configuration
# Make sure to update MONGODB_URI, JWT_SECRET, etc.
```

### Production Setup
```bash
# Copy the production template to root directory
cp setup/prod/.env.template .env

# Edit the .env file with your production configuration
# IMPORTANT: Change all default values for security!
```

## Important Notes

1. **Never commit `.env` files** to version control
2. **Change default values** in production (especially JWT_SECRET)
3. **Use strong passwords** and secure connection strings
4. **Update ALLOWED_ORIGINS** with your actual domains
5. **Test your configuration** before deploying

## Environment Variables Explained

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - Token expiration time
- `BCRYPT_ROUNDS` - Password hashing rounds
- `RATE_LIMIT_*` - API rate limiting settings
- `ALLOWED_ORIGINS` - CORS allowed origins
- `SMTP_*` - Email service configuration
- `MAX_FILE_SIZE` - Maximum file upload size
- `UPLOAD_PATH` - File upload directory
