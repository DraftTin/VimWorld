// game.js
import { ROCK, SEA, BUG, WEB, SPACE } from "./elements.js";
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
  winCon: null,
  grid: [],
  player: { x: 0, y: 0 },
  goal: { x: 0, y: 0 },
  started: false,
  won: false,
  mode: "normal", // "normal" | "cmd" | "replaceOne"
  currentLevel: 1,
  maxLevel: 3,
  allowedKeys: [],
};

// ------------ sounds --------------

const move_sound = new Audio("assets/movement.wav");
move_sound.preload = "auto";
const win_sound = new Audio("assets/level_completion.wav");
win_sound.preload = "auto";
const kill_sound = new Audio("assets/sword_slice.mp3");
kill_sound.preload = "auto";
const mod_sound = new Audio("assets/modif_sound.mp3");
mod_sound.preload = "auto";
const jump_sound = new Audio("assets/jump.mp3");
jump_sound.preload = "auto";

const bgMusic = new Audio("assets/bg_music.wav");
bgMusic.loop = true; // Makes the music repeat forever
bgMusic.volume = 0.03; // 30% volume so it doesn’t overpower effects

// ---------- grid helpers ----------
function at(x, y) {
  if (y < 0 || y >= state.grid.length) return "🪨";
  if (x < 0 || x >= state.grid[y].length) return "🪨";
  return state.grid[y][x];
}

function canStand(ch) {
  return ch !== ROCK && ch !== SEA;
}

// ---------- loading / restarting ----------

function isLastLevel() {
  return state.currentLevel >= state.maxLevel;
}

function checkWin() {
  return state.winCon(state);
}

async function loadLevel(id) {
  const mod = await import(`./levels/level${id}.js`); // ESM dynamic import
  const level = mod.default;

  // map + player
  state.started = false;
  state.mode = "normal";
  state.won = false;
  state.currentLevel = id;
  state.grid = level.rows.map((r) => Array.from(r));

  state.hasCorruption = level.hasCorruption;
  if (state.hasCorruption === true) {
    state.initialGrid = level.rows.map((r) => Array.from(r)); // immutable copy
    state.targetGrid = level.targetRows
      ? level.targetRows.map((r) => Array.from(r))
      : null;
  }
  state.winCon = level.winCon;

  state.allowedKeys = level.allowedKeys;
  state.player = { ...level.player };

  renderDescription(level.title, level.desc);
  renderHint(level.hint);
  renderMap(state);
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
  //Play game completed sound effect
  win_sound.currentTime = 0;
  win_sound.volume = 0.5;
  win_sound.play();
}

function move(dx, dy) {
  if (!state.started || state.won) return;
  const nx = state.player.x + dx,
    ny = state.player.y + dy;
  const cell = at(nx, ny);

  if (!canStand(cell)) {
    //Add collision grunt or sound

    return;
  } else {
    //Play move sound effect
    move_sound.currentTime = 0.2;
    move_sound.volume = 0.3;
    move_sound.play();
  }

  state.player.x = nx;
  state.player.y = ny;

  // resolve
  if (checkWin() === true) {
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

    jump_sound.currentTime = 0.1;
    jump_sound.volume = 0.4;
    jump_sound.play();

    // resolve
    if (checkWin() === true) {
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
    jump_sound.currentTime = 0.1;
    jump_sound.volume = 0.4;
    jump_sound.play();
    if (checkWin() === true) {
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
    jump_sound.currentTime = 0.1;
    jump_sound.volume = 0.4;
    jump_sound.play();
    // resolve
    if (checkWin() === true) {
      onWin();
    }
    renderMap(state);
  }
}

function handleX() {
  let { player } = state;
  // change tile to space (delete the content in a tile)
  state.grid[player.y][player.x] = SPACE;
  // resolve
  if (checkWin() === true) {
    onWin();
  }
  renderMap(state);
  kill_sound.currentTime = 0.2;
  kill_sound.volume = 0.2;
  kill_sound.play();
}

function handleR() {
  state.mode = "replaceOne";
  renderMap(state);
  mod_sound.currentTime = 0.2;
  mod_sound.volume = 0.3;
  mod_sound.play();
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

  // ReplaceOne mode
  if (state.mode == "replaceOne") {
    e.preventDefault();
    const k = e.key;
    if (k === "Escape") {
      state.mode = "normal";
      return;
    }

    // only single printable characters
    if (k.length === 1) {
      const { x, y } = state.player;
      state.grid[y][x] = k;
      renderMap(state);
      if (checkWin() === true) {
        onWin();
      }
      state.mode = "normal";
    }
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
  else if (e.key === "x") handleX();
  else if (e.key === "r") handleR();
}

const HELP_TEXT = `
VimWorld — Help

Basic Movements
  h  move left
  j  move down
  k  move up
  l  move right

Word Motions
  w  jump to the start of the next word
  e  jump to the end of the current or next word
  b  jump to the beginning of the current word or previous word

Editing
  x        slay (delete) the character under your cursor
  r<char>  repair (replace) a character with the typed character

Tiles
  🚪 DOOR  reach to finish levels that use doors
  🪨 ROCK  counts as a word char; but not walkable (The Player may jump over it with word motions but cannot stand on it.)
  🌊 SEA   counts as a space; but not walkable (The Player can jump across it using word motions but cannot stand on it.)
  🐛 BUG   standable enemy; press x to remove
  🕸 WEB   corrupted text; press r then a key to fix

Commands
  :start     begin the level
  :restart   restart current level
  :help      show this help

Tips:
• A 'Word' is a sequence of letters/digits/🪨/🐛/🕸 or a sequence of same characters.
• Use word motions to move faster!
• The tile with red border means the tile was not fixed correctly!
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
    bgMusic.play();
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
