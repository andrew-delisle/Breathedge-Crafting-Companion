// /src/scripts/lib/recipe-utils.js

export function getIngredientName(data, key) {
  if (!data || typeof data !== 'object') {
    console.warn(`[RecipeUtils] Invalid data passed to getIngredientName():`, data);
    return key;
  }
  return data[key]?.name || key;
}

export function resolveIngredientQuantity(qty = 1, multiplier = 1) {
  const q = parseFloat(qty) || 0;
  const m = parseFloat(multiplier) || 0;
  return q * m;
}
 
 export function flattenRecipeTree(data, key, level = 0, visited = new Set(), multiplier = 1) {
  if (!isValidRecipeData(data)) {
    console.warn(`[RecipeUtils] Invalid recipe data provided:`, data);
    return [];
  }

  if (!isValidRecipeKey(key)) {
    console.warn(`[RecipeUtils] Invalid recipe key:`, key);
    return [];
  }

  if (!data[key]) {
    return [];
  }

  if (visited.has(key)) {
    console.warn(`[RecipeUtils] Circular reference detected at '${key}', skipping deeper recursion.`);
    return [];
  }

  visited.add(key);
  const recipe = data[key];
  const result = [];

  const validIngredients = filterValidIngredients(recipe.ingredients, key);

  for (const ingredient of validIngredients) {
    const totalQty = resolveIngredientQuantity(ingredient.qty, multiplier);
    const name = getIngredientName(data, ingredient.key);

    result.push({
      text: `${name}${totalQty > 1 ? ` x${totalQty}` : ''}`,
      level
    });

    if (data[ingredient.key]) {
      const children = flattenRecipeTree(
        data,
        ingredient.key,
        level + 1,
        new Set(visited),
        totalQty
      );
      result.push(...children);
    }
  }

  return result;
}

// ✅ Helper functions (internal use only)
function isValidRecipeData(data) {
  return data && typeof data === 'object';
}

function isValidRecipeKey(key) {
  return key && typeof key === 'string';
}

function filterValidIngredients(ingredients, key) {
  if (!Array.isArray(ingredients)) {
    console.warn(`[RecipeUtils] Missing or invalid 'ingredients' for '${key}'`);
    return [];
  }
  return ingredients.filter(ing => ing && typeof ing === 'object');
}
