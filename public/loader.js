// Shared loader initialization
(function() {
  // Hide loader after delay
  setTimeout(function() {
    var loader = document.querySelector('.page-loader');
    if (loader) {
      loader.classList.add('hidden');
    }
    document.body.classList.add('loaded');
  }, 500);
})();
