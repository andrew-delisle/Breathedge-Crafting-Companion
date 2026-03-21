/**
 * persistence.js
 * Handles saving and rehydrating pin state to/from localStorage.
 *
 * Storage key: 'pinState:<gameId>'
 *
 * Saved format:
 * {
 *   "version": 1,
 *   "pins": {
 *     "<recipeKey>": {
 *       "checkedNodes": ["nodeId1", "nodeId2"]
 *     }
 *   }
 * }
 *
 * We only save which nodeIds are checked — not the full tree.
 * On rehydration we rebuild the tree from live data and replay
 * the checks, so propagateToDescendants runs naturally and all
 * disabled states are correctly derived.
 *
 * Note: this module does NOT import from pinState.js to avoid a
 * circular dependency. pinState.js imports us; we receive the
 * pinState object and mutation functions as arguments instead.
 */

import { flattenRecipeTree } from '../scripts/lib/recipe-utils.js';
import { logger } from '../scripts/lib/logger.js';

const STORAGE_VERSION = 1;

function storageKey(gameId) {
  return `pinState:${gameId}`;
}

/**
 * Serializes current pin state and writes it to localStorage.
 * Receives pinState directly to avoid circular import.
 */
export function savePinState(gameId, pinState) {
  if (!gameId || !pinState) return;

  try {
    const pins = {};

    for (const [recipeKey, recipe] of pinState.pinnedRecipes) {
      const checkedNodes = [];
      for (const [nodeId, node] of recipe.nodes) {
        if (node.checked) checkedNodes.push(nodeId);
      }
      pins[recipeKey] = { checkedNodes, multiplier: recipe.multiplier || 1 };
    }

    const payload = JSON.stringify({ version: STORAGE_VERSION, pins });
    localStorage.setItem(storageKey(gameId), payload);
    logger.log(`[PERSISTENCE] Saved pin state for ${gameId}`);
  } catch (err) {
    logger.error('[PERSISTENCE] Failed to save pin state:', err);
  }
}

/**
 * Loads and rehydrates pin state from localStorage for the given gameId.
 * Must be called after game assets are loaded so data is populated.
 * Receives pinRecipe and toggleNode to avoid circular import.
 */
export function loadPinState(gameId, data, pinRecipe, toggleNode, pinState) {
  if (!gameId || !data) return;

  try {
    const raw = localStorage.getItem(storageKey(gameId));
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (!saved || saved.version !== STORAGE_VERSION || !saved.pins) return;

    logger.log(`[PERSISTENCE] Rehydrating pin state for ${gameId}`);

    for (const [recipeKey, pinData] of Object.entries(saved.pins)) {
      // Skip if recipe no longer exists in current game data
      if (!data[recipeKey]) {
        logger.warn(`[PERSISTENCE] Skipping stale pin: '${recipeKey}' not in data`);
        continue;
      }

      // Rebuild the node tree from live data
      const flatNodes = flattenRecipeTree(data, recipeKey);
      if (!flatNodes.length) continue;

      const recipeName = data[recipeKey]?.name || recipeKey;
      pinRecipe(recipeKey, recipeName, flatNodes);

      // Restore multiplier
      const savedRecipe = pinState.pinnedRecipes.get(recipeKey);
      if (savedRecipe && pinData.multiplier && pinData.multiplier > 1) {
        savedRecipe.multiplier = Math.max(1, Math.round(Number(pinData.multiplier)));
      }

      // Replay checked states in order — toggleNode handles propagation naturally
      // so parent checks will correctly disable children
      const checkedSet = new Set(pinData.checkedNodes || []);
      for (const nodeId of checkedSet) {
        toggleNode(recipeKey, nodeId);
      }
    }

    logger.log(`[PERSISTENCE] Rehydration complete. ${Object.keys(saved.pins).length} recipe(s) restored.`);
  } catch (err) {
    logger.error('[PERSISTENCE] Failed to load pin state:', err);
  }
}

/**
 * Clears saved pin state for a given gameId.
 */
export function clearPinState(gameId) {
  if (!gameId) return;
  try {
    localStorage.removeItem(storageKey(gameId));
    logger.log(`[PERSISTENCE] Cleared pin state for ${gameId}`);
  } catch (err) {
    logger.error('[PERSISTENCE] Failed to clear pin state:', err);
  }
}
