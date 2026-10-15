// Lógica para la Sección de Ayuda (Acordeón de Preguntas Frecuentes y Buscador)

function toggleFaq(buttonElement) {
  const faqItem = buttonElement.parentElement;
  const isActive = faqItem.classList.contains('active');

  // Cerrar todos los demás ítems activos
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });

  // Alternar el ítem seleccionado
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

function filtrarPreguntas() {
  const input = document.getElementById('input-help-search');
  if (!input) return;

  const query = input.value.toLowerCase().trim();
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const texto = item.innerText.toLowerCase();
    if (texto.includes(query)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Navegación fluida desde el Navbar hacia #seccion-ayuda
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === '#seccion-ayuda') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const seccionAyuda = document.getElementById('seccion-ayuda');
        if (seccionAyuda) {
          seccionAyuda.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });
});