document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  setupSectionReveals();
  setupAccordion();
  setupSectionViewTracking();
  setupCtaClickTracking();
});

/* GA4 구간 도달 측정 (section_view) */
function setupSectionViewTracking() {
  if (window.__sectionTrackingInitialized) return;
  window.__sectionTrackingInitialized = true;

  const sectionTargets = [
    { id: 'hero-title', name: 'hero' },
    { id: 'solution-title', name: 'detail' },
    { id: 'final-title', name: 'cta' }
  ];

  const targetElements = sectionTargets
    .map(t => ({ el: document.getElementById(t.id), name: t.name }))
    .filter(t => t.el !== null);

  if (targetElements.length === 0) return;

  const sentSections = new Set();

  const sendSectionEvent = (sectionName) => {
    if (sentSections.has(sectionName)) return;
    sentSections.add(sectionName);

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'section_view', {
        section_name: sectionName
      });
    }
  };

  const checkElementsInView = () => {
    if (document.visibilityState !== 'visible') return;

    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 72;
    const viewportHeight = window.innerHeight;

    targetElements.forEach(({ el, name }) => {
      if (sentSections.has(name)) return;

      const rect = el.getBoundingClientRect();
      if (rect.height === 0 || rect.width === 0) return;

      // 고정 헤더 아래부터 뷰포트 하단까지를 보이는 영역으로 계산
      const visibleTop = Math.max(rect.top, headerHeight);
      const visibleBottom = Math.min(rect.bottom, viewportHeight);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      // 요소 높이의 50% 이상이 화면에 보이는지 판정
      if (visibleHeight / rect.height >= 0.5) {
        sendSectionEvent(name);
      }
    });
  };

  // IntersectionObserver 지원 여부 확인
  if ('IntersectionObserver' in window) {
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 72;

    const observer = new IntersectionObserver((entries) => {
      if (document.visibilityState !== 'visible') return;

      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const sectionName = entry.target.getAttribute('data-tracking-section');
          if (sectionName) {
            sendSectionEvent(sectionName);
            observer.unobserve(entry.target);
          }
        }
      });
    }, {
      threshold: [0.5],
      rootMargin: `-${headerHeight}px 0px 0px 0px`
    });

    targetElements.forEach(({ el, name }) => {
      el.setAttribute('data-tracking-section', name);
      observer.observe(el);
    });
  }

  // 탭 복귀 시 및 초기 로드 시 미포착 방지를 위한 가시성 체크
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkElementsInView();
    }
  });

  // 초기 로드 시점 검사
  if (document.visibilityState === 'visible') {
    window.setTimeout(checkElementsInView, 100);
  }
}

/* GA4 CTA 클릭 측정 (cta_click) */
function setupCtaClickTracking() {
  if (window.__ctaTrackingInitialized) return;
  window.__ctaTrackingInitialized = true;

  const heroCta = document.querySelector('#cta-hero') || document.querySelector('[data-cta-location="hero"]');
  const finalCta = document.querySelector('#cta-final') || document.querySelector('[data-cta-location="final"]');

  const ctaButtons = [
    { el: heroCta, location: 'hero' },
    { el: finalCta, location: 'final' }
  ].filter(item => item.el !== null);

  // 중복 요소 제거 (동일 요소 참조 방지)
  const uniqueButtons = [];
  const seenElements = new Set();
  ctaButtons.forEach(item => {
    if (!seenElements.has(item.el)) {
      seenElements.add(item.el);
      uniqueButtons.push(item);
    }
  });

  uniqueButtons.forEach(({ el, location }) => {
    el.addEventListener('click', () => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'cta_click', {
          button_location: location
        });
      }
    });
  });
}

/* 스크롤 시 부드러운 섹션 노출 애니메이션 (Intersection Observer) */
function setupSectionReveals() {
  const items = [...document.querySelectorAll('.reveal')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -6% 0px'
  });

  items.forEach((item) => observer.observe(item));
}

/* FAQ 아코디언 토글 인터랙션 */
function setupAccordion() {
  const triggers = document.querySelectorAll('.accordion__trigger');

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panelId = trigger.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      const item = trigger.closest('.accordion__item');

      if (!panel || !item) return;

      const willOpen = trigger.getAttribute('aria-expanded') !== 'true';
      trigger.setAttribute('aria-expanded', String(willOpen));
      panel.hidden = !willOpen;
      item.classList.toggle('is-open', willOpen);
    });
  });
}

/* 프로토타입 전용 '준비 중' 안내 모달 팝업 */
function setupPurchaseDialog() {
  const dialogBackdrop = document.getElementById('ready-dialog');
  const closeButton = document.getElementById('dialog-close');
  const confirmButton = document.getElementById('dialog-confirm');
  const purchaseButtons = document.querySelectorAll('[data-cta-location]');

  if (!dialogBackdrop || !closeButton || !confirmButton || purchaseButtons.length === 0) {
    return;
  }

  let lastFocusedElement = null;

  const openDialog = (trigger) => {
    lastFocusedElement = trigger;
    dialogBackdrop.hidden = false;
    document.body.classList.add('is-dialog-open');

    requestAnimationFrame(() => {
      dialogBackdrop.classList.add('is-visible');
      confirmButton.focus();
    });
  };

  const closeDialog = () => {
    dialogBackdrop.classList.remove('is-visible');
    document.body.classList.remove('is-dialog-open');

    window.setTimeout(() => {
      dialogBackdrop.hidden = true;
      if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
      }
    }, 240);
  };

  purchaseButtons.forEach((button) => {
    button.addEventListener('click', () => openDialog(button));
  });

  closeButton.addEventListener('click', closeDialog);
  confirmButton.addEventListener('click', closeDialog);

  dialogBackdrop.addEventListener('click', (event) => {
    if (event.target === dialogBackdrop) {
      closeDialog();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (dialogBackdrop.hidden) return;

    if (event.key === 'Escape') {
      closeDialog();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = [closeButton, confirmButton];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
