// RESPUESTA DE TRANSACCIONES (RETIRO / DEPÓSITO / CONSULTA)
socket.on('respuesta_operacion', (data) => {
  const msg = document.getElementById('mensaje-estado-dash');

  if (data && data.exito) {
    if (data.saldo !== undefined) {
      saldoActualCuenta = Number(data.saldo);
      saldoVisible = true;
      actualizarDisplaySaldo(true);
    }

    if (data.accion === 'RETIRAR' || data.accion === 'DEPOSITAR' || operacionActual) {
      const tipo = data.accion || operacionActual;
      const monto = data.monto || document.getElementById('input-monto').value;

      document.getElementById('vista-monto').classList.add('oculto');
      generarComprobanteDigital(tipo, monto, saldoActualCuenta);
      operacionActual = null;
    }

    if (msg) msg.innerText = '';
  } else {
    if (msg) msg.innerText = (data && data.mensaje) ? data.mensaje : 'Error al procesar la operación.';

    // Si la sesión expiró por reinicio del server, regresa al login tras 2 segundos
    if (data && data.mensaje && data.mensaje.includes('expirada')) {
      setTimeout(() => {
        cerrarSesion();
      }, 1800);
    }
  }
});