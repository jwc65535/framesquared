// ── Theme Toggle ──────────────────────────────────────────
const root = document.documentElement;
const stored = localStorage.getItem('fs-theme') || 'dark';
if (stored === 'light') root.setAttribute('data-theme', 'light');

document.getElementById('themeToggle')?.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('fs-theme', next);
});

// ── Nav scroll ────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Active nav link ───────────────────────────────────────
const path = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === path || (path === '' && href === 'index.html')) {
    a.classList.add('active');
  }
});

// ── Package selector ──────────────────────────────────────
document.querySelectorAll('.pkg-item').forEach(item => {
  item.addEventListener('click', () => {
    const pkg = item.dataset.pkg;
    document.querySelectorAll('.pkg-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.pkg-detail').forEach(d => d.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('detail-' + pkg)?.classList.add('active');
  });
});

// ── Reveal on scroll ──────────────────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Sidebar active link (getting-started) ────────────────
const sections = document.querySelectorAll('.gs-content section[id]');
if (sections.length) {
  const sideLinks = document.querySelectorAll('.gs-nav-group a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        sideLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach(s => io.observe(s));
}
