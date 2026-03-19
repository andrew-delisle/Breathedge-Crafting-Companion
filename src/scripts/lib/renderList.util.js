import { appState } from '../../state/appState.js';
import { getColorForLevel } from '../utils.js';
import { flattenRecipeTree } from './recipe-utils.js';
import { sortRecipes } from './sort-utils.js';
import { logger } from './logger.js';
import { isPinned, pinRecipe } from '../../state/pinState.js';
import { renderPinned } from './pinnedRecipes.js';

/**
 * Filters recipes by search and type.
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
 * Builds the ingredient tree DOM for a recipe card in the browse list.
 * Ingredients are not interactive here — no checkboxes.
 */
function buildIngredientTree(recipeKey, data) {
  const nodes = flattenRecipeTree(data, recipeKey);
  if (!nodes.length) return null;

  const tree = document.createElement('div');
  tree.classList.add('ingredient-tree');

  for (const node of nodes) {
    const color = getColorForLevel(node.level);
    const row = document.createElement('div');
    row.classList.add('ingredient');
    row.style.color = color;
    row.style.paddingLeft = `${node.level * 20}px`;
    row.textContent = node.text;
    tree.appendChild(row);
  }

  return tree;
}

/**
 * Creates a recipe card for the browse list with a collapse toggle and pin button.
 * Collapsed by default.
 */
function buildRecipeCard(recipe, data) {
  const card = document.createElement('div');
  card.classList.add('recipe-card');
  card.dataset.recipeKey = recipe.key;

  // --- Header ---
  const header = document.createElement('div');
  header.classList.add('recipe-card-header');

  const toggleBtn = document.createElement('button');
  toggleBtn.classList.add('btn-toggle');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.innerHTML = '<span class="toggle-arrow">▶</span>';

  const title = document.createElement('span');
  title.classList.add('recipe-card-title');
  title.textContent = recipe.name;

  const pinBtn = document.createElement('button');
  pinBtn.classList.add('btn-pin');
  const pinned = isPinned(recipe.key);
  pinBtn.textContent = pinned ? '📌 Pinned' : '📌 Pin';
  pinBtn.classList.toggle('is-pinned', pinned);
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isPinned(recipe.key)) {
      const nodes = flattenRecipeTree(data, recipe.key);
      pinRecipe(recipe.key, recipe.name, nodes);
      pinBtn.textContent = '📌 Pinned';
      pinBtn.classList.add('is-pinned');
      renderPinned();
    }
  });

  header.appendChild(toggleBtn);
  header.appendChild(title);
  header.appendChild(pinBtn);
  card.appendChild(header);

  // --- Collapsible body ---
  const body = document.createElement('div');
  body.classList.add('recipe-card-body');
  body.style.display = 'none';

  const tree = buildIngredientTree(recipe.key, data);
  if (tree) body.appendChild(tree);
  card.appendChild(body);

  // Wire toggle
  const doToggle = () => {
    const expanded = body.style.display !== 'none';
    body.style.display = expanded ? 'none' : 'block';
    toggleBtn.setAttribute('aria-expanded', String(!expanded));
    toggleBtn.querySelector('.toggle-arrow').textContent = expanded ? '▶' : '▼';
  };
  toggleBtn.addEventListener('click', doToggle);
  title.addEventListener('click', doToggle);
  title.style.cursor = 'pointer';

  return card;
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
 * Renders the recipe browse list.
 */
export function renderList() {
  const container = document.getElementById('recipeList');
  if (!container) return;

  const search = document.getElementById('searchBox')?.value.toLowerCase() ?? '';
  const type = document.getElementById('typeFilter')?.value ?? 'all';
  const sortOrder = document.getElementById('sortSelect')?.value ?? 'asc';
  const data = appState.data;

  container.innerHTML = '';

  if (!data || !Object.keys(data).length) {
    logger.warn('[RenderList] No recipe data found.');
    return;
  }

  let filteredRecipes = getFilteredRecipes(data, search, type);

  try {
    filteredRecipes = sortRecipes(filteredRecipes, sortOrder);
  } catch (err) {
    logger.warn('[RenderList] Failed to sort, fallback to original order:', err);
  }

  for (const recipe of filteredRecipes) {
    if (!recipe || typeof recipe.name !== 'string' || typeof recipe.key !== 'string') {
      logger.warn('[RenderList] Skipping malformed recipe:', recipe);
      continue;
    }
    try {
      const card = buildRecipeCard(recipe, data);
      container.appendChild(card);
    } catch (err) {
      logger.error(`[RenderList] Skipping problematic recipe: ${recipe.name}`, err);
    }
  }
}

// Re-render the browse list when a pin is removed so pin buttons update.
document.addEventListener('pins:changed', () => renderList());
