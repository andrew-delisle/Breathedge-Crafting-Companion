 // /src/scripts/game-loader.js

import { appState, resetAppState } from '../state/appState.js';

const BASE_PATHS = {
  games: './src/games',
  fallback: {
    recipes: './src/fallback/fallback-recipes.json',
    recipeTypes: './src/fallback/fallback-recipe-types.json',
    theme: './src/fallback/default-theme.css',
    header: './src/fallback/header.default.html',
  },
};

// ================= THEME LOADER =================
export async function loadTheme(path) {
  console.log(`[GAME-LOADER] Attempting to load theme: ${path}`);
  if (!path || typeof path !== 'string') {
    console.warn('[GAME-LOADER] No theme provided. Skipping.');
    appState.theme = null;
    return;
  }

  try {
    let link = document.getElementById('themeStylesheet');
    if (!link) {
      link = document.createElement('link');
      link.id = 'themeStylesheet';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    link.href = path;
    appState.theme = path;
    console.log(`[GAME-LOADER] Theme applied successfully: ${path}`);
  } catch (err) {
    console.error('[GAME-LOADER] Failed to load theme, falling back:', err);
    appState.theme = BASE_PATHS.fallback.theme;
  }
}

// ================= HEADER LOADER =================
export async function loadHeader(path) {
  console.log(`[GAME-LOADER] Attempting to load header: ${path}`);
  const container = document.getElementById('headerContainer') || document.getElementById('header');
  if (!container) {
    console.warn('[GAME-LOADER] No header container found. Skipping.');
    appState.headerLoaded = false;
    return;
  }

  try {
    if (!path || typeof path !== 'string') throw new Error('Invalid header path');
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch header from ${path}`);

    container.innerHTML = await res.text();
    appState.headerLoaded = true;
    console.log(`[GAME-LOADER] Header loaded successfully: ${path}`);
  } catch (err) {
    console.error('[GAME-LOADER] Failed to load header, falling back:', err);
    try {
      const res = await fetch(BASE_PATHS.fallback.header);
      if (res.ok) {
        container.innerHTML = await res.text();
        appState.headerLoaded = true;
        console.log('[GAME-LOADER] Fallback header applied successfully.');
      } else {
        appState.headerLoaded = false;
      }
    } catch (fallbackErr) {
      console.error('[GAME-LOADER] Fallback header error:', fallbackErr);
      appState.headerLoaded = false;
    }
  }
}

// ================= GAME LIST LOADER =================
export async function loadGameList(path = `${BASE_PATHS.games}/game.list.json`) {
  console.log(`[GAME-LOADER] Loading game list from: ${path}`);
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch game list from ${path}`);
    const list = await res.json();

    // Normalize array format into { id: name }
    const normalizedList = Array.isArray(list)
      ? Object.fromEntries(list.map((g) => [g.id, g.name]))
      : list;

    console.log(`[GAME-LOADER] Game list loaded successfully: ${JSON.stringify(normalizedList)}`);
    return normalizedList;
  } catch (err) {
    console.error('[GAME-LOADER] Error loading game list:', err);
    throw err;
  }
}

// ================= GAME CONFIG =================
export async function loadGameConfig(gameId) {
  if (!gameId || typeof gameId !== 'string') {
    throw new Error('[GAME-LOADER] Invalid gameId provided.');
  }
  const path = `${BASE_PATHS.games}/${gameId}/game-config.json`;
  console.log(`[GAME-LOADER] Loading game config for: ${gameId} from ${path}`);

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch config from ${path}`);
    const config = await res.json();
    console.log(`[GAME-LOADER] Game config loaded: ${JSON.stringify(config)}`);
    return config;
  } catch (err) {
    console.error(`[GAME-LOADER] Error loading game config for ${gameId}, using defaults:`, err);
    return {};
  }
}

// ================= RECIPES & TYPES =================
export async function loadRecipes(path) {
  console.log(`[GAME-LOADER] Loading recipes from: ${path}`);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch recipes from ${path}`);
  const data = await res.json();
  console.log(`[GAME-LOADER] Recipes loaded successfully. Count: ${Object.keys(data).length}`);
  return data;
}

export async function loadRecipeTypes(path) {
  console.log(`[GAME-LOADER] Loading recipe types from: ${path}`);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch recipe types from ${path}`);
  const types = await res.json();
  console.log(`[GAME-LOADER] Recipe types loaded successfully. Count: ${Object.keys(types).length}`);
  return types;
}

    // ================= GAME ASSETS LOADER =================
    import { populateRecipeTypeFilter, renderList } from './lib/renderList.util.js';

    export async function loadGameAssets(gameId) {
      console.log(`\n[GAME-LOADER] ==== Starting loadGameAssets for: ${gameId} ====`);
      if (!gameId || typeof gameId !== 'string') {
        throw new Error('[GAME-LOADER] Invalid gameId provided.');
      }

      resetAppState();

      try {
        const config = await loadGameConfig(gameId);

        const recipePath = config.recipes
          ? `${BASE_PATHS.games}/${gameId}/${config.recipes}`
          : BASE_PATHS.fallback.recipes;

        const recipeTypesPath = config.recipeTypes
          ? `${BASE_PATHS.games}/${gameId}/${config.recipeTypes}`
          : BASE_PATHS.fallback.recipeTypes;

        const themePath = config.theme
          ? `${BASE_PATHS.games}/${gameId}/${config.theme}`
          : BASE_PATHS.fallback.theme;

        const headerPath = config.header
          ? `${BASE_PATHS.games}/${gameId}/${config.header}`
          : BASE_PATHS.fallback.header;

        console.log('[GAME-LOADER] Resolved paths:', {
          recipePath,
          recipeTypesPath,
          themePath,
          headerPath,
        });

        // Load everything
        const [data, recipeTypes] = await Promise.all([
          loadRecipes(recipePath),
          loadRecipeTypes(recipeTypesPath),
          loadTheme(themePath),
          loadHeader(headerPath),
        ]);

        appState.config = config;
        appState.data = data;
        appState.recipeTypes = recipeTypes;
        appState.currentGame = gameId;

        console.log(
          `[GAME-LOADER] Game assets loaded and applied for: ${gameId}`
        );
        console.log(`[GAME-LOADER] Final appState: ${JSON.stringify(appState)}`);

        // ✅ New: Update UI after loading
        console.log('[GAME-LOADER] Populating recipe type filter...');
        populateRecipeTypeFilter(recipeTypes);

        console.log('[GAME-LOADER] Rendering recipe list...');
        renderList();

        return { config, data, recipeTypes };
      } catch (err) {
        console.error('[GAME-LOADER] Critical failure in loadGameAssets. Falling back:', err);
        appState.error = err.message || String(err);
        throw err;
      }
    }
