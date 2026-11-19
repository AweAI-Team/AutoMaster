const scoreTable = document.querySelector('#all-scores');
const plot = document.querySelector('.plot');
const chart = document.querySelector('#scores');

// All panels share a 20–60% scale, including when switching model sizes.
function scaleY(score) {
  return 157 - (score - 20) * 3;
}

function scorePanel(row, index) {
  const [name, size, , vanilla, auto, gain] = [...row.cells].map(cell => cell.textContent);
  const start = parseFloat(vanilla);
  const end = parseFloat(auto);
  const startY = scaleY(start);
  const endY = scaleY(end);
  const gradient = 'gain-fill-' + index;
  const panel = document.createElement('article');
  const grid = [20, 30, 40, 50, 60].map(tick => {
    const y = scaleY(tick);
    return `<path d="M30 ${y}H290"/><text x="24" y="${y + 4}">${tick}</text>`;
  }).join('');
  panel.innerHTML = `
    <h3>${name}</h3>
    <p class="difference">${gain}<small> pp</small></p>
    <svg viewBox="0 0 300 189" role="img" aria-label="${size} ${name}: Vanilla SFT ${start.toFixed(2)}%, AutoMaster ${end.toFixed(2)}%, gain ${gain} percentage points.">
      <defs><linearGradient id="${gradient}" x2="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stop-color="#8ba765" stop-opacity=".24"/><stop offset="1" stop-color="#8ba765" stop-opacity=".015"/>
      </linearGradient></defs>
      <g class="score-grid">${grid}</g>
      <text class="unit" x="4" y="17">%</text>
      <path class="gain-area" fill="url(#${gradient})" d="M58 ${startY}L256 ${endY}V157H58Z"/>
      <path class="gain-line" pathLength="1" d="M58 ${startY}L256 ${endY}"/>
      <circle class="start-point" cx="58" cy="${startY}" r="5"/>
      <text class="start-label" x="58" y="${startY - 13}">${start.toFixed(2)}</text>
      <g class="endpoint">
        <circle class="end-halo" cx="256" cy="${endY}" r="11"/>
        <circle class="end-point" cx="256" cy="${endY}" r="5"/>
        <text class="end-label" x="256" y="${endY - 16}">${end.toFixed(2)}</text>
      </g>
      <g class="method-label"><text x="58" y="181">Vanilla SFT</text><text x="256" y="181">AutoMaster</text></g>
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
