import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
import { setupGameDropdown, wireGameSelectListener, wireRecipeTypeFilter, wireSearchBox } from '../scripts/lib/ui.js';
import { appState } from '../state/appState.js';
import { renderList } from '../scripts/lib/renderList.util.js';

// ✅ Mock renderList
vi.mock('../scripts/lib/renderList.util.js', () => ({
  renderList: vi.fn(),
}));

describe('ui.js', () => {
  let dropdown, typeFilter, searchBox;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <select id="gameSelect"></select>
      <select id="typeFilter"></select>
      <input id="searchBox" />
    `;

    dropdown = document.getElementById('gameSelect');
    typeFilter = document.getElementById('typeFilter');
    searchBox = document.getElementById('searchBox');

    // Reset spies & appState
    vi.clearAllMocks();
    localStorage.clear();
    appState.gameId = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setupGameDropdown', () => {
    test('logs error if dropdown not found', () => {
      document.body.innerHTML = ''; // remove dropdown
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      setupGameDropdown({ testGame: 'Test Game' });

      expect(errorSpy).toHaveBeenCalledWith('[UI] #gameSelect not found! Cannot build dropdown.');
    });

    test('adds only default option if gameList is invalid', () => {
      setupGameDropdown(null);
      expect(dropdown.options.length).toBe(1);
      expect(dropdown.value).toBe('default');
    });

    test('populates dropdown with games and restores savedGame', () => {
      localStorage.setItem('selectedGame', 'game2');

      setupGameDropdown({
        game1: 'Game One',
        game2: 'Game Two',
      });

      expect(dropdown.options.length).toBe(3); // default + 2 games
      expect(dropdown.value).toBe('game2');
    });

    test('restores appState.gameId if no savedGame', () => {
      appState.gameId = 'game1';

      setupGameDropdown({
        game1: 'Game One',
        game2: 'Game Two',
      });

      expect(dropdown.value).toBe('game1');
    });

    test('defaults to "default" if no saved or appState match', () => {
      setupGameDropdown({
        game1: 'Game One',
      });

      expect(dropdown.value).toBe('default');
    });
  });

  describe('wireGameSelectListener', () => {
    test('logs error if dropdown not found', () => {
      document.body.innerHTML = ''; // remove dropdown
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      wireGameSelectListener('#gameSelect', vi.fn());
      expect(errorSpy).toHaveBeenCalledWith('[UI] Dropdown not found for selector: #gameSelect');
    });

test('executes callback when selection changes', async () => {
  const callback = vi.fn();

  const option = document.createElement('option');
  option.value = 'game1';
  option.textContent = 'Game One';
  dropdown.appendChild(option);

  wireGameSelectListener('#gameSelect', callback);

  // wireGameSelectListener clones and replaces the element, so we must
  // query the DOM again to get the live element that has the listener attached.
  const fresh = document.getElementById('gameSelect');
  fresh.value = 'game1';
  fresh.dispatchEvent(new Event('change'));

  await Promise.resolve();
  expect(callback).toHaveBeenCalledWith('game1');
});

    test('does nothing if callback is not a function', async () => {
      // No warning or error should be thrown — the listener simply won't invoke
      // anything if a non-function is passed.
      wireGameSelectListener('#gameSelect', null);

      const fresh = document.getElementById('gameSelect');
      fresh.value = 'game1';

      // Should not throw
      await expect(
        new Promise(resolve => {
          fresh.dispatchEvent(new Event('change'));
          resolve();
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('wireRecipeTypeFilter', () => {
    test('logs error if type filter not found', () => {
      document.body.innerHTML = ''; // remove typeFilter
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      wireRecipeTypeFilter();
      expect(errorSpy).toHaveBeenCalledWith('[UI] Type filter not found for selector: #typeFilter');
    });

    test('calls renderList when type filter changes', () => {
      wireRecipeTypeFilter();
      typeFilter.value = 'someType';
      typeFilter.dispatchEvent(new Event('change'));

      expect(renderList).toHaveBeenCalled();
    });
  });

  describe('wireSearchBox', () => {
    test('logs error if search box not found', () => {
      document.body.innerHTML = ''; // remove searchBox
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      wireSearchBox();
      expect(errorSpy).toHaveBeenCalledWith('[UI] Search box not found for selector: #searchBox');
    });

    test('calls renderList when input changes', () => {
      wireSearchBox();
      searchBox.value = 'test';
      searchBox.dispatchEvent(new Event('input'));

      expect(renderList).toHaveBeenCalled();
    });
  });
});