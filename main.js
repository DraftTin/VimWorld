// main.js
import { ROCK, NPC, SEA, PLAYER, END } from "./elements.js";
import { NON_WS_WORD_RE, WORD_RE, WS_RE } from "./helper.js";
import {
  renderMap,
  renderDescription,
  renderHint,
  openCmdline,
  closeCmdline,
  updateCmdline,
  getCmdBuffer,
  isCmdlineOpen,
  openHelp,
  closeHelp,
  isHelpOpen,
} from "./ui.js";

// ---------- central game state ----------
const state = {
  grid: [],
  player: { x: 0, y: 0 },
  goal: { x: 0, y: 0 },
  started: false,
  won: false,
  mode: "normal", // "normal" | "cmd"
  currentLevel: 1,
  prevCellUnderPlayer: " ", // the char that is covered by player currently.
};

// ---------- grid helpers ----------
function at(x, y) {
  if (y < 0 || y >= state.grid.length) return "🪨";
  if (x < 0 || x >= state.grid[y].length) return "🪨";
  return state.grid[y][x];
}

function canStand(ch) {
  return ch !== "🪨" && ch !== "🌊";
}

// ---------- loading / restarting ----------
function arrayGrid(rows) {
  // Unicode-safe rows → 2D arrays of code points
  return rows.map((r) => Array.from(r));
}

function clearState() {
  state.started = false;
  state.mode = "normal";
  state.won = false;
  state.prevCellUnderPlayer = " ";
}

async function loadLevel(id) {
  clearState();
  const mod = await import(`./levels/level${id}.js`); // ESM dynamic import
  const level = mod.default;

  // metadata
  renderDescription(level.title, level.desc);
  renderHint(level.hint);

  // map + player
  state.grid = arrayGrid(level.rows);
  state.player = { ...level.player };

  renderMap(state); // draws baseGrid + 👾 overlaymain
  document.getElementById("game").focus();
}

async function restartLevel() {
  await loadLevel(state.currentLevel);
  // auto-start after restart (optional):
  state.started = true;
}
function nextLevel() {
  state.currentLevel = state.currentLevel + 1;
  loadLevel(state.currentLevel);
}

// mechanics
function move(dx, dy) {
  if (!state.started || state.won) return;
  const nx = state.player.x + dx,
    ny = state.player.y + dy;
  const cell = at(nx, ny);
  if (!canStand(cell)) return;

  state.player.x = nx;
  state.player.y = ny;

  // resolve
  if (cell === END) {
    state.won = true;
    setTimeout(nextLevel, 600);
  }
  renderMap(state);
}

function moveE() {
  if (!state.started || state.won) return;
  let y = state.player.y;
  let x = state.player.x;
  let charOffset = 0;
  for (let i = 0; i < y; i++) {
    for (let j = 0; j < state.grid[i].length; j++) {
      charOffset += state.grid[i][j].length;
    }
  }
  // look from the next char
  for (let i = 0; i <= x; i++) {
    charOffset += state.grid[y][i].length;
  }
  let flatMap = state.grid.flat().join("");

  let subMap = flatMap.substring(charOffset);
  // skip space and count the actual units that need to move in actual map (utf-8 support)
  let spaceMatch = subMap.match(WS_RE);
  let totalCellOffset = 0;
  if (spaceMatch) {
    totalCellOffset += Array.from(spaceMatch[0]).length;
    subMap = subMap.substring(spaceMatch[0].length);
  }
  // 'e' will move to the end of the word
  let wordMatch = subMap.match(WORD_RE);
  let otherMatch = subMap.match(NON_WS_WORD_RE);
  let doubleMatch = wordMatch || otherMatch;
  if (doubleMatch) {
    totalCellOffset += Array.from(doubleMatch[0]).length;
  }

  // Move there
  for (let i = 0; i < totalCellOffset; i++) {
    x += 1;
    if (x == state.grid[y].length) {
      x = 0;
      y++;
    }
  }
  if (canStand(state.grid[y][x])) {
    state.player.x = x;
    state.player.y = y;
    // resolve

    if (state.grid[y][x] === END) {
      state.won = true;
      setTimeout(nextLevel, 600);
    }
    renderMap(state);
  }
}

function moveW() {
  if (!state.started || state.won) return;
  let y = state.player.y;
  let x = state.player.x;
  let charOffset = 0;
  for (let i = 0; i < y; i++) {
    for (let j = 0; j < state.grid[i].length; j++) {
      charOffset += state.grid[i][j].length;
    }
  }
  // To correctly execute 'w', it needs to start from the current char insdead of the next one
  for (let i = 0; i < x; i++) {
    charOffset += state.grid[y][i].length;
  }
  let flatMap = state.grid.flat().join("");

  let subMap = flatMap.substring(charOffset);
  // skip the current word
  let totalCellOffset = 0;
  let wordMatch = subMap.match(WORD_RE);
  let otherMatch = subMap.match(NON_WS_WORD_RE);
  let doubleMatch = wordMatch || otherMatch;
  if (doubleMatch) {
    // Total offset should be (length of the word - 1) because it matches from the current character
    totalCellOffset += Array.from(doubleMatch[0]).length - 1;
    subMap = subMap.substring(doubleMatch[0].length);
  }
  // skip space and count the actual units that need to move in actual map (utf-8 support)
  let spaceMatch = subMap.match(WS_RE);
  if (spaceMatch) {
    totalCellOffset += Array.from(spaceMatch[0]).length;
    subMap = subMap.substring(spaceMatch[0].length);
  }
  // 'e' will move to the end of the word
  wordMatch = subMap.match(WORD_RE);
  otherMatch = subMap.match(NON_WS_WORD_RE);
  doubleMatch = wordMatch || otherMatch;
  if (doubleMatch) {
    totalCellOffset += 1;
  }

  // Move there
  for (let i = 0; i < totalCellOffset; i++) {
    x += 1;
    if (x == state.grid[y].length) {
      x = 0;
      y++;
    }
  }
  if (canStand(state.grid[y][x])) {
    state.player.x = x;
    state.player.y = y;
    if (state.grid[y][x] === END) {
      state.won = true;
      setTimeout(nextLevel, 600);
    }
    renderMap(state);
  }
}
function moveB() {}

// ---------- commands ----------
function handleKey(e) {
  // Help modal capture
  if (isHelpOpen()) {
    if (e.key === "Escape" || e.key === "q") {
      e.preventDefault();
      closeHelp();
    } else e.preventDefault();
    return;
  }

  // Command-line mode
  if (isCmdlineOpen() || state.mode === "cmd") {
    e.preventDefault();
    state.mode = "cmd"; // ensure consistent
    if (e.key === "Enter") {
      const raw = getCmdBuffer(); // e.g., ":start"
      const cmd = raw.slice(1).trim();
      handleCommand(cmd);
      state.mode = "normal";
      return;
    }
    if (e.key === "Escape") {
      closeCmdline();
      state.mode = "normal";
      return;
    }
    if (e.key === "Backspace") {
      const cur = getCmdBuffer();
      updateCmdline({ buffer: cur.length > 1 ? cur.slice(0, -1) : ":" });
      return;
    }
    if (e.key.length === 1) {
      const cur = getCmdBuffer();
      updateCmdline({ buffer: cur + e.key });
      return;
    }
    return;
  }

  // Enter command-line
  if (e.key === ":") {
    e.preventDefault();
    state.mode = "cmd";
    openCmdline(":");
    updateCmdline({ msg: state.started ? "" : "Enter 'start' to begin" });
    return;
  }

  // Normal controls
  if (!state.started || state.won) return;
  if (e.key === "h") move(-1, 0);
  else if (e.key === "j") move(0, 1);
  else if (e.key === "k") move(0, -1);
  else if (e.key === "l") move(1, 0);
  else if (e.key === "e") moveE();
  else if (e.key === "w") moveW();
  else if (e.key === "b") moveB();
}

const HELP_TEXT = `
Vimventure — Help

Movement
  h j k l    move (can't stand on ${SEA} or ${ROCK})

Commands
  :start     begin the level
  :restart   restart current level
  :help      show this help

Elements
  : 🌊 - player cannot stand on it. But they can jump through using some motions other than 'h', 'j', 'k', 'l'.
  : 🪨 - player cannot stand on it. It's counted as 'ground' unlike '🌊', meaning it's will be a target of some motions.
  : 👾 - Our player!
  : 🚪 - Player needs to move to this place to win the game.

`.trim();

function handleCommand(cmd) {
  if (cmd === "start") {
    state.started = true;
    renderHint("Game started. Move with h j k l.");
    closeCmdline();
    renderMap(state);
    return;
  }
  if (cmd === "restart") {
    closeCmdline();
    restartLevel();
    return;
  }
  if (cmd === "help") {
    closeCmdline();
    openHelp(HELP_TEXT);
    return;
  }
  updateCmdline({ msg: `Not an editor command: :${cmd}` });
}

// ---------- keyboard ----------
window.addEventListener("keydown", handleKey);

// ---------- boot ----------
// setCellSize(28); // optional
loadLevel(state.currentLevel).catch((err) => {
  document.getElementById("game").textContent =
    "Level load error:\n" + err.message;
});
