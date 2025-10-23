// --- Vimventure (ASCII) — sea '~' + rocks-in-words '#', :start/:restart/:help, hjkl, w/e/b, auto-advance ---

// DOM refs
const GAME_EL = document.getElementById("game");
const TITLE_EL = document.getElementById("levelTitle");
const DESC_EL = document.getElementById("levelDesc");
const HINTS_EL = document.getElementById("hints");
const CMD_EL = document.getElementById("cmdOverlay");
const CMD_TEXT = document.getElementById("cmdText");
const CMD_MSG = document.getElementById("cmdMsg");
const HELP_MODAL = document.getElementById("helpModal");
const HELP_BODY = document.getElementById("helpBody");
const BACKDROP = document.getElementById("backdrop");

// Levels
const LEVELS = ["levels/level1.txt", "levels/level2.txt", "levels/level3.txt"];

const HELP_TEXT = `
Vimventure — Help

Movement
  h j k l    move cursor (cannot step on ~ or #)

Word motions (Level 2+)
  w          jump to FIRST LETTER of the NEXT word
             (skips words that START with #)
  e          if inside a word and not at its end → jump to that word's LAST LETTER
             else jump to LAST LETTER of the NEXT word
             (skips words that END with #)
  b          jump to FIRST LETTER of the PREVIOUS word
             (skips words that START with #)

Rocks (#) are part of a word when they REPLACE the first or last letter:
  #his  → start is a rock; you can't land there with 'w' or 'b'
  Thi#  → end is a rock; you can't land there with 'e'
Motions can scan ACROSS ~ and #; they just refuse to LAND on a rock edge.

Commands
  :start     begin the level
  :restart   restart the current level (auto-starts)
  :help      show this help
`.trim();

// State
let grid = [];
let player = { x: 0, y: 0 };
let goal = { x: 0, y: 0 };
let won = false;
let started = false; // require :start
let mode = "normal"; // "normal" | "cmd"
let cmdBuffer = ":"; // ':' + typed
let helpOpen = false;
let currentLevelIndex = 0;

// ---------- utils ----------
function esc(ch) {
  if (ch === "&") return "&amp;";
  if (ch === "<") return "&lt;";
  if (ch === ">") return "&gt;";
  return ch;
}
function setLevelUI(title, descHTML) {
  if (TITLE_EL) TITLE_EL.textContent = title;
  if (DESC_EL) DESC_EL.innerHTML = descHTML;
}
function setHint(html) {
  if (HINTS_EL) HINTS_EL.innerHTML = html;
}

function at(x, y) {
  if (y < 0 || y >= grid.length) return "#";
  if (x < 0 || x >= grid[y].length) return "#";
  return grid[y][x];
}
function setCell(x, y, ch) {
  grid[y][x] = ch;
}
function findChar(g, ch) {
  for (let y = 0; y < g.length; y++) {
    const x = g[y].indexOf(ch);
    if (x !== -1) return { x, y };
  }
  return null;
}

// ---------- per-level text ----------
function updateLevelMeta() {
  const n = currentLevelIndex + 1;
  if (currentLevelIndex === 0) {
    setLevelUI(
      `Level ${n} — hjkl-only maze`,
      `Type <strong>:start</strong> to begin. Then reach <strong>G</strong> using <strong>h j k l</strong>.`,
    );
    setHint(`Press <strong>:</strong> → type <strong>start</strong> → Enter.`);
  } else if (currentLevelIndex === 1) {
    setLevelUI(
      `Level ${n} — motions with rocks & sea`,
      `Sea <code>~</code> blocks walking but motions scan over it. Rocks <code>#</code> replace word edges and block landing at those edges.`,
    );
    setHint(
      `Examples: <code>#his</code> blocks landing for 'w'/'b'; <code>Thi#</code> blocks landing for 'e'. Try chains across ~.`,
    );
  } else {
    setLevelUI(
      `Level ${n}`,
      `Type <strong>:start</strong> and reach <strong>G</strong>.`,
    );
    setHint(`Press <strong>:</strong> for commands.`);
  }
}

// ---------- flow ----------
async function loadLevel(path) {
  const res = await fetch(path);
  const text = await res.text();
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.length > 0);
  grid = lines.map((l) => l.split(""));

  player = findChar(grid, "@");
  if (!player) throw new Error("Level missing @ player start");
  goal = findChar(grid, "G");
  if (!goal) throw new Error("Level missing G goal");
  setCell(player.x, player.y, " "); // remove @

  won = false;
  started = false;
  mode = "normal";
  cmdBuffer = ":";
  updateLevelMeta();
  render();
  GAME_EL.focus();
}

async function restartLevel({ autostart = true } = {}) {
  await loadLevel(LEVELS[currentLevelIndex]);
  started = autostart;
  if (autostart)
    setHint(
      "Level restarted. Move with hjkl (motions enabled if this level allows).",
    );
  render();
}

function loadNextLevel() {
  currentLevelIndex = (currentLevelIndex + 1) % LEVELS.length;
  loadLevel(LEVELS[currentLevelIndex]);
}

function completeLevel() {
  won = true;
  render();
  setTimeout(loadNextLevel, 900);
}

// ---------- rendering ----------
function render(message = "") {
  let html = "";
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const ch = grid[y][x];
      if (x === player.x && y === player.y) {
        const cell = ch === " " ? "&nbsp;" : esc(ch);
        html += `<span class="cursor">${cell}</span>`;
      } else if (ch === "#") {
        html += `<span class="rock">#</span>`;
      } else if (ch === "~") {
        html += `<span class="sea">~</span>`;
      } else {
        html += esc(ch);
      }
    }
    if (y < grid.length - 1) html += "\n";
  }
  const footer = won
    ? "\n\n🎉 Level complete!"
    : message
      ? "\n\n" + message
      : "";
  GAME_EL.innerHTML = html + esc(footer);

  // command overlay
  if (mode === "cmd") {
    CMD_TEXT.textContent = cmdBuffer;
    CMD_MSG.textContent = started ? "" : "Enter 'start' to begin";
    CMD_EL.classList.remove("hidden");
  } else {
    CMD_EL.classList.add("hidden");
  }
}

// ---------- movement ----------
function move(dx, dy) {
  if (!started || won) return;
  const nx = player.x + dx,
    ny = player.y + dy;
  const ch = at(nx, ny);
  if (ch === "#" || ch === "~") return; // cannot walk on rock or sea
  player.x = nx;
  player.y = ny;
  if (player.x === goal.x && player.y === goal.y) {
    completeLevel();
    return;
  }
  render();
}

// ---------- tokenizer & motions (rocks at edges, sea allowed across) ----------

function isLetter(ch) {
  return /[A-Za-z]/.test(ch);
}
function isRock(ch) {
  return ch === "#";
}
function isSea(ch) {
  return ch === "~";
}

function getLine(y) {
  if (y < 0 || y >= grid.length) return "";
  return grid[y].join("");
}

/** Tokens where rock may REPLACE the first or last char.
 * Forms recognized per word:
 *  "#his"  → headRock=true, firstLetter = index+1, lastLetter=index+3, token span start=index, end=index+3
 *  "Thi#"  → tailRock=true, firstLetter = index,   lastLetter=index+2, token span start=index, end=index+3
 *  "word"  → noRock,       firstLetter = index,    lastLetter=index+len-1, span start..end as letters only
 *
 * We scan left→right, skipping sea and spaces between words.
 */
function wordTokensOnLine(y) {
  const s = getLine(y);
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    // head rock: "#"+letters
    if (isRock(s[i]) && isLetter(s[i + 1])) {
      const start = i; // at '#'
      const firstLetter = i + 1;
      let j = i + 1;
      while (j < s.length && isLetter(s[j])) j++;
      const lastLetter = j - 1;
      const end = lastLetter; // span ends at last letter (no trailing '#')
      tokens.push({
        start,
        end,
        firstLetter,
        lastLetter,
        headRock: true,
        tailRock: false,
      });
      i = j;
      continue;
    }
    // letters, maybe tail rock
    if (isLetter(s[i])) {
      const firstLetter = i;
      let j = i;
      while (j < s.length && isLetter(s[j])) j++;
      let lastLetter = j - 1;
      let end = lastLetter;
      let tailRock = false;
      if (isRock(s[j])) {
        tailRock = true;
        end = j;
        j++;
      } // trailing rock replaces last char
      tokens.push({
        start: firstLetter,
        end,
        firstLetter,
        lastLetter,
        headRock: false,
        tailRock,
      });
      i = j;
      continue;
    }
    // otherwise skip (sea, spaces, punctuation)
    i++;
  }
  return tokens;
}

function tokenIndexAt(x, y) {
  const ts = wordTokensOnLine(y);
  for (let idx = 0; idx < ts.length; idx++) {
    const t = ts[idx];
    if (x >= t.start && x <= t.end) return idx;
  }
  return -1;
}
function tokenAt(x, y) {
  const ts = wordTokensOnLine(y);
  const i = tokenIndexAt(x, y);
  return i >= 0 ? ts[i] : null;
}

// w: next token's FIRST LETTER; It cannot jump on the rock
function nextW(x, y) {
  const ts = wordTokensOnLine(y);
  const i = tokenIndexAt(x, y);
  const startFrom = i >= 0 ? i + 1 : 0;
  for (let k = startFrom; k < ts.length; k++) {
    const t = ts[k];
    // If token starts with rock ('#his'), you can't land on '#', so skip it.
    const startCharIsRock = getLine(y)[t.start] === "#";
    if (!startCharIsRock) return { x: t.firstLetter, y };
  }
  return null;
}

// e: if inside and x<lastLetter → go to lastLetter; else next token's lastLetter;
// skip tokens whose end char is '#'
function nextE(x, y) {
  const line = getLine(y);
  const ts = wordTokensOnLine(y);
  const i = tokenIndexAt(x, y);
  const cur = i >= 0 ? ts[i] : null;

  if (cur && x < cur.lastLetter) {
    // end is lastLetter (always a letter)
    return { x: cur.lastLetter, y };
  }
  // otherwise, scan next tokens
  const startFrom = i >= 0 ? i + 1 : 0;
  for (let k = startFrom; k < ts.length; k++) {
    const t = ts[k];
    const endCharIsRock = line[t.end] === "#";
    if (!endCharIsRock) return { x: t.lastLetter, y };
    // else skip and keep scanning (you "jump through" a rock-ended word)
  }
  return null;
}

// b: previous token's FIRST LETTER; skip tokens whose start char is '#'
function prevB(x, y) {
  const ts = wordTokensOnLine(y);
  const i = tokenIndexAt(x, y);
  const cur = i >= 0 ? ts[i] : null;

  // inside current token and not at first letter → go to first letter
  if (cur && x > cur.firstLetter) return { x: cur.firstLetter, y };

  // otherwise, scan left
  const startFrom = i >= 0 ? i - 1 : ts.length - 1;
  for (let k = startFrom; k >= 0; k--) {
    const t = ts[k];
    const startCharIsRock = getLine(y)[t.start] === "#";
    if (!startCharIsRock) return { x: t.firstLetter, y };
  }
  return null;
}

// ---------- command line ----------
function openCmdline() {
  mode = "cmd";
  cmdBuffer = ":";
  render();
}
function closeCmdline() {
  mode = "normal";
  cmdBuffer = ":";
  render();
}

async function submitCmdline() {
  const raw = cmdBuffer.trim();
  const cmd = raw.slice(1);

  if (cmd === "start") {
    started = true;
    setHint("Game started. Move with hjkl. Motions allowed on Level 2+.");
    closeCmdline();
    render();
    return;
  }
  if (cmd === "restart") {
    closeCmdline();
    await restartLevel({ autostart: true });
    return;
  }
  if (cmd === "help") {
    closeCmdline();
    openHelp();
    return;
  }
  CMD_MSG.textContent = `Not an editor command: ${raw}`;
}

function handleCmdKey(e) {
  const k = e.key;
  if (k === "Enter") {
    e.preventDefault();
    submitCmdline();
    return;
  }
  if (k === "Escape") {
    e.preventDefault();
    closeCmdline();
    return;
  }
  if (k === "Backspace") {
    e.preventDefault();
    if (cmdBuffer.length > 1) cmdBuffer = cmdBuffer.slice(0, -1);
    render();
    return;
  }
  if (k.length === 1) {
    e.preventDefault();
    cmdBuffer += k;
    render();
  }
}

// ---------- help modal ----------
function openHelp() {
  HELP_BODY.textContent = HELP_TEXT;
  BACKDROP.classList.remove("hidden");
  HELP_MODAL.classList.remove("hidden");
  helpOpen = true;
}
function closeHelp() {
  BACKDROP.classList.add("hidden");
  HELP_MODAL.classList.add("hidden");
  helpOpen = false;
}
function handleHelpKey(e) {
  const k = e.key;
  if (k === "Escape" || k === "q") {
    e.preventDefault();
    closeHelp();
    return;
  }
  e.preventDefault();
}

// ---------- global keys ----------
function handleKey(e) {
  if (helpOpen) {
    handleHelpKey(e);
    return;
  }

  if (e.key === ":" || mode === "cmd") e.preventDefault();
  if (mode === "cmd") {
    handleCmdKey(e);
    return;
  }

  const k = e.key;

  // manual advance kept (we also auto-advance)
  if (won && k === "Enter") {
    loadNextLevel();
    return;
  }

  if (k === ":") {
    openCmdline();
    return;
  }

  if (!started) return;

  // hjkl
  if (k === "h") {
    move(-1, 0);
    return;
  }
  if (k === "j") {
    move(0, 1);
    return;
  }
  if (k === "k") {
    move(0, -1);
    return;
  }
  if (k === "l") {
    move(1, 0);
    return;
  }

  // motions enabled Level 2+
  const motionsEnabled = currentLevelIndex >= 1;
  if (!motionsEnabled) return;

  if (k === "w") {
    const t = nextW(player.x, player.y);
    if (t) {
      player = t;
      if (player.x === goal.x && player.y === goal.y) {
        completeLevel();
        return;
      }
      render();
    }
    return;
  }
  if (k === "e") {
    const t = nextE(player.x, player.y);
    if (t) {
      player = t;
      if (player.x === goal.x && player.y === goal.y) {
        completeLevel();
        return;
      }
      render();
    }
    return;
  }
  if (k === "b") {
    const t = prevB(player.x, player.y);
    if (t) {
      player = t;
      if (player.x === goal.x && player.y === goal.y) {
        completeLevel();
        return;
      }
      render();
    }
    return;
  }
}

window.addEventListener("keydown", handleKey);

// Boot
loadLevel(LEVELS[currentLevelIndex]).catch((err) => {
  GAME_EL.textContent = "Level load error:\n" + err.message;
});
