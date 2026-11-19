// Sample the rendered heading's typeface and baseline so the particles settle
// into the same letterforms as the selectable HTML text.
(() => {
  const stage = document.querySelector('.title-stage');
  const word = stage.querySelector('.wordmark');
  const canvas = stage.querySelector('canvas');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const replay = stage.querySelector('.title-replay');
  const toggle = document.querySelector('.motion-toggle');
  const ctx = canvas.getContext('2d');
  if (!ctx || !('IntersectionObserver' in window)) return;

  let frame = 0;
  let draw;
  let elapsed = 0;
  let previous = null;
  let visible = false;
  let paused = false;

  function prepare() {
    canvas.hidden = false;
    const box = canvas.getBoundingClientRect();
    const width = Math.ceil(box.width);
    const height = Math.ceil(box.height);
    const mask = document.createElement('canvas');
    mask.width = width;
    mask.height = height;
    const ink = mask.getContext('2d', {willReadFrequently:true});
    if (!ink || !width || !height) return null;
    const font = getComputedStyle(word);
    ink.font = font.fontWeight + ' ' + font.fontSize + ' ' + font.fontFamily;
    ink.letterSpacing = font.letterSpacing;
    const baseline = stage.querySelector('.wordmark-baseline').getBoundingClientRect().top - box.top;
    ink.fillText(word.textContent, word.getBoundingClientRect().left - box.left, baseline);
    const pixels = ink.getImageData(0, 0, width, height).data;
    const step = Math.max(2, parseFloat(font.fontSize) / 31);
    const particles = [];
    const colors = ['#21383b', '#365457', '#637746', '#829897', '#a78851'];
    for (let y = step; y < height; y += step) {
      for (let x = step; x < width; x += step) {
        const tx = x + (Math.random() - .5) * step * .6;
        const ty = y + (Math.random() - .5) * step * .6;
        if (!(pixels[(Math.floor(ty) * width + Math.floor(tx)) * 4 + 3] >= 100)) continue;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random());
        particles.push({
          x: tx, y: ty,
          fromX: width * (.49 + .52 * radius * Math.cos(angle)),
          fromY: height * (.5 + .52 * radius * Math.sin(angle)),
          bend: (Math.random() - .5) * height * .45,
          phase: Math.random() * Math.PI * 2, delay: Math.random() * .35,
          radius: step * (.24 + Math.random() * .24),
          color: colors[Math.floor(Math.random() ** 1.6 * colors.length)]
        });
      }
    }
    if (!particles.length) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // A sparse second layer stays in motion after the letters settle.
    const motes = Array.from({length: Math.round(width / 14)}, (_, i) => ({
      x: Math.random() * width,
      y: (.06 + .88 * Math.random()) * height,
      phase: Math.random() * Math.PI * 2,
      radius: .6 + Math.random() * 1.35,
      speed: .13 + Math.random() * .28,
      color: colors[i % colors.length]
    }));
    return function render(t) {
      // About four seconds of gathering, two seconds in dotted type, then a soft handoff.
      const dissolve = Math.min(1, Math.max(0, (t - 5.9) / 1.4));
      word.style.opacity = dissolve;
      ctx.clearRect(0, 0, width, height);
      if (dissolve < 1) {
        for (const p of particles) {
          const u = Math.min(1, Math.max(0, (t - .45 - p.delay * 2) / 3.1));
          const ease = u * u * (3 - 2 * u);
          const drift = (1 - ease) * Math.sin(t * 1.3 + p.phase);
          const x = p.fromX + (p.x - p.fromX) * ease + 8 * drift;
          const y = p.fromY + (p.y - p.fromY) * ease + Math.sin(u * Math.PI) * p.bend + 4 * drift;
          ctx.globalAlpha = (1 - dissolve) * (.65 + .35 * ease);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(x, y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (const p of motes) {
        const phase = t * p.speed + p.phase;
        const x = p.x + 17 * Math.sin(phase);
        const y = p.y + 6 * Math.cos(phase * 1.4);
        ctx.globalAlpha = .28 + .26 * (1 + Math.sin(phase * 1.7)) / 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };
  }

  function tick(now) {
    if (previous === null || now - previous >= (elapsed < 7.3 ? 24 : 48)) {
      if (previous !== null) elapsed += (now - previous) / 1000;
      previous = now;
      draw(elapsed);
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    previous = null;
    const enabled = !motion.matches;
    replay.hidden = toggle.hidden = !enabled;
    if (!enabled) {
      canvas.hidden = true;
      word.style.removeProperty('opacity');
      draw = null;
      elapsed = 0;
      return;
    }
    if (!visible || document.hidden) return;
    if (!draw) {
      draw = prepare();
      if (!draw) {
        replay.hidden = toggle.hidden = canvas.hidden = true;
        word.style.removeProperty('opacity');
        return;
      }
      draw(elapsed);
    }
    if (!paused) frame = requestAnimationFrame(tick);
  }

  function setPaused(value) {
    paused = value;
    toggle.classList.toggle('paused', paused);
    toggle.title = paused ? 'Resume title animation' : 'Pause title animation';
    toggle.setAttribute('aria-label', toggle.title);
  }

  toggle.addEventListener('click', () => { setPaused(!paused); sync(); });
  replay.addEventListener('click', () => {
    elapsed = 0;
    setPaused(false);
    sync();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(stage);
  new ResizeObserver(() => { draw = null; sync(); }).observe(stage);
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
})();
