    // /src/tests/init.test.js

    import { beforeEach, describe, test, expect, vi } from 'vitest';
    import { init } from '../scripts/init.js';
    import { appState, resetAppState } from '../state/appState.js';
    import * as gameLoader from '../scripts/game-loader.js';
    import * as utils from '../scripts/utils.js';
    import * as ui from '../scripts/lib/ui.js';

    beforeEach(() => {
      resetAppState();
      localStorage.clear();
      vi.restoreAllMocks();
    });

    describe('init', () => {
      test('loads saved gameId from localStorage and applies assets', async () => {
        // ✅ Mock game list
        vi.spyOn(gameLoader, 'loadGameList').mockResolvedValue({
          breathedge: 'Breathedge',
        });

        // ✅ Mock loadGameAssets to set recipe data
        vi.spyOn(gameLoader, 'loadGameAssets').mockImplementation(async (gameId) => {
          appState.data = {
            water: { name: 'Bottle of Water', type: 'Food', ingredients: [] },
          };
          appState.recipeTypes = { Food: 'Food' };
          appState.gameId = gameId;
          return {
            config: { name: 'Breathedge' },
            data: appState.data,
            recipeTypes: appState.recipeTypes,
          };
        });

        localStorage.setItem('selectedGame', 'breathedge');
        await init();

        expect(appState.gameId).toBe('breathedge');
        expect(appState.data).toHaveProperty('water');
        expect(gameLoader.loadGameAssets).toHaveBeenCalledWith('breathedge');
      });

      test('updates appState and localStorage when dropdown selection changes', async () => {
        // ✅ Mock game list
        vi.spyOn(gameLoader, 'loadGameList').mockResolvedValue({
          breathedge: 'Breathedge',
        });

        // ✅ Mock loadGameAssets with a different recipe
        vi.spyOn(gameLoader, 'loadGameAssets').mockImplementation(async (gameId) => {
          appState.data = {
            helmet: { name: 'Helmet', type: 'Equipment', ingredients: [] },
          };
          appState.recipeTypes = { Equipment: 'Equipment' };
          appState.gameId = gameId;
          return {
            config: { name: 'Breathedge' },
            data: appState.data,
            recipeTypes: appState.recipeTypes,
          };
        });

        // ✅ Mock UI listener to trigger change
        const mockCallback = vi.fn();
        vi.spyOn(ui, 'wireGameSelectListener').mockImplementation((_, cb) => {
          mockCallback.mockImplementation(cb);
        });

        await init();
        await mockCallback('breathedge');

        expect(localStorage.getItem('selectedGame')).toBe('breathedge');
        expect(appState.gameId).toBe('breathedge');
        expect(appState.data).toHaveProperty('helmet');
      });

      // Other tests (fallbacks, invalid, etc.) stay the same and already pass.
    });
