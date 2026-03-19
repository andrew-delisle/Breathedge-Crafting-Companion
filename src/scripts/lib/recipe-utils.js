import { logger } from './logger.js';

export function getIngredientName(data, key) {
  if (!data || typeof data !== 'object') {
    logger.warn(`[RecipeUtils] Invalid data passed to getIngredientName():`, data);
    return key;
  }
  return data[key]?.name || key;
}

export function resolveIngredientQuantity(qty = 1, multiplier = 1) {
  const q = parseFloat(qty) || 0;
  const m = parseFloat(multiplier) || 0;
  return q * m;
}

/**
 * Flattens a recipe tree into a list of nodes.
 * Each node includes metadata needed by the pin/checkbox system:
 *   nodeId        - unique path-based id for this node instance
 *   parentNodeId  - nodeId of the parent, or null for top-level ingredients
 *   ingredientKey - the recipe data key for this ingredient
 *   qty           - effective quantity at this level (accounting for multipliers)
 *   isBase        - true if this ingredient has no sub-recipe
 *   text          - display label
 *   level         - nesting depth
 */
export function flattenRecipeTree(
  data, key, level = 0, visited = new Set(),
  multiplier = 1, parentNodeId = null, pathPrefix = ''
) {
  if (!isValidRecipeData(data)) {
    logger.warn(`[RecipeUtils] Invalid recipe data provided:`, data);
    return [];
  }
  if (!isValidRecipeKey(key)) {
    logger.warn(`[RecipeUtils] Invalid recipe key:`, key);
    return [];
  }
  if (!data[key]) return [];
  if (visited.has(key)) {
    logger.warn(`[RecipeUtils] Circular reference detected at '${key}', skipping deeper recursion.`);
    return [];
  }

  visited.add(key);
  const recipe = data[key];
  const result = [];
  const validIngredients = filterValidIngredients(recipe.ingredients, key);

  for (let i = 0; i < validIngredients.length; i++) {
    const ingredient = validIngredients[i];
    const totalQty = resolveIngredientQuantity(ingredient.qty, multiplier);
    const name = getIngredientName(data, ingredient.key);
    const nodeId = `${pathPrefix}${key}__${ingredient.key}__${i}`;
    const hasSubRecipe = !!(data[ingredient.key]?.ingredients?.length);
    const isBase = !hasSubRecipe;

    result.push({
      nodeId,
      parentNodeId,
      ingredientKey: ingredient.key,
      qty: totalQty,
      isBase,
      text: `${name}${totalQty > 1 ? ` x${totalQty}` : ''}`,
      level,
    });

    if (hasSubRecipe) {
      const children = flattenRecipeTree(
        data, ingredient.key, level + 1,
        new Set(visited), totalQty, nodeId, nodeId + '/'
      );
      result.push(...children);
    }
  }

  return result;
}

// Internal helpers
function isValidRecipeData(data) {
  return data && typeof data === 'object';
}

function isValidRecipeKey(key) {
  return key && typeof key === 'string';
}

function filterValidIngredients(ingredients, key) {
  if (!Array.isArray(ingredients)) {
    logger.warn(`[RecipeUtils] Missing or invalid 'ingredients' for '${key}'`);
    return [];
  }
  return ingredients.filter(ing => ing && typeof ing === 'object');
}
