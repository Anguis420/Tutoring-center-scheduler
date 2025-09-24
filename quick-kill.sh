#!/bin/bash

# Quick port killer - one-liner solution
# Usage: ./quick-kill.sh [port1] [port2] ...

echo "🔫 Quick killing processes on ports: ${@:-3000 3001}"

for port in "${@:-3000 3001}"; do
    echo "Killing processes on port $port..."
    lsof -ti :$port 2>/dev/null | xargs kill -9 2>/dev/null || echo "No processes found on port $port"
done

echo "✅ Done! Ports should be free now."
