#!/bin/bash

# Comprehensive process and port cleanup script
# This script handles all scenarios where ports don't get released

echo "🔍 Checking for running processes on ports 3000 and 3001..."

# Function to kill processes by port
kill_by_port() {
    local port=$1
    echo "🔫 Killing processes on port $port..."
    
    # Find processes using the port
    local pids=$(lsof -ti :$port)
    
    if [ -n "$pids" ]; then
        echo "Found processes on port $port: $pids"
        
        # Try graceful kill first
        echo "Attempting graceful termination..."
        kill -TERM $pids 2>/dev/null
        
        # Wait a moment
        sleep 2
        
        # Check if still running
        local remaining_pids=$(lsof -ti :$port)
        if [ -n "$remaining_pids" ]; then
            echo "Force killing remaining processes..."
            kill -KILL $remaining_pids 2>/dev/null
        fi
        
        # Wait for cleanup
        sleep 1
        
        # Verify port is free
        if lsof -i :$port >/dev/null 2>&1; then
            echo "❌ Port $port still in use"
            return 1
        else
            echo "✅ Port $port is now free"
            return 0
        fi
    else
        echo "✅ Port $port is already free"
        return 0
    fi
}

# Function to kill Node.js processes
kill_node_processes() {
    echo "🔫 Killing all Node.js processes..."
    
    # Kill by process name
    pkill -f "node.*server" 2>/dev/null
    pkill -f "nodemon" 2>/dev/null
    pkill -f "npm.*start" 2>/dev/null
    pkill -f "npm.*run.*server" 2>/dev/null
    pkill -f "npm.*run.*client" 2>/dev/null
    
    # Kill by port
    kill_by_port 3000
    kill_by_port 3001
    
    # Wait for cleanup
    sleep 2
}

# Function to kill processes by pattern
kill_by_pattern() {
    local pattern=$1
    echo "🔫 Killing processes matching pattern: $pattern"
    
    local pids=$(pgrep -f "$pattern")
    if [ -n "$pids" ]; then
        echo "Found processes: $pids"
        kill -TERM $pids 2>/dev/null
        sleep 2
        
        # Force kill if still running
        local remaining=$(pgrep -f "$pattern")
        if [ -n "$remaining" ]; then
            echo "Force killing remaining processes..."
            kill -KILL $remaining 2>/dev/null
        fi
    fi
}

# Function to clean up zombie processes
cleanup_zombies() {
    echo "🧹 Cleaning up zombie processes..."
    
    # Find zombie processes
    local zombies=$(ps aux | awk '$8 ~ /^Z/ { print $2 }')
    if [ -n "$zombies" ]; then
        echo "Found zombie processes: $zombies"
        # Zombies can't be killed, but we can try to clean up their parents
        for zombie in $zombies; do
            local parent=$(ps -o ppid= -p $zombie 2>/dev/null)
            if [ -n "$parent" ] && [ "$parent" != "1" ]; then
                echo "Attempting to clean up parent process $parent of zombie $zombie"
                kill -TERM $parent 2>/dev/null
            fi
        done
    else
        echo "No zombie processes found"
    fi
}

# Function to reset network connections
reset_network() {
    echo "🌐 Resetting network connections..."
    
    # On macOS, we can't easily reset network stack
    # But we can check for lingering connections
    netstat -an | grep -E ":(3000|3001)" | grep -E "(TIME_WAIT|CLOSE_WAIT)"
    
    echo "Network connections checked"
}

# Function to verify ports are free
verify_ports() {
    echo "✅ Verifying ports are free..."
    
    local port3000=$(lsof -i :3000 2>/dev/null)
    local port3001=$(lsof -i :3001 2>/dev/null)
    
    if [ -n "$port3000" ]; then
        echo "❌ Port 3000 still in use:"
        echo "$port3000"
        return 1
    fi
    
    if [ -n "$port3001" ]; then
        echo "❌ Port 3001 still in use:"
        echo "$port3001"
        return 1
    fi
    
    echo "✅ All ports are free!"
    return 0
}

# Main execution
echo "🚀 Starting comprehensive process cleanup..."
echo "========================================"

# Step 1: Kill Node.js processes
kill_node_processes

# Step 2: Kill by specific patterns
kill_by_pattern "tutoring-center-scheduler"
kill_by_pattern "server.js"
kill_by_pattern "client.*start"

# Step 3: Clean up zombies
cleanup_zombies

# Step 4: Reset network
reset_network

# Step 5: Verify
verify_ports

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS: All processes killed and ports released!"
    echo "You can now start your server and client."
else
    echo ""
    echo "⚠️  WARNING: Some ports may still be in use."
    echo "Try running this script again or restart your terminal."
fi

echo "========================================"
