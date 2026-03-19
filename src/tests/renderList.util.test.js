import {
  getFilteredRecipes,
  populateRecipeTypeFilter,
  renderList
} from '../scripts/lib/renderList.util.js';

import { appState, resetAppState } from '../state/appState.js';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock pinState and pinnedRecipes so tests don't need a full DOM setup for those
vi.mock('../../state/pinState.js', () => ({
  isPinned: vi.fn(() => false),
  pinRecipe: vi.fn(),
}));

vi.mock('../scripts/lib/pinnedRecipes.js', () => ({
  renderPinned: vi.fn(),
}));

const baseMockData = {
  helmet:   { name: "Helmet",      type: 1, ingredients: [] },
  food:     { name: "Food Ration", type: 2, ingredients: [] },
};

beforeEach(() => {
  document.body.innerHTML = `
    <input id="searchBox" value="">
    <select id="typeFilter"><option value="all">All</option></select>
    <select id="sortSelect"><option value="asc">A-Z</option></select>
    <div id="recipeList"></div>
    <div id="pinnedRecipes"></div>
    <div id="materialsSummary" class="hidden"></div>
  `;
  resetAppState();
  appState.data = { ...baseMockData };
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getFilteredRecipes
// ---------------------------------------------------------------------------
describe('getFilteredRecipes', () => {
  test('filters by type', () => {
    const result = getFilteredRecipes(baseMockData, "", "2");
    expect(result.map(r => r.name)).toEqual(["Food Ration"]);
  });

  test('filters by search term', () => {
    const result = getFilteredRecipes(baseMockData, "helmet", "all");
    expect(result.map(r => r.name)).toEqual(["Helmet"]);
  });

  test('filters by both type and search term', () => {
    const result = getFilteredRecipes(baseMockData, "food", "2");
    expect(result.map(r => r.name)).toEqual(["Food Ration"]);
  });

  test('returns empty for malformed recipes', () => {
    const malformed = { bad: null };
    const result = getFilteredRecipes(malformed, "", "all");
    expect(result).toEqual([]);
  });

  test('returns empty for invalid data', () => {
    expect(getFilteredRecipes(null, "", "all")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// populateRecipeTypeFilter
// ---------------------------------------------------------------------------
describe('populateRecipeTypeFilter', () => {
  test('returns early if #typeFilter is missing', () => {
    document.body.innerHTML = '';
    populateRecipeTypeFilter({ "1": "Food" });
    expect(document.querySelector("#typeFilter")).toBeNull();
  });

  test('renders All Types plus provided types', () => {
    const types = { "1": "Food", "2": "Tools" };
    populateRecipeTypeFilter(types);
    const options = Array.from(document.querySelectorAll("#typeFilter option"));
    expect(options.map(o => o.textContent)).toEqual(["All Types", "Food", "Tools"]);
  });

  test('handles empty types gracefully', () => {
    populateRecipeTypeFilter({});
    const options = Array.from(document.querySelectorAll("#typeFilter option"));
    expect(options.map(o => o.textContent)).toEqual(["All Types"]);
  });

  test('handles numeric keys correctly', () => {
    populateRecipeTypeFilter({ 1: "One", 2: "Two" });
    const values = Array.from(document.querySelectorAll("#typeFilter option")).map(o => o.value);
    expect(values).toEqual(["all", "1", "2"]);
  });
});

// ---------------------------------------------------------------------------
// renderList
// ---------------------------------------------------------------------------
describe('renderList', () => {
  test('renders recipe cards into DOM', () => {
    renderList();
    const el = document.querySelector("#recipeList");
    expect(el.innerHTML).toContain("Helmet");
    expect(el.innerHTML).toContain("Food Ration");
  });

  test('each recipe gets a .recipe-card element', () => {
    renderList();
    const cards = document.querySelectorAll(".recipe-card");
    expect(cards.length).toBe(2);
  });

  test('each card has a pin button and toggle button', () => {
    renderList();
    const card = document.querySelector(".recipe-card");
    expect(card.querySelector(".btn-pin")).not.toBeNull();
    expect(card.querySelector(".btn-toggle")).not.toBeNull();
  });

  test('ingredient body is collapsed by default', () => {
    renderList();
    const body = document.querySelector(".recipe-card-body");
    expect(body.style.display).toBe("none");
  });

  test('returns early if container is missing', () => {
    document.body.innerHTML = '';
    renderList(); // should not throw
    expect(document.querySelector("#recipeList")).toBeNull();
  });

  test('skips recipes missing name or key', () => {
    appState.data = {
      helmet: { name: "Helmet", type: 1, ingredients: [] },
      bad:    { type: 2 }
    };
    renderList();
    const el = document.querySelector("#recipeList");
    expect(el.innerHTML).toContain("Helmet");
  });

  test('renders no cards if data is empty', () => {
    appState.data = {};
    renderList();
    expect(document.querySelector("#recipeList").innerHTML).toBe("");
  });

  test('clears previous list before rendering', () => {
    const container = document.querySelector("#recipeList");
    container.innerHTML = "<div>Old</div>";
    renderList();
    expect(container.innerHTML).not.toContain("Old");
  });
});
