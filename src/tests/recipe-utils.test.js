import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { flattenRecipeTree } from '../scripts/lib/recipe-utils.js';
import * as loggerModule from '../scripts/lib/logger.js';

describe('flattenRecipeTree - full coverage', () => {
  let mockData;
  let warnSpy;

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
      metal:   { name: 'Metal',   type: 2, ingredients: [] }
    };
    warnSpy = vi.spyOn(loggerModule.logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns empty for invalid recipe data', () => {
    const result = flattenRecipeTree(null, 'helmet');
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('[RecipeUtils] Invalid recipe data provided:', null);
  });

  test('returns empty for invalid recipe key', () => {
    const result = flattenRecipeTree(mockData, null);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('[RecipeUtils] Invalid recipe key:', null);
  });

  test('returns empty for non-existent recipe key', () => {
    const result = flattenRecipeTree(mockData, 'nonexistent');
    expect(result).toEqual([]);
  });

  test('skips circular references gracefully', () => {
    mockData.circular = {
      name: 'Circular',
      type: 1,
      ingredients: [{ key: 'circular', qty: 1 }]
    };
    const result = flattenRecipeTree(mockData, 'circular');
    // Node has enriched shape — use objectContaining to check what matters
    expect(result).toEqual([
      expect.objectContaining({ text: 'Circular', level: 0 })
    ]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[RecipeUtils] Circular reference detected at 'circular', skipping deeper recursion."
    );
  });

  test('skips invalid ingredients gracefully', () => {
    mockData.bad = { name: 'Bad', type: 1, ingredients: null };
    const result = flattenRecipeTree(mockData, 'bad');
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[RecipeUtils] Missing or invalid 'ingredients' for 'bad'"
    );
  });

  test('handles valid nested ingredients with multiplier', () => {
    mockData.helmet.ingredients = [{ key: 'plastic', qty: 3 }];
    const result = flattenRecipeTree(mockData, 'helmet');
    // Use objectContaining — node has extra fields beyond text and level
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: 'Plastic x3', level: 0 })
      ])
    );
  });

  test('handles deep nesting gracefully', () => {
    mockData.level1 = {
      name: 'Level1',
      type: 1,
      ingredients: [{ key: 'helmet', qty: 1 }]
    };
    const result = flattenRecipeTree(mockData, 'level1');
    const nested = result.find(r => r.text.includes('Plastic'));
    expect(nested.level).toBe(1);
  });
});
