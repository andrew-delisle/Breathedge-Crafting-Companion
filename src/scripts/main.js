import { wireSortSelect } from './lib/ui.js';
import { init } from './init.js';
import { logger } from './lib/logger.js';

export async function runMain() {
  try {
    await init();
    wireSortSelect('#sortSelect');
  } catch (error) {
    logger.error('[MAIN] App initialization failed:', error);
  }
}

runMain();
