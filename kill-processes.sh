#!/bin/bash
# Node.js Process Cleanup Script for Unix/Linux/macOS
# This script only kills Node.js related processes safely

echo "🔍 Checking for Node.js processes..."

# Function to kill Node.js processes
kill_node_processes() {
    echo "🔫 Killing Node.js processes..."
    
    # Kill Node.js processes
    if pkill -f "node" 2>/dev/null; then
        echo "✅ Killed node processes"
    else
        echo "ℹ️  No node processes found"
    fi
    
    # Kill Nodemon processes
    if pkill -f "nodemon" 2>/dev/null; then
        echo "✅ Killed nodemon processes"
    else
        echo "ℹ️  No nodemon processes found"
    fi
    
    # Kill npm processes
    if pkill -f "npm" 2>/dev/null; then
        echo "✅ Killed npm processes"
    else
        echo "ℹ️  No npm processes found"
    fi
    
    # Wait for cleanup
    sleep 2
}

# Function to verify Node.js processes are killed
verify_node_processes() {
    echo "✅ Verifying Node.js processes are terminated..."
    
    # Check for remaining Node.js processes
    if pgrep -f "node" >/dev/null 2>&1; then
        echo "❌ Some node processes still running:"
        pgrep -f "node" | xargs ps -p
        return 1
    fi
    
    if pgrep -f "nodemon" >/dev/null 2>&1; then
        echo "❌ Some nodemon processes still running:"
        pgrep -f "nodemon" | xargs ps -p
        return 1
    fi
    
    if pgrep -f "npm" >/dev/null 2>&1; then
        echo "❌ Some npm processes still running:"
        pgrep -f "npm" | xargs ps -p
        return 1
    fi
    
    echo "✅ All Node.js processes terminated successfully!"
    return 0
}

# Main execution
echo "🚀 Starting Node.js process cleanup..."
echo "========================================"

# Step 1: Kill Node.js processes
kill_node_processes

# Step 2: Verify
if verify_node_processes; then
    echo "🎉 SUCCESS: All Node.js processes killed!"
    echo "You can now start your server and client safely."
else
    echo "⚠️  WARNING: Some Node.js processes may still be running."
    echo "Try running this script again or manually kill them."
fi

echo "========================================"