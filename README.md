# 🚀 Breathedge Crafting Companion

A lightweight, mobile-friendly web app to help you track and explore crafting recipes across multiple survival games — including **Breathedge** and **Subnautica** — with full support for adding your own games.

👉 **Live Site:**  
[https://andrew-delisle.github.io/Breathedge-Crafting-Companion](https://andrew-delisle.github.io/Breathedge-Crafting-Companion)

---

## 🧰 Features

- 📱 Mobile-optimized UI with collapsible recipe cards
- 🔍 Search and filter by recipe type
- 📌 Pin recipes to the top of the page for active tracking
- ✅ Interactive checkboxes — check off ingredients as you gather them
- 📦 Sticky materials summary showing everything you still need across all pinned recipes
- ✖ Quantity multiplier per pinned recipe — planning to craft x3? The summary scales automatically
- 💾 Pin state, checked items, and multipliers persist across page refreshes
- 🎮 Multi-game support — switch between games with the dropdown
- 🌌 Space-survival HUD aesthetic with per-game themes

---

## 🎮 Adding a New Game

Want to contribute a game or add one for your own use?

### Quick start — use the Config Builder

Open [`tools/game-config-builder.html`](tools/game-config-builder.html) in your browser. It walks you through defining item types, items, and recipes, then exports a ready-to-use zip you can drop straight into the repo.

### Manual setup

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full file format reference and PR process.

### Automatic validation

When you open a Pull Request adding a new game folder, a GitHub Action automatically validates your submission and posts the results as a comment. On merge, `game.list.json` is regenerated automatically — no manual editing required.

You can also run the validator locally from the repo root:

```bash
node .github/scripts/validate-games.js your-game-id
```

---

## 🏗 Project Structure

```
src/
  games/
    breathedge/       ← Breathedge game data and theme
    subnautica/       ← Subnautica game data and theme
    game.list.json    ← Auto-generated list of available games
  fallback/           ← Default assets shown before a game is selected
  scripts/            ← App logic (init, game loader, state, rendering)
  state/              ← Pin state and localStorage persistence
  tests/              ← Vitest unit tests

tools/
  game-config-builder.html   ← Browser-based tool for creating new game configs

.github/
  workflows/
    validate-game.yml        ← Validates game folders on PRs
    update-game-list.yml     ← Regenerates game.list.json on merge
  scripts/
    validate-games.js        ← Validation logic (also runnable locally)
    generate-game-list.js    ← Game list generator
```

---

## 🔧 Development

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server (http://localhost:5173)
npm test          # run tests
npm run coverage  # run tests with coverage report
```

---

## 🐛 Bugs & 💡 Feature Requests

Have an idea or found a bug?  
[Open an issue →](https://github.com/andrew-delisle/Breathedge-Crafting-Companion/issues)

---

## 📜 License

This project is open-source under the [GNU License](LICENSE).

---

Crafted with 💛 for fellow survivors of space chicken disasters.
