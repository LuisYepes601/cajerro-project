// Lógica para la Sección de Tarjetas con Giro 3D y Sincronización de Datos

let tipoTarjetaActual = 'fisica'; // 'fisica' o 'virtual'
let cvvVisible = false;

// Mapeo de datos por tarjeta
const datosTarjetas = {
  fisica: {
    tag: 'FÍSICA',
    tipoTexto: 'Física',
    numero: '•••• •••• •••• 8824',
    exp: '08/28',
    cvv: '882',
  },
  virtual: {
    tag: 'VIRTUAL',
    tipoTexto: 'Virtual Dinámica',
    numero: '4532 •••• •••• 1904',
    exp: '11/29',
    cvv: '419',
  }
};

// Giro manual de la tarjeta
function voltearMiniTarjeta() {
  const miniDisplay = document.getElementById('mini-card-display');
  if (miniDisplay) {
    miniDisplay.classList.toggle('flipped');
  }
}

// Alternar entre Tarjeta Física y Virtual
function cambiarTipoTarjeta(tipo) {
  tipoTarjetaActual = tipo;

  const btnFisica = document.getElementById('btn-tab-fisica');
  const btnVirtual = document.getElementById('btn-tab-virtual');
  const miniDisplay = document.getElementById('mini-card-display');

  if (tipo === 'fisica') {
    btnFisica.classList.add('active');
    btnVirtual.classList.remove('active');
    miniDisplay.classList.remove('is-virtual');
  } else {
    btnVirtual.classList.add('active');
    btnFisica.classList.remove('active');
    miniDisplay.classList.add('is-virtual');
  }

  actualizarVistaMiniTarjeta();
}

// Actualiza la cara frontal y posterior según la tarjeta elegida y el estado del CVV
function actualizarVistaMiniTarjeta() {
  const cardData = datosTarjetas[tipoTarjetaActual];

  document.getElementById('display-card-type-tag').innerText = cardData.tag;
  document.getElementById('display-card-type-text').innerText = cardData.tipoTexto;
  document.getElementById('display-card-number').innerText = cardData.numero;
  document.getElementById('display-card-exp').innerText = cardData.exp;
  
  const elCvv = document.getElementById('display-card-cvv');
  const btnText = document.getElementById('btn-cvv-text');

  if (cvvVisible) {
    elCvv.innerText = cardData.cvv;
    btnText.innerText = 'Ocultar CVV Dinámico';
  } else {
    elCvv.innerText = '•••';
    btnText.innerText = 'Mostrar CVV Dinámico';
  }
}

// Botón para alternar visibilidad del CVV y voltear la tarjeta automáticamente
function toggleRevelarCVV() {
  cvvVisible = !cvvVisible;
  actualizarVistaMiniTarjeta();

  const miniDisplay = document.getElementById('mini-card-display');
  if (cvvVisible) {
    // Si activa el CVV, voltea automáticamente la tarjeta para mostrar el reverso
    miniDisplay.classList.add('flipped');
  } else {
    // Si oculta el CVV, la devuelve al frente
    miniDisplay.classList.remove('flipped');
  }
}

function actualizarLimiteTarjeta(monto) {
  const label = document.getElementById('label-limite-monto');
  if (label) {
    label.innerText = `$ ${Number(monto).toLocaleString('es-CO')}`;
  }
}

function alternarBloqueoTarjeta() {
  const toggle = document.getElementById('toggle-bloqueo');
  const miniDisplay = document.getElementById('mini-card-display');

  if (toggle.checked) {
    miniDisplay.style.opacity = '0.45';
    miniDisplay.style.filter = 'grayscale(0.9)';
  } else {
    miniDisplay.style.opacity = '1';
    miniDisplay.style.filter = 'none';
  }
}

// Actualiza el nombre del titular en ambas tarjetas cuando el usuario inicia sesión
document.addEventListener('DOMContentLoaded', () => {
  const cardHolderDisplay = document.getElementById('card-holder-display');
  const displayCardHolder = document.getElementById('display-card-holder');

  // Observador de cambios para mantener el nombre del titular sincronizado
  if (cardHolderDisplay && displayCardHolder) {
    const observer = new MutationObserver(() => {
      displayCardHolder.innerText = cardHolderDisplay.innerText;
    });

    observer.observe(cardHolderDisplay, { childList: true, characterData: true, subtree: true });
  }

  actualizarVistaMiniTarjeta();
});