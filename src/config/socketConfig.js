const { Server } = require('socket.io');
const manejarConexionSocket = require('../controllers/atmController');

function inicializarSockets(httpServer) {
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Nuevo cliente conectado ID: ${socket.id}`);
    manejarConexionSocket(socket);

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Cliente desconectado ID: ${socket.id}`);
    });
  });

  return io;
}

module.exports = inicializarSockets;