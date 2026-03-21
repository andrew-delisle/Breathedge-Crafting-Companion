 // /src/scripts/version-display.js
import { appState } from '../state/appState.js';
import { logger } from './lib/logger.js';

logger.log('[VERSION] Starting version check...');

const versionElement = document.getElementById('versionDisplay');
if (!versionElement) {
  logger.warn('[VERSION] No #versionDisplay found. Skipping.');
}

async function loadVersionInfo() {
  try {
    const res = await fetch('version.json');
    if (!res.ok) throw new Error('Version file missing');

    const data = await res.json();
    logger.log('[VERSION] Version loaded:', data.version);

    applyVersionToDOM(`v${data.version}`);
  } catch (err) {
    logger.warn('[VERSION] Version load failed, showing fallback changelog link.');
    applyVersionToDOM(null);
  }
}

function applyVersionToDOM(versionText) {
  if (!versionElement) return;

  const linkHtml = `<a class="version-link" href="https://github.com/andrew-delisle/Crafting-Companion/blob/master/CHANGELOG.md" target="_blank">Changelog</a>`;

  versionElement.innerHTML = versionText
    ? `<span class="version-text">${versionText}</span><span class="version-separator"></span>${linkHtml}`
    : linkHtml;

  logger.log('[VERSION] Version display updated:', versionElement.innerHTML);
}

loadVersionInfo();