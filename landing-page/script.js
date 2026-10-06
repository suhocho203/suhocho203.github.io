document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  setupSectionReveals();
  setupAccordion();
});

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
