# 🔧 Port Cleanup Guide

This guide explains why ports don't get released immediately and provides comprehensive solutions.

## 🚨 **Why Ports Don't Get Released**

### **1. Process States**
- **Zombie Processes**: Finished processes waiting for parent cleanup
- **Defunct Processes**: Terminated processes still holding resources
- **Background Processes**: Processes running in background

### **2. Operating System Behavior**
- **TIME_WAIT State**: TCP connections remain active for 2-4 minutes
- **Socket Reuse**: Systems delay port reuse to prevent conflicts
- **Process Cleanup**: OS takes time to clean up resources

### **3. Node.js Specific Issues**
- **Event Loop**: Node.js processes may not exit cleanly
- **Database Connections**: MongoDB connections keep processes alive
- **File Watchers**: Nodemon restarts processes automatically

## 🛠️ **Solutions**

### **Quick Solutions**

#### **1. One-Liner Commands**
```bash
# Kill processes on specific ports
lsof -ti :3000 | xargs kill -9
lsof -ti :3001 | xargs kill -9

# Kill all Node.js processes
pkill -f node
pkill -f nodemon
pkill -f npm

# Kill by pattern
pkill -f "tutoring-center-scheduler"
```

#### **2. Using Our Scripts**
```bash
# Quick kill (defaults to ports 3000, 3001)
./quick-kill.sh

# Kill specific ports
./quick-kill.sh 3000 3001 8080

# Comprehensive cleanup
./kill-processes.sh
```

### **Manual Methods**

#### **1. Find and Kill by Port**
```bash
# Find processes using port
lsof -i :3000
lsof -i :3001

# Kill by PID
kill -9 <PID>

# Or kill all at once
lsof -ti :3000 | xargs kill -9
```

#### **2. Find and Kill by Process Name**
```bash
# Find Node.js processes
ps aux | grep node
ps aux | grep npm

# Kill by name
killall node
killall npm
```

#### **3. Kill by Pattern**
```bash
# Kill processes matching pattern
pgrep -f "server.js" | xargs kill -9
pgrep -f "tutoring-center-scheduler" | xargs kill -9
```

### **Advanced Solutions**

#### **1. Force Kill Everything**
```bash
# Nuclear option - kill all Node.js processes
sudo pkill -9 -f node
sudo pkill -9 -f npm
sudo pkill -9 -f nodemon
```

#### **2. Reset Network Stack (macOS)**
```bash
# Flush DNS cache
sudo dscacheutil -flushcache

# Reset network interfaces (be careful!)
sudo ifconfig en0 down && sudo ifconfig en0 up
```

#### **3. Check for Lingering Connections**
```bash
# Check TIME_WAIT connections
netstat -an | grep TIME_WAIT | grep -E ":(3000|3001)"

# Check all connections on ports
netstat -an | grep -E ":(3000|3001)"
```

## 🔍 **Diagnostic Commands**

### **Check What's Using Ports**
```bash
# List all processes using ports
lsof -i :3000 -i :3001

# More detailed view
netstat -tulpn | grep -E ":(3000|3001)"

# Check specific port
ss -tulpn | grep :3000
```

### **Check Process Status**
```bash
# Check if processes are running
ps aux | grep -E "(node|npm)" | grep -v grep

# Check process tree
pstree -p | grep node

# Check zombie processes
ps aux | awk '$8 ~ /^Z/ { print $0 }'
```

### **Check System Resources**
```bash
# Check memory usage
top -o MEM | head -20

# Check file descriptors
lsof | wc -l

# Check network connections
netstat -an | wc -l
```

## 🚀 **Prevention Strategies**

### **1. Proper Process Management**
```bash
# Use process managers
npm install -g pm2
pm2 start server.js
pm2 stop all
pm2 delete all
```

### **2. Graceful Shutdown**
```javascript
// In your server.js
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

### **3. Use Different Ports**
```bash
# Use environment variables
PORT=3002 npm start
PORT=3003 npm run client
```

### **4. Development Best Practices**
```bash
# Use nodemon with proper cleanup
nodemon --kill-timeout 3000 server.js

# Use concurrently for multiple processes
npm install -g concurrently
concurrently "npm run server" "npm run client"
```

## 🆘 **Emergency Solutions**

### **When Nothing Else Works**

#### **1. Restart Terminal**
- Close terminal completely
- Open new terminal
- Try again

#### **2. Restart Development Environment**
```bash
# Kill all processes
sudo pkill -9 -f node
sudo pkill -9 -f npm

# Clear npm cache
npm cache clean --force

# Restart
npm start
```

#### **3. System Restart**
- Last resort: restart your computer
- This clears all network states and processes

## 📋 **Troubleshooting Checklist**

- [ ] Check if processes are actually running: `ps aux | grep node`
- [ ] Check port usage: `lsof -i :3000`
- [ ] Try graceful kill first: `kill -TERM <PID>`
- [ ] Try force kill: `kill -9 <PID>`
- [ ] Check for zombie processes: `ps aux | awk '$8 ~ /^Z/'`
- [ ] Check TIME_WAIT connections: `netstat -an | grep TIME_WAIT`
- [ ] Try different ports: `PORT=3002 npm start`
- [ ] Restart terminal/IDE
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Restart computer (last resort)

## 🎯 **Quick Reference**

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `lsof -ti :3000 \| xargs kill -9` |
| Port 3001 in use | `lsof -ti :3001 \| xargs kill -9` |
| Node processes running | `pkill -f node` |
| NPM processes running | `pkill -f npm` |
| Nodemon processes | `pkill -f nodemon` |
| All at once | `./quick-kill.sh` |
| Comprehensive cleanup | `./kill-processes.sh` |

## 🔧 **Scripts Available**

1. **`quick-kill.sh`** - Fast port killing
2. **`kill-processes.sh`** - Comprehensive cleanup
3. **`kill-processes.bat`** - Windows version

Use these scripts for reliable port cleanup!
