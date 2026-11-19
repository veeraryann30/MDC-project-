import { cleanTarget, scanLink, verdictOf, getConfig, reportUrl, NOT_CONFIGURED } from './shared.js';

const MENU_LINK = 'ctp-check-link';
const MENU_SELECTION = 'ctp-check-selection';
const MENU_PAGE = 'ctp-check-page';
const NOTE_PREFIX = 'ctp-note:';

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_LINK, title: 'Check this link with Catch the Phish', contexts: ['link'] });
    chrome.contextMenus.create({ id: MENU_SELECTION, title: 'Check selected text as a link', contexts: ['selection'] });
    chrome.contextMenus.create({ id: MENU_PAGE, title: 'Check this page with Catch the Phish', contexts: ['page'] });
  });
  if (details.reason === 'install') chrome.runtime.openOptionsPage();
});

chrome.contextMenus.onClicked.addListener((info) => {
  let target = null;
  if (info.menuItemId === MENU_LINK) target = cleanTarget(info.linkUrl);
  else if (info.menuItemId === MENU_SELECTION) target = cleanTarget(info.selectionText);
  else if (info.menuItemId === MENU_PAGE) target = cleanTarget(info.pageUrl);

  if (!target) {
    notify('Nothing to check', 'That selection does not look like a link.');
    return;
  }
  check(target);
});

async function check(target) {
  notify('Checking…', shorten(target), { silent: true, id: `${NOTE_PREFIX}pending` });
  try {
    const result = await scanLink(target);
    const v = verdictOf(result);
    const reason = result.threats_detected?.[0]?.title || (v.key === 'safe' ? 'No warning signs found.' : 'Matches patterns seen in scam links.');
    chrome.notifications.clear(`${NOTE_PREFIX}pending`);
    notify(
      `${v.label} (${Math.round(result.risk_score)}/100)`,
      `${shorten(result.domain || target)}\n${reason}\nClick for the full report.`,
      { id: `${NOTE_PREFIX}${encodeURIComponent(target)}` }
    );
  } catch (err) {
    chrome.notifications.clear(`${NOTE_PREFIX}pending`);
    if (err.message === NOT_CONFIGURED) {
      notify('Set up Catch the Phish', 'Add your service address in the extension options first.');
      chrome.runtime.openOptionsPage();
    } else {
      notify('Could not check this link', err.message || 'Please try again.');
    }
  }
}

// Clicking a result notification opens the full report on the website.
chrome.notifications.onClicked.addListener(async (id) => {
  chrome.notifications.clear(id);
  if (!id.startsWith(NOTE_PREFIX) || id === `${NOTE_PREFIX}pending`) return;
  const link = decodeURIComponent(id.slice(NOTE_PREFIX.length));
  const { appUrl } = await getConfig();
  chrome.tabs.create({ url: reportUrl(appUrl, link) });
});

function notify(title, message, { silent = false, id } = {}) {
  chrome.notifications.create(id || '', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    silent,
  });
}

function shorten(text, max = 90) {
  const s = String(text);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
