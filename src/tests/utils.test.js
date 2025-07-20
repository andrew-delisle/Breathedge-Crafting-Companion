// src/tests/utils.test.js
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { appState, resetAppState } from '../state/appState';
import {
  getColorForLevel,
  loadDefaultAssets,
} from '../scripts/utils.js';

// ✅ Mock dependencies
vi.mock('../scripts/game-loader.js', () => ({
  loadTheme: vi.fn(),
  loadHeader: vi.fn(),
  loadRecipes: vi.fn(),
  loadRecipeTypes: vi.fn(),
}));

vi.mock('../scripts/lib/renderList.util.js', () => ({
  renderList: vi.fn(),
  populateRecipeTypeFilter: vi.fn(),
}));

import {
  loadTheme,
  loadHeader,
  loadRecipes,
  loadRecipeTypes,
} from '../scripts/game-loader.js';
import {
  renderList,
  populateRecipeTypeFilter,
} from '../scripts/lib/renderList.util.js';

describe('utils.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAppState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getColorForLevel', () => {
    test('returns specific level color if available', () => {
      const getComputedStyleMock = vi.fn(() => ({
        getPropertyValue: (prop) =>
          prop === '--nest-2' ? 'blue' : '',
      }));
      vi.stubGlobal('getComputedStyle', getComputedStyleMock);

      const color = getColorForLevel(2);
      expect(color).toBe('blue');
    });

    test('falls back to default color if level color not set', () => {
      const getComputedStyleMock = vi.fn(() => ({
        getPropertyValue: (prop) =>
          prop === '--nest-default' ? 'green' : '',
      }));
      vi.stubGlobal('getComputedStyle', getComputedStyleMock);

      const color = getColorForLevel(5);
      expect(color).toBe('green');
    });

    test('falls back to #cccccc if no CSS vars exist', () => {
      const getComputedStyleMock = vi.fn(() => ({
        getPropertyValue: () => '',
      }));
      vi.stubGlobal('getComputedStyle', getComputedStyleMock);

      const color = getColorForLevel(99);
      expect(color).toBe('#cccccc');
    });
  });

  describe('loadDefaultAssets', () => {
    test('loads all assets and updates appState correctly', async () => {
      loadTheme.mockResolvedValue();
      loadHeader.mockResolvedValue();
      loadRecipes.mockResolvedValue({ recipe1: {} });
      loadRecipeTypes.mockResolvedValue({ type1: {} });

      await loadDefaultAssets();

      expect(loadTheme).toHaveBeenCalledWith('./src/fallback/fallback-theme.css');
      expect(loadHeader).toHaveBeenCalledWith('./src/fallback/header.default.html');
      expect(loadRecipes).toHaveBeenCalled();
      expect(loadRecipeTypes).toHaveBeenCalled();

      expect(appState.config.theme).toBe('fallback-theme.css');
      expect(appState.data).toHaveProperty('recipe1');
      expect(appState.recipeTypes).toHaveProperty('type1');

      expect(populateRecipeTypeFilter).toHaveBeenCalledWith(appState.recipeTypes);
      expect(renderList).toHaveBeenCalled();
    });

    test('logs error and continues when a loader fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      loadTheme.mockRejectedValue(new Error('Theme failed'));

      await expect(loadDefaultAssets()).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        '[DEFAULT ASSETS] Failed to load default assets:',
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });
  });
});