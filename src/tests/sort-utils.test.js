    import { describe, test, expect } from 'vitest';
    import { sortRecipes } from '../scripts/lib/sort-utils.js';

    describe('sortRecipes', () => {
      const sample = [
        { name: 'Banana' },
        { name: 'apple' },
        { name: 'Cherry' },
      ];

      test('sorts recipes ascending by default (A–Z)', () => {
        const result = sortRecipes(sample);
        expect(result.map(r => r.name)).toEqual(['apple', 'Banana', 'Cherry']);
      });

      test('sorts recipes descending (Z–A)', () => {
        const result = sortRecipes(sample, 'desc');
        expect(result.map(r => r.name)).toEqual(['Cherry', 'Banana', 'apple']);
      });

      test('returns empty array if input is empty', () => {
        expect(sortRecipes([])).toEqual([]);
      });

      test('returns input unchanged if invalid input is provided', () => {
        expect(sortRecipes(null)).toEqual([]);
        expect(sortRecipes('not-an-array')).toEqual('not-an-array');
      });

      test('is stable for equal names (retains original order)', () => {
        const dupes = [
          { name: 'Apple' },
          { name: 'Apple' },
          { name: 'Banana' },
        ];
        const result = sortRecipes(dupes);
        expect(result).toEqual([
          { name: 'Apple' },
          { name: 'Apple' },
          { name: 'Banana' },
        ]);
      });
    })