// /src/tests/renderList.util.test.js

import {
  getFilteredRecipes,
  buildExpandedIngredientHtml,
  renderRecipeBox,
  populateRecipeTypeFilter,
  renderList
} from '../scripts/lib/renderList.util.js';

import { appState, resetAppState } from '../state/appState.js';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Shared mock data
const baseMockData = {
  helmet: { name: "Helmet", type: 1, ingredients: [] },
  food: { name: "Food Ration", type: 2, ingredients: [] }
};

const mockFlattenFn = () => [
  { text: "Plastic x2", level: 0 },
  { text: "Metal x4", level: 1 }
];

const mockColorFn = level => ["white", "orange", "red"][level] || "gray";

beforeEach(() => {
  // ✅ Fully reset DOM & state before every test to prevent leakage
  document.body.innerHTML = `
    <input id="searchBox" value="">
    <select id="typeFilter"><option value="all">All</option></select>
    <div id="recipeList"></div>
  `;
  resetAppState();
  appState.data = { ...baseMockData };
});

//
// getFilteredRecipes
//
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
});

//
// buildExpandedIngredientHtml
//
describe('buildExpandedIngredientHtml', () => {
  test('generates correct HTML for recipe tree', () => {
    const html = buildExpandedIngredientHtml("helmet", baseMockData, mockFlattenFn, mockColorFn);
    expect(html).toContain('Plastic x2');
    expect(html).toContain('style="color:white');
  });

  test('handles no lines returned from flattenFn', () => {
    const html = buildExpandedIngredientHtml("helmet", baseMockData, () => [], mockColorFn);
    expect(html).toBe("");
  });

  test('supports deep nesting levels gracefully', () => {
    const deepFlatten = () => [{ text: "Layer 1", level: 3 }];
    const html = buildExpandedIngredientHtml("helmet", baseMockData, deepFlatten, mockColorFn);
    expect(html).toContain('padding-left:60px');
  });
});

//
// renderRecipeBox
//
describe('renderRecipeBox', () => {
  test('wraps content inside .ingredients div', () => {
    const el = renderRecipeBox("Helmet", "<div>Item</div>");
    expect(el.classList.contains("ingredients")).toBe(true);
    expect(el.innerHTML).toContain("<h2>Helmet</h2>");
  });

  test('works with special characters in recipe name', () => {
    const el = renderRecipeBox("Test & Special", "<div>Item</div>");
    expect(el.innerHTML).toContain("Test &amp; Special");
  });
});

//
// populateRecipeTypeFilter
//
describe('populateRecipeTypeFilter', () => {
  test('returns early if #typeFilter is missing', () => {
    document.body.innerHTML = ''; // no select present
    populateRecipeTypeFilter({ "1": "Food" });
    expect(document.querySelector("#typeFilter")).toBeNull();
  });

  test('renders all types plus provided types', () => {
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
    const types = { 1: "One", 2: "Two" };
    populateRecipeTypeFilter(types);
    const values = Array.from(document.querySelectorAll("#typeFilter option")).map(o => o.value);
    expect(values).toEqual(["all", "1", "2"]);
  });
});

//
// renderList
//
describe('renderList', () => {
  test('renders filtered recipes into DOM', () => {
    resetAppState();
    appState.data = { ...baseMockData };

    renderList();
    const el = document.querySelector("#recipeList");
    expect(el.innerHTML).toContain("Helmet");
    expect(el.innerHTML).toContain("Food Ration");
  });

  test('returns early if container is missing', () => {
    document.body.innerHTML = ''; // no recipeList div
    renderList();
    expect(document.querySelector("#recipeList")).toBeNull();
  });

  test('skips recipes missing name or key', () => {
    appState.data = {
      helmet: { name: "Helmet", type: 1, ingredients: [] },
      bad: { type: 2 }
    };
    renderList();
    const el = document.querySelector("#recipeList");
    expect(el.innerHTML).toContain("Helmet");
    expect(el.innerHTML).not.toContain("bad");
  });

  test('returns early if #recipeList is missing', () => {
    document.getElementById("recipeList").remove();
    renderList();
    expect(document.querySelector("#recipeList")).toBeNull();
  });

  test('renders no recipes if data is empty', () => {
    appState.data = {};
    renderList();
    expect(document.querySelector("#recipeList").innerHTML).toBe("");
  });

  test('renders errored recipes gracefully (still shows name, empty ingredients)', () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    appState.data = {
      helmet: { name: "Helmet", type: 1, ingredients: [] },
      bad: { name: "Broken", type: 1, ingredients: null }
    };
    renderList();
    const el = document.querySelector("#recipeList");
    expect(el.innerHTML).toContain("Helmet");
    expect(el.innerHTML).toContain("Broken");
    vi.restoreAllMocks();
  });

  test('renders circular/malformed recipes gracefully (still shows name)', () => {
    appState.data = {
      helmet: { name: "Helmet", type: 1, ingredients: [] },
      circ: { name: "Circular", type: 1, ingredients: [{ key: "circ", qty: 1 }] }
    };
    renderList();
    const el = document.querySelector("#recipeList");
    expect(el.innerHTML).toContain("Helmet");
    expect(el.innerHTML).toContain("Circular");
  });

  test('clears previous recipe list before rendering', () => {
    const container = document.querySelector("#recipeList");
    container.innerHTML = "<div>Old</div>";
    renderList();
    expect(container.innerHTML).not.toContain("Old");
  });

  test('populateRecipeTypeFilter does nothing if #typeFilter is missing', () => {
    document.body.innerHTML = ""; // missing typeFilter
    populateRecipeTypeFilter({});
    expect(document.querySelector("#typeFilter")).toBeNull();
  });

  test('renderList safely exits if #recipeList is missing', () => {
    document.getElementById("recipeList").remove();
    renderList();
    expect(document.querySelector("#recipeList")).toBeNull();
  });

test('renders recipe with empty expandedHtml gracefully', () => {
  resetAppState();
  document.body.innerHTML = `
    <input id="searchBox" value="">
    <select id="typeFilter"><option value="all">All</option></select>
    <div id="recipeList"></div>
  `;

  // Minimal appState data
  appState.data = {
    helmet: { name: "Helmet", type: 1, ingredients: [] }
  };

  // Mock buildExpandedIngredientHtml to return empty string
  const originalCreate = document.createElement;
  vi.spyOn(document, 'createElement').mockImplementation(tag => {
    const el = originalCreate.call(document, tag);
    if (tag === 'div') el.innerHTML = ''; // force empty expandedHtml
    return el;
  });

  renderList();
  const el = document.querySelector("#recipeList");
  expect(el.innerHTML).toContain("Helmet");
  vi.restoreAllMocks();
});


test('skips malformed recipe with missing key', () => {
  resetAppState();
  document.body.innerHTML = `
    <input id="searchBox" value="">
    <select id="typeFilter"><option value="all">All</option></select>
    <div id="recipeList"></div>
  `;

  appState.data = {
    bad: { name: "Broken" } // no key -> renders name only, empty ingredients
  };

  renderList();
  const container = document.querySelector("#recipeList");
  expect(container.innerHTML).toContain("Broken");
  expect(container.querySelectorAll(".ingredient").length).toBe(0);
});


});
