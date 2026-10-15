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

  socket.on('registrar_cuenta', async ({ correo, pin, titular }) => {
    const resultado = await atmService.registrar(correo, pin, titular, 0);
    if (resultado && resultado.exito) {
      socket.emit('respuesta_registro', {
        exito: true,
        mensaje: 'Cuenta creada exitosamente. Ya puedes ingresar con tu correo.'
      });
      await notificarMonitor('NUEVA CUENTA', resultado.cuenta.numero_cuenta, 0, 0);
    } else {
      socket.emit('respuesta_registro', {
        exito: false,
        mensaje: (resultado && resultado.mensaje) ? resultado.mensaje : 'Error al registrar la cuenta.'
      });
    }
  });

  socket.on('login', async ({ correo, pin }) => {
    const resultado = await atmService.autenticar(correo, pin);
    if (resultado && resultado.exito) {
      cuentaSesion = String(resultado.numeroCuenta);

      socket.emit('respuesta_login', {
        exito: true,
        titular: resultado.titular,
        numeroCuenta: cuentaSesion,
        correo: resultado.correo,
        saldo: Number(resultado.saldo)
      });

      await notificarMonitor('LOGIN', cuentaSesion, resultado.saldo, resultado.saldo);
    } else {
      socket.emit('respuesta_login', { 
        exito: false, 
        mensaje: (resultado && resultado.mensaje) ? resultado.mensaje : 'Credenciales incorrectas.' 
      });
    }
  });

  socket.on('consultar_saldo', async () => {
    if (!cuentaSesion) return socket.emit('respuesta_operacion', { exito: false, mensaje: 'Sesión expirada.' });
    const resultado = await atmService.obtenerSaldo(cuentaSesion);
    socket.emit('respuesta_operacion', { exito: true, saldo: Number(resultado.saldo || 0), accion: 'CONSULTAR' });
  });

  socket.on('retirar', async ({ monto }) => {
    if (!cuentaSesion) return socket.emit('respuesta_operacion', { exito: false, mensaje: 'Sesión expirada.' });
    const valorMonto = Number(monto);
    const resultado = await atmService.retirar(cuentaSesion, valorMonto);

    if (resultado && resultado.exito) {
      await notificarMonitor('RETIRO', cuentaSesion, valorMonto, resultado.saldo);
      socket.emit('respuesta_operacion', { exito: true, mensaje: resultado.mensaje, saldo: Number(resultado.saldo), monto: valorMonto, accion: 'RETIRAR' });
    } else {
      socket.emit('respuesta_operacion', { exito: false, mensaje: resultado.mensaje });
    }
  });

  socket.on('depositar', async ({ monto }) => {
    if (!cuentaSesion) return socket.emit('respuesta_operacion', { exito: false, mensaje: 'Sesión expirada.' });
    const valorMonto = Number(monto);
    const resultado = await atmService.depositar(cuentaSesion, valorMonto);

    if (resultado && resultado.exito) {
      await notificarMonitor('DEPÓSITO', cuentaSesion, valorMonto, resultado.saldo);
      socket.emit('respuesta_operacion', { exito: true, mensaje: resultado.mensaje, saldo: Number(resultado.saldo), monto: valorMonto, accion: 'DEPOSITAR' });
    } else {
      socket.emit('respuesta_operacion', { exito: false, mensaje: resultado.mensaje });
    }
  });

  socket.on('logout', () => {
    cuentaSesion = null;
    socket.emit('respuesta_logout', { exito: true });
  });
}

module.exports = manejarConexionSocket;