# 🎓 Tutoring Center Scheduling System

A comprehensive web-based scheduling platform designed for tutoring centers to manage appointments, schedules, and student-teacher interactions efficiently.

---

## 🚀 Quick Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

### Automated Setup (Recommended)

The easiest way to get started is using our automated setup script that handles everything for you:

```bash
# Clone the repository
git clone <repository-url>
cd tutoring-center-scheduler

# Run the automated setup script
# on Mac or linux
./setup/dev/setup-dev.sh

# Or on Windows:
# setup\dev\setup-dev.bat
```

**What the setup script does:**
- ✅ Installs MongoDB (if not present)
- ✅ Installs Node.js (if not present)
- ✅ Installs all project dependencies
- ✅ Verifies client setup (React, Tailwind CSS, PostCSS)
- ✅ Tests client build process
- ✅ Sets up environment configuration
- ✅ Seeds database with demo data
- ✅ Verifies development server can start

---

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
- **Unit Tests** - Individual component testing
- **Integration Tests** - API endpoint testing
- **End-to-End Tests** - Complete user flow testing

---


## 🏃‍♂️ Running Locally

### Development Mode

After running the setup script, start the application:

```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend development server
npm run client
```

### Production Mode

```bash
# Build frontend
npm run build

# Start production server
npm start
```

---

## 🌐 Access Points

### Application URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### Demo Accounts
After running the setup script, you can use these pre-configured accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@tutoring.com | admin123 | Full system control, user management |
| **Teacher** | teacher@tutoring.com | teacher123 | Schedule management, student view |
| **Parent** | parent@tutoring.com | parent123 | Book appointments, view schedules |

### How to Use

#### For Administrators:
1. **Dashboard**: Overview of all appointments and system statistics
2. **User Management**: Create, edit, and manage user accounts
3. **Schedule Management**: View and manage all schedules
4. **Appointment Oversight**: Monitor all appointments and their status

#### For Teachers:
1. **Schedule Creation**: Set available time slots for tutoring
2. **Student Management**: View assigned students and their progress
3. **Appointment View**: See upcoming and past appointments
4. **Profile Management**: Update personal information and preferences

#### For Parents:
1. **Appointment Booking**: Browse available slots and book appointments
2. **Schedule View**: See upcoming appointments and teacher availability
3. **Rescheduling**: Request appointment changes with real-time availability
4. **Student Profile**: Manage student information and preferences

---

---

## 🚀 Deployment

### Supported Platforms
- **Heroku** - Easy deployment with Git integration
- **Netlify** - Frontend deployment (recommended)
- **MongoDB Atlas** - Cloud database hosting
- **Railway** - Simple deployment with built-in database
- **Render** - Free tier available
- **DigitalOcean** - More control, requires setup

### Quick Deployment
```bash
# Use the comprehensive deployment script
./deploy/deploy-all.sh

# Or on Windows:
# deploy\deploy-all.bat
```

For detailed deployment instructions, see the files in the `deploy/` folder.


## 📝 Environment Configuration

### Development Environment
```bash
# Copy development template
cp setup/dev/.env.template .env

# Edit with your configuration
# MONGODB_URI=mongodb://localhost:27017/tutoring-center-scheduler
# JWT_SECRET=your-secret-key
# PORT=5000
```

### Production Environment
```bash
# Copy production template
cp setup/prod/.env.template .env

# Update with production values
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
# JWT_SECRET=secure-production-secret
# NODE_ENV=production
```

**⚠️ Security Note**: Never commit `.env` files to version control. Ensure `.env` is in your `.gitignore` file.

---

## 📁 Project Structure

```
tutoring-center-scheduler/
├── 📁 client/                     # React frontend application
│   ├── 📁 public/                 # Static assets
│   ├── 📁 src/                    # Source code
│   │   ├── 📁 components/         # Reusable React components
│   │   ├── 📁 contexts/           # React context providers
│   │   ├── 📁 pages/              # Page components
│   │   └── 📄 App.js              # Main application component
│   ├── 📄 package.json            # Client dependencies
│   └── 📄 tailwind.config.js      # Tailwind CSS configuration
│
├── 📁 server/                     # Node.js backend application
│   ├── 📁 middleware/             # Express middleware
│   ├── 📁 models/                 # MongoDB models (Mongoose)
│   ├── 📁 routes/                 # API route handlers
│   ├── 📁 scripts/               # Database seeding scripts
│   ├── 📁 tests/                  # Test files
│   ├── 📁 utils/                  # Utility functions
│   ├── 📄 server.js               # Main server file
│   └── 📄 package.json            # Server dependencies
│
├── 📁 deploy/                     # Deployment scripts and configs
│   ├── 📄 deploy-all.sh           # Comprehensive deployment script
│   ├── 📄 deploy-all.bat          # Windows deployment script
│   ├── 📄 netlify.toml            # Netlify configuration
│   └── 📄 Procfile                # Heroku configuration
│
├── 📁 setup/                      # Environment and setup files
│   ├── 📁 dev/                    # Development environment
│   │   ├── 📄 .env.template       # Development environment template
│   │   ├── 📄 setup-dev.sh        # Unix/Linux/macOS setup script
│   │   └── 📄 setup-dev.bat       # Windows setup script
│   └── 📁 prod/                   # Production environment
│       └── 📄 .env.template       # Production environment template
│
├── 📄 package.json                # Root package configuration
├── 📄 README.md                   # This file
├── 📄 seed-atlas.js               # Database seeding script (root level)
└── 📄 .env                        # Environment configuration (gitignored)
```

---

## 📖 Introduction

The Tutoring Center Scheduling System is a full-stack web application that streamlines the scheduling process for tutoring centers. It provides role-based access for administrators, teachers, and parents, enabling seamless appointment management, real-time scheduling updates, and comprehensive user management.

### Key Capabilities:
- **Smart Appointment Scheduling** with conflict prevention
- **Role-based Access Control** (Admin, Teacher, Parent)
- **Real-time Rescheduling** with availability checking
- **Modern Responsive Interface** built with React and Tailwind CSS
- **Secure Authentication** with JWT and password hashing
- **Comprehensive User Management** and profile handling

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based Authentication** with secure token management
- **Password Hashing** using bcryptjs with configurable salt rounds
- **Role-based Access Control** (Admin, Teacher, Parent)
- **Input Validation** with express-validator
- **Security Headers** via Helmet.js
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for controlled cross-origin access

### 📅 Scheduling System
- **Smart Appointment Booking** with conflict detection
- **Flexible Time Slot Management** for multiple subjects
- **Real-time Availability Checking** before booking
- **Automatic Double-booking Prevention**
- **Status Tracking** (scheduled, completed, cancelled, rescheduled)
- **Rescheduling Requests** with parent-initiated changes

### 👥 User Management
- **Comprehensive User Profiles** with role-specific information
- **Student-Teacher Assignment** management
- **User Role Management** with appropriate permissions
- **Profile Picture Support** with file upload handling
- **Contact Information Management**

### 🎨 User Interface
- **Responsive Design** that works on all devices
- **Modern UI Components** built with Tailwind CSS
- **Real-time Notifications** using React Hot Toast
- **Intuitive Navigation** with React Router
- **Form Management** with React Hook Form
- **Icon System** using Lucide React

### 📊 Data Management
- **MongoDB Integration** with Mongoose ODM
- **Database Seeding** with demo data
- **Data Validation** at both client and server levels
- **Error Handling** with comprehensive logging
- **API Documentation** with clear endpoint structure

---

## 🛠️ Tech Stack

### Backend Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing library
- **Express Validator** - Input validation middleware
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling

### Frontend Technologies
- **React.js** - JavaScript library for building user interfaces
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form state management
- **Axios** - HTTP client for API requests
- **React Hot Toast** - Notification system
- **Lucide React** - Icon library
- **Moment.js** - Date manipulation library

### Development Tools
- **Jest** - JavaScript testing framework
- **Supertest** - HTTP assertion library
- **Nodemon** - Development server with auto-restart
- **PostCSS** - CSS post-processor
- **Autoprefixer** - CSS vendor prefixing



## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Review the setup scripts in `setup/dev/`
3. Check the deployment documentation in `deploy/`
4. Create a new issue with detailed information

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for scalability and maintainability
- Follows best practices for security and performance
- Comprehensive documentation and setup automation