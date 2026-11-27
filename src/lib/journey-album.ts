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

function waitForImage(image: HTMLImageElement): Promise<void> {
  const decode = () => typeof image.decode === 'function'
    ? image.decode().catch(() => undefined)
    : Promise.resolve();
  if (image.complete) return decode();

  return new Promise<void>(resolve => {
    function finish() {
      image.removeEventListener('load', finish);
      image.removeEventListener('error', finish);
      resolve();
    }
    image.addEventListener('load', finish);
    image.addEventListener('error', finish);
  }).then(decode);
}

function requestImage(image: HTMLImageElement, priority: 'high' | 'low') {
  image.fetchPriority = priority;
  const src = image.dataset.src;
  if (src && !image.hasAttribute('src')) image.src = src;
}

export function initJourneyAlbum(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-album-stage]');
  const figures = Array.from(root.querySelectorAll<HTMLElement>('[data-album-photo]'));
  if (!stage || figures.length === 0) return;

  const slides = figures.map(figure => ({
    figure,
    select: figure.querySelector<HTMLButtonElement>('[data-album-select]'),
    image: figure.querySelector('img'),
  }));
  const current = root.querySelector<HTMLElement>('[data-album-current]');
  const title = root.querySelector<HTMLElement>('[data-album-title]');
  const announcement = root.querySelector<HTMLElement>('[data-album-announcement]');
  const previous = root.querySelector<HTMLButtonElement>('[data-album-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-album-next]');
  const playback = root.querySelector<HTMLButtonElement>('[data-album-playback]');
  const pauseIcon = playback?.querySelector<SVGElement>('[data-playback-pause]');
  const playIcon = playback?.querySelector<SVGElement>('[data-playback-play]');
  const total = slides.length;
  const pad = Math.max(2, String(total).length);
  let activeIndex = 0;
  let gesture: Gesture | undefined;
  let suppressClick = false;
  let playing = total > 1;
  let playbackTimer: number | undefined;
  let openingTimer: number | undefined;

  function shuffleSlides() {
    for (let index = slides.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [slides[index], slides[other]] = [slides[other], slides[index]];
    }
  }

  function schedulePlayback() {
    if (playbackTimer !== undefined) window.clearTimeout(playbackTimer);
    playbackTimer = undefined;
    if (!playing || document.hidden || gesture || !stage?.hasAttribute('data-ready')) return;
    playbackTimer = window.setTimeout(() => show(activeIndex + 1), 5_000);
  }

  function setPlaying(nextState: boolean) {
    playing = nextState && total > 1;
    playback?.setAttribute('aria-pressed', String(playing));
    playback?.setAttribute('title', playing ? '暂停自动播放' : '开启自动播放');
    announcement?.setAttribute('aria-live', playing ? 'off' : 'polite');
    pauseIcon?.toggleAttribute('hidden', !playing);
    playIcon?.toggleAttribute('hidden', playing);
    schedulePlayback();
  }

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
    const focusedImage = slides[activeIndex].image;
    if (focusedImage) requestImage(focusedImage, 'high');

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
    function loadSurroundings() {
      for (const slideIndex of positions.keys()) {
        const image = slides[slideIndex].image;
        if (image && image !== focusedImage) requestImage(image, 'low');
      }
    }

    if (stage?.hasAttribute('data-ready')) {
      loadSurroundings();
      schedulePlayback();
      return;
    }

    // The opening photo has the connection to itself until it settles or times out.
    window.clearTimeout(openingTimer);
    const timeout = window.setTimeout(() => reveal(), 4_000);
    openingTimer = timeout;
    function reveal() {
      if (openingTimer !== timeout) return;
      window.clearTimeout(timeout);
      openingTimer = undefined;
      stage?.setAttribute('data-ready', '');
      loadSurroundings();
      schedulePlayback();
    }
    if (focusedImage) void waitForImage(focusedImage).then(reveal);
    else reveal();
  }

  slides.forEach(slide => {
    const { figure, select, image } = slide;
    select?.addEventListener('click', () => show(slides.indexOf(slide)));
    const fallback = figure.querySelector<HTMLElement>('[data-album-fallback]');
    if (!image) return;

    const markUnavailable = () => {
      image.hidden = true;
      if (fallback) fallback.hidden = false;
    };
    image.addEventListener('error', markUnavailable);
  });

  if (previous) previous.disabled = total < 2;
  if (next) next.disabled = total < 2;
  previous?.addEventListener('click', () => show(activeIndex - 1));
  next?.addEventListener('click', () => show(activeIndex + 1));
  playback?.addEventListener('click', () => setPlaying(!playing));
  document.addEventListener('visibilitychange', schedulePlayback);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    shuffleSlides();
    show(0);
  });

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
    schedulePlayback();
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
    schedulePlayback();
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

  shuffleSlides();
  show(0);
}
