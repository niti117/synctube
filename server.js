const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// CORS ko allow karna zaroori hai taaki Vercel se backend connect ho sake
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST"]
}));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Socket.io logic (SyncTube Signaling)
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });
});

// Health check route (Browser mein link kholne par ye dikhega)
app.get('/', (req, res) => {
    res.send('<h1>SyncTube Backend is Live and Running!</h1>');
});

// --- 🔥 RENDER FIX START ---
// Render hamesha process.env.PORT provide karta hai (default 10000)
const PORT = process.env.PORT || 10000;

// '0.0.0.0' par bind karna zaroori hai taaki Render ka system server se baat kar sake
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SyncTube Signaling Server running on port ${PORT}`);
});
// --- 🔥 RENDER FIX END ---