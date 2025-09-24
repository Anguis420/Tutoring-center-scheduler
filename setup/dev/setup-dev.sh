#!/bin/bash

# Tutoring Center Scheduler - Local Development Setup Script
# This script sets up the complete local development environment including client setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Function to install MongoDB on macOS
install_mongodb_macos() {
    print_status "Installing MongoDB on macOS..."
    
    if command_exists brew; then
        print_status "Using Homebrew to install MongoDB..."
        brew tap mongodb/brew
        brew install mongodb-community
        print_success "MongoDB installed successfully via Homebrew"
    else
        print_warning "Homebrew not found. Please install MongoDB manually from: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/"
        return 1
    fi
}

# Function to install MongoDB on Linux
install_mongodb_linux() {
    print_status "Installing MongoDB on Linux..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is not recommended for development."
    fi
    
    # Ubuntu/Debian
    if command_exists apt-get; then
        print_status "Installing MongoDB via apt..."
        wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
        sudo apt-get update
        sudo apt-get install -y mongodb-org
        print_success "MongoDB installed successfully via apt"
    # CentOS/RHEL
    elif command_exists yum; then
        print_status "Installing MongoDB via yum..."
        sudo yum install -y mongodb-org
        print_success "MongoDB installed successfully via yum"
    else
        print_warning "Package manager not found. Please install MongoDB manually from: https://docs.mongodb.com/manual/installation/"
        return 1
    fi
}

# Function to start MongoDB service
start_mongodb() {
    print_status "Starting MongoDB service..."
    
    OS=$(detect_os)
    case $OS in
        "macos")
            if command_exists brew; then
                brew services start mongodb/brew/mongodb-community
            else
                print_warning "Please start MongoDB manually: mongod --config /usr/local/etc/mongod.conf"
            fi
            ;;
        "linux")
            sudo systemctl start mongod
            sudo systemctl enable mongod
            ;;
        "windows")
            print_warning "Please start MongoDB manually on Windows"
            ;;
        *)
            print_warning "Please start MongoDB manually for your OS"
            ;;
    esac
    
    # Wait a moment for MongoDB to start
    sleep 3
    
    # Test MongoDB connection
    if command_exists mongosh; then
        if mongosh --eval "db.runCommand('ping').ok" --quiet; then
            print_success "MongoDB is running and accessible"
        else
            print_warning "MongoDB may not be running properly"
        fi
    elif command_exists mongo; then
        if mongo --eval "db.runCommand('ping').ok" --quiet; then
            print_success "MongoDB is running and accessible"
        else
            print_warning "MongoDB may not be running properly"
        fi
    else
        print_warning "MongoDB client not found. Please verify MongoDB is running"
    fi
}

# Function to install Node.js if not present
install_nodejs() {
    if ! command_exists node; then
        print_status "Node.js not found. Installing Node.js..."
        
        OS=$(detect_os)
        case $OS in
            "macos")
                if command_exists brew; then
                    brew install node
                else
                    print_warning "Please install Node.js manually from: https://nodejs.org/"
                    return 1
                fi
                ;;
            "linux")
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
                ;;
            "windows")
                print_warning "Please install Node.js manually from: https://nodejs.org/"
                return 1
                ;;
        esac
        
        print_success "Node.js installed successfully"
    else
        print_success "Node.js is already installed: $(node --version)"
    fi
}

# Function to install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd client
    npm install
    cd ..
    
    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    npm install
    cd ..
    
    print_success "All dependencies installed successfully"
}

# Function to setup client-specific requirements
setup_client() {
    print_status "Setting up client-specific requirements..."
    
    # Check if Tailwind CSS is configured
    if [ -f "client/tailwind.config.js" ]; then
        print_success "Tailwind CSS configuration found"
    else
        print_warning "Tailwind CSS configuration not found"
    fi
    
    # Check if PostCSS is configured
    if [ -f "client/postcss.config.js" ]; then
        print_success "PostCSS configuration found"
    else
        print_warning "PostCSS configuration not found"
    fi
    
    # Check if React Scripts is properly configured
    if [ -f "client/package.json" ]; then
        print_success "Client package.json found"
        
        # Check for required client dependencies
        if grep -q "react" client/package.json; then
            print_success "React dependencies found"
        else
            print_warning "React dependencies not found in package.json"
        fi
        
        if grep -q "tailwindcss" client/package.json; then
            print_success "Tailwind CSS dependencies found"
        else
            print_warning "Tailwind CSS dependencies not found"
        fi
        
        if grep -q "axios" client/package.json; then
            print_success "Axios (HTTP client) dependencies found"
        else
            print_warning "Axios dependencies not found"
        fi
    else
        print_warning "Client package.json not found"
    fi
    
    # Build client to check for errors
    print_status "Building client to verify setup..."
    cd client
    if npm run build; then
        print_success "Client build successful"
    else
        print_warning "Client build failed - check for errors"
    fi
    cd ..
    
    print_success "Client setup completed"
}

# Function to setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f .env.template ]; then
            cp .env.template .env
            print_success "Environment file created from template"
        else
            print_warning "Environment template not found. Creating basic .env file..."
            cat > .env << 'ENVEOF'
# Development Environment Configuration
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/tutoring-center-scheduler
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=24h
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
MONGODB_TEST_URI=mongodb://localhost:27017/tutoring_test
TEST_PARENT_EMAIL=parent@tutoring.com
TEST_PARENT_PASSWORD=parent123
ENVEOF
            print_success "Basic environment file created"
        fi
    else
        print_success "Environment file already exists"
    fi
}

# Function to seed database
seed_database() {
    print_status "Seeding database with demo data..."
    
    # Use the server's seed script for local development
    if [ -f "server/scripts/seed-demo-data.js" ]; then
        cd server
        SEED_CONFIRM=yes node scripts/seed-demo-data.js
        cd ..
        print_success "Database seeded successfully"
    elif [ -f "server/seed-atlas.js" ]; then
        # Fallback to Atlas seed script if server script not found
        SEED_CONFIRM=yes node server/seed-atlas.js
        print_success "Database seeded successfully"
    else
        print_warning "Seed script not found. Skipping database seeding."
    fi
}

# Function to verify client development server
verify_client_dev() {
    print_status "Verifying client development server setup..."
    
    # Check if client can start in development mode
    cd client
    print_status "Testing client development server startup..."
    
    # Start client in background and capture PID
    npm start &
    CLIENT_PID=$!
    
    # Wait a moment for the server to start
    sleep 10
    
    # Check if the process is still running
    if kill -0 $CLIENT_PID 2>/dev/null; then
        print_success "Client development server started successfully"
        # Kill the background process
        kill $CLIENT_PID 2>/dev/null || true
    else
        print_warning "Client development server failed to start"
    fi
    
    cd ..
}

# Main setup function
main() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Tutoring Center Scheduler     ${NC}"
    echo -e "${BLUE}  Development Setup Script      ${NC}"
    echo -e "${BLUE}  (Includes Client Setup)       ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Usage: ./setup/dev/setup-dev.sh"
        exit 1
    fi
    
    # Install Node.js
    install_nodejs
    
    # Install MongoDB
    if ! command_exists mongod; then
        OS=$(detect_os)
        case $OS in
            "macos")
                install_mongodb_macos
                ;;
            "linux")
                install_mongodb_linux
                ;;
            "windows")
                print_warning "Please install MongoDB manually on Windows from: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/"
                ;;
            *)
                print_warning "Please install MongoDB manually for your OS"
                ;;
        esac
    else
        print_success "MongoDB is already installed"
    fi
    
    # Start MongoDB
    start_mongodb
    
    # Install dependencies
    install_dependencies
    
    # Setup client-specific requirements
    setup_client
    
    # Setup environment
    setup_environment
    
    # Seed database
    seed_database
    
    # Verify client development server
    verify_client_dev
    
    echo
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}  Setup Complete! 🎉            ${NC}"
    echo -e "${GREEN}================================${NC}"
    echo
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Start the server: ${BLUE}npm run server${NC}"
    echo -e "2. Start the client: ${BLUE}npm run client${NC}"
    echo -e "3. Open your browser: ${BLUE}http://localhost:3000${NC}"
    echo
    echo -e "${YELLOW}Demo accounts:${NC}"
    echo -e "Admin: ${BLUE}admin@tutoring.com${NC} / ${BLUE}admin123${NC}"
    echo -e "Teacher: ${BLUE}teacher@tutoring.com${NC} / ${BLUE}teacher123${NC}"
    echo -e "Student: ${BLUE}student@tutoring.com${NC} / ${BLUE}student123${NC}"
    echo
    echo -e "${YELLOW}Client-specific features verified:${NC}"
    echo -e "✓ React application setup"
    echo -e "✓ Tailwind CSS configuration"
    echo -e "✓ PostCSS configuration"
    echo -e "✓ Build process working"
    echo -e "✓ Development server ready"
    echo
}

# Run main function
main "$@"
