import { getConfig, parseServiceUrl, DEFAULT_APP_URL } from './shared.js';

const api = document.getElementById('api');
const app = document.getElementById('app');
const statusEl = document.getElementById('status');

getConfig().then(({ apiBase, appUrl }) => {
  api.value = apiBase;
  app.value = appUrl || DEFAULT_APP_URL;
});

document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiUrl = parseServiceUrl(api.value);
  const appUrl = parseServiceUrl(app.value);
  if (!apiUrl) {
    statusEl.textContent = 'The service address must start with https:// (or http://127.0.0.1 for local development).';
    return;
  }
  if (!appUrl) {
    statusEl.textContent = 'The website address must start with https://.';
    return;
  }

  // Ask the browser for permission to talk to this one host only (needs this click as the user gesture).
  const granted = await chrome.permissions.request({ origins: [`${apiUrl.protocol}//${apiUrl.hostname}/*`] });
  if (!granted) {
    statusEl.textContent = 'Permission was not granted, so the extension cannot reach that service.';
    return;
  }

  await chrome.storage.local.set({
    apiBase: apiUrl.href.replace(/\/+$/, ''),
    appUrl: appUrl.origin,
  });
  statusEl.textContent = 'Saved. Right-click a link to try it.';
});
