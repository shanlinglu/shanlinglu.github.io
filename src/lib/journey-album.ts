const surroundingPositions = [
  [0, 'current'],
  [-1, 'previous'],
  [1, 'next'],
  [-2, 'previous-far'],
  [2, 'next-far'],
  [-3, 'below'],
  [3, 'above'],
] as const;

type Gesture = {
  id: number;
  source: HTMLElement;
  startX: number;
  startY: number;
  width: number;
  horizontal: boolean;
};

export function initJourneyAlbum(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-album-stage]');
  const figures = Array.from(root.querySelectorAll<HTMLElement>('[data-album-photo]'));
  if (!stage || figures.length === 0) return;

  const slides = figures.map(figure => ({
    figure,
    select: figure.querySelector<HTMLButtonElement>('[data-album-select]'),
  }));
  const current = root.querySelector<HTMLElement>('[data-album-current]');
  const title = root.querySelector<HTMLElement>('[data-album-title]');
  const previous = root.querySelector<HTMLButtonElement>('[data-album-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-album-next]');
  const total = slides.length;
  const pad = Math.max(2, String(total).length);
  let activeIndex = 0;
  let gesture: Gesture | undefined;
  let suppressClick = false;

  function wrap(index: number) {
    return (index + total) % total;
  }

  function show(index: number) {
    activeIndex = wrap(index);
    const positions = new Map<number, string>();
    // Reserve nearby positions first. Wrapping a short album never reuses a photo.
    for (const [offset, position] of surroundingPositions) {
      if (positions.size === total) break;
      const slideIndex = wrap(activeIndex + offset);
      if (!positions.has(slideIndex)) positions.set(slideIndex, position);
    }

    const focusedIndex = slides.findIndex(slide => slide.select === document.activeElement);
    slides.forEach(({ figure, select }, slideIndex) => {
      const position = positions.get(slideIndex) ?? 'hidden';
      figure.dataset.position = position;
      figure.inert = position === 'hidden';
      if (position === 'current') {
        select?.setAttribute('aria-current', 'true');
      } else {
        select?.removeAttribute('aria-current');
      }
    });
    if (focusedIndex >= 0 && !positions.has(focusedIndex)) {
      slides[activeIndex].select?.focus({ preventScroll: true });
    }

    if (current) current.textContent = String(activeIndex + 1).padStart(pad, '0');
    if (title) title.textContent = slides[activeIndex].figure.dataset.title ?? '';
  }

  slides.forEach(({ figure, select }, index) => {
    select?.addEventListener('click', () => show(index));
    const image = figure.querySelector('img');
    const fallback = figure.querySelector<HTMLElement>('[data-album-fallback]');
    if (!image) return;

    const markUnavailable = () => {
      figure.dataset.unavailable = '';
      image.hidden = true;
      if (fallback) fallback.hidden = false;
    };
    image.addEventListener('error', markUnavailable);
    if (image.complete && image.naturalWidth === 0) markUnavailable();
  });

  if (previous) previous.disabled = total < 2;
  if (next) next.disabled = total < 2;
  previous?.addEventListener('click', () => show(activeIndex - 1));
  next?.addEventListener('click', () => show(activeIndex + 1));

  root.addEventListener('keydown', event => {
    if (total < 2 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });

  function endGesture(pointerId: number) {
    if (gesture?.id !== pointerId) return;
    const completed = gesture;
    gesture = undefined;
    stage?.removeAttribute('data-dragging');
    stage?.style.removeProperty('--drag-x');
    if (completed.source.hasPointerCapture(pointerId)) completed.source.releasePointerCapture(pointerId);
    return completed;
  }

  stage.addEventListener('pointerdown', event => {
    if (total < 2 || event.button !== 0 || !event.isPrimary || gesture) return;
    suppressClick = false;
    const source = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('[data-album-select]') ?? stage
      : stage;
    gesture = {
      id: event.pointerId,
      source,
      startX: event.clientX,
      startY: event.clientY,
      width: stage.clientWidth,
      horizontal: false,
    };
    // Capture on the pressed control so a simple press still produces a native click.
    source.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', event => {
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.horizontal && Math.max(Math.abs(dx), Math.abs(dy)) >= 8) {
      suppressClick = true;
      // Leave vertical gestures to the browser's native page scrolling.
      if (Math.abs(dy) > Math.abs(dx)) {
        endGesture(event.pointerId);
        return;
      }
      gesture.horizontal = true;
      stage.dataset.dragging = '';
    }

    if (gesture.horizontal) {
      const limit = Math.min(gesture.width * .28, 192);
      stage.style.setProperty('--drag-x', `${Math.max(-limit, Math.min(limit, dx))}px`);
    }
  });

  stage.addEventListener('pointerup', event => {
    const completed = endGesture(event.pointerId);
    if (!completed?.horizontal) return;
    const distance = event.clientX - completed.startX;
    const threshold = Math.max(36, Math.min(86, completed.width * .13));
    if (Math.abs(distance) >= threshold) show(activeIndex + (distance > 0 ? -1 : 1));
  });

  stage.addEventListener('pointercancel', event => endGesture(event.pointerId));
  stage.addEventListener('lostpointercapture', event => {
    if (gesture?.source === event.target) endGesture(event.pointerId);
  });
  stage.addEventListener('dragstart', event => event.preventDefault());
  stage.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      event.stopPropagation();
    }
    suppressClick = false;
  }, { capture: true });

  show(activeIndex);
}
