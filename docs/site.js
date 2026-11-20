/* Markflow public website: self-contained, accessible, no external requests or dependencies. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const themeButton = $('#theme-toggle');
  const savedTheme = (() => { try { return localStorage.getItem('markflow-website-theme'); } catch { return null; } })();
  root.dataset.theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
  function updateThemeLabel() { themeButton.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); }
  updateThemeLabel();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    updateThemeLabel();
    try { localStorage.setItem('markflow-website-theme', root.dataset.theme); } catch { /* private mode */ }
  });

  // Discrete demos give immediate feedback; nothing is persisted or uploaded.
  const demo = { highlight: true, note: true, comment: true, visible: true };
  const highlight = $('#demo-highlight');
  const comment = $('#demo-comment');
  const note = $('#demo-note');
  const colors = $('#demo-colors');
  const tools = {
    highlight: $('#demo-tool-highlight'),
    note: $('#demo-tool-note'),
    comment: $('#demo-tool-comment'),
    visible: $('#demo-tool-eye')
  };
  function renderDemo() {
    const active = demo.visible;
    highlight.classList.toggle('is-hidden', !active || !demo.highlight);
    comment.classList.toggle('is-hidden', !active || !demo.comment);
    note.classList.toggle('is-hidden', !active || !demo.note);
    colors.classList.toggle('is-hidden', !active || !demo.highlight);
    Object.entries(tools).forEach(([key, el]) => {
      el.classList.toggle('is-active', demo[key]);
      el.setAttribute('aria-pressed', String(demo[key]));
    });
    tools.visible.setAttribute('aria-label', demo.visible ? 'Hide annotations' : 'Show annotations');
  }
  ['highlight', 'note', 'comment'].forEach(k => tools[k].addEventListener('click', () => { demo[k] = !demo[k]; if (!demo.visible) demo.visible = true; renderDemo(); }));
  tools.visible.addEventListener('click', () => { demo.visible = !demo.visible; renderDemo(); });
  $('#demo-comment-close').addEventListener('click', () => { demo.comment = false; renderDemo(); });
  $$('.color-dot').forEach(button => button.addEventListener('click', () => {
    highlight.style.setProperty('--demo-marker', button.dataset.marker);
    highlight.style.setProperty('--demo-ink', button.dataset.color);
    $$('.color-dot').forEach(dot => { const selected = dot === button; dot.classList.toggle('is-selected', selected); dot.setAttribute('aria-pressed', String(selected)); });
  }));
  renderDemo();

  // Direct manipulation for the note, with grab offset and pointer capture.
  const grip = $('#demo-note-grip');
  const viewport = $('#interactive-browser').querySelector('.browser-body');
  let drag = null;
  grip.addEventListener('pointerdown', event => {
    if (event.button !== 0 || window.innerWidth < 760 || !demo.note || !demo.visible) return;
    const parent = viewport.getBoundingClientRect();
    const rect = note.getBoundingClientRect();
    note.style.left = `${rect.left - parent.left}px`;
    note.style.top = `${rect.top - parent.top}px`;
    note.style.right = 'auto';
    note.style.bottom = 'auto';
    note.style.transform = 'none';
    drag = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    grip.setPointerCapture(event.pointerId);
    note.classList.add('is-dragging');
  });
  grip.addEventListener('pointermove', event => {
    if (!drag) return;
    const rect = viewport.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.width - note.offsetWidth - 8, event.clientX - rect.left - drag.x));
    const top = Math.max(8, Math.min(rect.height - note.offsetHeight - 8, event.clientY - rect.top - drag.y));
    note.style.left = `${left}px`;
    note.style.top = `${top}px`;
  });
  function endDrag() { if (!drag) return; drag = null; note.classList.remove('is-dragging'); }
  grip.addEventListener('pointerup', endDrag);
  grip.addEventListener('pointercancel', endDrag);

  const GALLERY = {
    annotate: { image: 'assets/workspace-v2.png', title: 'Mark the moment.', desc: 'Give interesting passages a little more attention. Highlight, comment, sketch, and keep a thought beside the text.', alt: 'Markflow annotation toolbar on an article', index: '01 / 04' },
    library: { image: 'assets/library-v2.png', title: 'A home for every idea.', desc: 'Browse your annotated pages, find a specific thought, and return to it without hunting through tabs.', alt: 'Markflow dashboard showing local annotation library', index: '02 / 04' },
    focus: { image: 'assets/reading.png', title: 'More reading. Less noise.', desc: 'Switch to a clean, temporary reading view, then return to the original webpage whenever you want.', alt: 'Markflow distraction-free reading mode', index: '03 / 04' },
    privacy: { image: 'assets/privacy-v2.png', title: 'Your space. Your rules.', desc: 'Manage local storage, review your data, create backups, and choose the sites where you want Markflow to pause.', alt: 'Markflow privacy and local storage controls', index: '04 / 04' }
  };
  const galleryImage = $('#gallery-image');
  const galleryPanel = $('#gallery-panel');
  const galleryTitle = $('#gallery-title');
  const galleryDescription = $('#gallery-description');
  const galleryIndex = $('#gallery-index');
  const tabs = $$('.gallery-tab');
  function selectGallery(key, focus = false) {
    const next = GALLERY[key]; if (!next) return;
    galleryImage.classList.add('is-changing');
    galleryImage.src = next.image;
    galleryImage.alt = next.alt;
    galleryTitle.textContent = next.title;
    galleryDescription.textContent = next.desc;
    galleryIndex.textContent = next.index;
    tabs.forEach(button => {
      const active = button.dataset.gallery === key;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active) { galleryPanel.setAttribute('aria-labelledby', button.id); if (focus) button.focus(); }
    });
    if (reduced) galleryImage.classList.remove('is-changing');
  }
  galleryImage.addEventListener('load', () => galleryImage.classList.remove('is-changing'));
  tabs.forEach((button, index) => {
    button.addEventListener('click', () => selectGallery(button.dataset.gallery));
    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectGallery(tabs[next].dataset.gallery, true);
    });
  });

  // Observer only runs for reveal-once elements; no repeated scroll animations.
  if ('IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver((entries) => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
  } else { $$('.reveal').forEach(el => el.classList.add('is-revealed')); }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const available = document.documentElement.scrollHeight - innerHeight;
      $('#progress-bar').style.transform = `scaleX(${available > 0 ? Math.max(0, Math.min(1, scrollY / available)) : 0})`;
      $('#site-header').classList.toggle('is-scrolled', scrollY > 12);
      ticking = false;
    });
  }, { passive: true });

  let toastTimer;
  const toast = $('#toast');
  $('#copy-extensions').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('chrome://extensions');
      toast.textContent = 'Copied chrome://extensions';
    } catch { toast.textContent = 'Copy this address: chrome://extensions'; }
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  });
})();
