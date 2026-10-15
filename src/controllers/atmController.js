const atmService = require('../services/atmService');
const accountRepository = require('../repositories/accountRepository');

function manejarConexionSocket(socket) {
  let cuentaSesion = null;

  function emitirEstadoSistema() {
    try {
      const cuentas = accountRepository.obtenerTodas();
      socket.emit('estado_sistema_vivo', { cuentas });
      socket.broadcast.emit('estado_sistema_vivo', { cuentas });
    } catch (err) {
      console.error("Error al emitir estado del sistema:", err);
    }
  }

  function notificarMonitor(tipo, numeroCuenta, monto, nuevoSaldo) {
    const payload = { tipo, numeroCuenta, monto: Number(monto), nuevoSaldo: Number(nuevoSaldo) };
    socket.emit('evento_transaccion_vivo', payload);
    socket.broadcast.emit('evento_transaccion_vivo', payload);

    emitirEstadoSistema();
  }

  socket.on('solicitar_estado_sistema', () => {
    emitirEstadoSistema();
  });

  socket.on('login', ({ numeroCuenta, pin }) => {
    const resultado = atmService.autenticar(numeroCuenta, pin);
    if (resultado && resultado.exito) {
      cuentaSesion = String(numeroCuenta);
      
      const cuenta = accountRepository.obtenerPorCuenta(cuentaSesion);
      const saldoReal = cuenta ? cuenta.saldo : (resultado.saldo || 0);

      socket.emit('respuesta_login', {
        exito: true,
        titular: resultado.titular,
        numeroCuenta: cuentaSesion,
        saldo: Number(saldoReal)
      });

      notificarMonitor('LOGIN', cuentaSesion, saldoReal, saldoReal);
    } else {
      socket.emit('respuesta_login', { 
        exito: false, 
        mensaje: (resultado && resultado.mensaje) ? resultado.mensaje : 'Credenciales incorrectas.' 
      });
    }
  });

  socket.on('consultar_saldo', () => {
    if (!cuentaSesion) {
      return socket.emit('respuesta_operacion', { 
        exito: false, 
        mensaje: 'Sesión expirada. Por favor vuelve a ingresar.' 
      });
    }
    const resultado = atmService.obtenerSaldo(cuentaSesion);
    socket.emit('respuesta_operacion', {
      exito: true,
      saldo: Number(resultado.saldo || 0),
      accion: 'CONSULTAR'
    });
  });

  socket.on('retirar', ({ monto }) => {
    if (!cuentaSesion) {
      return socket.emit('respuesta_operacion', { 
        exito: false, 
        mensaje: 'Sesión expirada. Inicia sesión nuevamente.' 
      });
    }
    const valorMonto = Number(monto);
    const resultado = atmService.retirar(cuentaSesion, valorMonto);

    if (resultado && resultado.exito) {
      const saldoFinal = resultado.saldo !== undefined ? resultado.saldo : resultado.nuevoSaldo;
      
      // 1. Notifica al monitor en vivo
      notificarMonitor('RETIRO', cuentaSesion, valorMonto, saldoFinal);

      // 2. Responde al usuario con toda la metadata
      socket.emit('respuesta_operacion', {
        exito: true,
        mensaje: resultado.mensaje,
        saldo: Number(saldoFinal),
        monto: valorMonto,
        accion: 'RETIRAR'
      });
    } else {
      socket.emit('respuesta_operacion', {
        exito: false,
        mensaje: (resultado && resultado.mensaje) ? resultado.mensaje : 'Saldo insuficiente.'
      });
    }
  });

  socket.on('depositar', ({ monto }) => {
    if (!cuentaSesion) {
      return socket.emit('respuesta_operacion', { 
        exito: false, 
        mensaje: 'Sesión expirada. Inicia sesión nuevamente.' 
      });
    }
    const valorMonto = Number(monto);
    const resultado = atmService.depositar(cuentaSesion, valorMonto);

    if (resultado && resultado.exito) {
      const saldoFinal = resultado.saldo !== undefined ? resultado.saldo : resultado.nuevoSaldo;

      // 1. Notifica al monitor en vivo
      notificarMonitor('DEPÓSITO', cuentaSesion, valorMonto, saldoFinal);

      // 2. Responde al usuario con toda la metadata
      socket.emit('respuesta_operacion', {
        exito: true,
        mensaje: resultado.mensaje,
        saldo: Number(saldoFinal),
        monto: valorMonto,
        accion: 'DEPOSITAR'
      });
    } else {
      socket.emit('respuesta_operacion', {
        exito: false,
        mensaje: (resultado && resultado.mensaje) ? resultado.mensaje : 'Monto no válido.'
      });
    }
  });

  socket.on('logout', () => {
    cuentaSesion = null;
    socket.emit('respuesta_logout', { exito: true });
  });
}

module.exports = manejarConexionSocket;