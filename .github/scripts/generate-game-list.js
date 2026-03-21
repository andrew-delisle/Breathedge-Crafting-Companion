#!/usr/bin/env node
/**
 * generate-game-list.js
 *
 * Scans src/games/ for valid game folders and regenerates game.list.json.
 * Core logic is exported for unit testing.
 * CLI entry point only runs when executed directly.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

export const GAMES_DIR      = resolve('src/games');
export const GAME_LIST_PATH = join(GAMES_DIR, 'game.list.json');

// ============================================================
// Core logic (exported for testing)
// ============================================================

/**
 * Reads and parses the existing game.list.json.
 * Returns an empty array if the file doesn't exist or is invalid.
 */
export function readExistingList(gameListPath = GAME_LIST_PATH) {
  try {
    return JSON.parse(readFileSync(gameListPath, 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Scans a games directory and returns all valid game entries.
 * A valid entry is a directory containing a game-config.json with a name field.
 */
export function discoverGames(gamesDir = GAMES_DIR) {
  const discovered = [];

  let entries;
  try {
    entries = readdirSync(gamesDir);
  } catch {
    return discovered;
  }

  for (const entry of entries) {
    const entryPath = join(gamesDir, entry);

    if (!statSync(entryPath).isDirectory()) continue;

    const configPath = join(entryPath, 'game-config.json');
    if (!existsSync(configPath)) continue;

    let config;
    try {
      config = JSON.parse(readFileSync(configPath, 'utf8'));
    } catch {
      continue;
    }

    if (!config.name) continue;

    discovered.push({ id: entry, name: config.name });
  }

  return discovered;
}

/**
 * Merges an existing game list with newly discovered games.
 * - Preserves the order of existing games
 * - Removes stale entries whose folders no longer exist
 * - Appends new games at the end
 */
export function mergeGameLists(existingList, discovered) {
  const discoveredIds = new Set(discovered.map(g => g.id));
  const existingIds   = new Set(existingList.map(g => g.id));

  const retained = existingList.filter(g => discoveredIds.has(g.id));
  const added    = discovered.filter(g => !existingIds.has(g.id));

  return [...retained, ...added];
}

/**
 * Full pipeline: read → discover → merge → write.
 * Returns a summary object for logging/testing.
 */
export function generateGameList(gamesDir = GAMES_DIR, gameListPath = GAME_LIST_PATH) {
  const existingList = readExistingList(gameListPath);
  const discovered   = discoverGames(gamesDir);
  const newList      = mergeGameLists(existingList, discovered);

  writeFileSync(gameListPath, JSON.stringify(newList, null, 2) + '\n');

  return {
    retained: existingList.filter(g => discovered.some(d => d.id === g.id)).length,
    added:    newList.length - existingList.filter(g => discovered.some(d => d.id === g.id)).length,
    removed:  existingList.filter(g => !discovered.some(d => d.id === g.id)).length,
    total:    newList.length,
    list:     newList,
  };
}

// ============================================================
// CLI entry point — only runs when executed directly
// ============================================================

if (process.argv[1] && process.argv[1].endsWith('generate-game-list.js')) {
  const summary = generateGameList();

  console.log('\ngame.list.json updated:');
  console.log(`  Retained: ${summary.retained} existing game(s)`);
  console.log(`  Added:    ${summary.added} new game(s)`);
  console.log(`  Removed:  ${summary.removed} stale game(s)`);
  console.log('\nFinal list:');
  for (const g of summary.list) {
    console.log(`  - ${g.id}: ${g.name}`);
  }
}
