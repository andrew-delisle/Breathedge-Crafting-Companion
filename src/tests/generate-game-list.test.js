/**
 * generate-game-list.test.js
 *
 * Happy-path tests use the real src/games/ directory as a fixture —
 * it always contains breathedge and subnautica with known-good configs.
 *
 * Tests that write or mutate files use temporary directories.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir }        from 'os';
import {
  readExistingList,
  discoverGames,
  mergeGameLists,
  generateGameList,
} from '../../.github/scripts/generate-game-list.js';

const REAL_GAMES_DIR  = resolve('src/games');
const REAL_GAME_LIST  = join(REAL_GAMES_DIR, 'game.list.json');

// ── Temp dir helpers ─────────────────────────────────────────

let tmpDir;

function makeGameFolder(id, name) {
  const dir = join(tmpDir, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'game-config.json'), JSON.stringify({
    name, recipes: 'recipes.json', recipeTypes: 'recipe-type.json',
    theme: 'theme.css', header: 'header.html'
  }));
}

function writeGameList(list) {
  writeFileSync(join(tmpDir, 'game.list.json'), JSON.stringify(list, null, 2));
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'cc-generate-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ============================================================
// readExistingList — real fixture
// ============================================================

describe('readExistingList', () => {
  test('reads the real game.list.json successfully', () => {
    const result = readExistingList(REAL_GAME_LIST);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
  });

  test('real list contains breathedge and subnautica', () => {
    const result = readExistingList(REAL_GAME_LIST);
    const ids = result.map(g => g.id);
    expect(ids).toContain('breathedge');
    expect(ids).toContain('subnautica');
  });

  test('returns empty array if file does not exist', () => {
    const result = readExistingList(join(tmpDir, 'nonexistent.json'));
    expect(result).toEqual([]);
  });

  test('returns empty array if file contains invalid JSON', () => {
    writeFileSync(join(tmpDir, 'game.list.json'), '{ bad json {{');
    const result = readExistingList(join(tmpDir, 'game.list.json'));
    expect(result).toEqual([]);
  });
});

// ============================================================
// discoverGames — real fixture
// ============================================================

describe('discoverGames', () => {
  test('discovers breathedge and subnautica from real games dir', () => {
    const result = discoverGames(REAL_GAMES_DIR);
    const ids = result.map(g => g.id);
    expect(ids).toContain('breathedge');
    expect(ids).toContain('subnautica');
  });

  test('does not include game.list.json as a game', () => {
    const result = discoverGames(REAL_GAMES_DIR);
    expect(result.every(g => g.id !== 'game.list.json')).toBe(true);
  });

  test('discovered entries have id and name', () => {
    const result = discoverGames(REAL_GAMES_DIR);
    for (const game of result) {
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('name');
      expect(typeof game.id).toBe('string');
      expect(typeof game.name).toBe('string');
    }
  });

  test('skips folders without game-config.json', () => {
    mkdirSync(join(tmpDir, 'no-config'));
    const result = discoverGames(tmpDir);
    expect(result).toEqual([]);
  });

  test('skips folders with invalid game-config.json', () => {
    const dir = join(tmpDir, 'bad-config');
    mkdirSync(dir);
    writeFileSync(join(dir, 'game-config.json'), '{ invalid }');
    const result = discoverGames(tmpDir);
    expect(result).toEqual([]);
  });

  test('skips folders where game-config.json has no name field', () => {
    const dir = join(tmpDir, 'no-name');
    mkdirSync(dir);
    writeFileSync(join(dir, 'game-config.json'), JSON.stringify({ recipes: 'recipes.json' }));
    const result = discoverGames(tmpDir);
    expect(result).toEqual([]);
  });

  test('returns empty array if games directory does not exist', () => {
    const result = discoverGames('/nonexistent/path/that/does/not/exist');
    expect(result).toEqual([]);
  });
});

// ============================================================
// mergeGameLists
// ============================================================

describe('mergeGameLists', () => {
  test('returns discovered games when existing list is empty', () => {
    const discovered = [{ id: 'breathedge', name: 'Breathedge' }];
    expect(mergeGameLists([], discovered)).toEqual(discovered);
  });

  test('preserves order of existing games', () => {
    const existing   = [{ id: 'subnautica', name: 'Subnautica' }, { id: 'breathedge', name: 'Breathedge' }];
    const discovered = [{ id: 'breathedge', name: 'Breathedge' }, { id: 'subnautica', name: 'Subnautica' }];
    const result     = mergeGameLists(existing, discovered);
    expect(result.map(g => g.id)).toEqual(['subnautica', 'breathedge']);
  });

  test('appends new games after existing ones', () => {
    const existing   = [{ id: 'breathedge', name: 'Breathedge' }];
    const discovered = [{ id: 'breathedge', name: 'Breathedge' }, { id: 'subnautica', name: 'Subnautica' }];
    const result     = mergeGameLists(existing, discovered);
    expect(result.map(g => g.id)).toEqual(['breathedge', 'subnautica']);
  });

  test('removes stale entries no longer in discovered', () => {
    const existing   = [{ id: 'breathedge', name: 'Breathedge' }, { id: 'deleted', name: 'Deleted' }];
    const discovered = [{ id: 'breathedge', name: 'Breathedge' }];
    const result     = mergeGameLists(existing, discovered);
    expect(result.map(g => g.id)).toEqual(['breathedge']);
  });

  test('handles both additions and removals in one pass', () => {
    const existing   = [{ id: 'old-game', name: 'Old' }, { id: 'breathedge', name: 'Breathedge' }];
    const discovered = [{ id: 'breathedge', name: 'Breathedge' }, { id: 'new-game', name: 'New' }];
    const result     = mergeGameLists(existing, discovered);
    expect(result.map(g => g.id)).toEqual(['breathedge', 'new-game']);
  });

  test('produces the same list when nothing changed (real data)', () => {
    const existing   = readExistingList(REAL_GAME_LIST);
    const discovered = discoverGames(REAL_GAMES_DIR);
    const result     = mergeGameLists(existing, discovered);
    // Same IDs, same order
    expect(result.map(g => g.id)).toEqual(existing.map(g => g.id));
  });
});

// ============================================================
// generateGameList — full pipeline (uses tmpDir to avoid writing to repo)
// ============================================================

describe('generateGameList', () => {
  test('creates game.list.json from discovered games', () => {
    makeGameFolder('breathedge', 'Breathedge');
    const gameListPath = join(tmpDir, 'game.list.json');

    generateGameList(tmpDir, gameListPath);

    const written = JSON.parse(readFileSync(gameListPath, 'utf8'));
    expect(written).toEqual([{ id: 'breathedge', name: 'Breathedge' }]);
  });

  test('preserves existing order and appends new games', () => {
    makeGameFolder('subnautica', 'Subnautica');
    makeGameFolder('breathedge', 'Breathedge');
    const gameListPath = join(tmpDir, 'game.list.json');
    writeGameList([{ id: 'subnautica', name: 'Subnautica' }]);

    generateGameList(tmpDir, gameListPath);

    const written = JSON.parse(readFileSync(gameListPath, 'utf8'));
    expect(written[0].id).toBe('subnautica');
    expect(written[1].id).toBe('breathedge');
  });

  test('removes stale entries from game.list.json', () => {
    makeGameFolder('breathedge', 'Breathedge');
    const gameListPath = join(tmpDir, 'game.list.json');
    writeGameList([
      { id: 'breathedge', name: 'Breathedge' },
      { id: 'deleted',    name: 'Deleted Game' },
    ]);

    generateGameList(tmpDir, gameListPath);

    const written = JSON.parse(readFileSync(gameListPath, 'utf8'));
    expect(written.map(g => g.id)).not.toContain('deleted');
  });

  test('returns correct summary counts', () => {
    makeGameFolder('breathedge', 'Breathedge');
    makeGameFolder('subnautica', 'Subnautica');
    const gameListPath = join(tmpDir, 'game.list.json');
    writeGameList([{ id: 'breathedge', name: 'Breathedge' }]);

    const summary = generateGameList(tmpDir, gameListPath);

    expect(summary.total).toBe(2);
    expect(summary.list.map(g => g.id)).toContain('breathedge');
    expect(summary.list.map(g => g.id)).toContain('subnautica');
  });

  test('writes valid JSON with trailing newline', () => {
    makeGameFolder('breathedge', 'Breathedge');
    const gameListPath = join(tmpDir, 'game.list.json');

    generateGameList(tmpDir, gameListPath);

    const raw = readFileSync(gameListPath, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  test('real games directory produces a list matching game.list.json', () => {
    // Run against a tmpDir copy of game.list.json so we don't write to the repo
    const gameListPath = join(tmpDir, 'game.list.json');
    writeFileSync(gameListPath, readFileSync(REAL_GAME_LIST, 'utf8'));

    const summary = generateGameList(REAL_GAMES_DIR, gameListPath);

    expect(summary.list.map(g => g.id)).toContain('breathedge');
    expect(summary.list.map(g => g.id)).toContain('subnautica');
  });
});
