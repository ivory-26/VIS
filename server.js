const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// ✅ MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/whiteboard-users', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ✅ User model
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

// ✅ Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Auth routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.json({ success: false, message: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  await new User({ username, password: hashed }).save();

  res.json({ success: true });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.json({ success: false, message: 'User not found' });

  const match = await bcrypt.compare(password, user.password);
  res.json({ success: match, message: match ? undefined : 'Incorrect password' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

/* 🔄 Optional: Socket.io Setup (for real-time whiteboard)
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);

io.on('connection', (socket) => {
  console.log('🟢 New user connected:', socket.id);

  socket.on('draw', data => {
    socket.broadcast.emit('draw', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`🚀 Server with Socket.IO running at http://localhost:${PORT}`);
});
*/
