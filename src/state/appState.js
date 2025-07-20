// /src/state/appState.js


    // Global app state object
    export const appState = {
      gameId: null,
      data: {},
      recipeTypes: {},
      gameList: {},
      config: {},
      theme: null,
      headerLoaded: false,
      error: null,
      isInitialized: false
    };

    /**
     * Resets appState to its initial clean state.
     * Called on every new game load or when the app starts fresh.
     */
    export function resetAppState() {
      console.log('[APPSTATE] Resetting app state to defaults...');

      appState.gameId = null;
      appState.data = {};
      appState.recipeTypes = {};
      appState.gameList = {};
      appState.config = {};
      appState.theme = null;
      appState.headerLoaded = false;
      appState.error = null;
      appState.isInitialized = false;

      console.log('[APPSTATE] New appState:', JSON.stringify(appState));
    }