const scoreTable = document.querySelector('#all-scores');
const plot = document.querySelector('.plot');
const chart = document.querySelector('#scores');

function showScores(size) {
  const rows = [...scoreTable.querySelectorAll('tbody tr')].filter(row => row.cells[1].textContent === size);
  chart.replaceChildren();
  for (const row of rows) {
    const [name, , , vanilla, auto, gain] = [...row.cells].map(cell => cell.textContent);
    const panel = document.createElement('article');
    const title = document.createElement('h3');
    title.textContent = name;
    panel.append(title);
    for (const [index, entry] of [vanilla, auto].entries()) {
      const score = parseFloat(entry);
      const track = document.createElement('div');
      track.className = 'track';
      track.setAttribute('aria-label', (index ? 'AutoMaster ' : 'Vanilla SFT ') + score + '%');
      const bar = document.createElement('i');
      bar.style.width = score + '%';
      const label = document.createElement('b');
      label.textContent = score.toFixed(2);
      track.append(bar, label);
      panel.append(track);
    }
    const difference = document.createElement('p');
    difference.className = 'difference';
    difference.textContent = gain + ' pp';
    panel.append(difference);
    chart.append(panel);
  }
}
plot.hidden = false;
scoreTable.open = false;
showScores(document.querySelector('input[name="size"]:checked').value);
plot.addEventListener('change', event => showScores(event.target.value));
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
