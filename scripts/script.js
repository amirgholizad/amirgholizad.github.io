// Overlay Management

function openOverlay(id) {
  const template = document.getElementById('tpl-' + id);
  if (!template) return;

  const content = document.getElementById('overlay-content');
  content.innerHTML = '';
  content.appendChild(template.content.cloneNode(true));

  const overlay = document.getElementById('overlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeOverlay() {
  // Stop YouTube iframes to prevent audio playback after close
  document.querySelectorAll('#overlay-content iframe').forEach((frame) => {
    const src = frame.src;
    frame.src = '';
    frame.src = src;
  });

  const overlay = document.getElementById('overlay');
  overlay.classList.remove('active');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
  // Tile click handlers
  document.querySelectorAll('[data-overlay]').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      openOverlay(button.dataset.overlay);
    });
  });

  // Overlay close button
  const closeBtn = document.querySelector('.overlay-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeOverlay);
  }

  // Backdrop click
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'overlay' || e.target.classList.contains('overlay-backdrop')) {
        closeOverlay();
      }
    });
  }

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlay();
    }
  });
});
