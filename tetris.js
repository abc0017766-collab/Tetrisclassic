// ============================================
// TETRIS GAME ENGINE
// ============================================

// Game Constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const GRAVITY_BASE = 0.01; // Base gravity speed (lower = slower)
const MOVEMENT_DELAY = 5; // Frames between left/right/down movements
const HARD_DROP_BONUS = 2;

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
        this.moves = 0;
        this.level = 1;
        this.lines = 0;
        this.gameActive = false;
        this.gamePaused = false;
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.ghostPiece = null;
        this.dropCounter = 0;
        this.fastDropActive = false;
        this.frameCounter = 0;
        this.movementCounter = 0;
        this.clearingRows = new Set(); // Rows being cleared
        this.clearAnimationFrame = 0; // Animation frame counter
        this.clearAnimationDuration = 8; // Frames for flash effect
        this.shakeFrames = 0;
        this.bag = [];
        this.combo = -1;
        this.backToBack = false;
        this.soundEnabled = true;
        this.audioCtx = null;
        this.fxTimeout = null;
        this.baseCanvasWidth = BOARD_WIDTH * BLOCK_SIZE;
        this.baseCanvasHeight = BOARD_HEIGHT * BLOCK_SIZE;
        this.loopStarted = false;
        this.swipeState = {
            tracking: false,
            startX: 0,
            startY: 0,
            startTime: 0,
            pointerId: null
        };

        // Input tracking
        this.keys = {};
        this.lastKeyPress = {};

        // Get canvas contexts
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.mobileNextCanvas = document.getElementById('mobileNextCanvas');
        this.mobileNextCtx = this.mobileNextCanvas ? this.mobileNextCanvas.getContext('2d') : null;
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas ? this.holdCanvas.getContext('2d') : null;
        this.fxMessageEl = document.getElementById('fxMessage');

        // Initialize overlays
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.pauseOverlay = document.getElementById('pauseOverlay');

        // Main menu and game controls
        this.mainMenu = document.getElementById('mainMenu');
        this.gameSection = document.getElementById('gameSection');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.holdBtn = document.getElementById('holdBtn');
        this.soundBtn = document.getElementById('soundBtn');
        this.endBtn = document.getElementById('endBtn');

        // Bind input handlers
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('resize', () => this.resizeCanvases());
        window.addEventListener('orientationchange', () => this.resizeCanvases());
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => this.resizeCanvases());
            window.visualViewport.addEventListener('scroll', () => this.resizeCanvases());
        }

        this.bindSwipeControls();
        this.bindOverlayTouchStart();
        this.bindMainControls();
        this.updateViewportCssVars();

        // Show menu first; do not auto-start game.
        this.showMainMenu();
        this.resizeCanvases();
    }

    updateViewportCssVars() {
        const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty('--app-vw', `${Math.round(viewportWidth)}px`);
        document.documentElement.style.setProperty('--app-vh', `${Math.round(viewportHeight)}px`);
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
        this.moves = 0;
        this.level = 1;
        this.lines = 0;
        this.gameActive = true;
        this.gamePaused = false;
        this.dropCounter = 0;
        this.fastDropActive = false;
        this.movementCounter = 0;
        this.clearingRows.clear();
        this.clearAnimationFrame = 0;
        this.shakeFrames = 0;
        this.combo = -1;
        this.backToBack = false;
        this.holdPiece = null;
        this.canHold = true;
        this.bag = [];

        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');

        if (this.pauseBtn) {
            this.pauseBtn.textContent = 'PAUSE';
        }

        this.nextPiece = this.createRandomPiece();
        this.spawnNewPiece();
        this.updateUI();
        this.showFxMessage('READY', '#00ffcc', 550);

        if (!this.loopStarted) {
            this.loopStarted = true;
            this.gameLoop();
        }
    }

    bindMainControls() {
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener('click', () => this.startGame());
        }

        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => {
                if (this.gameActive) {
                    this.togglePause();
                }
            });
        }

        if (this.holdBtn) {
            this.holdBtn.addEventListener('click', () => this.holdCurrentPiece());
        }

        if (this.soundBtn) {
            this.soundBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                this.soundBtn.textContent = this.soundEnabled ? 'SOUND ON' : 'SOUND OFF';
                if (this.soundEnabled) {
                    this.ensureAudioReady();
                    this.playSfx('rotate');
                }
            });
        }

        if (this.endBtn) {
            this.endBtn.addEventListener('click', () => this.endToMainMenu());
        }
    }

    showMainMenu() {
        document.body.classList.remove('in-game');
        this.mainMenu.hidden = false;
        this.gameSection.hidden = true;
        this.mainMenu.classList.remove('hidden-view');
        this.gameSection.classList.add('hidden-view');
        this.mainMenu.style.display = 'flex';
        this.gameSection.style.display = 'none';
        this.resizeCanvases();
    }

    showGameSection() {
        document.body.classList.add('in-game');
        this.mainMenu.hidden = true;
        this.gameSection.hidden = false;
        this.mainMenu.classList.add('hidden-view');
        this.gameSection.classList.remove('hidden-view');
        this.mainMenu.style.display = 'none';
        this.gameSection.style.display = 'flex';
        requestAnimationFrame(() => this.resizeCanvases());
    }

    startGame() {
        this.ensureAudioReady();
        this.showGameSection();
        this.init();
        this.playSfx('start');
    }

    endToMainMenu() {
        this.gameActive = false;
        this.gamePaused = false;
        this.fastDropActive = false;
        this.keys = {};
        this.lastKeyPress = {};
        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        if (this.pauseBtn) {
            this.pauseBtn.textContent = 'PAUSE';
        }
        this.showFxMessage('', '#00ffcc', 0);
        this.showMainMenu();
    }

    ensureAudioReady() {
        if (!this.soundEnabled) return;
        if (!this.audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            this.audioCtx = new Ctx();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playSfx(kind) {
        if (!this.soundEnabled) return;
        this.ensureAudioReady();
        if (!this.audioCtx || this.audioCtx.state !== 'running') return;

        const now = this.audioCtx.currentTime;
        const beep = (freq, duration, type = 'square', gain = 0.05, at = 0) => {
            const osc = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, now + at);
            g.gain.setValueAtTime(gain, now + at);
            g.gain.exponentialRampToValueAtTime(0.0001, now + at + duration);
            osc.connect(g);
            g.connect(this.audioCtx.destination);
            osc.start(now + at);
            osc.stop(now + at + duration);
        };

        if (kind === 'start') {
            beep(440, 0.08, 'square', 0.05, 0);
            beep(660, 0.1, 'square', 0.05, 0.09);
        } else if (kind === 'rotate') {
            beep(620, 0.05, 'triangle', 0.04, 0);
        } else if (kind === 'drop') {
            beep(220, 0.08, 'square', 0.05, 0);
        } else if (kind === 'clear') {
            beep(700, 0.07, 'square', 0.05, 0);
            beep(880, 0.09, 'square', 0.05, 0.08);
        } else if (kind === 'gameover') {
            beep(300, 0.12, 'sawtooth', 0.05, 0);
            beep(220, 0.18, 'sawtooth', 0.05, 0.13);
        } else if (kind === 'pause') {
            beep(500, 0.05, 'triangle', 0.04, 0);
        } else if (kind === 'hold') {
            beep(760, 0.04, 'triangle', 0.04, 0);
        }
    }

    showFxMessage(text, color = '#00ffcc', duration = 800) {
        if (!this.fxMessageEl) return;
        this.fxMessageEl.textContent = text;
        this.fxMessageEl.style.color = color;
        if (text) {
            this.fxMessageEl.classList.add('active');
        } else {
            this.fxMessageEl.classList.remove('active');
        }
        if (this.fxTimeout) {
            clearTimeout(this.fxTimeout);
        }
        if (duration > 0) {
            this.fxTimeout = setTimeout(() => {
                if (this.fxMessageEl) {
                    this.fxMessageEl.classList.remove('active');
                }
            }, duration);
        }
    }

    bindOverlayTouchStart() {
        this.gameOverOverlay.addEventListener('click', () => {
            if (!this.gameActive) {
                this.startGame();
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
            this.fastDropActive = false;
        };

        const updateSwipeMove = (x, y) => {
            if (!this.swipeState.tracking || !this.gameActive || this.gamePaused || !this.currentPiece) {
                this.fastDropActive = false;
                return;
            }

            const dx = x - this.swipeState.startX;
            const dy = y - this.swipeState.startY;
            const slideDownThreshold = Math.max(14, Math.round(this.canvas.clientHeight * 0.03));
            this.fastDropActive = dy > slideDownThreshold && Math.abs(dy) > Math.abs(dx);
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

            const swipeThreshold = Math.max(24, Math.round(this.canvas.clientWidth * 0.08));
            const tapThreshold = Math.max(22, Math.round(this.canvas.clientWidth * 0.06));

            // Single tap to rotate.
            if (absX < tapThreshold && absY < tapThreshold && elapsed < 360) {
                if (this.rotate(this.currentPiece)) {
                    this.playSfx('rotate');
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
            updateSwipeMove(event.clientX, event.clientY);
            event.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('pointerup', (event) => {
            if (event.pointerType !== 'touch') return;
            if (event.pointerId !== this.swipeState.pointerId) return;
            endSwipe(event.clientX, event.clientY);
            this.fastDropActive = false;
        }, { passive: true });

        this.canvas.addEventListener('pointercancel', () => {
            this.swipeState.tracking = false;
            this.swipeState.pointerId = null;
            this.fastDropActive = false;
        }, { passive: true });

        // Touch fallback for browsers that do not dispatch pointer events consistently.
        this.canvas.addEventListener('touchstart', (event) => {
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            startSwipe(touch.clientX, touch.clientY, null);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (event) => {
            if (!this.swipeState.tracking) return;
            const touch = event.touches[0];
            if (touch) {
                updateSwipeMove(touch.clientX, touch.clientY);
            }
            event.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (event) => {
            if (!this.swipeState.tracking) return;
            const touch = event.changedTouches[0];
            endSwipe(touch.clientX, touch.clientY);
            this.fastDropActive = false;
        }, { passive: false });

        this.canvas.addEventListener('touchcancel', () => {
            this.swipeState.tracking = false;
            this.swipeState.pointerId = null;
            this.fastDropActive = false;
        }, { passive: true });
    }

    resizeCanvases() {
        this.updateViewportCssVars();
        const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        const isMobileLayout = viewportWidth <= 900 || isTouchDevice;
        const desktopSidePanelWidth = 240;
        const horizontalPadding = isMobileLayout ? 10 : 80;
        const chromeSafetyMargin = isMobileLayout ? 20 : 0;

        let topUiHeight = 0;
        if (isMobileLayout && this.gameSection && !this.gameSection.classList.contains('hidden-view')) {
            const mobileHud = this.gameSection.querySelector('.mobile-hud');
            const gameActions = this.gameSection.querySelector('.game-actions');
            const fxMessage = this.fxMessageEl;
            topUiHeight =
                (mobileHud ? mobileHud.offsetHeight : 0) +
                (gameActions ? gameActions.offsetHeight : 0) +
                (fxMessage ? fxMessage.offsetHeight : 0) +
                18;
        }

        const verticalPadding = isMobileLayout ? topUiHeight : 120;
        const availableWidth = isMobileLayout
            ? viewportWidth - horizontalPadding
            : viewportWidth - horizontalPadding - desktopSidePanelWidth;
        const availableHeight = isMobileLayout
            ? Math.max(160, viewportHeight - verticalPadding - chromeSafetyMargin)
            : viewportHeight - 120;

        const scaleLimit = isMobileLayout ? 1 : 1.25;
        const minScale = isMobileLayout ? 0.22 : 0.45;
        const scale = Math.max(
            minScale,
            Math.min(
                scaleLimit,
                Math.min(availableWidth / this.baseCanvasWidth, availableHeight / this.baseCanvasHeight)
            )
        );

        const mobileScaleTuning = isMobileLayout ? 0.9 : 1;
        const tunedScale = scale * mobileScaleTuning;
        const scaledWidth = Math.round(this.baseCanvasWidth * tunedScale);
        const scaledHeight = Math.round(this.baseCanvasHeight * tunedScale);

        this.canvas.style.width = `${scaledWidth}px`;
        this.canvas.style.height = `${scaledHeight}px`;

        const nextBase = 120;
        const nextScale = isMobileLayout ? 0.75 : 1;
        this.nextCanvas.style.width = `${Math.round(nextBase * nextScale)}px`;
        this.nextCanvas.style.height = `${Math.round(nextBase * nextScale)}px`;
        if (this.holdCanvas) {
            this.holdCanvas.style.width = `${Math.round(nextBase * nextScale)}px`;
            this.holdCanvas.style.height = `${Math.round(nextBase * nextScale)}px`;
        }
        if (this.mobileNextCanvas) {
            const mobileSize = isMobileLayout ? 56 : 64;
            this.mobileNextCanvas.style.width = `${mobileSize}px`;
            this.mobileNextCanvas.style.height = `${mobileSize}px`;
        }
    }

    refillBag() {
        const pieces = Object.keys(TETROMINOES);
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        this.bag.push(...pieces);
    }

    drawFromBag() {
        if (this.bag.length === 0) {
            this.refillBag();
        }
        return this.bag.pop();
    }

    createRandomPiece() {
        const type = this.drawFromBag();
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
        this.canHold = true;

        if (this.collides(this.currentPiece)) {
            this.gameOver();
        }
    }

    holdCurrentPiece() {
        if (!this.gameActive || this.gamePaused || !this.currentPiece || !this.canHold) return;

        this.playSfx('hold');
        const nextCurrent = {
            type: this.currentPiece.type,
            rotation: 0,
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0,
            data: TETROMINOES[this.currentPiece.type]
        };

        if (!this.holdPiece) {
            this.holdPiece = { ...nextCurrent };
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.createRandomPiece();
        } else {
            const swap = this.holdPiece.type;
            this.holdPiece = { ...nextCurrent };
            this.currentPiece = {
                type: swap,
                rotation: 0,
                x: Math.floor(BOARD_WIDTH / 2) - 1,
                y: 0,
                data: TETROMINOES[swap]
            };
        }

        this.canHold = false;
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
        let distance = 0;
        while (this.softDrop(piece)) {
            distance++;
        }
        if (distance > 0) {
            this.score += distance * HARD_DROP_BONUS;
            this.shakeFrames = 4;
            this.playSfx('drop');
        }
        this.placePiece(piece);
        this.spawnNewPiece();
    }

    placePiece(piece) {
        this.moves++;
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
            this.lines += linesCleared;
            this.addScore(linesCleared);
            this.clearAnimationFrame = 0;
            this.shakeFrames = Math.max(this.shakeFrames, 6);
            this.playSfx('clear');

            if (linesCleared === 4) {
                this.showFxMessage('TETRIS!', '#ffef33', 900);
            } else {
                this.showFxMessage(`${linesCleared} LINE${linesCleared > 1 ? 'S' : ''}`, '#00ffcc', 650);
            }
            // Don't clear immediately, wait for animation
        } else {
            this.combo = -1;
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

        if (linesCleared > 0) {
            this.combo++;
            if (this.combo > 0) {
                points += this.combo * 50 * this.level;
                this.showFxMessage(`COMBO x${this.combo + 1}`, '#ff66ff', 700);
            }

            if (linesCleared === 4) {
                if (this.backToBack) {
                    points = Math.floor(points * 1.5);
                    this.showFxMessage('BACK-TO-BACK!', '#ff8844', 800);
                }
                this.backToBack = true;
            } else {
                this.backToBack = false;
            }
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
                    this.startGame();
                }
            } else if (this.gamePaused) {
                if (key === 'p') {
                    this.togglePause();
                }
            } else {
                if (event.key === 'ArrowUp') {
                    if (this.rotate(this.currentPiece)) {
                        this.playSfx('rotate');
                    }
                }
                if (event.key === ' ') {
                    event.preventDefault();
                    this.hardDrop(this.currentPiece);
                }
                if (key === 'c') {
                    this.holdCurrentPiece();
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
            this.fastDropActive = false;
            this.pauseOverlay.classList.remove('hidden');
            this.playSfx('pause');
            if (this.pauseBtn) {
                this.pauseBtn.textContent = 'RESUME';
            }
        } else {
            this.pauseOverlay.classList.add('hidden');
            this.playSfx('pause');
            if (this.pauseBtn) {
                this.pauseBtn.textContent = 'PAUSE';
            }
        }
    }

    gameOver() {
        this.gameActive = false;
        this.fastDropActive = false;
        this.playSfx('gameover');
        this.showFxMessage('GAME OVER', '#ff3366', 900);
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
        const gravity = GRAVITY_BASE + (this.level - 1) * 0.003;
        const gravityMultiplier = this.fastDropActive ? 6 : 1;
        this.dropCounter += gravity * gravityMultiplier;

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
        this.ctx.save();
        if (this.shakeFrames > 0) {
            const shakeX = (Math.random() - 0.5) * 6;
            const shakeY = (Math.random() - 0.5) * 6;
            this.ctx.translate(shakeX, shakeY);
            this.shakeFrames--;
        }

        // Clear and render blue playfield background.
        this.drawPlayfieldBackground();

        // Draw board
        this.drawBoard();

        // Draw ghost piece
        if (this.gameActive && this.currentPiece) {
            this.drawGhostPiece(this.currentPiece);
        }

        // Draw current piece
        if (this.gameActive) {
            this.drawPiece(this.currentPiece);
        }

        this.ctx.restore();

        // Draw next piece preview
        this.drawNextPreview();
        this.drawHoldPreview();
    }

    drawGhostPiece(piece) {
        const ghost = {
            ...piece,
            x: piece.x,
            y: piece.y,
            rotation: piece.rotation,
            data: piece.data
        };

        while (true) {
            ghost.y++;
            if (this.collides(ghost)) {
                ghost.y--;
                break;
            }
        }

        if (ghost.y === piece.y) return;

        const shape = ghost.data.rotations[ghost.rotation];
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;
                const gx = ghost.x + x;
                const gy = ghost.y + y;
                if (gy >= 0) {
                    this.drawStyledBlock(this.ctx, gx * BLOCK_SIZE, gy * BLOCK_SIZE, BLOCK_SIZE, ghost.data.color, 0.32);
                }
            }
        }
    }

    hexToRgb(hex) {
        const normalized = String(hex || '').replace('#', '');
        if (normalized.length !== 6) {
            return { r: 255, g: 255, b: 255 };
        }
        return {
            r: parseInt(normalized.slice(0, 2), 16),
            g: parseInt(normalized.slice(2, 4), 16),
            b: parseInt(normalized.slice(4, 6), 16)
        };
    }

    clampColor(value) {
        return Math.max(0, Math.min(255, Math.round(value)));
    }

    shiftColor(hex, amount) {
        const rgb = this.hexToRgb(hex);
        return `rgb(${this.clampColor(rgb.r + amount)}, ${this.clampColor(rgb.g + amount)}, ${this.clampColor(rgb.b + amount)})`;
    }

    drawStyledBlock(targetCtx, x, y, size, color, alpha = 1) {
        const blockX = x + 1;
        const blockY = y + 1;
        const blockSize = Math.max(4, size - 2);

        targetCtx.save();
        targetCtx.globalAlpha = alpha;

        // Main tile fill with gentle top-to-bottom ramp.
        const fillGradient = targetCtx.createLinearGradient(blockX, blockY, blockX, blockY + blockSize);
        fillGradient.addColorStop(0, this.shiftColor(color, 24));
        fillGradient.addColorStop(0.55, color);
        fillGradient.addColorStop(1, this.shiftColor(color, -30));
        targetCtx.fillStyle = fillGradient;
        targetCtx.fillRect(blockX, blockY, blockSize, blockSize);

        // Pixel-style highlight on top and left edges.
        targetCtx.fillStyle = 'rgba(255, 255, 255, 0.32)';
        targetCtx.fillRect(blockX + 1, blockY + 1, Math.max(1, blockSize - 2), 2);
        targetCtx.fillRect(blockX + 1, blockY + 1, 2, Math.max(1, blockSize - 2));

        // Bottom and right shadow for depth.
        targetCtx.fillStyle = 'rgba(0, 0, 0, 0.24)';
        targetCtx.fillRect(
            blockX + 1,
            blockY + blockSize - 2,
            Math.max(1, blockSize - 1),
            2
        );
        targetCtx.fillRect(blockX + blockSize - 2, blockY + 1, 2, Math.max(1, blockSize - 1));

        // Strong border so each cell stays visually distinct.
        targetCtx.strokeStyle = 'rgba(7, 20, 80, 0.95)';
        targetCtx.lineWidth = 1;
        targetCtx.strokeRect(blockX + 0.5, blockY + 0.5, blockSize - 1, blockSize - 1);

        targetCtx.restore();
    }

    drawBoard() {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawStyledBlock(this.ctx, x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, this.board[y][x]);
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
                    this.drawStyledBlock(this.ctx, boardX * BLOCK_SIZE, boardY * BLOCK_SIZE, BLOCK_SIZE, piece.data.color);
                }
            }
        }
    }

    drawNextPreview() {
        this.drawPreviewPiece(this.nextCtx, this.nextPiece);
        if (this.mobileNextCtx) {
            this.drawPreviewPiece(this.mobileNextCtx, this.nextPiece);
        }
    }

    drawHoldPreview() {
        if (!this.holdCtx) return;
        this.drawPreviewPiece(this.holdCtx, this.holdPiece);
    }

    drawPreviewPiece(targetCtx, piece) {
        const previewWidth = targetCtx.canvas.width;
        const previewHeight = targetCtx.canvas.height;
        targetCtx.fillStyle = '#102a88';
        targetCtx.fillRect(0, 0, previewWidth, previewHeight);
        if (!piece) return;

        const shape = piece.data.rotations[piece.rotation];
        const blockSize = Math.max(12, Math.floor(Math.min(previewWidth, previewHeight) / 6));
        const offsetX = (previewWidth - shape[0].length * blockSize) / 2;
        const offsetY = (previewHeight - shape.length * blockSize) / 2;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;

                targetCtx.fillStyle = piece.data.color;
                const drawX = offsetX + x * blockSize;
                const drawY = offsetY + y * blockSize;
                this.drawStyledBlock(targetCtx, drawX, drawY, blockSize, piece.data.color);
            }
        }
    }

    updateUI() {
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('levelDisplay').textContent = this.level;
        document.getElementById('linesDisplay').textContent = this.lines;

        const movesEl = document.getElementById('movesDisplay');
        if (movesEl) {
            movesEl.textContent = this.moves;
        }

        const targetEl = document.getElementById('targetDisplay');
        if (targetEl) {
            const mod = this.lines % 10;
            const remain = mod === 0 ? 10 : 10 - mod;
            targetEl.textContent = `CLEAR ${remain} LINES`;
        }
    }

    drawPlayfieldBackground() {
        this.ctx.fillStyle = '#0b257e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const evenCell = (x + y) % 2 === 0;
                this.ctx.fillStyle = evenCell ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.015)';
                this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
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
