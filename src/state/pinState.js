/**
 * pinState.js
 * Manages all state for pinned recipes and their checkbox interactions.
 *
 * Structure:
 *   pinnedRecipes: Map<recipeKey, { name, nodes: Map<nodeId, NodeState> }>
 *
 * Each node in the tree gets a unique nodeId (recipeKey + path) so the same
 * ingredient appearing in two branches is tracked independently.
 *
 * NodeState: { checked: boolean, disabled: boolean, isBase: boolean,
 *              qty: number, ingredientKey: string, parentNodeId: string|null,
 *              childNodeIds: string[] }
 */

export const pinState = {
  pinnedRecipes: new Map(), // recipeKey -> { name, nodes }
};

/**
 * Returns true if a recipe key is currently pinned.
 */
export function isPinned(recipeKey) {
  return pinState.pinnedRecipes.has(recipeKey);
}

/**
 * Pins a recipe. Builds the full node tree from the flattened recipe data.
 * Each node tracks its own state and references to parent/children.
 */
export function pinRecipe(recipeKey, recipeName, flatNodes) {
  if (isPinned(recipeKey)) return;

  const nodes = new Map();

  // flatNodes is the output of flattenRecipeTree:
  // [{ text, level, ingredientKey, qty, isBase, nodeId, parentNodeId }]
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

  pinState.pinnedRecipes.set(recipeKey, { name: recipeName, nodes });
}

/**
 * Unpins a recipe and clears all its state.
 */
export function unpinRecipe(recipeKey) {
  pinState.pinnedRecipes.delete(recipeKey);
}

/**
 * Unpins all recipes.
 */
export function unpinAll() {
  pinState.pinnedRecipes.clear();
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
 * Only counts base ingredients whose node is not checked and not disabled
 * by a checked ancestor.
 * Returns Map<ingredientKey, { name, qty }>
 */
export function computeMaterialsSummary(data) {
  const summary = new Map();

  for (const [, recipe] of pinState.pinnedRecipes) {
    for (const [, node] of recipe.nodes) {
      if (!node.isBase) continue;
      if (node.checked || node.disabled) continue;

      const key = node.ingredientKey;
      const name = data[key]?.name || node.text.replace(/ x\d+$/, '');
      const existing = summary.get(key);
      if (existing) {
        existing.qty += node.qty;
      } else {
        summary.set(key, { name, qty: node.qty });
      }
    }
  }

  return summary;
}
