  // /src/scripts/lib/renderList.util.js

import { appState } from '../../state/appState.js';
import { getColorForLevel } from '../utils.js';
import { flattenRecipeTree } from './recipe-utils.js';
    import { sortRecipes } from './sort-utils.js'; //

/**
 * Filters recipes by search and type.
 * Now uses appState.data as source of truth.
 */
export function getFilteredRecipes(data = appState.data, search = '', type = 'all') {
  if (!data || typeof data !== 'object') return [];

  return Object.entries(data)
    .filter(([_, recipe]) =>
      recipe &&
      typeof recipe.name === 'string' &&
      (type === 'all' || recipe.type?.toString() === type) &&
      recipe.name.toLowerCase().includes(search)
    )
    .map(([key, recipe]) => ({ key, ...recipe }));
}

/**
 * Builds HTML for expanded ingredient tree.
 */
export function buildExpandedIngredientHtml(recipeKey, data, flattenFn, colorFn) {
  const lines = flattenFn(data, recipeKey);
  return lines
    .map(line => {
      const color = colorFn(line.level);
      return `<div class="ingredient" style="color:${color}; padding-left:${line.level * 20}px">
        <input type="checkbox"> <label>${line.text}</label>
      </div>`;
    })
    .join('');
}

/**
 * Creates a styled recipe box.
 */
export function renderRecipeBox(name, html) {
  const box = document.createElement('div');
  box.classList.add('ingredients');
  box.innerHTML = `<h2>${name}</h2>${html}`;
  return box;
}

/**
 * Populates the recipe type dropdown.
 */
export function populateRecipeTypeFilter(types) {
  const filter = document.getElementById('typeFilter');
  if (!filter) return;

  filter.innerHTML = '';

  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = 'All Types';
  filter.appendChild(all);

  for (const [id, label] of Object.entries(types)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = label;
    filter.appendChild(opt);
  }
}

/**
 * Renders recipes into the DOM using appState as the source of truth.
 */
/* 
export function renderList() {
  const container = document.getElementById('recipeList');
  if (!container) return;

  const search = document.getElementById('searchBox')?.value.toLowerCase() ?? '';
  const type = document.getElementById('typeFilter')?.value ?? 'all';
  const data = appState.data;

  container.innerHTML = '';

  if (!data || !Object.keys(data).length) {
    console.warn('[RenderList] No recipe data found.');
    return;
  }

  const filteredRecipes = getFilteredRecipes(data, search, type);

  for (const recipe of filteredRecipes) {
    if (!recipe || typeof recipe.name !== 'string' || typeof recipe.key !== 'string') {
      console.warn('[RenderList] Skipping malformed recipe:', recipe);
      continue;
    }

    try {
      const expandedHtml = buildExpandedIngredientHtml(
        recipe.key,
        data,
        flattenRecipeTree,
        getColorForLevel
      );

      // ✅ Render recipes with or without ingredients
      const recipeBox = renderRecipeBox(recipe.name, expandedHtml || '');
      container.appendChild(recipeBox);
    } catch (err) {
      console.error(`[RenderList] Skipping problematic recipe: ${recipe.name}`, err);
    }
  }
}
 */



/*     // /src/scripts/lib/renderList.util.js
    import { appState } from '../../state/appState.js';
    import { getColorForLevel } from '../utils.js';
    import { flattenRecipeTree } from './recipe-utils.js';
    import { sortRecipes } from './sort-utils.js'; // ✅ New import */


    export function renderList() {
      const container = document.getElementById('recipeList');
      if (!container) return;

      const search = document.getElementById('searchBox')?.value.toLowerCase() ?? '';
      const type = document.getElementById('typeFilter')?.value ?? 'all';
      const sortOrder = document.getElementById('sortSelect')?.value ?? 'a-z'; // ✅ new
      const data = appState.data;

      container.innerHTML = '';

      if (!data || !Object.keys(data).length) {
        console.warn('[RenderList] No recipe data found.');
        return;
      }

      let filteredRecipes = getFilteredRecipes(data, search, type);

      // ✅ New sorting step
      try {
        console.log(`[RenderList] Sorting recipes by: ${sortOrder}`);
        filteredRecipes = sortRecipes(filteredRecipes, sortOrder);
      } catch (err) {
        console.warn(`[RenderList] Failed to sort, fallback to original order:`, err);
      }

      for (const recipe of filteredRecipes) {
        if (!recipe || typeof recipe.name !== 'string' || typeof recipe.key !== 'string') {
          console.warn('[RenderList] Skipping malformed recipe:', recipe);
          continue;
        }

        try {
          const expandedHtml = buildExpandedIngredientHtml(
            recipe.key,
            data,
            flattenRecipeTree,
            getColorForLevel
          );

          const recipeBox = renderRecipeBox(recipe.name, expandedHtml || '');
          container.appendChild(recipeBox);
        } catch (err) {
          console.error(`[RenderList] Skipping problematic recipe: ${recipe.name}`, err);
        }
      }
    }
