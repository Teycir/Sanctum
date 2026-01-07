// Text Pressure Effect - Hover animation on title
function initTextPressure(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  const text = container.textContent;
  container.innerHTML = '';
  
  text.split('').forEach((char) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char;
    span.style.display = 'inline-block';
    span.style.transition = 'all 0.1s ease-out';
    span.style.fontWeight = '400';
    if (char === ' ') span.style.whiteSpace = 'pre';
    container.appendChild(span);
  });

  const isMobile = 'ontouchstart' in window || window.innerWidth < 768;
  if (isMobile) {
    container.querySelectorAll('.char').forEach(char => {
      char.style.fontWeight = '700';
    });
    return;
  }

  const handleMouseMove = (e) => {
    const chars = container.querySelectorAll('.char');
    chars.forEach((char) => {
      const rect = char.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;
      
      const distanceX = e.clientX - charCenterX;
      const distanceY = e.clientY - charCenterY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      const maxDistance = 200;
      const influence = Math.max(0, 1 - distance / maxDistance);
      
      const fontWeight = 400 + influence * 500;
      char.style.fontWeight = fontWeight.toString();
    });
  };

  document.addEventListener('mousemove', handleMouseMove);
}

// Make initTextPressure globally accessible
window.initTextPressure = initTextPressure;

// Animated Tagline - Scramble reveal effect
function initAnimatedTagline(selector) {
  const element = document.querySelector(selector);
  if (!element) return;

  const text = element.textContent;
  element.innerHTML = '';
  
  const chars = text.split('').map((char, i) => {
    const span = document.createElement('span');
    span.className = 'tagline-char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.style.transition = 'all 0.2s ease-out';
    element.appendChild(span);
    return span;
  });

  // Reveal animation (reverse order)
  chars.reverse().forEach((span, i) => {
    setTimeout(() => {
      span.style.opacity = '1';
    }, i * 50);
  });

  // Hover effects
  element.addEventListener('mouseenter', () => {
    element.style.transform = 'scale(1.05)';
    element.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)';
  });

  element.addEventListener('mouseleave', () => {
    element.style.transform = 'scale(1)';
    element.style.textShadow = 'none';
  });

  chars.forEach((span) => {
    span.addEventListener('mouseenter', () => {
      span.style.transform = 'translateY(-2px)';
      span.style.color = '#ffffff';
      span.style.textShadow = '0 0 10px rgba(255, 255, 255, 1)';
    });

    span.addEventListener('mouseleave', () => {
      span.style.transform = 'translateY(0)';
      span.style.color = '';
      span.style.textShadow = '';
    });
  });
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTextPressure('.text-pressure');
    initAnimatedTagline('.animated-tagline');
  });
} else {
  initTextPressure('.text-pressure');
  initAnimatedTagline('.animated-tagline');
}
