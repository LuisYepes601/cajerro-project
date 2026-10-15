const socket = io();

// Estado del Módulo "Mi Cuenta" / Cajero
let operacionActual = null;     // 'RETIRAR' | 'DEPOSITAR' | null
let saldoActualCuenta = 0;      // Saldo numérico en tiempo real
let saldoVisible = false;       // Control de enmascaramiento ($ ••••••••)

// ------------------------------------------------------------
// 1. RESPUESTAS DEL SERVIDOR VÍA SOCKETS
// ------------------------------------------------------------

socket.on('respuesta_login', (data) => {
  const msg = document.getElementById('mensaje-estado');
  if (data.exito) {
    if (msg) msg.innerText = '';
    const titular = data.titular || 'Cliente';
    saldoActualCuenta = data.saldo || 0;
    
    // Actualizar saludo y titular en tarjetas
    const saludoEl = document.getElementById('saludo-usuario');
    if (saludoEl) saludoEl.innerText = `Hola, ${titular}`;

    const cardHolderMain = document.getElementById('card-holder-display');
    if (cardHolderMain) cardHolderMain.innerText = titular.toUpperCase();

    const cardHolderMini = document.getElementById('display-card-holder');
    if (cardHolderMini) cardHolderMini.innerText = titular.toUpperCase();

    // Actualizar visualización del saldo
    actualizarDisplaySaldoATM();
    
    // Cambiar a la vista autenticada y desplazar la pantalla
    mostrarVista('vista-menu');
    redirigirAMiCuenta();
  } else {
    if (msg) msg.innerText = data.mensaje || 'Credenciales incorrectas.';
  }
});

socket.on('respuesta_operacion', (data) => {
  const msg = document.getElementById('mensaje-estado');
  if (data.exito) {
    if (data.saldo !== undefined) {
      saldoActualCuenta = data.saldo;
      actualizarDisplaySaldoATM();
      
      // Si la operación proviene de un retiro o depósito, mostramos el comprobante
      if (operacionActual) {
        const montoIngresado = document.getElementById('input-monto').value;
        generarComprobanteDigital(operacionActual, montoIngresado, data.saldo);
        operacionActual = null;
      } else {
        if (msg) msg.innerText = `Saldo actualizado: $${data.saldo.toLocaleString('es-CO')}`;
        mostrarVista('vista-menu');
      }
    } else {
      if (msg) msg.innerText = data.mensaje;
      mostrarVista('vista-menu');
    }
  } else {
    if (msg) msg.innerText = data.mensaje;
    mostrarVista('vista-menu');
  }
});

socket.on('respuesta_logout', () => {
  saldoActualCuenta = 0;
  saldoVisible = false;
  operacionActual = null;

  mostrarVista('vista-login');

  const cardHolderMain = document.getElementById('card-holder-display');
  if (cardHolderMain) cardHolderMain.innerText = 'CUENTA BANCARIA';

  const msg = document.getElementById('mensaje-estado');
  if (msg) msg.innerText = 'Sesión cerrada correctamente.';
});


// ------------------------------------------------------------
// 2. FUNCIONES DE OPERACIONES DEL CAJERO
// ------------------------------------------------------------

function ejecutarLogin() {
  const numeroCuenta = document.getElementById('input-cuenta').value.trim();
  const pin = document.getElementById('input-pin').value.trim();
  const msg = document.getElementById('mensaje-estado');

  if (!numeroCuenta || !pin) {
    if (msg) msg.innerText = 'Por favor ingresa tu número de cuenta y PIN.';
    return;
  }
  socket.emit('login', { numeroCuenta, pin });
}

function consultarSaldo() {
  operacionActual = null;
  socket.emit('consultar_saldo');
}

function prepararMonto(tipo) {
  operacionActual = tipo;
  const tituloEl = document.getElementById('monto-titulo');
  if (tituloEl) {
    tituloEl.innerText = `Monto a ${tipo.toLowerCase()}:`;
  }
  const inputMonto = document.getElementById('input-monto');
  if (inputMonto) inputMonto.value = '';

  mostrarVista('vista-monto');
}

function asignarMontoRapido(valor) {
  const inputMonto = document.getElementById('input-monto');
  if (inputMonto) inputMonto.value = valor;
}

function confirmarMonto() {
  const inputMonto = document.getElementById('input-monto');
  const monto = Number(inputMonto ? inputMonto.value : 0);
  const msg = document.getElementById('mensaje-estado');

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
  const msg = document.getElementById('mensaje-estado');
  if (msg) msg.innerText = '';
  mostrarVista('vista-menu');
}

function cerrarSesion() {
  socket.emit('logout');
}


// ------------------------------------------------------------
// 3. CONTROL DE SALDO, COMPROBANTE Y VISTAS
// ------------------------------------------------------------

function toggleVisibilidadSaldoATM() {
  saldoVisible = !saldoVisible;
  actualizarDisplaySaldoATM();
}

function actualizarDisplaySaldoATM() {
  const display = document.getElementById('atm-saldo-display');
  const btnIcon = document.getElementById('btn-balance-icon');

  if (!display || !btnIcon) return;

  if (saldoVisible) {
    display.innerText = `$ ${saldoActualCuenta.toLocaleString('es-CO')}`;
    btnIcon.innerText = 'Ocultar';
  } else {
    display.innerText = '$ ••••••••';
    btnIcon.innerText = 'Mostrar';
  }
}

function generarComprobanteDigital(tipo, monto, nuevoSaldo) {
  const ahora = new Date();
  const fechaStr = ahora.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  
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

  mostrarVista('vista-comprobante');
}

function mostrarVista(idVista) {
  const vistas = ['vista-login', 'vista-menu', 'vista-monto', 'vista-comprobante'];
  vistas.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('oculto');
  });

  const vistaTarget = document.getElementById(idVista);
  if (vistaTarget) {
    vistaTarget.classList.remove('oculto');
  }
}

function redirigirAMiCuenta() {
  const seccionMiCuenta = document.getElementById('seccion-mi-cuenta') || document.querySelector('.dashboard-account-container') || document.querySelector('.terminal-container');
  
  if (seccionMiCuenta) {
    seccionMiCuenta.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#seccion-mi-cuenta') {
      link.classList.add('active');
    }
  });
}


// ------------------------------------------------------------
// 4. INTERACTIVIDAD DE LA TARJETA 3D DE LA PORTADA
// ------------------------------------------------------------

function voltearTarjeta() {
  const card = document.getElementById('interactive-card');
  if (card) {
    card.classList.toggle('flipped');
  }
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

      const rotateX = (-y / rect.height) * 16;
      const rotateY = (x / rect.width) * 16;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    container.addEventListener('mouseleave', () => {
      if (!card.classList.contains('flipped')) {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      }
    });
  }
});