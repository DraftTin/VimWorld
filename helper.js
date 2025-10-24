// word = letters, digits, or rock
export const WORD_RE = /^[\w🪨]+/u;

// whitespace = space, sea, newline
export const WS_RE = /^[\s🌊]+/u;

// All other characters (only )
export const NON_WS_WORD_RE = /^([^\w\s🌊🪨])\1*/u;

export function charType(ch) {
  if (WS_RE.test(ch)) return "ws"; // whitespace
  if (WORD_RE.test(ch)) return "word"; // letters, digits, 🪨
  return "punct"; // everything else
}
