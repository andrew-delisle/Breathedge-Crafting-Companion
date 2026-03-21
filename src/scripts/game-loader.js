import { appState, resetAppState } from '../state/appState.js';
import { unpinAll } from '../state/pinState.js';
import { populateRecipeTypeFilter, renderList } from './lib/renderList.util.js';
import { renderPinned } from './lib/pinnedRecipes.js';
import { logger } from './lib/logger.js';

const BASE_PATHS = {
  games: './src/games',
  fallback: {
    recipes: './src/fallback/fallback-recipes.json',
    recipeTypes: './src/fallback/fallback-recipe-types.json',
    theme: './src/fallback/default-theme.css',
    header: './src/fallback/header.default.html',
  },
};

export function loadTheme(path) {
  logger.log(`[GAME-LOADER] Attempting to load theme: ${path}`);
  if (!path || typeof path !== 'string') {
    logger.warn('[GAME-LOADER] No theme provided. Skipping.');
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
    logger.log(`[GAME-LOADER] Theme applied successfully: ${path}`);
  } catch (err) {
    logger.error('[GAME-LOADER] Failed to load theme, falling back:', err);
    appState.theme = BASE_PATHS.fallback.theme;
  }
}

export async function loadHeader(path) {
  logger.log(`[GAME-LOADER] Attempting to load header: ${path}`);
  const container = document.getElementById('headerContainer') || document.getElementById('header');
  if (!container) {
    logger.warn('[GAME-LOADER] No header container found. Skipping.');
    appState.headerLoaded = false;
    return;
  }

  try {
    if (!path || typeof path !== 'string') throw new Error('Invalid header path');
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch header from ${path}`);

    container.innerHTML = await res.text();
    appState.headerLoaded = true;
    logger.log(`[GAME-LOADER] Header loaded successfully: ${path}`);
  } catch (err) {
    logger.error('[GAME-LOADER] Failed to load header, falling back:', err);
    try {
      const res = await fetch(BASE_PATHS.fallback.header);
      if (res.ok) {
        container.innerHTML = await res.text();
        appState.headerLoaded = true;
        logger.log('[GAME-LOADER] Fallback header applied successfully.');
      } else {
        appState.headerLoaded = false;
      }
    } catch (fallbackErr) {
      logger.error('[GAME-LOADER] Fallback header error:', fallbackErr);
      appState.headerLoaded = false;
    }
  }
}

export async function loadGameList(path = `${BASE_PATHS.games}/game.list.json`) {
  logger.log(`[GAME-LOADER] Loading game list from: ${path}`);
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch game list from ${path}`);
    const list = await res.json();

    // Normalize array format into { id: name }
    const normalizedList = Array.isArray(list)
      ? Object.fromEntries(list.map((g) => [g.id, g.name]))
      : list;

    logger.log(`[GAME-LOADER] Game list loaded successfully: ${JSON.stringify(normalizedList)}`);
    return normalizedList;
  } catch (err) {
    logger.error('[GAME-LOADER] Error loading game list:', err);
    throw err;
  }
}

export async function loadGameConfig(gameId) {
  if (!gameId || typeof gameId !== 'string') {
    throw new Error('[GAME-LOADER] Invalid gameId provided.');
  }
  const path = `${BASE_PATHS.games}/${gameId}/game-config.json`;
  logger.log(`[GAME-LOADER] Loading game config for: ${gameId} from ${path}`);

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch config from ${path}`);
    const config = await res.json();
    logger.log(`[GAME-LOADER] Game config loaded: ${JSON.stringify(config)}`);
    return config;
  } catch (err) {
    logger.error(`[GAME-LOADER] Error loading game config for ${gameId}, using defaults:`, err);
    return {};
  }
}

export async function loadRecipes(path) {
  logger.log(`[GAME-LOADER] Loading recipes from: ${path}`);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch recipes from ${path}`);
  const data = await res.json();
  logger.log(`[GAME-LOADER] Recipes loaded successfully. Count: ${Object.keys(data).length}`);
  return data;
}

export async function loadRecipeTypes(path) {
  logger.log(`[GAME-LOADER] Loading recipe types from: ${path}`);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch recipe types from ${path}`);
  const types = await res.json();
  logger.log(`[GAME-LOADER] Recipe types loaded successfully. Count: ${Object.keys(types).length}`);
  return types;
}

    export async function loadGameAssets(gameId) {
      logger.log(`\n[GAME-LOADER] ==== Starting loadGameAssets for: ${gameId} ====`);
      if (!gameId || typeof gameId !== 'string') {
        throw new Error('[GAME-LOADER] Invalid gameId provided.');
      }

      resetAppState();
      unpinAll();

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

        logger.log('[GAME-LOADER] Resolved paths:', {
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
        appState.gameId = gameId;
        appState.currentGame = gameId; // kept for compatibility

        logger.log(
          `[GAME-LOADER] Game assets loaded and applied for: ${gameId}`
        );
        logger.log(`[GAME-LOADER] Final appState: ${JSON.stringify(appState)}`);

        logger.log('[GAME-LOADER] Populating recipe type filter...');
        populateRecipeTypeFilter(recipeTypes);

        logger.log('[GAME-LOADER] Rendering recipe list...');
        renderList();
        renderPinned();

        return { config, data, recipeTypes };
      } catch (err) {
        logger.error('[GAME-LOADER] Critical failure in loadGameAssets. Falling back:', err);
        appState.error = err.message || String(err);
        throw err;
      }
    }
