const express = require('express');
const http = require('http');
const path = require('path');
const inicializarSockets = require('./src/config/socketConfig');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Servir archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar capa de comunicación distribuida (Sockets)
inicializarSockets(server);

server.listen(PORT, () => {
  console.log(`================================================`);
  console.log(` Servidor del Banco iniciado en http://localhost:${PORT}`);
  console.log(` Sockets activos para comunicación distribuida.`);
  console.log(`================================================`);
});