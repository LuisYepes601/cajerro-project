const socket = io();

let operacionActual = null;
let saldoActualCuenta = 0;
let saldoVisible = true;

socket.on('respuesta_registro', (data) => {
  const msg = document.getElementById('mensaje-estado-registro') || document.getElementById('mensaje-estado');

  if (data && data.exito) {
    if (msg) {
      msg.style.color = '#00b85c';
      msg.innerText = data.mensaje || '¡Cuenta registrada exitosamente!';
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

socket.on('respuesta_login', (data) => {
  const msg = document.getElementById('mensaje-estado');

  if (data && data.exito) {
    if (msg) msg.innerText = '';
    const titular = data.titular || 'Cliente';
    saldoActualCuenta = Number(data.saldo !== undefined ? data.saldo : 0);
    saldoVisible = true;

    const saludoEl = document.getElementById('saludo-usuario');
    if (saludoEl) saludoEl.innerText = `Hola, ${titular}`;

    const dashCuentaEl = document.getElementById('dash-num-cuenta');
    if (dashCuentaEl) dashCuentaEl.innerText = data.numeroCuenta || '----';

    const cardHolderMain = document.getElementById('card-holder-display');
    if (cardHolderMain) cardHolderMain.innerText = titular.toUpperCase();

    actualizarDisplaySaldoATM();

    const vistaPublica = document.getElementById('vista-publica');
    const vistaDashboard = document.getElementById('vista-dashboard-micuenta');

    if (vistaPublica) vistaPublica.classList.add('oculto');
    if (vistaDashboard) vistaDashboard.classList.remove('oculto');

    document.querySelectorAll('.public-only').forEach(el => el.style.display = 'none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    if (msg) {
      msg.style.color = '#ff4d4d';
      msg.innerText = (data && data.mensaje) ? data.mensaje : 'Credenciales incorrectas.';
    }
  }
});

socket.on('respuesta_operacion', (data) => {
  const msg = document.getElementById('mensaje-estado-dash');

  if (data && data.exito) {
    if (data.saldo !== undefined) {
      saldoActualCuenta = Number(data.saldo);
      saldoVisible = true;
      actualizarDisplaySaldoATM(true);
    }

    if (operacionActual) {
      const montoIngresado = document.getElementById('input-monto').value;
      const vistaMonto = document.getElementById('vista-monto');
      if (vistaMonto) vistaMonto.classList.add('oculto');

      generarComprobanteDigital(operacionActual, montoIngresado, saldoActualCuenta);
      operacionActual = null;
    }

    if (msg) msg.innerText = '';
  } else {
    if (msg) msg.innerText = (data && data.mensaje) ? data.mensaje : 'Error al procesar la operación.';
  }
});

socket.on('respuesta_logout', () => {
  saldoActualCuenta = 0;
  saldoVisible = false;
  operacionActual = null;

  const vistaPublica = document.getElementById('vista-publica');
  const vistaDashboard = document.getElementById('vista-dashboard-micuenta');

  if (vistaDashboard) vistaDashboard.classList.add('oculto');
  if (vistaPublica) vistaPublica.classList.remove('oculto');

  document.querySelectorAll('.public-only').forEach(el => el.style.display = 'inline-block');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function mostrarFormularioRegistro() {
  const formLogin = document.getElementById('box-login');
  const formRegistro = document.getElementById('box-registro');

  if (formLogin && formRegistro) {
    formLogin.classList.add('oculto');
    formRegistro.classList.remove('oculto');
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

function ejecutarRegistro() {
  const correo = document.getElementById('reg-correo')?.value.trim();
  const pin = document.getElementById('reg-pin')?.value.trim();
  const titular = document.getElementById('reg-titular')?.value.trim();
  const msg = document.getElementById('mensaje-estado-registro') || document.getElementById('mensaje-estado');

  if (!correo || !pin || !titular) {
    if (msg) {
      msg.style.color = '#ff4d4d';
      msg.innerText = 'Por favor completa todos los campos.';
    }
    return;
  }

  if (pin.length < 4) {
    if (msg) {
      msg.style.color = '#ff4d4d';
      msg.innerText = 'El PIN debe tener al menos 4 dígitos.';
    }
    return;
  }

  socket.emit('registrar_cuenta', { correo, pin, titular });
}

function ejecutarLogin() {
  const correo = document.getElementById('input-correo').value.trim();
  const pin = document.getElementById('input-pin').value.trim();
  const msg = document.getElementById('mensaje-estado');

  if (!correo || !pin) {
    if (msg) {
      msg.style.color = '#ff4d4d';
      msg.innerText = 'Ingresa tu correo y PIN de acceso.';
    }
    return;
  }
  socket.emit('login', { correo, pin });
}

function limpiarCamposRegistro() {
  ['reg-correo', 'reg-pin', 'reg-titular'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function consultarSaldo() {
  volverMenu();
  socket.emit('consultar_saldo');
}

function prepararMonto(tipo) {
  volverMenu();
  operacionActual = tipo;

  const msg = document.getElementById('mensaje-estado-dash');
  if (msg) msg.innerText = '';

  const tituloEl = document.getElementById('monto-titulo');
  if (tituloEl) tituloEl.innerText = `Monto a ${tipo.toLowerCase()}:`;

  const inputMonto = document.getElementById('input-monto');
  if (inputMonto) inputMonto.value = '';

  const vistaMonto = document.getElementById('vista-monto');
  if (vistaMonto) {
    vistaMonto.classList.remove('oculto');
    vistaMonto.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function asignarMontoRapido(valor) {
  const inputMonto = document.getElementById('input-monto');
  if (inputMonto) inputMonto.value = valor;
}

function confirmarMonto() {
  const inputMonto = document.getElementById('input-monto');
  const monto = Number(inputMonto ? inputMonto.value : 0);
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
  const vistaMonto = document.getElementById('vista-monto');
  const vistaComprobante = document.getElementById('vista-comprobante');

  if (vistaMonto) vistaMonto.classList.add('oculto');
  if (vistaComprobante) vistaComprobante.classList.add('oculto');

  const msg = document.getElementById('mensaje-estado-dash');
  if (msg) msg.innerText = '';
}

function cerrarSesion() {
  socket.emit('logout');
}

function toggleVisibilidadSaldoATM() {
  saldoVisible = !saldoVisible;
  actualizarDisplaySaldoATM();
}

function actualizarDisplaySaldoATM(animar = false) {
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
        display.style.color = '';
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

  const tagEl = document.getElementById('receipt-type-tag');
  const dateEl = document.getElementById('receipt-date');
  const refEl = document.getElementById('receipt-ref');
  const amountEl = document.getElementById('receipt-amount');
  const newBalEl = document.getElementById('receipt-new-balance');

  if (tagEl) tagEl.innerText = tipo;
  if (dateEl) dateEl.innerText = fechaStr;
  if (refEl) refEl.innerText = numRef;
  if (amountEl) amountEl.innerText = `$ ${Number(monto).toLocaleString('es-CO')}`;
  if (newBalEl) newBalEl.innerText = `$ ${Number(nuevoSaldo).toLocaleString('es-CO')}`;

  const comprobante = document.getElementById('vista-comprobante');
  if (comprobante) {
    comprobante.classList.remove('oculto');
    comprobante.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function irAInicio() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function voltearTarjeta() {
  const card = document.getElementById('interactive-card');
  if (card) card.classList.toggle('flipped');
}

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