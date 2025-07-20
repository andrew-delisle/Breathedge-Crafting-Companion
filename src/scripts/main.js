    // /src/scripts/main.js

 
 /* 
    import { loadDefaultAssets } from './utils.js';
    import { wireGameSelectListener, wireSortSelect } from './lib/ui.js';
    import { appState } from '../state/appState.js';
    import { init } from './init.js';


    export async function runMain() {
      try {
        console.log('[MAIN] Starting app initialization...');

        console.log('[MAIN] Loading default assets...');
        await loadDefaultAssets();
        console.log('[MAIN] Default assets loaded.');

        console.log('[MAIN] Running initial init()...');
        await init();
        console.log('[MAIN] Initial init complete. Current appState:', JSON.stringify(appState));

        console.log('[MAIN] Wiring dropdown change listener...');
        wireGameSelectListener('#gameSelect', async (gameId) => {
          console.log('[MAIN] Dropdown changed to:', gameId);

          if (gameId && gameId !== 'default') {
            console.log('[MAIN] Updating appState.gameId to:', gameId);
            appState.gameId = gameId;

            console.log('[MAIN] Re-running init() with gameId:', gameId);

            try {
              await init();
              console.log('[MAIN] Init re-run complete. appState after change:', JSON.stringify(appState));
            } catch (error) {
              console.error('[MAIN] App initialization failed:', error);
            }
          } else {
            console.log('[MAIN] Ignored change (gameId was empty or "default").');
          }
        });

        console.log('[MAIN] App fully initialized and ready.');
      } catch (error) {
        console.error('[MAIN] App initialization failed:', error);
      }
    }

    // ✅ Ensure runMain is called at startup
    runMain();
 */
 
     import { loadDefaultAssets } from './utils.js';
    import { wireGameSelectListener, wireSortSelect } from './lib/ui.js';
    import { appState } from '../state/appState.js';
    import { init } from './init.js';

    export async function runMain() {
      try {
        console.log('[MAIN] Starting app initialization...');

        console.log('[MAIN] Loading default assets...');
        await loadDefaultAssets();
        console.log('[MAIN] Default assets loaded.');

        console.log('[MAIN] Running initial init()...');
        await init();
        console.log('[MAIN] Initial init complete. Current appState:', JSON.stringify(appState));

        console.log('[MAIN] Wiring dropdown change listener...');
        wireGameSelectListener('#gameSelect', async (gameId) => {
          console.log('[MAIN] Dropdown changed to:', gameId);

          if (gameId && gameId !== 'default') {
            console.log('[MAIN] Updating appState.gameId to:', gameId);
            appState.gameId = gameId;

            console.log('[MAIN] Re-running init() with gameId:', gameId);

            try {
              await init();
              console.log('[MAIN] Init re-run complete. appState after change:', JSON.stringify(appState));
            } catch (error) {
              console.error('[MAIN] App initialization failed:', error);
            }
          } else {
            console.log('[MAIN] Ignored change (gameId was empty or "default").');
          }
        });

        console.log('[MAIN] Wiring sort dropdown listener...');
        wireSortSelect('#sortSelect');

        console.log('[MAIN] App fully initialized and ready.');
      } catch (error) {
        console.error('[MAIN] App initialization failed:', error);
      }
    }

    // ✅ Ensure runMain is called at startup
    runMain();
