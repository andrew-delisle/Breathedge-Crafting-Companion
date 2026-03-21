/**
 * pinState.js
 * Manages all state for pinned recipes and their checkbox interactions.
 *
 * Structure:
 *   pinnedRecipes: Map<recipeKey, { name, nodes: Map<nodeId, NodeState> }>
 *
 * NodeState: { checked: boolean, disabled: boolean, isBase: boolean,
 *              qty: number, ingredientKey: string, parentNodeId: string|null,
 *              childNodeIds: string[] }
 */

import { savePinState, clearPinState } from './persistence.js';
import { appState } from './appState.js';

export const pinState = {
  pinnedRecipes: new Map(),
};

/**
 * Returns true if a recipe key is currently pinned.
 */
export function isPinned(recipeKey) {
  return pinState.pinnedRecipes.has(recipeKey);
}

/**
 * Pins a recipe. Builds the full node tree from the flattened recipe data.
 */
export function pinRecipe(recipeKey, recipeName, flatNodes) {
  if (isPinned(recipeKey)) return;

  const nodes = new Map();

  for (const node of flatNodes) {
    nodes.set(node.nodeId, {
      checked: false,
      disabled: false,
      isBase: node.isBase,
      qty: node.qty,
      ingredientKey: node.ingredientKey,
      text: node.text,
      level: node.level,
      parentNodeId: node.parentNodeId,
      childNodeIds: [],
    });
  }

  // Wire up child references from parent
  for (const node of flatNodes) {
    if (node.parentNodeId && nodes.has(node.parentNodeId)) {
      nodes.get(node.parentNodeId).childNodeIds.push(node.nodeId);
    }
  }

  pinState.pinnedRecipes.set(recipeKey, { name: recipeName, nodes, multiplier: 1 });
  savePinState(appState.gameId, pinState);
}

/**
 * Unpins a recipe and saves updated state.
 */
export function unpinRecipe(recipeKey) {
  pinState.pinnedRecipes.delete(recipeKey);
  savePinState(appState.gameId, pinState);
}

/**
 * Unpins all recipes and removes persisted state.
 */
export function unpinAll() {
  pinState.pinnedRecipes.clear();
  clearPinState(appState.gameId);
}

/**
 * Sets the quantity multiplier for a pinned recipe.
 * Minimum value is 1. Non-integers are rounded.
 */
export function setMultiplier(recipeKey, value) {
  const recipe = pinState.pinnedRecipes.get(recipeKey);
  if (!recipe) return;
  recipe.multiplier = Math.max(1, Math.round(Number(value) || 1));
  savePinState(appState.gameId, pinState);
}

/**
 * Toggles a node's checked state and propagates to children.
 * - Checking a node: disables + unchecks all descendants
 * - Unchecking a node: re-enables + unchecks all descendants
 */
export function toggleNode(recipeKey, nodeId) {
  const recipe = pinState.pinnedRecipes.get(recipeKey);
  if (!recipe) return;

  const node = recipe.nodes.get(nodeId);
  if (!node || node.disabled) return;

  node.checked = !node.checked;
  propagateToDescendants(recipe.nodes, nodeId, node.checked);
  savePinState(appState.gameId, pinState);
}

/**
 * Recursively disables/enables and unchecks all descendants of a node.
 */
function propagateToDescendants(nodes, nodeId, parentChecked) {
  const node = nodes.get(nodeId);
  if (!node) return;

  for (const childId of node.childNodeIds) {
    const child = nodes.get(childId);
    if (!child) continue;
    child.disabled = parentChecked;
    child.checked = false;
    propagateToDescendants(nodes, childId, parentChecked);
  }
}

/**
 * Computes the materials summary across all pinned recipes.
 * Only counts base ingredients that are unchecked and not disabled.
 * Returns Map<ingredientKey, { name, qty }>
 */
export function computeMaterialsSummary(data) {
  const summary = new Map();

  for (const [, recipe] of pinState.pinnedRecipes) {
    const multiplier = recipe.multiplier || 1;
    for (const [, node] of recipe.nodes) {
      if (!node.isBase) continue;
      if (node.checked || node.disabled) continue;

      const key = node.ingredientKey;
      const name = data[key]?.name || node.text.replace(/ x\d+$/, '');
      const qty = node.qty * multiplier;
      const existing = summary.get(key);
      if (existing) {
        existing.qty += qty;
      } else {
        summary.set(key, { name, qty });
      }
    }
  }

  return summary;
}
