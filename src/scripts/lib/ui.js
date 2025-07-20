// /src/scripts/lib/ui.js

import { appState } from "../../state/appState.js";
import { renderList } from './renderList.util.js';

/**
 * Populates the game dropdown list.
 * Logs every step for troubleshooting.
 */
export function setupGameDropdown(gameList) {
  console.log('\n[UI] ==== setupGameDropdown starting ====');

  const dropdown = document.getElementById('gameSelect');
  if (!dropdown) {
    console.error('[UI] #gameSelect not found! Cannot build dropdown.');
    return;
  }

  console.log('[UI] Clearing existing dropdown options...');
  dropdown.innerHTML = '';

  // Add the "default" option first
  const defaultOption = document.createElement('option');
  defaultOption.value = 'default';
  defaultOption.textContent = 'Select a Game';
  dropdown.appendChild(defaultOption);

  if (!gameList || typeof gameList !== 'object' || !Object.keys(gameList).length) {
    console.warn('[UI] No valid gameList provided. Only default option added.');
    return;
  }

  console.log('[UI] Populating dropdown with games:', JSON.stringify(gameList));

  for (const [gameId, gameName] of Object.entries(gameList)) {
    console.log(`[UI] Adding dropdown option: ${gameId} - ${gameName}`);
    const option = document.createElement('option');
    option.value = gameId;
    option.textContent = gameName;
    dropdown.appendChild(option);
  }

  // Select saved or currently active gameId if available
  const savedGame = localStorage.getItem('selectedGame');
  console.log('[UI] Saved game in localStorage:', savedGame);

  if (savedGame && gameList[savedGame]) {
    dropdown.value = savedGame;
    console.log(`[UI] Restoring saved game selection: ${savedGame}`);
  } else if (appState.gameId && gameList[appState.gameId]) {
    dropdown.value = appState.gameId;
    console.log(`[UI] Restoring appState.gameId selection: ${appState.gameId}`);
  } else {
    dropdown.value = 'default';
    console.log('[UI] No saved/appState selection. Default selected.');
  }

  console.log('[UI] ==== setupGameDropdown complete ====');
}

/**
 * Wires a change listener to the game select dropdown.
 * Logs every selection change for debugging.
 */
export function wireGameSelectListener(selector, callback) {
  console.log('\n[UI] ==== wireGameSelectListener starting ====');

  const dropdown = document.querySelector(selector);
  if (!dropdown) {
    console.error(`[UI] Dropdown not found for selector: ${selector}`);
    return;
  }

  console.log(`[UI] Wiring change listener to: ${selector}`);
  dropdown.addEventListener('change', async (event) => {
    const selectedGame = event.target.value;
    console.log(`[UI] Dropdown changed. Selected value: ${selectedGame}`);

    if (typeof callback === 'function') {
      console.log('[UI] Executing callback for selection...');
      await callback(selectedGame);
    } else {
      console.warn('[UI] No valid callback provided to wireGameSelectListener.');
    }
  });

  console.log('[UI] ==== wireGameSelectListener complete ====');
}





/**
 * Wires the recipe type filter dropdown to re-render the list on change.
 */
export function wireRecipeTypeFilter(selector = '#typeFilter') {
  console.log('\n[UI] ==== wireRecipeTypeFilter starting ====');

  const dropdown = document.querySelector(selector);
  if (!dropdown) {
    console.error(`[UI] Type filter not found for selector: ${selector}`);
    return;
  }

  dropdown.addEventListener('change', () => {
    console.log(`[UI] Type filter changed to: ${dropdown.value}`);
    renderList();
  });

  console.log('[UI] ==== wireRecipeTypeFilter complete ====');
}

/**
 * Wires the search box to re-render the list on input.
 */
export function wireSearchBox(selector = '#searchBox') {
  console.log('\n[UI] ==== wireSearchBox starting ====');

  const input = document.querySelector(selector);
  if (!input) {
    console.error(`[UI] Search box not found for selector: ${selector}`);
    return;
  }

  input.addEventListener('input', () => {
    console.log(`[UI] Search input changed: ${input.value}`);
    renderList();
  });

  console.log('[UI] ==== wireSearchBox complete ====');
}


/**
 * Wires the sort dropdown to re-render the list on change.
 */
export function wireSortSelect(selector = '#sortSelect') {
  console.log('\n[UI] ==== wireSortSelect starting ====');

  const dropdown = document.querySelector(selector);
  if (!dropdown) {
    console.error(`[UI] Sort dropdown not found for selector: ${selector}`);
    return;
  }

  dropdown.addEventListener('change', () => {
    console.log(`[UI] Sort order changed to: ${dropdown.value}`);
    renderList();
  });

  console.log('[UI] ==== wireSortSelect complete ====');
}


