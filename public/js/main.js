// ===== MOBILE NAV TOGGLE =====
function toggleNav() {
  var links = document.getElementById('navLinks');
  var toggle = document.getElementById('navToggle');
  links.classList.toggle('open');
  toggle.classList.toggle('active');
}

// Hamburger animation
var style = document.createElement('style');
style.textContent = `
  .nav-toggle.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .nav-toggle.active span:nth-child(2) { opacity: 0; }
  .nav-toggle.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
`;
document.head.appendChild(style);

// Close nav when link clicked
document.querySelectorAll('.nav-links a').forEach(function(link) {
  link.addEventListener('click', function() {
    document.getElementById('navLinks').classList.remove('open');
    document.getElementById('navToggle').classList.remove('active');
  });
});

// Close nav when clicking outside
document.addEventListener('click', function(e) {
  var navbar = document.querySelector('.navbar');
  if (navbar && !navbar.contains(e.target)) {
    document.getElementById('navLinks').classList.remove('open');
    var toggle = document.getElementById('navToggle');
    if (toggle) toggle.classList.remove('active');
  }
});

// ===== SCROLL TO TOP =====
var scrollBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', function() {
  if (scrollBtn) scrollBtn.classList.toggle('visible', window.scrollY > 400);
});

// ===== FADE-IN ANIMATIONS =====
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in').forEach(function(el) { observer.observe(el); });

// ===== GALLERY LIGHTBOX =====
document.querySelectorAll('.gallery-item').forEach(function(item) {
  item.addEventListener('click', function() {
    var img = item.querySelector('img');
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.93);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:16px;';
    var image = document.createElement('img');
    image.src = img.src;
    image.style.cssText = 'max-width:100%;max-height:90vh;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,0.5);object-fit:contain;';
    var close = document.createElement('button');
    close.innerHTML = '✕';
    close.style.cssText = 'position:absolute;top:16px;right:20px;background:rgba(255,255,255,0.15);border:none;color:white;font-size:1.5rem;cursor:pointer;width:40px;height:40px;border-radius:50%;line-height:1;';
    overlay.appendChild(image);
    overlay.appendChild(close);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    var closeFn = function() { overlay.remove(); document.body.style.overflow = ''; };
    overlay.addEventListener('click', closeFn);
    close.addEventListener('click', function(e) { e.stopPropagation(); closeFn(); });
  });
});

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, duration) {
  duration = duration || 1500;
  var start = 0;
  var step = target / (duration / 16);
  var timer = setInterval(function() {
    start += step;
    if (start >= target) { el.textContent = target + '+'; clearInterval(timer); return; }
    el.textContent = Math.floor(start) + '+';
  }, 16);
}

var statsObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-num').forEach(function(num) {
        var val = parseInt(num.textContent);
        if (!isNaN(val)) animateCounter(num, val);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

var heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);
