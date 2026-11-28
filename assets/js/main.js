(() => {
  const root = document.documentElement;
  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const finePointerQuery = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
  const mobileDrawerQuery = window.matchMedia ? window.matchMedia('(max-width: 767px)') : null;

  const isReducedMotion = () => Boolean(motionQuery && motionQuery.matches);
  const isFinePointer = () => Boolean(finePointerQuery && finePointerQuery.matches);
  const isCompactViewport = () =>
    (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) || !isFinePointer();
  const isDesktopFolderPinned = () =>
    Boolean(window.matchMedia && window.matchMedia('(min-width: 960px) and (min-height: 560px)').matches);

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');

  // 01 / Mobile navigation drawer: open/close, accessible focus, Escape & outside click
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
      if (isOpen) closeMenu();
      else openMenu();
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

  // Header scroll elevation & active section indicator
  const updateHeaderState = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 18);
  };
  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  // Functional Back-to-Top navigation to exact top of Hero
  const scrollToHeroTop = event => {
    if (event) event.preventDefault();
    if (nav && nav.classList.contains('is-open') && toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      nav.classList.remove('is-open');
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: isReducedMotion() ? 'auto' : 'smooth'
    });
  };

  document.querySelectorAll('.back-top, .footer-wordmark, .header-logo[href="#top"]').forEach(ctrl => {
    ctrl.addEventListener('click', scrollToHeroTop);
  });

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

  // 02 / Opening Hero masked entrance + sticky settle
  if (!isReducedMotion()) {
    root.classList.add('motion-ready');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.add('is-hero-ready');
        window.setTimeout(() => {
          root.classList.add('is-hero-settled');
        }, 1200);
      });
    });
  }

  // Coordinated scroll-triggered reveals across sections
  const staggerGroups = [
    { selector: '.section-label', step: 0, max: 0 },
    { selector: '.belief-main', step: 0, max: 0 },
    { selector: '.belief .section-aside', step: 0, max: 0, offset: 120 },
    { selector: '.services-heading > *', step: 85, max: 2 },
    { selector: '.service-card', step: 85, max: 4 },
    { selector: '.capability-caveat', step: 0, max: 0 },
    { selector: '.perspectives-heading > *', step: 85, max: 2 },
    { selector: '.article-row', step: 110, max: 3 },
    { selector: '.editorial-disclaimer', step: 0, max: 0 },
    { selector: '.practice-intro > *', step: 85, max: 2 },
    { selector: '.section-end-link', step: 0, max: 0 },
    { selector: '.thinking-copy > *', step: 75, max: 4 },
    { selector: '.conversation-copy > *', step: 75, max: 4 },
    { selector: '.closing h2', step: 0, max: 0 },
    { selector: '.contact-top, .contact h2, .contact-subline, .contact-link, .contact-bottom, .contact-note', step: 70, max: 5 },
    { selector: '.footer-main > *, .footer-wordmark-stage, .footer-bottom', step: 85, max: 4 }
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

  const mediaTargets = Array.from(document.querySelectorAll('.reveal-media'));
  ['.service-media', '.article-thumb'].forEach(sel => {
    document.querySelectorAll(sel).forEach((el, idx) => {
      el.style.setProperty('--stagger-delay', `${Math.min(idx, 3) * 95}ms`);
    });
  });

  const allTargets = [...revealTargets, ...mediaTargets];
  const pendingTargets = new Set(allTargets);
  let revealObserver = null;

  // Declare folder references before revealAllImmediately() runs on reduced-motion / no-IO browsers
  const folderShell = document.querySelector('.case-folder-shell');
  const folderToggle = document.querySelector('.folder-toggle');
  const syncFolderLabel = opened => {
    if (!folderToggle) return;
    folderToggle.setAttribute('aria-expanded', String(opened));
    const label = folderToggle.querySelector('span');
    if (label) label.textContent = opened ? 'Tuck sheets' : 'Spread sheets';
  };

  const revealAllImmediately = () => {
    allTargets.forEach(el => el.classList.add('is-visible'));
    pendingTargets.clear();
    if (folderShell) {
      folderShell.classList.add('is-folder-opened');
      syncFolderLabel(true);
    }
    document.querySelectorAll('.process-step').forEach(s => s.classList.add('is-step-active'));
    document.querySelectorAll('.closing-pillar').forEach(p => p.classList.add('is-pillar-active'));
  };

  if (!isReducedMotion() && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          pendingTargets.delete(entry.target);
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04, rootMargin: '0px 0px -12px 0px' });

    allTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealAllImmediately();
  }

  // Interactive tap/keyboard toggle groups (03 Services, 04 Perspectives, 07 People mosaic)
  const setupInteractiveGroup = (containerSelector, itemSelector, toggleContainerActiveClass = false) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const items = Array.from(container.querySelectorAll(itemSelector));
    const syncExpandedState = () => {
      items.forEach(el => {
        const expanded = el.classList.contains('is-active');
        if (el.hasAttribute('aria-expanded')) {
          el.setAttribute('aria-expanded', String(expanded));
        }
        const detail = el.querySelector('.service-detail');
        if (detail) detail.setAttribute('aria-hidden', String(!expanded));
        const readLabel = el.querySelector('.service-readmore span');
        if (readLabel) readLabel.textContent = expanded ? 'Read less' : 'Read more';
      });
    };

    const toggleItem = item => {
      const wasActive = item.classList.contains('is-active');
      items.forEach(el => el.classList.remove('is-active'));
      if (!wasActive) {
        item.classList.add('is-active');
        if (toggleContainerActiveClass) container.classList.add('has-active');
      } else if (toggleContainerActiveClass) {
        container.classList.remove('has-active');
      }
      syncExpandedState();
    };

    syncExpandedState();

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
  setupInteractiveGroup('.people-prompts', '.mosaic-card');

  // 05 / Partner folder: opens smoothly when hovering a card/packet, closes on mouse-leave (tap on touch)
  if (folderShell) {
    const workCards = Array.from(folderShell.querySelectorAll('.work-card'));
    const tabletLayoutQuery = window.matchMedia ? window.matchMedia('(max-width: 900px)') : null;
    const supportsHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const useTapMode = () => !supportsHover() || Boolean(tabletLayoutQuery && tabletLayoutQuery.matches);

    const syncFolderState = () => {
      const opened =
        folderShell.classList.contains('is-folder-open') ||
        folderShell.classList.contains('is-folder-opened');
      workCards.forEach(card => card.setAttribute('aria-expanded', String(opened)));
      syncFolderLabel(opened);
    };

    const setHoverOpen = open => {
      folderShell.classList.toggle('is-folder-open', open);
      syncFolderState();
    };

    syncFolderState();

    // Hovering any peeking card or the folder packet opens the 3-card fan smoothly;
    // moving between cards inside .case-folder-shell stays open with zero flicker and closes on leave.
    const openTriggers = folderShell.querySelectorAll('.work-card, .case-folder-front, .folder-tab, .case-folder-back');
    openTriggers.forEach(trigger => {
      trigger.addEventListener('pointerenter', e => {
        if (e.pointerType === 'mouse' && supportsHover()) {
          setHoverOpen(true);
        }
      });
    });

    folderShell.addEventListener('pointerleave', e => {
      if (e.pointerType === 'mouse' && supportsHover()) {
        folderShell.classList.remove('is-folder-opened');
        setHoverOpen(false);
      }
    });

    folderShell.addEventListener('focusin', e => {
      if (e.target.closest('.work-card') && e.target.matches(':focus-visible')) {
        setHoverOpen(true);
      }
    });

    folderShell.addEventListener('focusout', e => {
      if (!folderShell.contains(e.relatedTarget)) {
        setHoverOpen(false);
      }
    });

    workCards.forEach(card => {
      card.addEventListener('click', e => {
        if (!useTapMode()) return;
        e.stopPropagation();
        setHoverOpen(!folderShell.classList.contains('is-folder-open'));
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setHoverOpen(!folderShell.classList.contains('is-folder-open'));
        } else if (e.key === 'Escape') {
          folderShell.classList.remove('is-folder-opened');
          setHoverOpen(false);
          card.blur();
        }
      });
    });

    folderShell.addEventListener('click', e => {
      if (useTapMode() && !e.target.closest('.folder-toggle')) {
        setHoverOpen(!folderShell.classList.contains('is-folder-open'));
      }
    });

    document.addEventListener('click', e => {
      if (!folderShell.contains(e.target)) {
        folderShell.classList.remove('is-folder-open');
        if (useTapMode()) folderShell.classList.remove('is-folder-opened');
        syncFolderState();
      }
    });

    if (folderToggle) {
      folderToggle.addEventListener('click', e => {
        e.stopPropagation();
        const pinned = folderShell.classList.contains('is-folder-opened');
        if (pinned) {
          folderShell.classList.remove('is-folder-opened', 'is-folder-open');
        } else {
          folderShell.classList.add('is-folder-opened');
        }
        syncFolderState();
      });
    }

    window.addEventListener('resize', () => {
      if (!useTapMode()) {
        folderShell.classList.remove('is-folder-open');
        syncFolderState();
      }
    }, { passive: true });
  }

  // Scroll-driven choreography: Hero 3-scene slideshow, Practice Room case-file folder, Process timelines, Spotlight parallax
  if (!isReducedMotion()) {
    const heroStage = document.querySelector('.hero-stage');
    const heroSection = document.querySelector('.hero');
    const heroVisual = document.querySelector('.hero-visual');
    const heroSlideCounter = document.querySelector('.hero-slide-counter');
    const heroSlideNum = document.querySelector('.hero-slide-num');
    const beliefEl = document.querySelector('.belief');
    const practiceStage = document.querySelector('.practice-stage');
    const practiceSeqEl = document.querySelector('.section-end-link');
    const processSteps = Array.from(document.querySelectorAll('.process-step'));
    const convSections = Array.from(document.querySelectorAll('.conversation'));
    const closingEl = document.querySelector('.closing');
    const closingPillars = Array.from(document.querySelectorAll('.closing-pillar'));
    const contactSection = document.querySelector('.contact');

    const clamp01 = v => Math.max(0, Math.min(1, v));
    const smoothstep = (edge0, edge1, x) => {
      const t = clamp01((x - edge0) / Math.max(0.0001, edge1 - edge0));
      return t * t * (3 - 2 * t);
    };
    let scrollTicking = false;
    let lastScrollY = window.scrollY;
    let lastHeroSlideNum = '03';
    let maxFolderAppear = 0;

    const resetDesktopVars = () => {
      root.style.removeProperty('--hero-p');
      if (heroVisual) {
        heroVisual.style.setProperty('--hero-slide-p', '0');
        heroVisual.style.setProperty('--slide2-p', '0');
        heroVisual.style.setProperty('--slide3-p', '0');
      }
      if (beliefEl) beliefEl.style.removeProperty('--belief-p');
      convSections.forEach(sec => sec.style.removeProperty('--conv-p'));
      if (contactSection) contactSection.style.removeProperty('--contact-p');
      if (folderShell) {
        folderShell.style.removeProperty('--folder-appear');
      }
    };

    const updateScrollProgress = () => {
      scrollTicking = false;
      const vh = window.innerHeight || 900;
      const currentY = window.scrollY;
      const scrollingDown = currentY >= lastScrollY;
      lastScrollY = currentY;

      const compact = isCompactViewport();
      const isTabletOrDesktop = !Boolean(mobileDrawerQuery && mobileDrawerQuery.matches);
      const closingPillarsWrap = closingEl ? closingEl.querySelector('.closing-pillars') : null;
      const isMobileTimeline = Boolean(mobileDrawerQuery && mobileDrawerQuery.matches);

      // Phase 1: Batch all layout reads before any DOM writes to prevent forced reflow
      const toReveal = [];
      pendingTargets.forEach(el => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < vh - 12 && rect.bottom > 12;
        const passedDown = scrollingDown && rect.top < vh - 12;
        if (inView || passedDown) toReveal.push(el);
      });

      const heroMetrics = (heroStage && heroSection && heroVisual) ? {
        sr: heroStage.getBoundingClientRect(),
        stageH: heroStage.offsetHeight,
        heroH: heroSection.offsetHeight,
        visualTop: heroVisual.offsetTop,
        visualH: heroVisual.offsetHeight
      } : null;

      const beliefRect = (!compact && beliefEl) ? beliefEl.getBoundingClientRect() : null;
      const convRects = (!compact && convSections.length)
        ? convSections.map(sec => ({ sec, rect: sec.getBoundingClientRect() }))
        : [];
      const contactRect = (!compact && contactSection) ? contactSection.getBoundingClientRect() : null;
      const folderRect = folderShell ? (practiceStage || folderShell).getBoundingClientRect() : null;
      const seqRect = practiceSeqEl ? practiceSeqEl.getBoundingClientRect() : null;
      const closingRect = closingEl ? closingEl.getBoundingClientRect() : null;
      const pillarsRect = closingPillarsWrap ? closingPillarsWrap.getBoundingClientRect() : null;

      let mobileNodeMetrics = null;
      if (isMobileTimeline && closingPillarsWrap && closingPillars.length >= 3) {
        const n0 = closingPillars[0].querySelector('.pillar-node');
        const n1 = closingPillars[1].querySelector('.pillar-node');
        const n2 = closingPillars[2].querySelector('.pillar-node');
        if (n0 && n1 && n2) {
          mobileNodeMetrics = {
            y0: n0.getBoundingClientRect().top + n0.offsetHeight / 2,
            y1: n1.getBoundingClientRect().top + n1.offsetHeight / 2,
            y2: n2.getBoundingClientRect().top + n2.offsetHeight / 2
          };
        }
      }

      // Phase 2: Perform all DOM mutations together
      if (currentY > 4) root.classList.add('is-hero-settled');

      toReveal.forEach(el => {
        el.classList.add('is-visible');
        pendingTargets.delete(el);
        if (revealObserver) revealObserver.unobserve(el);
      });

      // 02 / Scroll-controlled 3-scene hero slideshow (03/03 -> 02/03 -> 01/03)
      if (heroMetrics) {
        let slideP = 0;
        if (isTabletOrDesktop && heroMetrics.stageH > heroMetrics.heroH + 48) {
          const pinTravel = Math.max(1, heroMetrics.stageH - heroMetrics.heroH);
          slideP = clamp01(-heroMetrics.sr.top / pinTravel);
        } else {
          const mobileSpan = Math.max(260, heroMetrics.visualTop + heroMetrics.visualH * 0.65);
          slideP = clamp01(currentY / mobileSpan);
        }

        const slide2P = smoothstep(0.16, 0.48, slideP);
        const slide3P = smoothstep(0.54, 0.86, slideP);

        heroVisual.style.setProperty('--hero-slide-p', slideP.toFixed(4));
        heroVisual.style.setProperty('--slide2-p', slide2P.toFixed(4));
        heroVisual.style.setProperty('--slide3-p', slide3P.toFixed(4));
        root.style.setProperty('--hero-p', slideP.toFixed(4));

        const nextSlideNum = slideP >= 0.70 ? '01' : slideP >= 0.32 ? '02' : '03';
        if (nextSlideNum !== lastHeroSlideNum) {
          lastHeroSlideNum = nextSlideNum;
          if (heroSlideNum) heroSlideNum.textContent = nextSlideNum;
          if (heroSlideCounter) {
            const sceneOrdinal = nextSlideNum === '03' ? 1 : nextSlideNum === '02' ? 2 : 3;
            heroSlideCounter.setAttribute('aria-label', `Hero scene ${sceneOrdinal} of 3`);
          }
        }
      }

      if (compact) {
        if (beliefEl) beliefEl.style.removeProperty('--belief-p');
        convSections.forEach(sec => sec.style.removeProperty('--conv-p'));
        if (contactSection) contactSection.style.removeProperty('--contact-p');
      } else {
        if (beliefRect) {
          beliefEl.style.setProperty('--belief-p', clamp01((vh - beliefRect.top) / (vh * 0.82)).toFixed(4));
        }
        convRects.forEach(({ sec, rect }) => {
          sec.style.setProperty('--conv-p', clamp01((vh - rect.top) / (vh + rect.height)).toFixed(4));
        });
        if (contactRect) {
          contactSection.style.setProperty('--contact-p', clamp01((vh - contactRect.top) / (vh + contactRect.height)).toFixed(4));
        }
      }

      // 05 / Partner folder subtle pocket entrance opacity on scroll (stays tucked until hovered)
      if (folderRect) {
        const span = Math.max(1, vh * 0.54);
        const rawP = clamp01((vh * 0.90 - folderRect.top) / span);
        const passed = folderRect.top < vh * 0.48 ? 1 : rawP;
        maxFolderAppear = Math.max(maxFolderAppear, smoothstep(0, 0.38, passed));
        folderShell.style.setProperty('--folder-appear', maxFolderAppear.toFixed(4));
      }

      // 06 / Smooth bidirectional sequence timelines (Practice sequence + Think/Create/Communicate)
      if (seqRect) {
        const seqSpan = compact ? vh * 0.34 : vh * 0.44;
        const seqP = clamp01((vh * 0.92 - seqRect.top) / seqSpan);
        practiceSeqEl.style.setProperty('--practice-seq-p', seqP.toFixed(4));
        processSteps.forEach((stepEl, idx) => {
          const threshold = idx / Math.max(1, processSteps.length);
          stepEl.classList.toggle('is-step-active', seqP >= threshold * 0.85);
        });
      }

      if (closingRect) {
        const phraseP = clamp01((vh * 0.9 - closingRect.top) / (vh * 0.65));
        closingEl.style.setProperty('--closing-p', phraseP.toFixed(4));

        if (pillarsRect) {
          const startY = isMobileTimeline ? vh * 0.90 : vh * 0.90;
          const travel = isMobileTimeline ? vh * 0.46 : vh * 0.44;
          const lineP = clamp01((startY - pillarsRect.top) / travel);
          closingPillarsWrap.style.setProperty('--closing-p', lineP.toFixed(4));

          let midThreshold = 0.5;
          if (mobileNodeMetrics) {
            const span = Math.max(1, mobileNodeMetrics.y2 - mobileNodeMetrics.y0);
            closingPillarsWrap.style.setProperty('--mobile-track-h', `${span.toFixed(1)}px`);
            midThreshold = clamp01((mobileNodeMetrics.y1 - mobileNodeMetrics.y0) / span);
          } else {
            closingPillarsWrap.style.removeProperty('--mobile-track-h');
          }

          closingPillars.forEach((pillar, idx) => {
            const threshold = idx === 0 ? 0.04 : idx === 1 ? midThreshold : 0.94;
            pillar.classList.toggle('is-pillar-active', lineP >= threshold);
          });
        }
      }
    };

    let scrollRafId = 0;
    const requestScrollUpdate = () => {
      if (!scrollTicking) {
        scrollTicking = true;
        scrollRafId = requestAnimationFrame(() => {
          scrollRafId = 0;
          updateScrollProgress();
        });
      }
    };

    const cleanupScrollChoreography = () => {
      if (scrollRafId) {
        cancelAnimationFrame(scrollRafId);
        scrollRafId = 0;
      }
      window.removeEventListener('scroll', requestScrollUpdate);
      window.removeEventListener('resize', requestScrollUpdate);
      resetDesktopVars();
    };

    updateScrollProgress();
    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate, { passive: true });
    window.addEventListener('pagehide', cleanupScrollChoreography);

    if (motionQuery && typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', event => {
        if (event.matches) cleanupScrollChoreography();
      });
    }
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

  // 07 / Cursor-following radial torchlight & subtle ambient spotlight + Magnetic CTA
  if (!isReducedMotion() && isFinePointer()) {
    const pointerAbort = typeof AbortController === 'function' ? new AbortController() : null;
    const ptrOpts = pointerAbort ? { signal: pointerAbort.signal } : undefined;
    const activeRafIds = new Set();

    const cleanupPointerEffects = () => {
      activeRafIds.forEach(id => cancelAnimationFrame(id));
      activeRafIds.clear();
      if (pointerAbort) pointerAbort.abort();
    };

    window.addEventListener('pagehide', cleanupPointerEffects, ptrOpts);
    if (motionQuery && typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', event => {
        if (event.matches) cleanupPointerEffects();
      }, ptrOpts);
    }

    document.querySelectorAll('.torchlight-surface').forEach(surface => {
      const rect0 = surface.getBoundingClientRect();
      let targetX = rect0.width ? rect0.width * 0.66 : 600;
      let targetY = rect0.height ? rect0.height * 0.46 : 240;
      let currentX = targetX;
      let currentY = targetY;
      let targetAlpha = 0;
      let currentAlpha = 0;
      let rafId = 0;

      const animateTorch = () => {
        activeRafIds.delete(rafId);
        currentX += (targetX - currentX) * 0.20;
        currentY += (targetY - currentY) * 0.20;
        currentAlpha += (targetAlpha - currentAlpha) * 0.24;
        surface.style.setProperty('--mx', `${currentX.toFixed(1)}px`);
        surface.style.setProperty('--my', `${currentY.toFixed(1)}px`);
        surface.style.setProperty('--torch-alpha', currentAlpha.toFixed(3));
        const moving =
          Math.abs(targetX - currentX) > 0.4 ||
          Math.abs(targetY - currentY) > 0.4 ||
          Math.abs(targetAlpha - currentAlpha) > 0.008;
        if (moving) {
          rafId = requestAnimationFrame(animateTorch);
          activeRafIds.add(rafId);
        } else {
          currentAlpha = targetAlpha;
          surface.style.setProperty('--torch-alpha', currentAlpha.toFixed(3));
          rafId = 0;
        }
      };

      surface.addEventListener('pointerenter', e => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        const r = surface.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = Math.max(0, Math.min(r.width, e.clientX - r.left));
        const py = Math.max(0, Math.min(r.height, e.clientY - r.top));
        if (currentAlpha < 0.05) {
          currentX = px;
          currentY = py;
        }
        targetX = px;
        targetY = py;
        targetAlpha = 1;
        if (!rafId) {
          rafId = requestAnimationFrame(animateTorch);
          activeRafIds.add(rafId);
        }
      }, ptrOpts);

      surface.addEventListener('pointermove', e => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        const r = surface.getBoundingClientRect();
        if (!r.width || !r.height) return;
        targetX = Math.max(0, Math.min(r.width, e.clientX - r.left));
        targetY = Math.max(0, Math.min(r.height, e.clientY - r.top));
        targetAlpha = 1;
        if (!rafId) {
          rafId = requestAnimationFrame(animateTorch);
          activeRafIds.add(rafId);
        }
      }, ptrOpts);

      surface.addEventListener('pointerleave', () => {
        targetAlpha = 0;
        if (!rafId) {
          rafId = requestAnimationFrame(animateTorch);
          activeRafIds.add(rafId);
        }
      }, ptrOpts);
    });

    document.querySelectorAll('.spotlight-surface:not(.torchlight-surface)').forEach(surface => {
      let targetX = 50;
      let targetY = 50;
      let currentX = 50;
      let currentY = 50;
      let rafId = 0;

      const animateSpotlight = () => {
        activeRafIds.delete(rafId);
        currentX += (targetX - currentX) * 0.16;
        currentY += (targetY - currentY) * 0.16;
        surface.style.setProperty('--mx', `${currentX.toFixed(2)}%`);
        surface.style.setProperty('--my', `${currentY.toFixed(2)}%`);
        if (Math.abs(targetX - currentX) > 0.08 || Math.abs(targetY - currentY) > 0.08) {
          rafId = requestAnimationFrame(animateSpotlight);
          activeRafIds.add(rafId);
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
        if (!rafId) {
          rafId = requestAnimationFrame(animateSpotlight);
          activeRafIds.add(rafId);
        }
      }, ptrOpts);

      surface.addEventListener('pointerleave', () => {
        surface.style.setProperty('--spotlight-alpha', '0');
      }, ptrOpts);
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
      }, ptrOpts);
      magBtn.addEventListener('pointerleave', () => {
        magBtn.style.setProperty('--mag-x', '0px');
        magBtn.style.setProperty('--mag-y', '0px');
      }, ptrOpts);
    }
  }

  // 03 / Seamless infinite ticker calibration
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
      let tickerResizeRaf = 0;
      const scheduleTickerSync = () => {
        if (!tickerResizeRaf) {
          tickerResizeRaf = requestAnimationFrame(() => {
            tickerResizeRaf = 0;
            syncTicker();
          });
        }
      };
      window.addEventListener('resize', scheduleTickerSync, { passive: true });
      window.addEventListener('pagehide', () => {
        if (tickerResizeRaf) cancelAnimationFrame(tickerResizeRaf);
        window.removeEventListener('resize', scheduleTickerSync);
      });
    }
  }
})();
