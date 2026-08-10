(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const body = document.body;
  const gate = $('#openingGate');
  const track = $('#swipeTrack');
  const thumb = $('#swipeThumb');
  const lotusRain = $('#lotusRain');
  const invitation = $('#invitation');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let invitationOpened = false;
  let revealObserver = null;
  let lotusInterval = null;

  /* ==========================================================
     SCROLL REVEALS — IN AND OUT
     ========================================================== */

  const revealItems = $$('[data-animate]');

  function initRevealObserver() {
    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else {
            entry.target.classList.remove('is-visible');
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '-4% 0px -8% 0px'
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  function revealHero() {
    $$('.hero [data-animate]').forEach((item, index) => {
      window.setTimeout(() => {
        item.classList.add('is-visible');
      }, reduceMotion ? 0 : 180 + index * 190);
    });
  }

  /* ==========================================================
     SWIPE TO OPEN
     ========================================================== */

  let dragging = false;
  let pointerId = null;
  let startClientX = 0;
  let startProgress = 0;
  let progress = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function getSwipeMetrics() {
    const wrap = thumb.parentElement;
    const wrapRect = wrap.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();

    const leftInset = parseFloat(getComputedStyle(thumb).left) || 0;
    const rightInset = leftInset;
    const maxX = Math.max(
      0,
      wrapRect.width - thumbRect.width - leftInset - rightInset
    );

    return { maxX };
  }

  function setProgress(next, animate = false) {
    progress = clamp(next, 0, 1);
    const { maxX } = getSwipeMetrics();
    const x = maxX * progress;

    thumb.style.setProperty('--swipe-x', `${x}px`);
    thumb.setAttribute('aria-valuenow', String(Math.round(progress * 100)));

    if (animate) {
      thumb.classList.remove('is-dragging');
    }
  }

  function resetSwipe() {
    setProgress(0, true);
  }

  function completeSwipe() {
    if (invitationOpened) return;

    setProgress(1, true);
    invitationOpened = true;

    window.setTimeout(openInvitation, reduceMotion ? 0 : 160);
  }

  function onPointerDown(event) {
    if (invitationOpened) return;

    dragging = true;
    pointerId = event.pointerId;
    startClientX = event.clientX;
    startProgress = progress;

    thumb.setPointerCapture(pointerId);
    thumb.classList.add('is-dragging');
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== pointerId) return;

    const { maxX } = getSwipeMetrics();
    if (!maxX) return;

    const delta = event.clientX - startClientX;
    setProgress(startProgress + delta / maxX);
  }

  function finishPointer(event) {
    if (!dragging || event.pointerId !== pointerId) return;

    dragging = false;

    try {
      thumb.releasePointerCapture(pointerId);
    } catch {
      // Pointer may already be released by the browser.
    }

    pointerId = null;
    thumb.classList.remove('is-dragging');

    if (progress >= 0.78) {
      completeSwipe();
    } else {
      resetSwipe();
    }
  }

  thumb.addEventListener('pointerdown', onPointerDown);
  thumb.addEventListener('pointermove', onPointerMove);
  thumb.addEventListener('pointerup', finishPointer);
  thumb.addEventListener('pointercancel', finishPointer);

  thumb.addEventListener('keydown', (event) => {
    if (invitationOpened) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setProgress(progress + 0.12, true);
      if (progress >= 0.9) completeSwipe();
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setProgress(progress - 0.12, true);
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      completeSwipe();
    }
  });

  window.addEventListener('resize', () => {
    if (!invitationOpened) setProgress(progress);
  });

  /* ==========================================================
     LOTUS BLESSING SHOWER
     ========================================================== */

  function createLotus({
    delay = 0,
    minSize = 28,
    maxSize = 54,
    opacity = 0.88
  } = {}) {
    if (!lotusRain || reduceMotion) return;

    const drop = document.createElement('div');
    const img = document.createElement('img');

    drop.className = 'lotus-drop';
    img.src = 'assets/lotus-diya.png';
    img.alt = '';

    const x = 4 + Math.random() * 92;
    const size = minSize + Math.random() * (maxSize - minSize);
    const duration = 5.8 + Math.random() * 3.8;
    const drift = -48 + Math.random() * 96;
    const finalOpacity = Math.max(.48, opacity - Math.random() * .18);

    drop.style.setProperty('--drop-x', `${x}vw`);
    drop.style.setProperty('--drop-size', `${size}px`);
    drop.style.setProperty('--drop-duration', `${duration}s`);
    drop.style.setProperty('--drop-delay', `${delay}s`);
    drop.style.setProperty('--drift', `${drift}px`);
    drop.style.setProperty('--drop-opacity', finalOpacity.toFixed(2));

    drop.appendChild(img);
    lotusRain.appendChild(drop);

    const cleanupDelay = (duration + delay + 1) * 1000;
    window.setTimeout(() => drop.remove(), cleanupDelay);
  }

  function lotusBlessingBurst() {
    if (reduceMotion) return;

    const count = window.innerWidth <= 450 ? 12 : 16;

    for (let i = 0; i < count; i += 1) {
      createLotus({
        delay: i * 0.13 + Math.random() * 0.3,
        minSize: 28,
        maxSize: 58,
        opacity: 0.92
      });
    }
  }

  function startGentleLotusRain() {
    if (reduceMotion || lotusInterval) return;

    lotusInterval = window.setInterval(() => {
      if (document.hidden) return;

      createLotus({
        delay: 0,
        minSize: 25,
        maxSize: 46,
        opacity: 0.74
      });
    }, 1150);
  }

  /* ==========================================================
     OPEN INVITATION
     ========================================================== */

  function openInvitation() {
    body.classList.remove('site-locked');
    body.classList.add('invitation-entering');

    gate.classList.add('is-opening');

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    revealHero();
    lotusBlessingBurst();

    window.setTimeout(() => {
      gate.hidden = true;
      body.classList.remove('invitation-entering');
      invitation.removeAttribute('aria-hidden');
      startGentleLotusRain();
    }, reduceMotion ? 0 : 1050);
  }

  /* ==========================================================
     COUNTDOWN
     ========================================================== */

  const weddingDate = new Date('2026-12-11T20:00:00+05:30');

  const daysEl = $('#days');
  const hoursEl = $('#hours');
  const minutesEl = $('#minutes');
  const secondsEl = $('#seconds');
  const countdownMini = $('#countdownMini');
  const countdownPanel = $('#countdownPanel');
  const countdownButton = $('#countdownButton');
  const closeCountdown = $('#closeCountdown');

  const pad = (value, size = 2) => String(value).padStart(size, '0');

  function updateCountdown() {
    const diff = Math.max(0, weddingDate.getTime() - Date.now());

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (daysEl) daysEl.textContent = pad(days, 3);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minutesEl) minutesEl.textContent = pad(minutes);
    if (secondsEl) secondsEl.textContent = pad(seconds);

    if (countdownMini) {
      countdownMini.textContent =
        diff === 0
          ? 'THE CELEBRATION HAS BEGUN'
          : `${days} DAYS • ${pad(hours)} HRS`;
    }
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  function openCountdown() {
    if (!countdownPanel || !countdownButton) return;

    countdownPanel.hidden = false;
    countdownButton.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden';

    window.requestAnimationFrame(() => {
      closeCountdown?.focus();
    });
  }

  function hideCountdown() {
    if (!countdownPanel || !countdownButton) return;

    countdownPanel.hidden = true;
    countdownButton.setAttribute('aria-expanded', 'false');
    body.style.overflow = '';
    countdownButton.focus();
  }

  countdownButton?.addEventListener('click', openCountdown);
  closeCountdown?.addEventListener('click', hideCountdown);

  countdownPanel?.addEventListener('click', (event) => {
    if (event.target === countdownPanel) hideCountdown();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && countdownPanel && !countdownPanel.hidden) {
      hideCountdown();
    }
  });

  /* ==========================================================
     RSVP + MAP
     ========================================================== */

  const rsvpFeedback = $('#rsvpFeedback');
  const rsvpInputs = $$('input[name="rsvp"]');

  const rsvpMessages = {
    yes: 'We would love to celebrate with you.',
    no: 'Thank you for letting us know.',
    later: 'No problem — you can confirm later.'
  };

  rsvpInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (rsvpFeedback) {
        rsvpFeedback.textContent = rsvpMessages[input.value] || '';
      }
    });
  });

  const mapLink = $('#mapLink');

  mapLink?.addEventListener('click', (event) => {
    event.preventDefault();

    const original = 'LOCATION MAP LINK';
    mapLink.textContent = 'LOCATION DETAILS COMING SOON';

    window.setTimeout(() => {
      mapLink.textContent = original;
    }, 2200);
  });

  /* ==========================================================
     RESTRAINED HERO PARALLAX
     ========================================================== */

  if (!reduceMotion) {
    let rafId = 0;

    const onScroll = () => {
      if (!invitationOpened || rafId) return;

      rafId = window.requestAnimationFrame(() => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const monogram = $('.monogram');

        if (monogram && scrollY < 850) {
          monogram.style.marginTop = `${Math.min(5, scrollY * 0.008)}px`;
        }

        rafId = 0;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ==========================================================
     INITIALIZE
     ========================================================== */

  initRevealObserver();

  // Ensure the gate owns focus on first load.
  window.addEventListener('load', () => {
    setProgress(0);

    window.setTimeout(() => {
      thumb?.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 850);
  });
})();
