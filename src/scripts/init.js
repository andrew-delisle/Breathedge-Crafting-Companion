// /src/scripts/init.js

    import { appState } from '../state/appState.js';
    import { loadGameList, loadGameAssets } from './game-loader.js';
    import { loadDefaultAssets } from './utils.js';
    import { setupGameDropdown, wireGameSelectListener, wireRecipeTypeFilter, wireSearchBox } from './lib/ui.js';
	import { populateRecipeTypeFilter, renderList } from './lib/renderList.util.js';

    export async function init() {
      console.log('\n[INIT] Starting initialization...');
      console.log('[INIT] appState before reset:', JSON.stringify(appState));

      try {
        // ✅ Reset partial state
        appState.data = {};
        appState.recipeTypes = {};
        appState.theme = null;
        appState.headerLoaded = false;

        console.log('[INIT] appState after reset:', JSON.stringify(appState));

        // ✅ Load game list if needed
        if (!Object.keys(appState.gameList).length) {
          console.log('[INIT] Loading game list...');
          const gameList = await loadGameList();
          appState.gameList = gameList || {};
          console.log('[INIT] Game list loaded:', JSON.stringify(appState.gameList));
          setupGameDropdown(appState.gameList);
		  
		  
		  populateRecipeTypeFilter(appState.recipeTypes);
renderList();
wireRecipeTypeFilter();
wireSearchBox();


        }

        // ✅ Check for saved game in localStorage
        const validGameIds = Object.keys(appState.gameList);
        console.log('[INIT] Valid game IDs:', validGameIds);

        const savedGame = localStorage.getItem('selectedGame');
        console.log('[INIT] Saved game in localStorage:', savedGame);

        if (savedGame && validGameIds.includes(savedGame)) {
          appState.gameId = savedGame;
          console.log('[INIT] Using saved gameId from localStorage:', appState.gameId);
        } else {
          appState.gameId = null;
          console.log('[INIT] No saved game or invalid, defaulting to fallback.');
        }

        // ✅ Load game assets or fallback
        if (appState.gameId) {
          console.log(`[INIT] Loading assets for gameId: ${appState.gameId}`);
          await loadGameAssets(appState.gameId);
          console.log('[INIT] Finished loading game assets.');
        } else {
          console.warn('[INIT] No valid gameId, falling back to default assets.');
          await loadDefaultAssets();
        }

        // ✅ Wire game select listener
        console.log('[INIT] Wiring game select listener...');
        wireGameSelectListener('#gameSelect', async (gameId) => {
          console.log(`[INIT] Game selection changed to: ${gameId}`);
          if (gameId && gameId !== 'default') {
            localStorage.setItem('selectedGame', gameId);
            appState.gameId = gameId;
            console.log('[INIT] Updating gameId & re-initializing...');
            await init();
          } else {
            localStorage.removeItem('selectedGame');
            console.log('[INIT] Resetting to fallback due to default selection.');
            await loadDefaultAssets();
          }
        });

        console.log('[INIT] Initialization complete. Final appState:', JSON.stringify(appState));
      } catch (err) {
        console.error('[INIT] Initialization failed, falling back to default assets:', err);
        await loadDefaultAssets();
      }
    }























 
 
 
 