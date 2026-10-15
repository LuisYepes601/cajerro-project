// Navegación suave por Navbar hacia la sección Informativa de Seguridad

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === '#seccion-seguridad') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const seccionSeguridad = document.getElementById('seccion-seguridad');
        if (seccionSeguridad) {
          seccionSeguridad.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });
});