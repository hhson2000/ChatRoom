const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const io = new Server(server);

  let onlineCount = 0;

  function getOnlineUsers() {
    const users = [];
    for (const [, s] of io.sockets.sockets) {
      if (s.data.name) users.push(s.data.name);
    }
    return users;
  }

  io.on('connection', (socket) => {
    onlineCount++;
    io.emit('online', onlineCount);

    socket.on('join', (name) => {
      socket.data.name = name;
      io.emit('message', { name: 'System', text: `${name} đã tham gia phòng chat` });
      io.emit('userList', getOnlineUsers());
    });

    socket.on('getUserList', () => {
      socket.emit('userList', getOnlineUsers());
    });

    socket.on('message', (text) => {
      if (socket.data.name) {
        io.emit('message', { name: socket.data.name, text });
      }
    });

    socket.on('disconnect', () => {
      onlineCount--;
      io.emit('online', onlineCount);
      if (socket.data.name) {
        io.emit('message', { name: 'System', text: `${socket.data.name} đã rời phòng chat` });
        io.emit('userList', getOnlineUsers());
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
