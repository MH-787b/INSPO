/**
 * INSPO — Inspiration engine for artists
 */

(function () {
  'use strict';

  // ── State ──
  let data = null;
  let currentCategory = null; // null = random from all
  let currentInspiration = null;
  let imageIndex = Math.floor(Math.random() * 1000);

  // ── DOM refs ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const bgImg = $('.inspiration__bg img');
  const content = $('.inspiration__content');
  const categoryLabel = $('.inspiration__category');
  const promptEl = $('.inspiration__prompt');
  const wordEl = $('.inspiration__word');
  const inspireBtn = $('#inspire-btn');
  const soundBtn = $('#sound-btn');
  const soundIndicator = $('.sound-indicator');
  const categoriesContainer = $('.categories');
  const loadingScreen = $('.loading-screen');

  // ── Init ──

  async function init() {
    try {
      const res = await fetch('data/inspirations.json');
      data = await res.json();
    } catch (e) {
      console.error('Failed to load inspiration data:', e);
      return;
    }

    buildCategoryPills();
    bindEvents();
    await generateInspiration();

    // Hide loader
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 400);
  }

  // ── Categories ──

  function buildCategoryPills() {
    // "All" pill
    const allPill = document.createElement('button');
    allPill.className = 'category-pill active';
    allPill.textContent = 'All';
    allPill.dataset.category = '';
    categoriesContainer.appendChild(allPill);

    for (const [key, cat] of Object.entries(data.categories)) {
      const pill = document.createElement('button');
      pill.className = 'category-pill';
      pill.textContent = `${cat.icon} ${cat.name}`;
      pill.dataset.category = key;
      categoriesContainer.appendChild(pill);
    }
  }

  // ── Generate Inspiration ──

  async function generateInspiration() {
    // Fade out
    content.classList.remove('visible');

    await sleep(300);

    // Pick category
    const categories = Object.keys(data.categories);
    const catKey = currentCategory || categories[Math.floor(Math.random() * categories.length)];
    const cat = data.categories[catKey];

    // Pick random prompt and word
    const prompt = cat.prompts[Math.floor(Math.random() * cat.prompts.length)];
    const word = cat.words[Math.floor(Math.random() * cat.words.length)];

    // Update text
    categoryLabel.textContent = `${cat.icon} ${cat.name}`;
    promptEl.textContent = prompt;
    wordEl.textContent = word;

    currentInspiration = { category: catKey, prompt, word, soundType: cat.soundType };

    // Load new image
    loadImage(catKey);

    // If sound is playing, switch to new category sound
    if (AudioEngine.playing) {
      AudioEngine.play(cat.soundType);
    }

    // Fade in
    await sleep(200);
    content.classList.add('visible');
  }

  function loadImage(category) {
    imageIndex = Math.floor(Math.random() * 1000);
    const seed = `${category}-${imageIndex}`;
    const url = `https://picsum.photos/seed/${seed}/1400/900`;

    bgImg.classList.remove('loaded');

    const img = new Image();
    img.onload = () => {
      bgImg.src = url;
      bgImg.classList.add('loaded');
    };
    img.onerror = () => {
      // Fallback: try without seed
      bgImg.src = `https://picsum.photos/1400/900?random=${Date.now()}`;
      bgImg.classList.add('loaded');
    };
    img.src = url;
  }

  // ── Events ──

  function bindEvents() {
    inspireBtn.addEventListener('click', generateInspiration);

    soundBtn.addEventListener('click', () => {
      if (!currentInspiration) return;
      const playing = AudioEngine.toggle(currentInspiration.soundType);
      soundBtn.classList.toggle('active', playing);
      soundIndicator.classList.toggle('playing', playing);
    });

    // Category pills (event delegation)
    categoriesContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.category-pill');
      if (!pill) return;

      $$('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      currentCategory = pill.dataset.category || null;
      generateInspiration();
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        generateInspiration();
      }
    });

    // Subscribe form
    const form = $('#subscribe-form');
    if (form) {
      form.addEventListener('submit', handleSubscribe);
    }
  }

  // ── Subscribe ──

  async function handleSubscribe(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Subscribing...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.style.display = 'none';
        $('.subscribe__success').classList.add('visible');
      } else {
        submitBtn.textContent = 'Something went wrong — try again';
        submitBtn.disabled = false;
      }
    } catch {
      submitBtn.textContent = 'Something went wrong — try again';
      submitBtn.disabled = false;
    }
  }

  // ── Helpers ──

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── Start ──
  document.addEventListener('DOMContentLoaded', init);
})();
