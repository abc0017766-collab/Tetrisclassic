// ============================================
// TETRIS GAME ENGINE
// ============================================

// Game Constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const GRAVITY_BASE = 0.04; // Base gravity speed (lower = slower)
const MOVEMENT_DELAY = 4; // Frames between left/right/down movements

// Piece Colors (RGB values)
const PIECE_COLORS = {
    I: '#00ffff', // Cyan
    O: '#ffff00', // Yellow
    T: '#ff00ff', // Magenta
    S: '#00ff00', // Green
    Z: '#ff0000', // Red
    J: '#0000ff', // Blue
    L: '#ff8800', // Orange
};

// Tetromino Definitions (spawn positions and rotations)
const TETROMINOES = {
    I: {
        color: PIECE_COLORS.I,
        rotations: [
            [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
            [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
            [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
            [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
        ]
    },
    O: {
        color: PIECE_COLORS.O,
        rotations: [
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
        ]
    },
    T: {
        color: PIECE_COLORS.T,
        rotations: [
            [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
            [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
        ]
    },
    S: {
        color: PIECE_COLORS.S,
        rotations: [
            [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
            [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
        ]
    },
    Z: {
        color: PIECE_COLORS.Z,
        rotations: [
            [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
            [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
            [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
            [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
        ]
    },
    J: {
        color: PIECE_COLORS.J,
        rotations: [
            [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
            [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
        ]
    },
    L: {
        color: PIECE_COLORS.L,
        rotations: [
            [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
            [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
            [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
            [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
        ]
    }
};

// Game State
class Game {
    constructor() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameActive = false;
        this.gamePaused = false;
        this.currentPiece = null;
        this.nextPiece = null;
        this.ghostPiece = null;
        this.dropCounter = 0;
        this.frameCounter = 0;
        this.movementCounter = 0;
        this.clearingRows = new Set(); // Rows being cleared
        this.clearAnimationFrame = 0; // Animation frame counter
        this.clearAnimationDuration = 8; // Frames for flash effect
        this.baseCanvasWidth = BOARD_WIDTH * BLOCK_SIZE;
        this.baseCanvasHeight = BOARD_HEIGHT * BLOCK_SIZE;
        this.loopStarted = false;
        this.swipeState = {
            tracking: false,
            startX: 0,
            startY: 0,
            startTime: 0,
            pointerId: null,
            lastTapTime: 0,
            lastTapX: 0,
            lastTapY: 0
        };

        // Input tracking
        this.keys = {};
        this.lastKeyPress = {};

        // Get canvas contexts
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // Initialize overlays
        this.startOverlay = document.getElementById('startOverlay');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.pauseOverlay = document.getElementById('pauseOverlay');

        // Bind input handlers
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('resize', () => this.resizeCanvases());
        window.addEventListener('orientationchange', () => this.resizeCanvases());

        this.bindSwipeControls();
        this.bindOverlayTouchStart();

        // Initialize game
        this.init();
        this.resizeCanvases();
    }

    createBoard() {
        const board = [];
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            board[i] = [];
            for (let j = 0; j < BOARD_WIDTH; j++) {
                board[i][j] = null;
            }
        }
        return board;
    }

    init() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameActive = true;
        this.gamePaused = false;
        this.dropCounter = 0;
        this.movementCounter = 0;
        this.clearingRows.clear();
        this.clearAnimationFrame = 0;

        this.startOverlay.classList.add('hidden');
        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');

        this.nextPiece = this.createRandomPiece();
        this.spawnNewPiece();
        this.updateUI();

        if (!this.loopStarted) {
            this.loopStarted = true;
            this.gameLoop();
        }
    }

    bindOverlayTouchStart() {
        this.startOverlay.addEventListener('click', () => {
            if (!this.gameActive) {
                this.init();
            }
        });

        this.gameOverOverlay.addEventListener('click', () => {
            if (!this.gameActive) {
                this.init();
            }
        });

        this.pauseOverlay.addEventListener('click', () => {
            if (this.gamePaused) {
                this.togglePause();
            }
        });
    }

    bindSwipeControls() {
        const startSwipe = (x, y, pointerId = null) => {
            this.swipeState.tracking = true;
            this.swipeState.startX = x;
            this.swipeState.startY = y;
            this.swipeState.startTime = performance.now();
            this.swipeState.pointerId = pointerId;
        };

        const endSwipe = (x, y) => {
            if (!this.swipeState.tracking) return;
            this.swipeState.tracking = false;
            this.swipeState.pointerId = null;

            if (!this.gameActive || this.gamePaused || !this.currentPiece) return;

            const dx = x - this.swipeState.startX;
            const dy = y - this.swipeState.startY;
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);
            const elapsed = performance.now() - this.swipeState.startTime;

            const swipeThreshold = Math.max(10, Math.round(this.canvas.clientWidth * 0.03));
            const tapThreshold = Math.max(12, Math.round(this.canvas.clientWidth * 0.025));

            // Double tap to rotate.
            if (absX < tapThreshold && absY < tapThreshold && elapsed < 280) {
                const now = performance.now();
                const doubleTapWindowMs = 320;
                const doubleTapDistance = 32;
                const tapDx = Math.abs(x - this.swipeState.lastTapX);
                const tapDy = Math.abs(y - this.swipeState.lastTapY);
                const isDoubleTap =
                    now - this.swipeState.lastTapTime <= doubleTapWindowMs &&
                    tapDx <= doubleTapDistance &&
                    tapDy <= doubleTapDistance;

                if (isDoubleTap) {
                    this.rotate(this.currentPiece);
                    this.swipeState.lastTapTime = 0;
                    this.swipeState.lastTapX = 0;
                    this.swipeState.lastTapY = 0;
                } else {
                    this.swipeState.lastTapTime = now;
                    this.swipeState.lastTapX = x;
                    this.swipeState.lastTapY = y;
                }
                return;
            }

            // Swipe to move or soft drop
            if (absX >= swipeThreshold || absY >= swipeThreshold) {
                if (absX > absY) {
                    if (dx > 0) {
                        this.moveRight(this.currentPiece);
                    } else {
                        this.moveLeft(this.currentPiece);
                    }
                } else if (dy > 0) {
                    this.softDrop(this.currentPiece);
                }
            }
        };

        this.canvas.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'touch') return;
            event.preventDefault();
            startSwipe(event.clientX, event.clientY, event.pointerId);
        }, { passive: false });

        this.canvas.addEventListener('pointermove', (event) => {
            if (!this.swipeState.tracking) return;
            if (event.pointerId !== this.swipeState.pointerId) return;
            if (event.pointerType !== 'touch') return;
            event.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('pointerup', (event) => {
            if (event.pointerType !== 'touch') return;
            if (event.pointerId !== this.swipeState.pointerId) return;
            endSwipe(event.clientX, event.clientY);
        }, { passive: true });

        this.canvas.addEventListener('pointercancel', () => {
            this.swipeState.tracking = false;
            this.swipeState.pointerId = null;
        }, { passive: true });

        // Touch fallback for browsers that do not dispatch pointer events consistently.
        this.canvas.addEventListener('touchstart', (event) => {
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            startSwipe(touch.clientX, touch.clientY, null);
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (event) => {
            if (!this.swipeState.tracking) return;
            event.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (event) => {
            if (!this.swipeState.tracking) return;
            const touch = event.changedTouches[0];
            endSwipe(touch.clientX, touch.clientY);
        }, { passive: true });

        this.canvas.addEventListener('touchcancel', () => {
            this.swipeState.tracking = false;
            this.swipeState.pointerId = null;
        }, { passive: true });
    }

    resizeCanvases() {
        const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        const isMobileLayout = window.innerWidth <= 768 || isTouchDevice;
        const desktopSidePanelWidth = 240;
        const horizontalPadding = isMobileLayout ? 12 : 80;
        const verticalPadding = isMobileLayout ? 8 : 120;
        const availableWidth = isMobileLayout
            ? window.innerWidth - horizontalPadding
            : window.innerWidth - horizontalPadding - desktopSidePanelWidth;
        const availableHeight = isMobileLayout
            ? Math.max(340, window.innerHeight - verticalPadding)
            : window.innerHeight - 120;

        const scaleLimit = isMobileLayout ? 2 : 1.25;
        const scale = Math.max(
            0.45,
            Math.min(
                scaleLimit,
                Math.min(availableWidth / this.baseCanvasWidth, availableHeight / this.baseCanvasHeight)
            )
        );

        const scaledWidth = Math.round(this.baseCanvasWidth * scale);
        const scaledHeight = Math.round(this.baseCanvasHeight * scale);

        this.canvas.style.width = `${scaledWidth}px`;
        this.canvas.style.height = `${scaledHeight}px`;

        const nextBase = 120;
        const nextScale = isMobileLayout ? 0.75 : 1;
        this.nextCanvas.style.width = `${Math.round(nextBase * nextScale)}px`;
        this.nextCanvas.style.height = `${Math.round(nextBase * nextScale)}px`;
    }

    createRandomPiece() {
        const pieces = Object.keys(TETROMINOES);
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            type: type,
            rotation: 0,
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0,
            data: TETROMINOES[type]
        };
    }

    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createRandomPiece();

        if (this.collides(this.currentPiece)) {
            this.gameOver();
        }
    }

    collides(piece) {
        const shape = piece.data.rotations[piece.rotation];

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;

                const boardX = piece.x + x;
                const boardY = piece.y + y;

                if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                    return true;
                }

                if (boardY >= 0 && this.board[boardY][boardX] !== null) {
                    return true;
                }
            }
        }

        return false;
    }

    rotate(piece) {
        const oldRotation = piece.rotation;
        piece.rotation = (piece.rotation + 1) % piece.data.rotations.length;

        if (this.collides(piece)) {
            piece.rotation = oldRotation;
            return false;
        }
        return true;
    }

    moveLeft(piece) {
        piece.x--;
        if (this.collides(piece)) {
            piece.x++;
            return false;
        }
        return true;
    }

    moveRight(piece) {
        piece.x++;
        if (this.collides(piece)) {
            piece.x--;
            return false;
        }
        return true;
    }

    softDrop(piece) {
        piece.y++;
        if (this.collides(piece)) {
            piece.y--;
            return false;
        }
        return true;
    }

    hardDrop(piece) {
        while (this.softDrop(piece)) {}
        this.placePiece(piece);
        this.spawnNewPiece();
    }

    placePiece(piece) {
        const shape = piece.data.rotations[piece.rotation];

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;

                const boardX = piece.x + x;
                const boardY = piece.y + y;

                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    this.board[boardY][boardX] = piece.data.color;
                }
            }
        }

        this.clearLines();
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            let isLineFull = true;
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.board[y][x] === null) {
                    isLineFull = false;
                    break;
                }
            }

            if (isLineFull) {
                this.clearingRows.add(y);
                linesCleared++;
            }
        }

        if (linesCleared > 0) {
            this.addScore(linesCleared);
            this.lines += linesCleared;
            this.clearAnimationFrame = 0;
            // Don't clear immediately, wait for animation
        }
    }

    addScore(linesCleared) {
        let points = 0;

        switch (linesCleared) {
            case 1:
                points = 100 * this.level;
                break;
            case 2:
                points = 300 * this.level;
                break;
            case 3:
                points = 500 * this.level;
                break;
            case 4:
                points = 800 * this.level;
                break;
        }

        this.score += points;

        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel !== this.level) {
            this.level = newLevel;
        }
    }

    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        this.keys[key] = true;

        // Single-key press actions (not held)
        if (!this.lastKeyPress[key]) {
            this.lastKeyPress[key] = true;

            if (!this.gameActive) {
                if (event.key === 'Enter') {
                    this.init();
                }
            } else if (this.gamePaused) {
                if (key === 'p') {
                    this.togglePause();
                }
            } else {
                if (event.key === 'ArrowUp') {
                    this.rotate(this.currentPiece);
                }
                if (event.key === ' ') {
                    event.preventDefault();
                    this.hardDrop(this.currentPiece);
                }
                if (key === 'p') {
                    this.togglePause();
                }
            }
        }
    }

    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        this.keys[key] = false;
        this.lastKeyPress[key] = false;
    }

    togglePause() {
        this.gamePaused = !this.gamePaused;

        if (this.gamePaused) {
            this.pauseOverlay.classList.remove('hidden');
        } else {
            this.pauseOverlay.classList.add('hidden');
        }
    }

    gameOver() {
        this.gameActive = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalLines').textContent = this.lines;
        this.gameOverOverlay.classList.remove('hidden');
    }

    update() {
        if (!this.gameActive || this.gamePaused) return;

        // Handle line clearing animation
        if (this.clearingRows.size > 0) {
            this.clearAnimationFrame++;
            if (this.clearAnimationFrame >= this.clearAnimationDuration) {
                // Animation complete, now clear the rows
                const rowsToRemove = Array.from(this.clearingRows).sort((a, b) => b - a);
                for (const row of rowsToRemove) {
                    this.board.splice(row, 1);
                    this.board.unshift(new Array(BOARD_WIDTH).fill(null));
                }
                this.clearingRows.clear();
            }
            // Don't process gravity or movement during animation
            return;
        }

        // Gravity
        const gravity = GRAVITY_BASE + (this.level - 1) * 0.01;
        this.dropCounter += gravity;

        if (this.dropCounter >= 1) {
            if (!this.softDrop(this.currentPiece)) {
                this.placePiece(this.currentPiece);
                this.spawnNewPiece();
            }
            this.dropCounter = 0;
        }

        // Continuous movement (held keys) with delay
        this.movementCounter++;
        if (this.movementCounter >= MOVEMENT_DELAY) {
            if (this.keys['arrowleft'] || this.keys['a']) {
                this.moveLeft(this.currentPiece);
            }
            if (this.keys['arrowright'] || this.keys['d']) {
                this.moveRight(this.currentPiece);
            }
            if (this.keys['arrowdown'] || this.keys['s']) {
                this.softDrop(this.currentPiece);
            }
            this.movementCounter = 0;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board
        this.drawBoard();

        // Draw current piece
        if (this.gameActive) {
            this.drawPiece(this.currentPiece);
        }

        // Draw next piece preview
        this.drawNextPreview();
    }

    drawBoard() {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);

                    // Add glow effect
                    this.ctx.strokeStyle = this.board[y][x];
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                }
            }

            // Draw flash effect for rows being cleared
            if (this.clearingRows.has(y)) {
                const flashIntensity = Math.sin((this.clearAnimationFrame / this.clearAnimationDuration) * Math.PI) * 255;
                
                // White flash background
                this.ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity / 255 * 0.8})`;
                this.ctx.fillRect(0, y * BLOCK_SIZE, BOARD_WIDTH * BLOCK_SIZE, BLOCK_SIZE);

                // Yellow/bright glow
                this.ctx.strokeStyle = `rgba(255, 255, 0, ${flashIntensity / 255})`;
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(0, y * BLOCK_SIZE, BOARD_WIDTH * BLOCK_SIZE, BLOCK_SIZE);

                // Bright lighting effect
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 20;
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(2, y * BLOCK_SIZE + 2, BOARD_WIDTH * BLOCK_SIZE - 4, BLOCK_SIZE - 4);
                this.ctx.shadowBlur = 0;
            }
        }
    }

    drawPiece(piece) {
        const shape = piece.data.rotations[piece.rotation];

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;

                const boardX = piece.x + x;
                const boardY = piece.y + y;

                if (boardY >= 0) {
                    this.ctx.fillStyle = piece.data.color;
                    this.ctx.fillRect(boardX * BLOCK_SIZE, boardY * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);

                    // Add glow
                    this.ctx.shadowColor = piece.data.color;
                    this.ctx.shadowBlur = 10;
                    this.ctx.strokeStyle = piece.data.color;
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(boardX * BLOCK_SIZE, boardY * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                    this.ctx.shadowBlur = 0;
                }
            }
        }
    }

    drawNextPreview() {
        this.nextCtx.fillStyle = '#000000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        const piece = this.nextPiece;
        const shape = piece.data.rotations[piece.rotation];
        const blockSize = 20;

        // Center the preview
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;

                this.nextCtx.fillStyle = piece.data.color;
                const drawX = offsetX + x * blockSize;
                const drawY = offsetY + y * blockSize;
                this.nextCtx.fillRect(drawX, drawY, blockSize - 1, blockSize - 1);

                this.nextCtx.strokeStyle = piece.data.color;
                this.nextCtx.lineWidth = 1;
                this.nextCtx.strokeRect(drawX, drawY, blockSize - 1, blockSize - 1);
            }
        }
    }

    updateUI() {
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('levelDisplay').textContent = this.level;
        document.getElementById('linesDisplay').textContent = this.lines;
    }

    gameLoop() {
        this.update();
        this.draw();
        this.updateUI();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
