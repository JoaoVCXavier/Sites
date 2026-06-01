/* ============================================================
   MISTER DUAS RODAS — script.js
   ============================================================ */

/* ---- Navbar: scroll + mobile toggle ---- */
const header    = document.querySelector('header');
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
  document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 400);
});

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navMenu.classList.toggle('open');
});

// Fecha menu ao clicar em link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
  });
});

/* ---- Smooth scroll para links âncora ---- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ---- Scroll Top ---- */
document.getElementById('scrollTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---- Intersection Observer: reveal animations ---- */
const revealEls = document.querySelectorAll('.reveal, .reveal-delay, .reveal-card');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger para cards
      if (entry.target.classList.contains('reveal-card')) {
        const siblings = Array.from(entry.target.parentElement.children)
          .filter(el => el.classList.contains('reveal-card'));
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${idx * 0.1}s`;
      }
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => observer.observe(el));

/* ---- Barra de Pesquisa ---- */

function formatSearchSlug(text) {
  return encodeURIComponent(text)
    .replace(/%20/g, '-')
    .replace(/-{2,}/g, '-');
}

function searchStore(store) {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) { shakInput(); return; }

  const encoded = encodeURIComponent(query);
  const slug = formatSearchSlug(query);

  if (store === 'shopee') {
    window.open(`https://shopee.com.br/shop/463402988/search?keyword=${encoded}`, '_blank');
    return;
  }

  if (store === 'ml') {
    window.open(`https://lista.mercadolivre.com.br/loja/mister-duas-rodas/${slug}`, '_blank');
  }
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchStore('ml');
  });
}

function shakInput() {
  const input = document.getElementById('searchInput');
  input.style.borderColor = 'var(--red)';
  input.style.boxShadow   = '0 0 0 3px var(--red-glow2)';

  let start = null;
  const duration = 400;
  const shakePositions = [0, -8, 8, -6, 6, -4, 4, 0];

  function animateShake(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const progress = elapsed / duration;

    if (progress < 1) {
      const pos = shakePositions[Math.floor(progress * shakePositions.length)];
      input.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(animateShake);
    } else {
      input.style.transform = '';
      input.placeholder = 'Digite o nome do produto primeiro...';
    }
  }
  requestAnimationFrame(animateShake);

  setTimeout(() => {
    input.style.borderColor = '';
    input.style.boxShadow   = '';
    input.placeholder = 'Ex: pastilha de freio, filtro de ar, capacete...';
  }, 2500);
}

/* ---- Active nav link no scroll ---- */
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    const sTop = sec.offsetTop - 120;
    if (window.scrollY >= sTop) current = sec.getAttribute('id');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}, { passive: true });

/* ---- Parallax leve no hero ---- */
const heroFlares = document.querySelectorAll('.hero-flare');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  heroFlares.forEach((flare, i) => {
    const dir = i === 0 ? -1 : 1;
    flare.style.transform = `translateY(${y * 0.12 * dir}px)`;
  });
}, { passive: true });
/* Fecha o menu mobile e volta ao início ao clicar na logo */
const navLogo = document.querySelector('.nav-logo');
if (navLogo) {
  navLogo.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
  });
}


/* ---- Cookie Banner ---- */
(function () {
  const banner   = document.getElementById('cookieBanner');
  const btnAcept = document.getElementById('cookieAceitar');
  const btnDecl  = document.getElementById('cookieRecusar');

  if (!banner) return;

  const consent = localStorage.getItem('cookieConsent');
  if (!consent) {
    setTimeout(() => banner.classList.add('show'), 800);
  }

  function closeBanner(choice) {
    banner.classList.remove('show');
    localStorage.setItem('cookieConsent', choice);
  }

  btnAcept.addEventListener('click', () => closeBanner('accepted'));
  btnDecl.addEventListener('click',  () => closeBanner('declined'));
})();
