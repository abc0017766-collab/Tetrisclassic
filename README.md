# 🎮 Tetris Classic

A fully playable classic Tetris game built with pure HTML5, CSS3, and vanilla JavaScript. No frameworks, no dependencies — just retro arcade fun in your browser!

## 🌐 Play Now

**Live Demo:** https://abc0017766-collab.github.io/Tetrisclassic

Simply open the link in your browser and start playing. No installation required!

## 📁 Project Structure

```
Tetrisclassic/
├── index.html       # Game layout and UI
├── style.css        # Retro dark theme with neon colors
├── tetris.js        # Complete game engine
└── README.md        # This file
```

## 🎯 Features

✅ **Classic Tetris Gameplay**
- 7 tetrominoes (I, O, T, S, Z, J, L)
- 10 × 20 game board
- Piece rotation and movement
- Line clearing with scoring
- Progressive difficulty (speed increases with level)
- Game over detection

✅ **Retro 90s Arcade Style**
- Dark background with neon glow effects
- Press Start 2P pixel font for authentic feel
- Vibrant neon colors for each piece
- Smooth animations and transitions

✅ **Full UI & Game States**
- Start screen (press Enter to begin)
- Live score, level, and lines counter
- Next piece preview
- Pause/Resume functionality
- Game Over overlay with final stats

✅ **NES Tetris Scoring System**
- Single: 100 × level points
- Double: 300 × level points
- Triple: 500 × level points
- Tetris (4 lines): 800 × level points
- Level up every 10 lines cleared

## 🕹️ How to Play

1. **Visit the game URL** or open `index.html` in your browser
2. **Press Enter** on the start screen to begin
3. **Control your pieces** using the keyboard:
   - **← →** Move piece left/right
   - **↑** Rotate piece clockwise
   - **↓** Soft drop (speed up falling)
   - **Space** Hard drop (instant drop)
   - **P** Pause/Resume game
4. **Clear lines** by filling horizontal rows completely
5. **Survive longer** as the game gets faster with each level
6. **Game Over** occurs when a new piece cannot spawn (board is full)

## 🏆 Scoring

| Lines Cleared | Points |
|:---:|:---:|
| 1 (Single) | 100 × level |
| 2 (Double) | 300 × level |
| 3 (Triple) | 500 × level |
| 4 (Tetris!) | 800 × level |

**Level Progression:** Every 10 lines cleared = Level +1 (game speeds up)

## 🎨 Visual Design

- **Color Scheme:** Dark background (#0a0e27) with neon green UI and colored tetrominoes
- **Font:** Press Start 2P from Google Fonts for that authentic retro feel
- **Effects:** Neon glow borders, smooth canvas rendering, blinking text animations
- **Responsive:** Works on desktop and tablets

## 💻 Technical Details

- **No Dependencies:** Pure vanilla JavaScript, no npm packages
- **Static Files:** Can be hosted anywhere (GitHub Pages, Netlify, etc.)
- **Canvas Rendering:** Crisp pixelated graphics using HTML5 Canvas
- **Game Loop:** Powered by `requestAnimationFrame` for 60 FPS gameplay
- **Input Handling:** Native keyboard event listeners
- **Browser Compatible:** Works on all modern browsers (Chrome, Firefox, Safari, Edge)

## 🚀 GitHub Pages Hosting

This project is optimized for GitHub Pages:

1. The `index.html` is in the repository root
2. No build step or npm installation needed
3. Simply push to GitHub and enable GitHub Pages in settings
4. Your game will be live at: `https://<username>.github.io/Tetrisclassic`

## 📝 Game Mechanics

### Piece Spawning
- Pieces appear at the top center of the board
- Next piece is shown in the side panel preview
- Game over if a new piece collides with existing blocks

### Collision Detection
- Prevents pieces from moving outside board boundaries
- Prevents overlapping with already-placed blocks
- Enables piece stacking and land detection

### Line Clearing
- Automatically detects complete rows
- Clears lines and drops remaining blocks
- Multiple lines can be cleared in one drop
- Each clear awards points based on the combo

### Gravity & Speed
- Base gravity: 0.5 blocks per frame
- Increases with level: gravity = 0.5 + (level - 1) × 0.1
- Soft drop: Player can manually speed up falling
- Hard drop: Instant placement

## 🛠️ How to Modify

Want to customize the game? Here's what you can tweak:

### Change Colors
Edit `tetris.js` line ~20:
```javascript
const PIECE_COLORS = {
    I: '#00ffff', // Change this to any hex color
    O: '#ffff00',
    // etc...
};
```

### Adjust Game Speed
Edit `tetris.js` line ~11:
```javascript
const GRAVITY_BASE = 0.5; // Lower = slower, higher = faster
```

### Change Board Size
Edit `tetris.js` lines 8-9:
```javascript
const BOARD_WIDTH = 10;   // Number of columns
const BOARD_HEIGHT = 20;  // Number of rows
```

### Modify Scoring
Edit `tetris.js` starting at line ~436:
```javascript
addScore(linesCleared) {
    switch (linesCleared) {
        case 1:
            points = 100 * this.level; // Change these values
        // etc...
    }
}
```

## 📜 License

This project is free to use and modify for personal or educational purposes.

## 🎮 Enjoy!

Have fun playing Tetris Classic! High scores welcome! 🏆
