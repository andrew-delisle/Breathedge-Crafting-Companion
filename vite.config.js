/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    environmentMatchGlobs: [
      // GitHub Action scripts use Node.js fs APIs — run in node environment
      ['src/tests/validate-games.test.js',    'node'],
      ['src/tests/generate-game-list.test.js', 'node'],
    ],
  },
  coverage: {
	provider: 'c8',
	reporter: ['text','html'],
	include: ['src/**/*.js'],
	exclude: ['src/tests', 'src/scripts/main.js'],
	all: true,
	statements: 90,
	branches: 80,
	functions: 90,
	lines: 90
  }
});
