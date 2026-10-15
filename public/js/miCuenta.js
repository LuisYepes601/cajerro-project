const socket = io();

let operacionActual = null;
let saldoActualCuenta = 0;
let saldoVisible = true;

// ============================================================
// ESCUCHADORES SOCKET.IO (RESPUESTAS DEL SERVIDOR)
// ============================================================

// 1. RESPUESTA DE REGISTRO DE CUENTA
socket.on('respuesta_registro', (data) => {
  const msg = document.getElementById('mensaje-estado-registro') || document.getElementById('mensaje-estado');

  if (data && data.exito) {
    if (msg) {
      msg.style.color = '#00b85c';
      msg.innerText = data.mensaje || 'Cuenta registrada exitosamente. ¡Ya puedes ingresar!';
    }
    limpiarCamposRegistro();
    setTimeout(() => {
      mostrarFormularioLogin();
    }, 2000);
  } else {
    if (msg) {
      msg.style.color = '#ff4d4d';
      msg.innerText = (data && data.mensaje) ? data.mensaje : 'Error al registrar la cuenta.';
    }
  }
});

// 2. AL LOGUEARSE
socket.on('respuesta_login', (data) => {
  const msg = document.getElementById('mensaje-estado');

  if (data && data.exito) {
    if (msg) msg.innerText = '';
    const titular = data.titular || 'Cliente';
    
    saldoActualCuenta = Number(data.saldo !== undefined ? data.saldo : 0);
    saldoVisible = true;

    document.getElementById('saludo-usuario').innerText = `Hola, ${titular}`;
    document.getElementById('dash-num-cuenta').innerText = data.numeroCuenta || '----';

    const cardHolder = document.getElementById('card-holder-display');
    if (cardHolder) cardHolder.innerText = titular.toUpperCase();

    actualizarDisplaySaldo();

    document.getElementById('vista-publica').classList.add('oculto');
    document.getElementById('vista-dashboard-micuenta').classList.remove('oculto');
    document.querySelectorAll('.public-only').forEach(el => el.style.display = 'none');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    if (msg) {
      msg.style.color = '#ff4d4d';
      msg.innerText = (data && data.mensaje) ? data.mensaje : 'Credenciales incorrectas.';
    }
  }
});

// 3. TRAS CADA OPERACIÓN (RETIRO / DEPÓSITO)
socket.on('respuesta_operacion', (data) => {
  const msg = document.getElementById('mensaje-estado-dash');

  if (data && data.exito) {
    if (data.saldo !== undefined) {
      saldoActualCuenta = Number(data.saldo);
      saldoVisible = true;
      actualizarDisplaySaldo(true);
    }

    if (operacionActual) {
      const monto = document.getElementById('input-monto').value;
      document.getElementById('vista-monto').classList.add('oculto');
      generarComprobanteDigital(operacionActual, monto, saldoActualCuenta);
      operacionActual = null;
    }

    if (msg) msg.innerText = '';
  } else {
    if (msg) msg.innerText = (data && data.mensaje) ? data.mensaje : 'Error al procesar la operación.';
  }
});

// 4. LOGOUT
socket.on('respuesta_logout', () => {
  saldoActualCuenta = 0;
  saldoVisible = false;
  operacionActual = null;

  document.getElementById('vista-dashboard-micuenta').classList.add('oculto');
  document.getElementById('vista-publica').classList.remove('oculto');
  document.querySelectorAll('.public-only').forEach(el => el.style.display = 'inline-block');

  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================================
// FUNCIONES DE REGISTRO Y LOGIN
// ============================================================

function generarNumeroCuenta10Digitos() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function ejecutarLogin() {
  const numeroCuenta = document.getElementById('input-cuenta').value.trim();
  const pin = document.getElementById('input-pin').value.trim();
  const msg = document.getElementById('mensaje-estado');

  if (!numeroCuenta || !pin) {
    if (msg) {
      msg.style.color = '#ff4d4d';
      msg.innerText = 'Ingresa tu número de cuenta y PIN.';
    }
    return;
  }
  socket.emit('login', { numeroCuenta, pin });
}

function ejecutarRegistro() {
  const numeroCuenta = document.getElementById('reg-cuenta')?.value.trim();
  const pin = document.getElementById('reg-pin')?.value.trim();
  const titular = document.getElementById('reg-titular')?.value.trim();
  const saldoInicial = 0; // Saldo inicial fijado en $0 COP
  const msg = document.getElementById('mensaje-estado-registro') || document.getElementById('mensaje-estado');

  if (!numeroCuenta || !pin || !titular) {
    if (msg) {
      msg.style.color = '#ff4d4d';
      msg.innerText = 'Ingresa el nombre del titular y tu PIN de seguridad.';
    }
    return;
  }

  if (pin.length < 4) {
    if (msg) {
      msg.style.color = '#ff4d4d';
      msg.innerText = 'El PIN de seguridad debe tener al menos 4 dígitos.';
    }
    return;
  }

  socket.emit('registrar_cuenta', {
    numeroCuenta,
    pin,
    titular,
    saldoInicial
  });
}

function mostrarFormularioRegistro() {
  const formLogin = document.getElementById('box-login');
  const formRegistro = document.getElementById('box-registro');

  if (formLogin && formRegistro) {
    formLogin.classList.add('oculto');
    formRegistro.classList.remove('oculto');

    // Genera automáticamente un número de cuenta aleatorio de 10 dígitos
    const inputCuenta = document.getElementById('reg-cuenta');
    if (inputCuenta) {
      inputCuenta.value = generarNumeroCuenta10Digitos();
    }
  }
}

function mostrarFormularioLogin() {
  const formLogin = document.getElementById('box-login');
  const formRegistro = document.getElementById('box-registro');

  if (formLogin && formRegistro) {
    formRegistro.classList.add('oculto');
    formLogin.classList.remove('oculto');
  }
}

function limpiarCamposRegistro() {
  const regPin = document.getElementById('reg-pin');
  const regTitular = document.getElementById('reg-titular');
  if (regPin) regPin.value = '';
  if (regTitular) regTitular.value = '';
}

// ============================================================
// FUNCIONES DE CONTROL DEL CAJERO
// ============================================================

function consultarSaldo() {
  volverMenu();
  socket.emit('consultar_saldo');
}

function prepararMonto(tipo) {
  volverMenu();
  operacionActual = tipo;

  const msg = document.getElementById('mensaje-estado-dash');
  if (msg) msg.innerText = '';

  document.getElementById('monto-titulo').innerText = `Monto a ${tipo.toLowerCase()}:`;
  document.getElementById('input-monto').value = '';

  const vistaMonto = document.getElementById('vista-monto');
  vistaMonto.classList.remove('oculto');
  vistaMonto.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function asignarMontoRapido(valor) {
  document.getElementById('input-monto').value = valor;
}

function confirmarMonto() {
  const monto = Number(document.getElementById('input-monto').value);
  const msg = document.getElementById('mensaje-estado-dash');

  if (!monto || monto <= 0) {
    if (msg) msg.innerText = 'Ingresa un monto válido mayor a $0.';
    return;
  }

  if (operacionActual === 'RETIRAR') {
    socket.emit('retirar', { monto });
  } else if (operacionActual === 'DEPOSITAR') {
    socket.emit('depositar', { monto });
  }
}

function volverMenu() {
  operacionActual = null;
  document.getElementById('vista-monto').classList.add('oculto');
  document.getElementById('vista-comprobante').classList.add('oculto');

  const msg = document.getElementById('mensaje-estado-dash');
  if (msg) msg.innerText = '';
}

function cerrarSesion() {
  socket.emit('logout');
}

function toggleVisibilidadSaldoATM() {
  saldoVisible = !saldoVisible;
  actualizarDisplaySaldo();
}

function actualizarDisplaySaldo(animar = false) {
  const display = document.getElementById('atm-saldo-display');
  const btnIcon = document.getElementById('btn-balance-icon');

  if (!display || !btnIcon) return;

  if (saldoVisible) {
    display.innerText = `$ ${Number(saldoActualCuenta).toLocaleString('es-CO')}`;
    btnIcon.innerText = 'Ocultar Saldo';

    if (animar) {
      display.style.color = '#00b85c';
      display.style.transform = 'scale(1.04)';
      setTimeout(() => {
        display.style.color = 'var(--nu-purple)';
        display.style.transform = 'scale(1)';
      }, 350);
    }
  } else {
    display.innerText = '$ ••••••••';
    btnIcon.innerText = 'Mostrar Saldo';
  }
}

function generarComprobanteDigital(tipo, monto, nuevoSaldo) {
  const ahora = new Date();
  const fechaStr = ahora.toLocaleString('es-CO');
  const numRef = '#' + Math.floor(100000 + Math.random() * 900000);

  document.getElementById('receipt-type-tag').innerText = tipo;
  document.getElementById('receipt-date').innerText = fechaStr;
  document.getElementById('receipt-ref').innerText = numRef;
  document.getElementById('receipt-amount').innerText = `$ ${Number(monto).toLocaleString('es-CO')}`;
  document.getElementById('receipt-new-balance').innerText = `$ ${Number(nuevoSaldo).toLocaleString('es-CO')}`;

  const comprobante = document.getElementById('vista-comprobante');
  comprobante.classList.remove('oculto');
  comprobante.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function irAInicio() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Interacción 3D Tarjeta Morada Hero
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('card-tilt-container');
  const card = document.getElementById('interactive-card');

  if (container && card) {
    container.addEventListener('mousemove', (e) => {
      if (card.classList.contains('flipped')) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `rotateX(${(-y / rect.height) * 16}deg) rotateY(${(x / rect.width) * 16}deg)`;
    });

    container.addEventListener('mouseleave', () => {
      if (!card.classList.contains('flipped')) {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      }
    });
  }
});

function voltearTarjeta() {
  const card = document.getElementById('interactive-card');
  if (card) card.classList.toggle('flipped');
}