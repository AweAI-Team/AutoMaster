// Sample the rendered heading's typeface and baseline so the particles settle
// into the same letterforms as the selectable HTML text.
(() => {
  const stage = document.querySelector('.title-stage');
  const word = stage.querySelector('.wordmark');
  const canvas = stage.querySelector('canvas');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let frame;
  let observer;
  function finish() {
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.hidden = true;
    word.style.removeProperty('opacity');
    window.removeEventListener('resize', finish);
    motion.removeEventListener('change', finish);
    document.removeEventListener('visibilitychange', finish);
  }

  function play() {
    canvas.hidden = false;
    const box = canvas.getBoundingClientRect();
    const width = Math.ceil(box.width);
    const height = Math.ceil(box.height);
    const mask = document.createElement('canvas');
    mask.width = width;
    mask.height = height;
    const ink = mask.getContext('2d', {willReadFrequently:true});
    if (!ink || !width || !height) return finish();
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
    if (!particles.length) return finish();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    word.style.opacity = 0;
    const start = performance.now();
    function draw(now) {
      const t = (now - start) / 1000;
      if (t >= 2.65) return finish();
      const dissolve = Math.min(1, Math.max(0, (t - 2.04) / .61));
      word.style.opacity = dissolve;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const u = Math.min(1, Math.max(0, (t - .18 - p.delay) / 1.43));
        const ease = u * u * (3 - 2 * u);
        const drift = (1 - ease) * Math.sin(t * 2.2 + p.phase);
        const x = p.fromX + (p.x - p.fromX) * ease + 5 * drift;
        const y = p.fromY + (p.y - p.fromY) * ease + Math.sin(u * Math.PI) * p.bend + 2 * drift;
        ctx.globalAlpha = (1 - dissolve) * (.62 + .38 * ease);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', finish);
    motion.addEventListener('change', finish);
    document.addEventListener('visibilitychange', finish);
    draw(start);
  }

  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      if (!motion.matches) play();
    }
  }, {threshold: .5});
  observer.observe(stage);
})();
