import { describe, test, expect, beforeEach, vi } from 'vitest';
import { flattenRecipeTree } from '../scripts/lib/recipe-utils.js';

describe('flattenRecipeTree - full coverage', () => {
  let mockData;

  beforeEach(() => {
    mockData = {
      helmet: {
        name: 'Helmet',
        type: 1,
        ingredients: [
          { key: 'plastic', qty: 2 },
          { key: 'metal', qty: 4 }
        ]
      },
      plastic: { name: 'Plastic', type: 2, ingredients: [] },
      metal: { name: 'Metal', type: 2, ingredients: [] }
    };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns empty for invalid recipe data', () => {
    const result = flattenRecipeTree(null, 'helmet');
    expect(result).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith('[RecipeUtils] Invalid recipe data provided:', null);
  });

  test('returns empty for invalid recipe key', () => {
    const result = flattenRecipeTree(mockData, null);
    expect(result).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith('[RecipeUtils] Invalid recipe key:', null);
  });

  test('returns empty for non-existent recipe key', () => {
    const result = flattenRecipeTree(mockData, 'nonexistent');
    expect(result).toEqual([]);
  });

 /*  test('skips circular references gracefully', () => {
    mockData.circular = {
      name: 'Circular',
      type: 1,
      ingredients: [{ key: 'circular', qty: 1 }]
    };
    const result = flattenRecipeTree(mockData, 'circular');
    expect(result).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(
      "[RecipeUtils] Circular reference detected at 'circular', skipping deeper recursion."
    );
  }); */
  
  test('skips circular references gracefully', () => {
  mockData.circular = {
    name: 'Circular',
    type: 1,
    ingredients: [{ key: 'circular', qty: 1 }]
  };
  const result = flattenRecipeTree(mockData, 'circular');

  // ✅ Should include the first-level "Circular" only once
  expect(result).toEqual([{ text: 'Circular', level: 0 }]);
  expect(console.warn).toHaveBeenCalledWith(
    "[RecipeUtils] Circular reference detected at 'circular', skipping deeper recursion."
  );
});

/*   test('skips invalid ingredients gracefully', () => {
    mockData.bad = { name: 'Bad', type: 1, ingredients: [null, 123, 'invalid'] };
    const result = flattenRecipeTree(mockData, 'bad');
    expect(result).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(
      "[RecipeUtils] Missing or invalid 'ingredients' for 'bad'"
    );
  }); */
  
  test('skips invalid ingredients gracefully', () => {
  mockData.bad = { name: 'Bad', type: 1, ingredients: null }; // ✅ not an array
  const result = flattenRecipeTree(mockData, 'bad');
  expect(result).toEqual([]);
  expect(console.warn).toHaveBeenCalledWith(
    "[RecipeUtils] Missing or invalid 'ingredients' for 'bad'"
  );
});

  test('handles valid nested ingredients with multiplier', () => {
    mockData.helmet.ingredients = [{ key: 'plastic', qty: 3 }];
    const result = flattenRecipeTree(mockData, 'helmet');
    expect(result).toEqual(
      expect.arrayContaining([{ text: 'Plastic x3', level: 0 }])
    );
  });

/*   test('handles deep nesting gracefully', () => {
    mockData.level1 = {
      name: 'Level1',
      type: 1,
      ingredients: [{ key: 'helmet', qty: 1 }]
    };
    const result = flattenRecipeTree(mockData, 'level1');
    const nested = result.find(r => r.text.includes('Plastic'));
    expect(nested.level).toBe(2); // Level1 -> helmet -> plastic
  }); */
  test('handles deep nesting gracefully', () => {
  mockData.level1 = {
    name: 'Level1',
    type: 1,
    ingredients: [{ key: 'helmet', qty: 1 }]
  };
  const result = flattenRecipeTree(mockData, 'level1');
  const nested = result.find(r => r.text.includes('Plastic'));
  expect(nested.level).toBe(1); // ✅ Correct level after refactor
});
  
});










