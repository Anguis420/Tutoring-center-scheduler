# 🎓 Tutoring Center Scheduling System

A comprehensive web-based scheduling platform for tutoring centers, built with Node.js, Express, MongoDB, and React.

## ✨ Features

### 🔐 User Management
- **Role-based Access Control**: Admin, Teacher, and Parent roles
- **Secure Authentication**: JWT-based authentication with password hashing
- **User Profiles**: Manage personal information and preferences

### 📅 Scheduling Engine
- **Smart Scheduling**: Match student availability with teacher schedules
- **Conflict Prevention**: Automatic double-booking detection
- **Flexible Time Slots**: Support for multiple subjects and time preferences

### 🔄 Rescheduling System
- **Parent-initiated Requests**: Easy rescheduling with availability checking
- **Real-time Updates**: Instant schedule modifications
- **Status Tracking**: Monitor appointment states (scheduled, completed, cancelled, rescheduled)

### 📱 Modern Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Intuitive UI**: Clean, user-friendly interface built with Tailwind CSS
- **Real-time Notifications**: Toast notifications for user feedback

## 🚀 Tech Stack

### Backend
- **Node.js** with **Express.js** framework
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests

### Frontend
- **React.js** with **React Router DOM**
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Lucide React** for icons

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd tutoring-center-scheduler
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

**Note**: The `dotenv` package is already included as a dependency and is required for loading environment variables from the `.env` file.

### 3. Environment Setup
```bash
# Copy environment variables template
cp env.example .env

# Edit .env file with your configuration
# IMPORTANT: Never commit .env files to version control
# MONGODB_URI=mongodb://localhost:27017/tutoring-center-scheduler
# For MongoDB Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
# JWT_SECRET=your-secret-key
# PORT=5000
```

**⚠️ Security Note**: The `.env` file contains sensitive information and should never be committed to version control. Make sure `.env` is in your `.gitignore` file.

### 4. Database Setup
```bash
# Start MongoDB (if using local installation)
# On Windows: Start MongoDB service
# On macOS/Linux: mongod

# Seed demo data (requires .env file with MONGODB_URI)
npm run seed

# Or seed directly with Atlas connection
node seed-atlas.js
```

**Important**: The seeding scripts (`seed-atlas.js` and `scripts/seed-demo-data.js`) require a `.env` file with the `MONGODB_URI` variable. Make sure to create the `.env` file from `env.example` before running the seeding commands.

## 🚀 Running the Application

### Development Mode
```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start frontend development server
cd client
npm start
```

### Production Mode
```bash
# Build frontend
cd client
npm run build
cd ..

# Start production server
npm start
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔑 Demo Accounts

After seeding the database, you can use these demo accounts:

### Admin User
- **Email**: admin@tutoring.com
- **Password**: admin123
- **Access**: Full system control, user management

### Teacher User
- **Email**: teacher@tutoring.com
- **Password**: teacher123
- **Access**: Schedule management, student information

### Parent User
- **Email**: parent@tutoring.com
- **Password**: parent123
- **Access**: Child scheduling, appointment management

## 📁 Project Structure

```
tutoring-center-scheduler/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main app component
│   └── package.json
├── middleware/             # Express middleware
├── models/                 # Mongoose models
├── routes/                 # API routes
├── scripts/                # Database scripts
├── server.js               # Express server
└── package.json
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Schedules
- `GET /api/schedules` - Get schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule

## 🚀 Deployment

### Environment Variables
```bash
NODE_ENV=production
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=your-secure-jwt-secret
PORT=5000
```

### Build Commands
```bash
# Build frontend
cd client
npm run build

# Start production server
npm start
```

### Deployment Platforms
- **Heroku**: Easy deployment with Git integration
- **AWS**: EC2, Elastic Beanstalk, or Lambda
- **DigitalOcean**: App Platform or Droplets
- **Netlify**: Frontend deployment (recommended)

### Netlify Deployment
```bash
# 1. Build the application (from project root)
npm --prefix client run build

# 2. Deploy to Netlify
# - Connect your GitHub repository to Netlify
# - Set Base directory: client
# - Build command: npm run build
# - Publish directory: build
# - Set environment variables in Netlify dashboard (CLIENT-SAFE ONLY)
```

**Important Netlify Configuration:**
- **Base directory**: `client`
- **Build command**: `npm run build`
- **Publish directory**: `build`

**Environment Variables (CLIENT-SAFE ONLY):**
⚠️ **WARNING**: Only set client-safe environment variables in Netlify:
- `REACT_APP_*` variables (e.g., `REACT_APP_API_URL`)
- `VITE_*` variables (if using Vite)

❌ **NEVER set server secrets in Netlify:**
- `JWT_SECRET`
- `MONGODB_URI`
- `NODE_ENV`
- Any other server-side environment variables

**SPA Redirects Setup:**
Create `client/public/_redirects` with the following content:
```
/* /index.html 200
```
This ensures React Router deep links work properly in production.

### Backend Deployment
Deploy your backend separately to:
- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Simple deployment with built-in database
- **Render**: Free tier available
- **DigitalOcean**: More control, requires setup

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based sessions
- **Input Validation**: Express validator for all inputs
- **Security Headers**: Helmet.js for protection
- **Rate Limiting**: Prevent abuse
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: Sensitive data stored in environment variables
- **No Hardcoded Secrets**: All database credentials and API keys use environment variables

### 🚨 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Rotate credentials regularly** for production environments
3. **Use strong, unique passwords** for database users
4. **Restrict database access** to specific IP addresses when possible
5. **Monitor access logs** for suspicious activity
6. **Keep dependencies updated** to patch security vulnerabilities

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

