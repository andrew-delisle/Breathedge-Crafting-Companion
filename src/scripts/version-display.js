 // /src/scripts/version-display.js
import { appState } from '../state/appState.js';

console.log('[VERSION] Starting version check...');

const versionElement = document.getElementById('versionDisplay');
if (!versionElement) {
  console.warn('[VERSION] No #versionDisplay found. Skipping.');
}

async function loadVersionInfo() {
  try {
    const res = await fetch('version.json');
    if (!res.ok) throw new Error('Version file missing');

    const data = await res.json();
    console.log('[VERSION] Version loaded:', data.version);

    applyVersionToDOM(`v${data.version}`);
  } catch (err) {
    console.warn('[VERSION] Version load failed, showing fallback changelog link.');
    applyVersionToDOM(null);
  }
}

function applyVersionToDOM(versionText) {
  if (!versionElement) return;

  const linkHtml = `<a class="version-link" href="https://github.com/andrew-delisle/Breathedge-Crafting-Companion/blob/master/CHANGELOG.md" target="_blank">Changelog</a>`;

  versionElement.innerHTML = versionText
    ? `<span class="version-text">${versionText}</span><span class="version-separator"></span>${linkHtml}`
    : linkHtml;

  console.log('[VERSION] Version display updated:', versionElement.innerHTML);
}

loadVersionInfo();