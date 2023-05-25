const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const axios = require('axios');

// Replace this with your own secret key
const secretKey = 'your-secret-key';

// Middleware to authenticate requests using JWT tokens
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = decoded;
    next();
  });
};

// Example route with authentication
app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: 'Protected resource accessed successfully' });
});

// Start the server
const port = 3000; // Change this to the desired port number
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Middleware to authenticate WebSocket connections using JWT tokens
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('No token provided'));
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return next(new Error('Invalid token'));
    }

    socket.user = decoded;
    next();
  });
});

// Event handler for new WebSocket connections
io.on('connection', (socket) => {
  console.log(`WebSocket connection established: ${socket.id}`);

  // Example event handler for receiving and broadcasting messages
  socket.on('message', (data) => {
    console.log(`Received message from ${socket.user.username}: ${data}`);
    io.emit('message', {
      username: socket.user.username,
      message: data,
    });
  });

  // Example event handler for joining a room
  socket.on('joinRoom', (roomName) => {
    console.log(`${socket.user.username} joined room: ${roomName}`);
    socket.join(roomName);
  });

  // Example event handler for leaving a room
  socket.on('leaveRoom', (roomName) => {
    console.log(`${socket.user.username} left room: ${roomName}`);
    socket.leave(roomName);
  });

  // Event handler for disconnections
  socket.on('disconnect', () => {
    console.log(`WebSocket connection closed: ${socket.id}`);
  });
});

// Example function for sending real-time updates to clients
const sendRealtimeUpdate = (resourceId, updateData) => {
  io.to(resourceId).emit('update', updateData);
};

// Example API route for creating/updating a resource
app.post('/api/resource/:id', authenticate, (req, res) => {
  const resourceId = req.params.id;
  const updateData = req.body;

  // Process the resource update (e.g., save to database)

  // Send real-time update to connected clients
  sendRealtimeUpdate(resourceId, updateData);

  res.json({ message: 'Resource updated successfully' });
});
