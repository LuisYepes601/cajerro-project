const socket = io();

let operacionActual = null;
let saldoActualCuenta = 0;
let saldoVisible = true;

// 1. AL LOGUEARSE: Recibe el saldo real y lo dibuja en pantalla
socket.on('respuesta_login', (data) => {
  const msg = document.getElementById('mensaje-estado');

  if (data && data.exito) {
    if (msg) msg.innerText = '';
    const titular = data.titular || 'Cliente';
    
    // Asigna el saldo recibido directamente desde el backend
    saldoActualCuenta = Number(data.saldo !== undefined ? data.saldo : 0);
    saldoVisible = true;

    document.getElementById('saludo-usuario').innerText = `Hola, ${titular}`;
    document.getElementById('dash-num-cuenta').innerText = data.numeroCuenta || '1234';

    const cardHolder = document.getElementById('card-holder-display');
    if (cardHolder) cardHolder.innerText = titular.toUpperCase();

    // Muestra el saldo real al instante
    actualizarDisplaySaldo();

    document.getElementById('vista-publica').classList.add('oculto');
    document.getElementById('vista-dashboard-micuenta').classList.remove('oculto');
    document.querySelectorAll('.public-only').forEach(el => el.style.display = 'none');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    if (msg) msg.innerText = (data && data.mensaje) ? data.mensaje : 'Credenciales incorrectas.';
  }
});

// 2. TRAS CADA OPERACIÓN (RETIRO / DEPÓSITO): Actualiza el saldo en vivo
socket.on('respuesta_operacion', (data) => {
  const msg = document.getElementById('mensaje-estado-dash');

  if (data && data.exito) {
    if (data.saldo !== undefined) {
      saldoActualCuenta = Number(data.saldo);
      saldoVisible = true;
      actualizarDisplaySaldo(true); // Actualiza la cifra y le da una animación visual
    }

    if (operacionActual) {
      const monto = document.getElementById('input-monto').value;
      // Cierra la caja de entrada de monto
      document.getElementById('vista-monto').classList.add('oculto');
      // Genera el recibo digital de la transacción
      generarComprobanteDigital(operacionActual, monto, saldoActualCuenta);
      operacionActual = null;
    }

    if (msg) msg.innerText = '';
  } else {
    if (msg) msg.innerText = (data && data.mensaje) ? data.mensaje : 'Error al procesar la operación.';
  }
});

// 3. LOGOUT
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
// FUNCIONES DE CONTROL
// ============================================================

function ejecutarLogin() {
  const numeroCuenta = document.getElementById('input-cuenta').value.trim();
  const pin = document.getElementById('input-pin').value.trim();
  const msg = document.getElementById('mensaje-estado');

  if (!numeroCuenta || !pin) {
    if (msg) msg.innerText = 'Ingresa tu número de cuenta y PIN.';
    return;
  }
  socket.emit('login', { numeroCuenta, pin });
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