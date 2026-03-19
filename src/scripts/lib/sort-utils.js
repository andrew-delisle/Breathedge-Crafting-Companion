import { logger } from './logger.js';
    // /src/scripts/lib/sort-utils.js
    /**
     * Sorts recipes alphabetically by name.
     * Default: ascending (A–Z).
     * Logs every step for debugging.
     */
    export function sortRecipes(recipes, order = 'asc') {
      logger.log(`[SortRecipes] Sorting recipes (${recipes?.length || 0}) in ${order} order...`);

      if (!Array.isArray(recipes)) {
        logger.warn('[SortRecipes] Invalid input (not an array). Returning as-is.');
        return recipes || [];
      }

      if (!recipes.length) {
        logger.log('[SortRecipes] No recipes to sort. Returning empty array.');
        return [];
      }

      const safeOrder = order === 'desc' ? 'desc' : 'asc';

      return [...recipes].sort((a, b) => {
        const nameA = a?.name?.toString() || '';
        const nameB = b?.name?.toString() || '';
        return safeOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }




;




