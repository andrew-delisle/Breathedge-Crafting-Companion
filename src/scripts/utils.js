 // /scripts/utils.js

    import { appState } from '../state/appState.js';
    import { loadTheme, loadHeader, loadRecipes, loadRecipeTypes } from './game-loader.js';
    import { renderList, populateRecipeTypeFilter } from './lib/renderList.util.js';

/**
 * Gets the color for a given nesting level using CSS variables.
 */
export function getColorForLevel(level) {
  const root = getComputedStyle(document.documentElement);
  const color = root.getPropertyValue(`--nest-${level}`).trim();
  return color || root.getPropertyValue('--nest-default').trim() || '#cccccc';
}

/**
 * Loads default theme, header, and recipes, then updates appState.
 */

    export async function loadDefaultAssets() {
      console.log('\n[DEFAULT ASSETS] Starting fallback asset loading...');

      try {
        // ✅ Load fallback theme and header
        console.log('[DEFAULT ASSETS] Loading fallback theme...');
        await loadTheme('./src/fallback/fallback-theme.css');
        console.log('[DEFAULT ASSETS] Fallback theme loaded.');

        console.log('[DEFAULT ASSETS] Loading fallback header...');
        await loadHeader('./src/fallback/header.default.html');
        console.log('[DEFAULT ASSETS] Fallback header loaded.');

        // ✅ Load fallback recipes & recipe types
        console.log('[DEFAULT ASSETS] Loading fallback recipes...');
        const data = await loadRecipes('./src/fallback/fallback-recipes.json');
        console.log('[DEFAULT ASSETS] Fallback recipes loaded, count:', data ? Object.keys(data).length : 0);

        console.log('[DEFAULT ASSETS] Loading fallback recipe types...');
        const recipeTypes = await loadRecipeTypes('./src/fallback/fallback-recipe-types.json');
        console.log('[DEFAULT ASSETS] Fallback recipe types loaded, count:', recipeTypes ? Object.keys(recipeTypes).length : 0);

        // ✅ Update appState consistently
        appState.gameId = null;
        appState.config = { theme: 'fallback-theme.css', header: 'header.default.html' };
        appState.data = data || {};
        appState.recipeTypes = recipeTypes || {};

        console.log('[DEFAULT ASSETS] Updated appState:', JSON.stringify(appState));

        // ✅ Render UI with fallback data
        populateRecipeTypeFilter(appState.recipeTypes);
        renderList();

        console.log('[DEFAULT ASSETS] Fallback assets fully loaded and rendered.');
      } catch (err) {
        console.error('[DEFAULT ASSETS] Failed to load default assets:', err);
      }
    }

