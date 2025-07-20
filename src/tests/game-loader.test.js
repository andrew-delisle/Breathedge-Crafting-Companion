    import {
      loadTheme,
      loadHeader,
      loadGameList,
      loadGameConfig,
      loadRecipes,
      loadRecipeTypes,
      loadGameAssets
    } from '../scripts/game-loader.js';

    import { appState, resetAppState } from '../state/appState.js';
    import { beforeEach, describe, test, expect, vi } from 'vitest';

    beforeEach(() => {
      resetAppState();
      vi.restoreAllMocks();
      document.head.innerHTML = '';
      document.body.innerHTML = `<div id="headerContainer"></div>`;
      global.fetch = vi.fn();
    });

    function mockFetchSuccess(data) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => data,
        text: async () => typeof data === 'string' ? data : JSON.stringify(data)
      });
    }

    function mockFetchFail() {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });
    }

    // ========== THEME & HEADER ==========
    describe('loadTheme', () => {
      test('applies theme and updates appState', async () => {
        await loadTheme('test-theme.css');
        const link = document.getElementById('themeStylesheet');
        expect(link).not.toBeNull();
        expect(link.href).toContain('test-theme.css');
        expect(appState.theme).toBe('test-theme.css');
      });

      test('handles invalid theme path gracefully', async () => {
        await loadTheme(null);
        expect(appState.theme).toBeNull();
      });
    });

    describe('loadHeader', () => {
      test('loads header HTML successfully', async () => {
        mockFetchSuccess('<h1>Header</h1>');
        await loadHeader('header.html');
        expect(document.getElementById('headerContainer').innerHTML)
          .toContain('Header');
        expect(appState.headerLoaded).toBe(true);
      });

      test('falls back if header container missing', async () => {
        document.body.innerHTML = '';
        await loadHeader('header.html');
        expect(appState.headerLoaded).toBe(false);
      });

      test('handles fetch failure and applies fallback', async () => {
        mockFetchFail();
        mockFetchSuccess('<h1>Fallback</h1>'); // fallback will succeed
        await loadHeader('bad-header.html');
        expect(appState.headerLoaded).toBe(true);
      });
    });

    // ========== GAME LIST ==========
    describe('loadGameList', () => {
      test('normalizes array format into object', async () => {
        const mockList = [{ id: 'game1', name: 'Game 1' }];
        mockFetchSuccess(mockList);
        const result = await loadGameList();
        expect(result).toEqual({ game1: 'Game 1' });
      });

      test('returns object directly if already normalized', async () => {
        const mockList = { game2: 'Game 2' };
        mockFetchSuccess(mockList);
        const result = await loadGameList();
        expect(result).toEqual(mockList);
      });

      test('throws on fetch failure', async () => {
        mockFetchFail();
        await expect(loadGameList()).rejects.toThrow();
      });
    });

    // ========== GAME CONFIG ==========
    describe('loadGameConfig', () => {
      test('loads config successfully', async () => {
        const mockConfig = { theme: 'theme.css' };
        mockFetchSuccess(mockConfig);
        const result = await loadGameConfig('testGame');
        expect(result).toEqual(mockConfig);
      });

      test('returns {} on fetch failure', async () => {
        mockFetchFail();
        const result = await loadGameConfig('badGame');
        expect(result).toEqual({});
      });

      test('throws for invalid gameId', async () => {
        await expect(loadGameConfig(null))
          .rejects.toThrow('[GAME-LOADER] Invalid gameId provided.');
      });
    });

    // ========== RECIPES & TYPES ==========
    describe('loadRecipes & loadRecipeTypes', () => {
      test('loads recipes successfully', async () => {
        const mockRecipes = { item1: {} };
        mockFetchSuccess(mockRecipes);
        const result = await loadRecipes('recipes.json');
        expect(result).toEqual(mockRecipes);
      });

      test('loads recipe types successfully', async () => {
        const mockTypes = { Food: 'Food' };
        mockFetchSuccess(mockTypes);
        const result = await loadRecipeTypes('recipe-types.json');
        expect(result).toEqual(mockTypes);
      });
    });

    // ========== GAME ASSETS ==========
    describe('loadGameAssets', () => {
      test('throws error for invalid gameId', async () => {
        await expect(loadGameAssets(null))
          .rejects.toThrow('[GAME-LOADER] Invalid gameId provided.');
      });

      test('loads all assets and updates appState', async () => {
        const mockConfig = {
          recipes: 'recipes.json',
          recipeTypes: 'recipe-types.json',
          theme: 'theme.css',
          header: 'header.html'
        };
        const mockRecipes = { testItem: {} };
        const mockTypes = { Food: 'Food' };

        // Sequence of mock returns (config, recipes, types, theme, header)
        global.fetch = vi.fn()
          .mockResolvedValueOnce({ ok: true, json: async () => mockConfig })
          .mockResolvedValueOnce({ ok: true, json: async () => mockRecipes })
          .mockResolvedValueOnce({ ok: true, json: async () => mockTypes })
          .mockResolvedValueOnce({ ok: true }) // theme
          .mockResolvedValueOnce({ ok: true, text: async () => '<h1>Header</h1>' });

        const result = await loadGameAssets('testGame');
        expect(result.config).toEqual(mockConfig);
        expect(appState.data).toEqual(mockRecipes);
        expect(appState.recipeTypes).toEqual(mockTypes);
        expect(appState.currentGame).toBe('testGame');
      });

      test('handles loader errors gracefully', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = vi.fn().mockRejectedValue(new Error('Config load failed'));
        await expect(loadGameAssets('failGame')).rejects.toThrow('Config load failed');
      });
    });
