// /src/scripts/lib/ui.js

import { appState } from "../../state/appState.js";
import { renderList } from './renderList.util.js';
import { logger } from './logger.js';

/**
 * Populates the game dropdown list.
 * Logs every step for troubleshooting.
 */
export function setupGameDropdown(gameList) {
  logger.log('\n[UI] ==== setupGameDropdown starting ====');

  const dropdown = document.getElementById('gameSelect');
  if (!dropdown) {
    logger.error('[UI] #gameSelect not found! Cannot build dropdown.');
    return;
  }

  logger.log('[UI] Clearing existing dropdown options...');
  dropdown.innerHTML = '';

  // Add the "default" option first
  const defaultOption = document.createElement('option');
  defaultOption.value = 'default';
  defaultOption.textContent = 'Select a Game';
  dropdown.appendChild(defaultOption);

  if (!gameList || typeof gameList !== 'object' || !Object.keys(gameList).length) {
    logger.warn('[UI] No valid gameList provided. Only default option added.');
    return;
  }

  logger.log('[UI] Populating dropdown with games:', JSON.stringify(gameList));

  for (const [gameId, gameName] of Object.entries(gameList)) {
    logger.log(`[UI] Adding dropdown option: ${gameId} - ${gameName}`);
    const option = document.createElement('option');
    option.value = gameId;
    option.textContent = gameName;
    dropdown.appendChild(option);
  }

  // Select saved or currently active gameId if available
  const savedGame = localStorage.getItem('selectedGame');
  logger.log('[UI] Saved game in localStorage:', savedGame);

  if (savedGame && gameList[savedGame]) {
    dropdown.value = savedGame;
    logger.log(`[UI] Restoring saved game selection: ${savedGame}`);
  } else if (appState.gameId && gameList[appState.gameId]) {
    dropdown.value = appState.gameId;
    logger.log(`[UI] Restoring appState.gameId selection: ${appState.gameId}`);
  } else {
    dropdown.value = 'default';
    logger.log('[UI] No saved/appState selection. Default selected.');
  }

  logger.log('[UI] ==== setupGameDropdown complete ====');
}

/**
 * Wires a change listener to the game select dropdown.
 * Logs every selection change for debugging.
 */
export function wireGameSelectListener(selector, callback) {
  const dropdown = document.querySelector(selector);
  if (!dropdown) {
    logger.error(`[UI] Dropdown not found for selector: ${selector}`);
    return;
  }

  // Replace element with a clone to strip any previously attached listeners
  // before wiring the new one. Prevents duplicate callbacks stacking up
  // each time init() re-runs on game change.
  const fresh = dropdown.cloneNode(true);
  dropdown.replaceWith(fresh);

  fresh.addEventListener('change', async (event) => {
    if (typeof callback === 'function') {
      await callback(event.target.value);
    }
  });
}

/**
 * Wires the recipe type filter dropdown to re-render the list on change.
 */
export function wireRecipeTypeFilter(selector = '#typeFilter') {
  logger.log('\n[UI] ==== wireRecipeTypeFilter starting ====');

  const dropdown = document.querySelector(selector);
  if (!dropdown) {
    logger.error(`[UI] Type filter not found for selector: ${selector}`);
    return;
  }

  dropdown.addEventListener('change', () => {
    logger.log(`[UI] Type filter changed to: ${dropdown.value}`);
    renderList();
  });

  logger.log('[UI] ==== wireRecipeTypeFilter complete ====');
}

/**
 * Wires the search box to re-render the list on input.
 */
export function wireSearchBox(selector = '#searchBox') {
  logger.log('\n[UI] ==== wireSearchBox starting ====');

  const input = document.querySelector(selector);
  if (!input) {
    logger.error(`[UI] Search box not found for selector: ${selector}`);
    return;
  }

  input.addEventListener('input', () => {
    logger.log(`[UI] Search input changed: ${input.value}`);
    renderList();
  });

  logger.log('[UI] ==== wireSearchBox complete ====');
}

/**
 * Wires the sort dropdown to re-render the list on change.
 */
export function wireSortSelect(selector = '#sortSelect') {
  logger.log('\n[UI] ==== wireSortSelect starting ====');

  const dropdown = document.querySelector(selector);
  if (!dropdown) {
    logger.error(`[UI] Sort dropdown not found for selector: ${selector}`);
    return;
  }

  dropdown.addEventListener('change', () => {
    logger.log(`[UI] Sort order changed to: ${dropdown.value}`);
    renderList();
  });

  logger.log('[UI] ==== wireSortSelect complete ====');
}

