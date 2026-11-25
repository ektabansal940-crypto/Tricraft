(() => {
  const root = document.documentElement;
  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const finePointerQuery = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
  const mobileDrawerQuery = window.matchMedia ? window.matchMedia('(max-width: 767px)') : null;

  const isReducedMotion = () => Boolean(motionQuery && motionQuery.matches);
  const isFinePointer = () => Boolean(finePointerQuery && finePointerQuery.matches);
  const isCompactViewport = () =>
    (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) || !isFinePointer();

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');

  // Mobile navigation drawer: open/close, accessible focus, Escape & outside click
  if (toggle && nav) {
    const navLinks = Array.from(nav.querySelectorAll('a'));
    navLinks.forEach((link, idx) => {
      link.style.setProperty('--nav-index', String(idx));
    });

    const syncDrawerAccessibility = () => {
      const isDrawerMode = Boolean(mobileDrawerQuery && mobileDrawerQuery.matches);
      const isOpen = nav.classList.contains('is-open');
      if (isDrawerMode && !isOpen) {
        nav.setAttribute('aria-hidden', 'true');
        navLinks.forEach(link => link.setAttribute('tabindex', '-1'));
      } else {
        nav.removeAttribute('aria-hidden');
        navLinks.forEach(link => link.removeAttribute('tabindex'));
      }
    };

    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      nav.classList.remove('is-open');
      syncDrawerAccessibility();
    };

    const openMenu = () => {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation');
      nav.classList.add('is-open');
      syncDrawerAccessibility();
    };

    syncDrawerAccessibility();

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.forEach(link => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', event => {
      if (
        nav.classList.contains('is-open') &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener('resize', () => {
      if (mobileDrawerQuery && !mobileDrawerQuery.matches && nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        syncDrawerAccessibility();
      }
    }, { passive: true });
  }

  // Footer copyright year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header scroll state & active nav indicator
  const updateHeaderState = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 18);
  };
  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  if (nav && 'IntersectionObserver' in window) {
    const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sections = navLinks
      .map(link => {
        const target = document.querySelector(link.getAttribute('href'));
        return target ? { link, target } : null;
      })
      .filter(Boolean);

    if (sections.length) {
      const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const item = sections.find(s => s.target === entry.target);
          if (!item) return;
          if (entry.isIntersecting) {
            navLinks.forEach(l => l.classList.remove('is-active'));
            item.link.classList.add('is-active');
          }
        });
      }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

      sections.forEach(s => navObserver.observe(s.target));
    }
  }

  // Hero entrance + sticky-stack settle
  if (!isReducedMotion()) {
    root.classList.add('motion-ready');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.add('is-hero-ready');
        window.setTimeout(() => {
          root.classList.add('is-hero-settled');
        }, 1150);
      });
    });
  }

  // Scroll-triggered reveals with coordinated stagger
  const staggerGroups = [
    { selector: '.section-label', step: 0, max: 0 },
    { selector: '.belief-main', step: 0, max: 0 },
    { selector: '.belief .section-aside', step: 0, max: 0, offset: 120 },
    { selector: '.services-heading > *', step: 85, max: 2 },
    { selector: '.service-card', step: 75, max: 4 },
    { selector: '.capability-caveat', step: 0, max: 0 },
    { selector: '.perspectives-heading > *', step: 85, max: 2 },
    { selector: '.article-row', step: 80, max: 3 },
    { selector: '.editorial-disclaimer', step: 0, max: 0 },
    { selector: '.practice-intro > *', step: 85, max: 2 },
    { selector: '.work-card .work-meta', step: 85, max: 3, offset: 60 },
    { selector: '.work-card .work-summary', step: 85, max: 3, offset: 120 },
    { selector: '.section-end-link', step: 0, max: 0 },
    { selector: '.conversation-copy > *', step: 70, max: 4 },
    { selector: '.people-intro > *', step: 85, max: 2 },
    { selector: '.people-prompts > div', step: 85, max: 3 },
    { selector: '.people-note', step: 0, max: 0 },
    { selector: '.closing h2', step: 0, max: 0 },
    { selector: '.closing-pillars > div', step: 80, max: 3 },
    { selector: '.contact-top, .contact h2, .contact-link, .contact-bottom, .contact-note', step: 65, max: 4 },
    { selector: '.footer-main > *, .footer-bottom', step: 65, max: 4 }
  ];

  const revealTargets = [];
  staggerGroups.forEach(group => {
    document.querySelectorAll(group.selector).forEach((el, idx) => {
      el.classList.add('reveal');
      if (group.step > 0 || group.offset) {
        const capped = group.max ? Math.min(idx, group.max) : idx;
        const delay = (group.offset || 0) + capped * group.step;
        el.style.setProperty('--stagger-delay', `${delay}ms`);
      }
      revealTargets.push(el);
    });
  });

  const mediaTargets = Array.from(
    new Set(document.querySelectorAll('.work-image, .conversation-art, .reveal-media'))
  );
  mediaTargets.forEach(el => el.classList.add('reveal-media'));
  ['.service-media', '.article-thumb', '.work-image'].forEach(sel => {
    document.querySelectorAll(sel).forEach((el, idx) => {
      el.style.setProperty('--stagger-delay', `${Math.min(idx, 3) * 85}ms`);
    });
  });

  const allTargets = [...revealTargets, ...mediaTargets];
  let revealObserver = null;

  const revealAllImmediately = () => {
    allTargets.forEach(el => el.classList.add('is-visible'));
    document.querySelectorAll('.process-step').forEach(s => s.classList.add('is-step-active'));
    document.querySelectorAll('.closing-pillars > div').forEach(p => p.classList.add('is-pillar-active'));
  };

  if (!isReducedMotion() && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04, rootMargin: '0px 0px -12px 0px' });

    allTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealAllImmediately();
  }

  // Touch & keyboard interactive card groups (03 Services, 04 Perspectives, 05 Practice, 07 People)
  const setupInteractiveGroup = (containerSelector, itemSelector, toggleContainerActiveClass = false) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const items = Array.from(container.querySelectorAll(itemSelector));
    const toggleItem = item => {
      const wasActive = item.classList.contains('is-active');
      items.forEach(el => el.classList.remove('is-active'));
      if (!wasActive) {
        item.classList.add('is-active');
        if (toggleContainerActiveClass) container.classList.add('has-active');
      } else if (toggleContainerActiveClass) {
        container.classList.remove('has-active');
      }
    };

    items.forEach(item => {
      item.addEventListener('click', () => toggleItem(item));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleItem(item);
        }
      });
    });
  };

  setupInteractiveGroup('.service-grid', '.service-card', true);
  setupInteractiveGroup('.article-list', '.article-row');
  setupInteractiveGroup('.work-grid', '.work-card');
  setupInteractiveGroup('.people-prompts', ':scope > div');

  // Scroll-driven choreography (adapted for desktop vs tablet/mobile)
  if (!isReducedMotion()) {
    const heroStage = document.querySelector('.hero-stage');
    const beliefEl = document.querySelector('.belief');
    const practiceEl = document.querySelector('.practice');
    const practiceSeqEl = document.querySelector('.section-end-link');
    const processSteps = Array.from(document.querySelectorAll('.process-step'));
    const convEl = document.querySelector('.conversation-art');
    const peopleEl = document.querySelector('.people-prompts');
    const closingEl = document.querySelector('.closing');
    const closingPillars = Array.from(document.querySelectorAll('.closing-pillars > div'));

    const clamp01 = v => Math.max(0, Math.min(1, v));
    let scrollTicking = false;
    let lastScrollY = window.scrollY;

    const resetDesktopScrollVars = () => {
      root.style.removeProperty('--hero-p');
      if (beliefEl) beliefEl.style.removeProperty('--belief-p');
      if (practiceEl) {
        const wg = practiceEl.querySelector('.work-grid');
        if (wg) wg.style.removeProperty('--practice-p');
      }
      if (convEl) convEl.style.removeProperty('--conv-p');
      if (peopleEl) peopleEl.style.removeProperty('--people-p');
    };

    const updateScrollProgress = () => {
      scrollTicking = false;
      const vh = window.innerHeight || 900;
      const currentY = window.scrollY;
      const scrollingDown = currentY >= lastScrollY;
      lastScrollY = currentY;

      if (currentY > 4) root.classList.add('is-hero-settled');

      // Ensure fast scrolls never leave any reveal or media target hidden
      allTargets.forEach(el => {
        if (el.classList.contains('is-visible')) return;
        const rect = el.getBoundingClientRect();
        const inView = rect.top < vh - 12 && rect.bottom > 12;
        const passedDown = scrollingDown && rect.top < vh - 12;
        if (inView || passedDown) {
          el.classList.add('is-visible');
          if (revealObserver) revealObserver.unobserve(el);
        }
      });

      const compact = isCompactViewport();

      if (compact) {
        resetDesktopScrollVars();
      } else {
        if (heroStage) {
          const r = heroStage.getBoundingClientRect();
          const heroSpan = Math.max(240, r.height * 0.85);
          root.style.setProperty('--hero-p', clamp01(-r.top / heroSpan).toFixed(4));
        }

        if (beliefEl) {
          const r = beliefEl.getBoundingClientRect();
          beliefEl.style.setProperty('--belief-p', clamp01((vh - r.top) / (vh * 0.82)).toFixed(4));
        }

        if (practiceEl) {
          const workGrid = practiceEl.querySelector('.work-grid');
          if (workGrid) {
            const r = workGrid.getBoundingClientRect();
            const p = clamp01((vh * 0.96 - r.top) / (vh * 0.62));
            workGrid.style.setProperty('--practice-p', p.toFixed(4));
          }
        }

        if (convEl) {
          const r = convEl.getBoundingClientRect();
          const enterP = clamp01((vh - r.top) / (vh * 0.72));
          convEl.style.setProperty('--conv-p', enterP.toFixed(4));
        }

        if (peopleEl) {
          const r = peopleEl.getBoundingClientRect();
          peopleEl.style.setProperty('--people-p', clamp01((vh - r.top) / (vh + r.height)).toFixed(4));
        }
      }

      // Lightweight sequence & closing pillar activation across all viewports
      if (practiceSeqEl) {
        const r = practiceSeqEl.getBoundingClientRect();
        const reached = r.top < vh * 0.92;
        const seqP = compact
          ? (reached ? 1 : 0)
          : clamp01((vh * 0.92 - r.top) / (vh * 0.45));
        practiceSeqEl.style.setProperty('--practice-seq-p', seqP.toFixed(4));
        processSteps.forEach((stepEl, idx) => {
          const threshold = idx / Math.max(1, processSteps.length);
          if (seqP >= threshold * 0.85) {
            stepEl.classList.add('is-step-active');
          } else if (!compact) {
            stepEl.classList.remove('is-step-active');
          }
        });
      }

      if (closingEl) {
        const r = closingEl.getBoundingClientRect();
        const reached = r.top < vh * 0.88;
        const cp = compact
          ? (reached ? 1 : 0)
          : clamp01((vh * 0.9 - r.top) / (vh * 0.78));
        closingEl.style.setProperty('--closing-p', cp.toFixed(4));
        closingPillars.forEach((pillar, idx) => {
          const threshold = idx === 0 ? 0.15 : idx === 1 ? 0.42 : 0.68;
          if (cp >= threshold) {
            pillar.classList.add('is-pillar-active');
          } else if (!compact && r.top > vh) {
            pillar.classList.remove('is-pillar-active');
          }
        });
      }
    };

    const requestScrollUpdate = () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateScrollProgress);
      }
    };

    updateScrollProgress();
    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate, { passive: true });
  } else {
    revealAllImmediately();
  }

  // Dynamic reduced-motion listener
  if (motionQuery && typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', event => {
      if (event.matches) {
        root.classList.remove('motion-ready', 'is-hero-ready', 'is-hero-settled');
        revealAllImmediately();
      }
    });
  }

  // Spotlight cursor reveal & magnetic Closing CTA (desktop fine pointer only)
  if (!isReducedMotion() && isFinePointer()) {
    document.querySelectorAll('.spotlight-surface').forEach(surface => {
      let targetX = 50;
      let targetY = 50;
      let currentX = 50;
      let currentY = 50;
      let rafId = 0;

      const animateSpotlight = () => {
        currentX += (targetX - currentX) * 0.16;
        currentY += (targetY - currentY) * 0.16;
        surface.style.setProperty('--mx', `${currentX.toFixed(2)}%`);
        surface.style.setProperty('--my', `${currentY.toFixed(2)}%`);
        if (Math.abs(targetX - currentX) > 0.08 || Math.abs(targetY - currentY) > 0.08) {
          rafId = requestAnimationFrame(animateSpotlight);
        } else {
          rafId = 0;
        }
      };

      surface.addEventListener('pointermove', e => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        const r = surface.getBoundingClientRect();
        if (!r.width || !r.height) return;
        targetX = ((e.clientX - r.left) / r.width) * 100;
        targetY = ((e.clientY - r.top) / r.height) * 100;
        surface.style.setProperty('--spotlight-alpha', '1');
        if (!rafId) rafId = requestAnimationFrame(animateSpotlight);
      });

      surface.addEventListener('pointerleave', () => {
        surface.style.setProperty('--spotlight-alpha', '0');
      });
    });

    const magBtn = document.querySelector('.magnetic-cta');
    if (magBtn) {
      magBtn.addEventListener('pointermove', e => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        const r = magBtn.getBoundingClientRect();
        const dx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 6;
        const dy = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 5;
        magBtn.style.setProperty('--mag-x', `${Math.max(-6, Math.min(6, dx)).toFixed(2)}px`);
        magBtn.style.setProperty('--mag-y', `${Math.max(-5, Math.min(5, dy)).toFixed(2)}px`);
      });
      magBtn.addEventListener('pointerleave', () => {
        magBtn.style.setProperty('--mag-x', '0px');
        magBtn.style.setProperty('--mag-y', '0px');
      });
    }
  }

  // Seamless infinite ticker calibration (exact sequence width & consistent speed)
  const ticker = document.querySelector('.ticker');
  const tickerTrack = document.querySelector('.ticker-track');
  if (ticker && tickerTrack) {
    const sequences = tickerTrack.querySelectorAll('.ticker-seq');
    const primarySeq = sequences[0];
    const duplicateSeq = sequences[1];

    if (primarySeq && duplicateSeq) {
      const unitHTML = '<span>Think with intent</span><i>✳</i><span>Create with purpose</span><i>✳</i><span>Communicate with clarity</span><i>✳</i>';
      const speedPxPerSec = 28;
      let lastSeqWidth = 0;

      const syncTicker = () => {
        const containerWidth = ticker.getBoundingClientRect().width || window.innerWidth;
        let seqWidth = primarySeq.getBoundingClientRect().width;
        let guard = 0;

        while (seqWidth > 0 && seqWidth < containerWidth + 120 && guard < 8) {
          primarySeq.insertAdjacentHTML('beforeend', unitHTML);
          duplicateSeq.insertAdjacentHTML('beforeend', unitHTML);
          seqWidth = primarySeq.getBoundingClientRect().width;
          guard += 1;
        }

        if (seqWidth > 0 && Math.abs(seqWidth - lastSeqWidth) > 0.5) {
          lastSeqWidth = seqWidth;
          tickerTrack.style.setProperty('--ticker-distance', `-${seqWidth}px`);
          tickerTrack.style.setProperty('--ticker-duration', `${(seqWidth / speedPxPerSec).toFixed(2)}s`);
        }
      };

      syncTicker();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(syncTicker);
      }
      window.addEventListener('resize', syncTicker, { passive: true });
    }
  }
})();
