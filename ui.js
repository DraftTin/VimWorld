// ui.js
// All UI functions; NO game logic or state here.

import { ROCK, NPC, SEA, END } from "./elements.js";

// Cache DOM once
const GAME_EL = document.getElementById("game");
const TITLE_EL = document.getElementById("levelTitle");
const DESC_EL = document.getElementById("levelDesc");
const HINTS_EL = document.getElementById("hints");

// Command-line overlay
const CMD_EL = document.getElementById("cmdOverlay");
const CMD_TEXT = document.getElementById("cmdText");
const CMD_MSG = document.getElementById("cmdMsg");
const CMD_RESULT = document.getElementById("cmdResult");

// Help modal
const BACKDROP = document.getElementById("backdrop");
const HELP_MODAL = document.getElementById("helpModal");
const HELP_BODY = document.getElementById("helpBody");

export function renderMap(state) {
  const g = state.grid ?? [];
  const px = state.player.x;
  const py = state.player.y;

  let html = "";
  for (let y = 0; y < g.length; y++) {
    const row = g[y];
    for (let x = 0; x < row.length; x++) {
      let ch = x === px && y === py ? "👾" : g[y][x];

      let cls = "cell ";

      if (ch === "👾") cls += "player";
      else if (ch === "🪨") cls += "rock";
      else if (ch === "🌊") cls += "sea";
      else if (ch === "🚪") cls += "goal";
      else if (ch === "🤖") cls += "npc";
      else if (ch === " ") cls += "space";

      html += `<span class="${cls}">${ch}</span>`;
    }
    html += `<span class="row-break"></span>`;
  }
  GAME_EL.innerHTML = html;
}

// --- Public: header/description & hints ---
export function renderDescription(title, descHTML) {
  if (TITLE_EL) TITLE_EL.textContent = title;
  if (DESC_EL) DESC_EL.innerHTML = descHTML; // allow <strong>
}
export function renderHint(html) {
  if (HINTS_EL) HINTS_EL.innerHTML = html;
}

// --- Public: command-line overlay ---
export function openCmdline(initialBuffer = ":") {
  if (!CMD_EL) return;
  CMD_TEXT.textContent = initialBuffer;
  CMD_MSG.textContent = "";
  CMD_RESULT.textContent = "";
  CMD_EL.classList.remove("hidden");
}
export function closeCmdline() {
  if (!CMD_EL) return;
  CMD_EL.classList.add("hidden");
  CMD_TEXT.textContent = ":";
  CMD_MSG.textContent = "";
  CMD_RESULT.textContent = "";
}
export function updateCmdline({ buffer, msg, result } = {}) {
  if (!CMD_EL) return;
  if (buffer !== undefined) CMD_TEXT.textContent = buffer;
  if (msg !== undefined) CMD_MSG.textContent = msg;
  if (result !== undefined) CMD_RESULT.textContent = result;
}
export function getCmdBuffer() {
  return CMD_TEXT?.textContent ?? ":";
}
export function isCmdlineOpen() {
  return !CMD_EL.classList.contains("hidden");
}

// --- Public: help modal ---
export function openHelp(text) {
  HELP_BODY.textContent = text;
  BACKDROP.classList.remove("hidden");
  HELP_MODAL.classList.remove("hidden");
}
export function closeHelp() {
  BACKDROP.classList.add("hidden");
  HELP_MODAL.classList.add("hidden");
}
export function isHelpOpen() {
  return !HELP_MODAL.classList.contains("hidden");
}

// --- Optional: tweak tile size via CSS var ---
// export function setCellSize(px = 28) {
//   document.documentElement.style.setProperty("--cell", `${px}px`);
// }
