import { cleanTarget, scanLink, verdictOf, getConfig, reportUrl, NOT_CONFIGURED } from './shared.js';

const $ = (id) => document.getElementById(id);
const input = $('link');
const statusEl = $('status');
const resultEl = $('result');

$('settings').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Pre-fill with the current tab (allowed because the popup was opened by the user: activeTab).
chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  if (tab?.url && /^https?:/i.test(tab.url)) input.value = tab.url;
}).catch(() => {});

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const target = cleanTarget(input.value);
  resultEl.hidden = true;
  if (!target) {
    statusEl.textContent = 'Paste a link to check.';
    return;
  }
  const go = $('go');
  go.disabled = true;
  statusEl.textContent = 'Checking…';
  try {
    const result = await scanLink(target);
    const { appUrl } = await getConfig();
    render(result, target, appUrl);
    statusEl.textContent = '';
  } catch (err) {
    statusEl.textContent = err.message === NOT_CONFIGURED
      ? 'Add your service address in Settings first.'
      : err.message || 'Could not check this link.';
  } finally {
    go.disabled = false;
  }
});

function render(result, target, appUrl) {
  const v = verdictOf(result);
  const badge = $('badge');
  badge.textContent = `${v.label} · ${Math.round(result.risk_score)}/100`;
  badge.dataset.state = v.key;
  $('domain').textContent = result.domain || target;

  const list = $('reasons');
  list.replaceChildren();
  const reasons = (result.threats_detected || []).slice(0, 3).map((t) => t.title);
  if (reasons.length === 0) reasons.push(v.key === 'safe' ? 'No warning signs found.' : 'Matches patterns seen in scam links.');
  for (const r of reasons) {
    const li = document.createElement('li');
    li.textContent = r;
    list.appendChild(li);
  }
  $('report').href = reportUrl(appUrl, target);
  resultEl.hidden = false;
}
