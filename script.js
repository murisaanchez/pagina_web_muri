// ============================================================
// Muriel Sánchez — Portfolio
// Menú móvil + reveal al hacer scroll
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- Menú móvil (burger) ----
  const nav = document.querySelector('.nav');
  const burger = document.getElementById('burger');

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });

    // Cierra el menú al hacer clic en un link
    nav.querySelectorAll('.nav__links a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Reveal suave al hacer scroll ----
  const revealTargets = document.querySelectorAll(
    '.feat-card, .link-card, .workshop-card, .tide-list li, .contact-link, .photo-card, .profile-banner'
  );

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    revealTargets.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .6s ease, transform .6s ease';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => observer.observe(el));
  }

});