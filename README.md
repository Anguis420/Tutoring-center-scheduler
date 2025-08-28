# Tutoring Center Scheduler

A comprehensive web-based scheduling platform for tutoring centers, built with Node.js, Express, MongoDB, and React.

## 🚀 Quick Start

### Prerequisites
- Node.js (>=16.0.0)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tutoring-center-scheduler
   ```

2. **Install all dependencies**
   ```bash
   npm run setup
   ```
   This will install both backend and frontend dependencies and seed the database.

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development environment**
   ```bash
   npm run dev:full
   ```
   This starts both the backend server and React frontend simultaneously.

## 📜 Available Scripts

### Root Directory Scripts

#### Development
- `npm run dev` - Start backend server with nodemon
- `npm run dev:client` - Start React development server
- `npm run dev:server` - Start backend server with nodemon
- `npm run dev:full` - Start both client and server simultaneously

#### Installation
- `npm run install:all` - Install both backend and frontend dependencies
- `npm run install-client` - Install only frontend dependencies

#### Building
- `npm run build` - Build React app for production
- `npm run build:client` - Build React app for production

#### Testing
- `npm run test` - Run React tests
- `npm run test:client` - Run React tests
- `npm run test:server` - Run server tests (placeholder)

#### Database
- `npm run seed` - Seed database with demo data
- `npm run seed:reset` - Reset and reseed database

#### Utilities
- `npm run clean` - Remove all build files and node_modules
- `npm run clean:build` - Remove only build files
- `npm run setup` - Complete setup (install + seed)

### Client Directory Scripts

#### Development
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App

#### Testing
- `npm test` - Run tests in watch mode
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

#### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

#### Build Analysis
- `npm run analyze` - Analyze bundle size
- `npm run preview` - Preview production build locally

#### Maintenance
- `npm run clean` - Remove build and node_modules
- `npm run reinstall` - Clean reinstall of dependencies

## 🏗️ Project Structure

```
tutoring-center-scheduler/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/               # React source code
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── ...
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
├── models/                 # MongoDB models
├── routes/                 # Express API routes
├── middleware/             # Express middleware
├── scripts/                # Database scripts
├── server.js              # Express server
├── package.json           # Backend dependencies
└── .env                   # Environment variables
```

## 🔧 Development Workflow

### 1. Full-Stack Development
```bash
# Start both frontend and backend
npm run dev:full

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### 2. Frontend-Only Development
```bash
# Start only React (assumes backend is running)
npm run dev:client
```

### 3. Backend-Only Development
```bash
# Start only backend
npm run dev:server
```

### 4. Code Quality Workflow
```bash
# Check code quality
npm run lint
npm run format:check

# Fix issues automatically
npm run lint:fix
npm run format
```

### 5. Testing Workflow
```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 Production Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

### 3. Environment Variables for Production
Make sure to set these in your production environment:
- `NODE_ENV=production`
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secure JWT secret
- `PORT` - Server port (defaults to 5000)

## 🧪 Testing

### Frontend Tests
```bash
cd client
npm test                    # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run test:watch         # Run tests in watch mode
```

### Backend Tests
```bash
npm run test:server        # Placeholder for future server tests
```

## 📊 Code Quality

### ESLint Configuration
The project uses ESLint with React-specific rules for:
- React Hooks
- Accessibility (jsx-a11y)
- Prettier integration

### Prettier Configuration
Automatic code formatting with Prettier for consistent code style.

### Linting Commands
```bash
npm run lint               # Check for issues
npm run lint:fix          # Fix issues automatically
npm run format            # Format code
npm run format:check      # Check formatting
```

## 🔍 Build Analysis

### Bundle Analysis
```bash
npm run analyze           # Analyze bundle size and dependencies
```

### Production Preview
```bash
npm run preview          # Build and serve production version locally
```

## 🛠️ Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes using ports 3000 or 5000
npx kill-port 3000 5000
```

#### Dependency Issues
```bash
# Clean reinstall
npm run clean
npm run install:all
```

#### Build Issues
```bash
# Clean build files
npm run clean:build
npm run build
```

#### Database Issues
```bash
# Reset database
npm run seed:reset
```

### Development Tips

1. **Use `npm run dev:full`** for full-stack development
2. **Check console logs** in both terminal and browser
3. **Use React DevTools** for frontend debugging
4. **Monitor MongoDB** for database issues
5. **Check environment variables** are properly set

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

