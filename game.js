// game.js
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
  isModalOpen,
  modalMode,
  closeModal,
  openWin,
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
  maxLevel: 2,
  allowedKeys: [],
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

function isLastLevel() {
  return state.currentLevel >= state.maxLevel;
}

async function loadLevel(id) {
  const mod = await import(`./levels/level${id}.js`); // ESM dynamic import
  const level = mod.default;

  // map + player
  state.started = false;
  state.mode = "normal";
  state.won = false;
  state.currentLevel = id;
  state.grid = arrayGrid(level.rows);

  state.allowedKeys = level.allowedKeys;
  state.player = { ...level.player };

  renderDescription(level.title, level.desc);
  renderHint(level.hint);
  renderMap(state); // draws baseGrid + 👾 overlaymain
  document.getElementById("game").focus();
}

async function restartLevel() {
  await loadLevel(state.currentLevel);
  state.started = true;
}

async function nextLevel() {
  state.currentLevel = state.currentLevel + 1;
  if (state.currentLevel > state.maxLevel) {
    state.currentLevel = 1;
  }
  await loadLevel(state.currentLevel);
  state.started = true;
}

// mechanics
function onWin() {
  state.won = true;
  if (isLastLevel()) {
    openWin(
      "Congratulations! You finished all available levels.\n\nPress 'q' or 'Esc' to end.\nPress 'r' to replay from Level 1.",
      true, // isEnd
    );
  } else {
    openWin(
      "Nice! Level complete.\n\nPress 'q' or 'Esc' to continue to the next level.",
    );
  }
}

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
    onWin();
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
      onWin();
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
  // offset starts from -1 because the scanning is from the current char
  let totalCellOffset = -1;
  let wordMatch = subMap.match(WORD_RE);
  let otherMatch = subMap.match(NON_WS_WORD_RE);
  let doubleMatch = wordMatch || otherMatch;
  if (doubleMatch) {
    totalCellOffset += Array.from(doubleMatch[0]).length;
    subMap = subMap.substring(doubleMatch[0].length);
  }
  console.log("$$$$", totalCellOffset);
  // skip space and count the actual units that need to move in actual map (utf-8 support)
  let spaceMatch = subMap.match(WS_RE);
  if (spaceMatch) {
    totalCellOffset += Array.from(spaceMatch[0]).length;
    subMap = subMap.substring(spaceMatch[0].length);
  }
  console.log("%%%%%", totalCellOffset);
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
      onWin();
    }
    renderMap(state);
  }
}

function moveB() {
  if (!state.started || state.won) return;
  let y = state.player.y;
  let x = state.player.x;
  let charOffset = 0;
  // reversed
  for (let i = y + 1; i < state.grid.length; i++) {
    for (let j = 0; j < state.grid[i].length; j++) {
      charOffset += state.grid[i][j].length;
    }
  }
  // look from the next char
  for (let i = x; i < state.grid[y].length; i++) {
    charOffset += state.grid[y][i].length;
  }
  // reverse the map string
  let flatMap = state.grid.flat().reverse().join("");

  let subMap = flatMap.substring(charOffset);
  // skip space and count the actual units that need to move in actual map (utf-8 support)
  let spaceMatch = subMap.match(WS_RE);
  let totalCellOffset = 0;
  if (spaceMatch) {
    totalCellOffset += Array.from(spaceMatch[0]).length;
    subMap = subMap.substring(spaceMatch[0].length);
  }
  // 'b' will move to the start of the word
  let wordMatch = subMap.match(WORD_RE);
  let otherMatch = subMap.match(NON_WS_WORD_RE);
  let doubleMatch = wordMatch || otherMatch;
  if (doubleMatch) {
    totalCellOffset += Array.from(doubleMatch[0]).length;
  }

  // Move there
  for (let i = 0; i < totalCellOffset; i++) {
    x -= 1;
    // boundary
    if (x == -1) {
      y--;
      x = state.grid[y].length - 1;
    }
  }
  if (canStand(state.grid[y][x])) {
    state.player.x = x;
    state.player.y = y;

    // resolve
    if (state.grid[y][x] === END) {
      onWin();
    }
    renderMap(state);
  }
}

// ---------- commands ----------
async function handleKey(e) {
  // Help modal capture
  if (isModalOpen()) {
    let mode = modalMode();
    if (e.key === "Escape" || e.key === "q") {
      e.preventDefault();
      closeModal();
      if (mode === "win") {
        await nextLevel();
        return;
      }
    }
    if (mode === "end" && e.key === "r") {
      e.preventDefault();
      closeModal();
      await loadLevel(1);
      return;
    }
    // swallow other keys while modal open
    e.preventDefault();
    return;
  }

  // Command-line mode
  if (isCmdlineOpen() || state.mode === "cmd") {
    e.preventDefault();
    state.mode = "cmd"; // ensure consistent
    if (e.key === "Enter") {
      const raw = getCmdBuffer();
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
  if (!state.allowedKeys.has(e.key)) {
    e.preventDefault();
    return;
  }
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
VimWorld — Help

Movement
  h  move left
  j  move down
  k  move up
  l  move right
  w  jump to the start of the next word
  e  jump to the end of the current or next word
  b  jump to the beginning of the previous word

Commands
  :start     begin the level
  :restart   restart current level
  :help      show this help

Tips:
  • Words are made of letters, numbers, or 🪨.
  • 🌊 acts like space — you can’t stand on it but can move over it.
  • Reach 🚪 to complete the level.
  • Press ':' to open command mode, type a command, then Enter.

`.trim();

async function handleCommand(cmd) {
  if (cmd === "start") {
    // if the game is finished, then starts the next game
    if (state.won === true) {
      closeCmdline();
      await nextLevel();
      return;
    }
    state.started = true;
    closeCmdline();
    renderMap(state);
    return;
  }
  if (cmd === "restart") {
    closeCmdline();
    await restartLevel();
    return;
  }
  if (cmd === "help") {
    closeCmdline();
    openHelp(HELP_TEXT);
    return;
  }
  updateCmdline({ msg: `Not an editor command: :${cmd}` });
  closeCmdline();
}

// export functions
export { handleKey, loadLevel, state };
