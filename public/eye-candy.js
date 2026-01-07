// Particle System - Floating lock icons/dots
function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 30;

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.speedY = Math.random() * 0.5 - 0.25;
      this.opacity = Math.random() * 0.3 + 0.1;
      this.isLock = Math.random() > 0.7;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }

    draw() {
      ctx.fillStyle = `rgba(65, 105, 225, ${this.opacity})`;
      if (this.isLock) {
        // Draw lock icon
        ctx.fillRect(this.x - this.size, this.y, this.size * 2, this.size * 2);
        ctx.fillRect(this.x - this.size * 0.5, this.y - this.size, this.size, this.size);
      } else {
        // Draw dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// Scroll Fade-In Animations
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.faq-item, .step, .card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// Interactive Cursor Trail
function initCursorTrail() {
  const trail = document.createElement('div');
  trail.style.position = 'fixed';
  trail.style.width = '20px';
  trail.style.height = '20px';
  trail.style.borderRadius = '50%';
  trail.style.background = 'radial-gradient(circle, rgba(65, 105, 225, 0.4), transparent)';
  trail.style.pointerEvents = 'none';
  trail.style.zIndex = '9999';
  trail.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
  trail.style.opacity = '0';
  document.body.appendChild(trail);

  let mouseX = 0, mouseY = 0;
  let trailX = 0, trailY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    trail.style.opacity = '1';
  });

  function animateTrail() {
    trailX += (mouseX - trailX) * 0.15;
    trailY += (mouseY - trailY) * 0.15;
    trail.style.left = trailX - 10 + 'px';
    trail.style.top = trailY - 10 + 'px';
    requestAnimationFrame(animateTrail);
  }

  animateTrail();
}

// Initialize all effects
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initScrollAnimations();
  initCursorTrail();
});
