    import { appState } from '../state/appState.js';
    import { loadGameList, loadGameAssets } from './game-loader.js';
    import { loadDefaultAssets } from './utils.js';
    import { setupGameDropdown, wireGameSelectListener, wireRecipeTypeFilter, wireSearchBox } from './lib/ui.js';
import { populateRecipeTypeFilter, renderList } from './lib/renderList.util.js';
import { logger } from './lib/logger.js';

    export async function init() {
      logger.log('\n[INIT] Starting initialization...');
      logger.log('[INIT] appState before reset:', JSON.stringify(appState));

      try {
        appState.data = {};
        appState.recipeTypes = {};
        appState.theme = null;
        appState.headerLoaded = false;

        logger.log('[INIT] appState after reset:', JSON.stringify(appState));

        if (!Object.keys(appState.gameList).length) {
          logger.log('[INIT] Loading game list...');
          const gameList = await loadGameList();
          appState.gameList = gameList || {};
          logger.log('[INIT] Game list loaded:', JSON.stringify(appState.gameList));
          setupGameDropdown(appState.gameList);
          populateRecipeTypeFilter(appState.recipeTypes);
          renderList();
          wireRecipeTypeFilter();
          wireSearchBox();

        }

        const validGameIds = Object.keys(appState.gameList);
        logger.log('[INIT] Valid game IDs:', validGameIds);

        const savedGame = localStorage.getItem('selectedGame');
        logger.log('[INIT] Saved game in localStorage:', savedGame);

        if (savedGame && validGameIds.includes(savedGame)) {
          appState.gameId = savedGame;
          logger.log('[INIT] Using saved gameId from localStorage:', appState.gameId);
        } else {
          appState.gameId = null;
          logger.log('[INIT] No saved game or invalid, defaulting to fallback.');
        }

        if (appState.gameId) {
          logger.log(`[INIT] Loading assets for gameId: ${appState.gameId}`);
          await loadGameAssets(appState.gameId);
          logger.log('[INIT] Finished loading game assets.');
        } else {
          logger.warn('[INIT] No valid gameId, falling back to default assets.');
          await loadDefaultAssets();
        }

        async function onGameSelect(gameId) {
          if (gameId && gameId !== 'default') {
            localStorage.setItem('selectedGame', gameId);
            appState.gameId = gameId;
            await init();
          } else {
            localStorage.removeItem('selectedGame');
            await loadDefaultAssets();
            // Re-wire after loadDefaultAssets since the clone replaced the element
            wireGameSelectListener('#gameSelect', onGameSelect);
          }
        }
        wireGameSelectListener('#gameSelect', onGameSelect);

        logger.log('[INIT] Initialization complete. Final appState:', JSON.stringify(appState));
      } catch (err) {
        logger.error('[INIT] Initialization failed, falling back to default assets:', err);
        await loadDefaultAssets();
      }
    }
