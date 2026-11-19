const scoreTable = document.querySelector('#all-scores');
const plot = document.querySelector('.plot');
const chart = document.querySelector('#scores');

// The zero baseline and common 0–60% scale make column heights comparable.
function scaleY(score) {
  return 165 - score * 2.2;
}

function scorePanel(row) {
  const [name, size, , vanilla, auto, gain] = [...row.cells].map(cell => cell.textContent);
  const start = parseFloat(vanilla);
  const end = parseFloat(auto);
  const panel = document.createElement('article');
  const grid = [0, 20, 40, 60].map(tick => {
    const y = scaleY(tick);
    return `<path d="M30 ${y}H290"/><text x="24" y="${y + 4}">${tick}</text>`;
  }).join('');
  const columns = [start, end].map((score, index) => {
    const center = index ? 207 : 94;
    const top = scaleY(score);
    return `<g class="series ${index ? 'guided' : 'vanilla'}">
      <rect class="score-bar" x="${center - 28}" y="${top}" width="56" height="${165 - top}" rx="3"/>
      <text class="bar-value" x="${center}" y="${top - 8}">${score.toFixed(2)}</text>
      <text class="method-label" x="${center}" y="187">${index ? 'AutoMaster' : 'Vanilla SFT'}</text>
    </g>`;
  }).join('');
  panel.innerHTML = `
    <h3>${name}</h3>
    <p class="difference">${gain}<small> pp</small></p>
    <svg viewBox="0 0 300 194" role="img" aria-label="${size} ${name}: Vanilla SFT ${start.toFixed(2)}%, AutoMaster ${end.toFixed(2)}%, gain ${gain} percentage points.">
      <g class="score-grid">${grid}</g>
      <text class="unit" x="4" y="16">%</text>
      ${columns}
    </svg>`;
  return panel;
}

const visibility = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      visibility.unobserve(entry.target);
    }
  }
}, { threshold: 0.28 });

function showScores() {
  const size = plot.querySelector(':checked').value;
  const rows = [...scoreTable.querySelectorAll('tbody tr')].filter(row => row.cells[1].textContent === size);
  visibility.disconnect();
  chart.replaceChildren(...rows.map(scorePanel));
  for (const panel of chart.children) visibility.observe(panel);
}
plot.hidden = false;
scoreTable.open = false;
showScores();
plot.addEventListener('change', showScores);
document.querySelector('#replay').addEventListener('click', showScores);
const copy = document.querySelector('#copy');
copy.hidden = false;
copy.addEventListener('click', async () => {
  const code = document.querySelector('#bibtex');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(code.textContent);
    status.textContent = 'Copied';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(code);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = 'Text selected for copying';
  }
});

const preview = document.querySelector('#figure-preview');
if (typeof preview.showModal === 'function') {
  const previewImage = preview.querySelector('img');
  const previewTitle = preview.querySelector('h2');
  let opener;
  for (const link of document.querySelectorAll('.case-image')) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      previewTitle.textContent = link.closest('.paper-panel').querySelector('h4').textContent;
      previewImage.alt = link.querySelector('img').alt;
      previewImage.src = link.href;
      preview.showModal();
      previewImage.parentElement.scrollTop = 0;
    });
  }
  preview.addEventListener('click', event => {
    if (event.target !== preview) return;
    const bounds = preview.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) {
      preview.close();
    }
  });
  preview.addEventListener('close', () => opener?.focus({preventScroll:true}));
}
