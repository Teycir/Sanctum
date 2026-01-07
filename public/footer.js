// Shared footer component
(function() {
  const footer = document.createElement('footer');
  footer.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 20px; font-size: clamp(11px, 2.5vw, 12px); color: rgba(255, 255, 255, 0.6); padding: 12px 20px; background: linear-gradient(to top, rgba(10, 14, 39, 0.95), transparent); backdrop-filter: blur(10px); z-index: 100;';
  
  const links = [
    { href: '/faq.html', text: 'FAQ' },
    { href: '/how-to-use.html', text: 'How to Use' },
    { href: '/canary.html', text: 'Warrant Canary' },
    { href: 'https://teycirbensoltane.tn', text: 'Made by Teycir', external: true }
  ];
  
  links.forEach((link, i) => {
    if (i > 0) {
      const dot = document.createElement('span');
      dot.textContent = '•';
      dot.style.cssText = 'color: rgba(255, 255, 255, 0.3); user-select: none;';
      footer.appendChild(dot);
    }
    
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.style.cssText = 'color: rgba(255, 255, 255, 0.6); text-decoration: none; transition: color 0.2s;';
    if (link.external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    a.addEventListener('mouseenter', () => a.style.color = '#fff');
    a.addEventListener('mouseleave', () => a.style.color = 'rgba(255, 255, 255, 0.6)');
    footer.appendChild(a);
  });
  
  document.body.appendChild(footer);
})();
