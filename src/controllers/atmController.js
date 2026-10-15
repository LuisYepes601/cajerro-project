const atmService = require('../services/atmService');
const accountRepository = require('../repositories/accountRepository');

function manejarConexionSocket(socket) {
  let cuentaSesion = null;

  async function emitirEstadoSistema() {
    try {
      const cuentas = await accountRepository.obtenerTodas();
      socket.emit('estado_sistema_vivo', { cuentas });
      socket.broadcast.emit('estado_sistema_vivo', { cuentas });
    } catch (err) {
      console.error("Error al emitir estado del sistema:", err);
    }
  }

  async function notificarMonitor(tipo, numeroCuenta, monto, nuevoSaldo) {
    const payload = { tipo, numeroCuenta, monto: Number(monto), nuevoSaldo: Number(nuevoSaldo) };
    socket.emit('evento_transaccion_vivo', payload);
    socket.broadcast.emit('evento_transaccion_vivo', payload);

    await emitirEstadoSistema();
  }

  socket.on('solicitar_estado_sistema', async () => {
    await emitirEstadoSistema();
  });

  // EVENTO NUEVO: Procesar Registro de Cuenta
  socket.on('registrar_cuenta', async ({ numeroCuenta, pin, titular, saldoInicial }) => {
    const resultado = await atmService.registrar(numeroCuenta, pin, titular, saldoInicial);
    if (resultado && resultado.exito) {
      socket.emit('respuesta_registro', {
        exito: true,
        mensaje: 'Cuenta registrada exitosamente. Ya puedes ingresar.'
      });
      // Notifica al monitor administrativo para que muestre la nueva cuenta al instante
      await notificarMonitor('NUEVA CUENTA', numeroCuenta, saldoInicial || 0, saldoInicial || 0);
    } else {
      socket.emit('respuesta_registro', {
        exito: false,
        mensaje: (resultado && resultado.mensaje) ? resultado.mensaje : 'Error al registrar la cuenta.'
      });
    }
  });

  socket.on('login', async ({ numeroCuenta, pin }) => {
    const resultado = await atmService.autenticar(numeroCuenta, pin);
    if (resultado && resultado.exito) {
      cuentaSesion = String(numeroCuenta);
      
      const cuenta = await accountRepository.obtenerPorCuenta(cuentaSesion);
      const saldoReal = cuenta ? cuenta.saldo : (resultado.saldo || 0);

      socket.emit('respuesta_login', {
        exito: true,
        titular: resultado.titular,
        numeroCuenta: cuentaSesion,
        saldo: Number(saldoReal)
      });

      await notificarMonitor('LOGIN', cuentaSesion, saldoReal, saldoReal);
    } else {
      socket.emit('respuesta_login', { 
        exito: false, 
        mensaje: (resultado && resultado.mensaje) ? resultado.mensaje : 'Credenciales incorrectas.' 
      });
    }
  });

  socket.on('consultar_saldo', async () => {
    if (!cuentaSesion) {
      return socket.emit('respuesta_operacion', { 
        exito: false, 
        mensaje: 'Sesión expirada. Por favor vuelve a ingresar.' 
      });
    }
    const resultado = await atmService.obtenerSaldo(cuentaSesion);
    socket.emit('respuesta_operacion', {
      exito: true,
      saldo: Number(resultado.saldo || 0),
      accion: 'CONSULTAR'
    });
  });

  socket.on('retirar', async ({ monto }) => {
    if (!cuentaSesion) {
      return socket.emit('respuesta_operacion', { 
        exito: false, 
        mensaje: 'Sesión expirada. Inicia sesión nuevamente.' 
      });
    }
    const valorMonto = Number(monto);
    const resultado = await atmService.retirar(cuentaSesion, valorMonto);

    if (resultado && resultado.exito) {
      const saldoFinal = resultado.saldo !== undefined ? resultado.saldo : resultado.nuevoSaldo;
      
      await notificarMonitor('RETIRO', cuentaSesion, valorMonto, saldoFinal);

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

  socket.on('depositar', async ({ monto }) => {
    if (!cuentaSesion) {
      return socket.emit('respuesta_operacion', { 
        exito: false, 
        mensaje: 'Sesión expirada. Inicia sesión nuevamente.' 
      });
    }
    const valorMonto = Number(monto);
    const resultado = await atmService.depositar(cuentaSesion, valorMonto);

    if (resultado && resultado.exito) {
      const saldoFinal = resultado.saldo !== undefined ? resultado.saldo : resultado.nuevoSaldo;

      await notificarMonitor('DEPÓSITO', cuentaSesion, valorMonto, saldoFinal);

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