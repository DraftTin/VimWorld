# 🪨 VimWorld

\***\*VimWorld is a small educational game that teaches core **Vim navigation\*\* concepts through interactive, text-based puzzles.  
Each level represents a piece of text or terrain that you explore using Vim-like motions such as `h`, `j`, `k`, `l`, `w`, `e`, and `b`.

The goal is to reach the **🚪 door** while mastering how different keys move your “cursor” 👾 across the world.

---

## 🎯 Purpose

VimWorld

- How **word motions** (`w`, `e`, `b`) behave in Vim.
- The difference between **words**, **punctuation**, and **whitespace**.
- How navigating text in Vim mirrors moving through a logical grid.
- Other vim features will be incorporated in the future game

It’s both a **game** and a **learning tool** — simple, fast, and playable right in your browser.

---

## 🌍 Game Elements

| Symbol | Meaning         | Behavior                                                        |
| :----: | :-------------- | :-------------------------------------------------------------- |
|   👾   | **Player**      | You — the cursor controlled with Vim keys                       |
|   🪨   | **Rock**        | Counts as part of words (like letters/numbers) but not walkable |
|   🌊   | **Sea / Space** | Separates words, like whitespace; cannot stand on it            |
|   🤖   | **NPC**         | Gives hints or lore (optional interactions)                     |
|   🚪   | **Goal / Exit** | Reach it to finish the level                                    |

---

## 🎮 Controls

|       Key       | Action                                             |
| :-------------: | :------------------------------------------------- |
| `h` `j` `k` `l` | Move left / down / up / right                      |
|       `w`       | Jump to the start of the next word                 |
|       `e`       | Jump to the end of the current or next word        |
|       `b`       | Jump to the beginning of the previous word         |
|       `:`       | Enter command mode (`:start`, `:restart`, `:help`) |
|     `Enter`     | Confirm command                                    |
|  `Esc` or `q`   | Close help or cancel command line                  |

---

## ⚙️ Run Locally

### 1. Clone or download this repository

```bash
git clone https://github.com/DraftTin/VimWorld.git
cd VimWorld
# local server
python3 -m http.server 8000

```

## Remote access

Visit [VimWorld](https://drafttin.github.io/VimWorld/) webpage.
