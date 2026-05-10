// ============================================
// TETRIS GAME ENGINE
// ============================================

// Game Constants
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 24;
const BLOCK_SIZE = 30;
const GRAVITY_BASE = 0.01; // Base gravity speed (lower = slower)
const MOVEMENT_DELAY = 5; // Frames between left/right/down movements
const HARD_DROP_BONUS = 2;
const FAST_DROP_STEPS = 2;
const LOCK_DELAY_MS = 800;
const BGM_BEAT_SECONDS = 0.34;
const LEADERBOARD_STORAGE_KEY = 'tetrisCompetitionScoresV1';

// Relaxed ambient loop (generated with Web Audio, no external asset).
const BGM_MELODY = [
    440.0, 493.88, 523.25, 587.33,
    523.25, 493.88, 440.0, 392.0,
    349.23, 392.0, 440.0, 493.88,
    440.0, 392.0, 349.23, 0,
    392.0, 440.0, 493.88, 523.25,
    493.88, 440.0, 392.0, 349.23,
    329.63, 349.23, 392.0, 440.0,
    392.0, 349.23, 329.63, 0
];

const BGM_BASS = [
    110.0, 0, 110.0, 0,
    98.0, 0, 98.0, 0,
    87.31, 0, 87.31, 0,
    82.41, 0, 82.41, 0,
    98.0, 0, 98.0, 0,
    110.0, 0, 110.0, 0,
    87.31, 0, 87.31, 0,
    73.42, 0, 73.42, 0
];

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
        this.lockDelayActive = false;
        this.lockDelayStart = 0;
        this.fastDropActive = false;
        this.fastDropDisabledForPiece = false;
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
        this.shadowEnabled = true;
        this.audioCtx = null;
        this.bgmIntervalId = null;
        this.bgmStep = 0;
        this.fxTimeout = null;
        this.competitionMode = false;
        this.currentPlayerName = '';
        this.lastEntryView = 'menu';
        this.competitionScores = [];
        this.baseCanvasWidth = BOARD_WIDTH * BLOCK_SIZE;
        this.baseCanvasHeight = BOARD_HEIGHT * BLOCK_SIZE;
        this.loopStarted = false;
        this.swipeState = {
            tracking: false,
            startX: 0,
            startY: 0,
            startTime: 0,
            pointerId: null,
            holdTimeoutId: null,
            holdActivated: false
        };

        // Input tracking
        this.keys = {};
        this.lastKeyPress = {};

        // Get canvas contexts
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Keep internal canvas resolution aligned with board dimensions.
        this.canvas.width = this.baseCanvasWidth;
        this.canvas.height = this.baseCanvasHeight;
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
        this.competitionSection = document.getElementById('competitionSection');
        this.gameSection = document.getElementById('gameSection');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.competitionBtn = document.getElementById('competitionBtn');
        this.competitionStartBtn = document.getElementById('competitionStartBtn');
        this.competitionBackBtn = document.getElementById('competitionBackBtn');
        this.competitionNameInput = document.getElementById('competitionNameInput');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.shadowBtn = document.getElementById('shadowBtn');
        this.holdBtn = document.getElementById('holdBtn');
        this.soundBtn = document.getElementById('soundBtn');
        this.endBtn = document.getElementById('endBtn');
        this.topScoresList = document.getElementById('topScoresList');
        this.latestScoresList = document.getElementById('latestScoresList');

        this.loadCompetitionScores();
        this.renderCompetitionBoards();

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
        this.updateShadowButtonLabel();
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
        this.lockDelayActive = false;
        this.lockDelayStart = 0;
        this.fastDropActive = false;
        this.fastDropDisabledForPiece = false;
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
        this.updateShadowButtonLabel();

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
            this.startGameBtn.addEventListener('click', () => {
                this.competitionMode = false;
                this.currentPlayerName = '';
                this.lastEntryView = 'menu';
                this.startGame();
            });
        }

        if (this.competitionBtn) {
            this.competitionBtn.addEventListener('click', () => this.showCompetitionSection());
        }

        if (this.competitionStartBtn) {
            this.competitionStartBtn.addEventListener('click', () => this.startCompetitionGame());
        }

        if (this.competitionBackBtn) {
            this.competitionBackBtn.addEventListener('click', () => this.showMainMenu());
        }

        if (this.competitionNameInput) {
            this.competitionNameInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.startCompetitionGame();
                }
            });
        }

        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => {
                if (this.gameActive) {
                    this.togglePause();
                }
            });
        }

        if (this.shadowBtn) {
            this.shadowBtn.addEventListener('click', () => {
                this.shadowEnabled = !this.shadowEnabled;
                this.updateShadowButtonLabel();
                this.playSfx('rotate');
            });
        }

        if (this.soundBtn) {
            this.soundBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                this.soundBtn.textContent = this.soundEnabled ? 'SOUND ON' : 'SOUND OFF';
                if (this.soundEnabled) {
                    this.ensureAudioReady();
                    this.playSfx('rotate');
                }
                this.updateBackgroundMusicState();
            });
        }

        if (this.endBtn) {
            this.endBtn.addEventListener('click', () => this.endToMainMenu());
        }
    }

    updateShadowButtonLabel() {
        if (this.shadowBtn) {
            this.shadowBtn.textContent = this.shadowEnabled ? 'SHADOW ON' : 'SHADOW OFF';
        }
    }

    setVisibleSection(viewName) {
        const isMenu = viewName === 'menu';
        const isCompetition = viewName === 'competition';
        const isGame = viewName === 'game';

        document.body.classList.toggle('in-game', isGame);

        if (this.mainMenu) {
            this.mainMenu.hidden = !isMenu;
            this.mainMenu.classList.toggle('hidden-view', !isMenu);
            this.mainMenu.style.display = isMenu ? 'flex' : 'none';
        }

        if (this.competitionSection) {
            this.competitionSection.hidden = !isCompetition;
            this.competitionSection.classList.toggle('hidden-view', !isCompetition);
            this.competitionSection.style.display = isCompetition ? 'flex' : 'none';
        }

        if (this.gameSection) {
            this.gameSection.hidden = !isGame;
            this.gameSection.classList.toggle('hidden-view', !isGame);
            this.gameSection.style.display = isGame ? 'flex' : 'none';
        }

        window.scrollTo(0, 0);
    }

    showMainMenu() {
        this.setVisibleSection('menu');
        this.lastEntryView = 'menu';
        this.resizeCanvases();
    }

    showCompetitionSection() {
        this.setVisibleSection('competition');
        this.lastEntryView = 'competition';
        this.renderCompetitionBoards();
        if (this.competitionNameInput) {
            this.competitionNameInput.focus();
        }
        this.resizeCanvases();
    }

    showGameSection() {
        this.setVisibleSection('game');
        requestAnimationFrame(() => this.resizeCanvases());
    }

    startGame() {
        this.ensureAudioReady();
        this.showGameSection();
        this.init();
        this.updateBackgroundMusicState();
        this.playSfx('start');
    }

    startCompetitionGame() {
        const rawName = this.competitionNameInput ? this.competitionNameInput.value : '';
        const sanitized = (rawName || '').trim().replace(/\s+/g, ' ');
        if (this.competitionNameInput) {
            this.competitionNameInput.blur();
        }
        this.currentPlayerName = sanitized || 'PLAYER';
        this.competitionMode = true;
        this.lastEntryView = 'competition';
        this.startGame();
    }

    endToMainMenu() {
        this.gameActive = false;
        this.gamePaused = false;
        this.fastDropActive = false;
        this.fastDropDisabledForPiece = false;
        this.keys = {};
        this.lastKeyPress = {};
        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        if (this.pauseBtn) {
            this.pauseBtn.textContent = 'PAUSE';
        }
        this.showFxMessage('', '#00ffcc', 0);
        this.updateBackgroundMusicState();
        if (this.lastEntryView === 'competition') {
            this.showCompetitionSection();
        } else {
            this.showMainMenu();
        }
    }

    loadCompetitionScores() {
        try {
            const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            this.competitionScores = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            this.competitionScores = [];
        }
    }

    saveCompetitionScores() {
        localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(this.competitionScores));
    }

    recordCompetitionScore() {
        if (!this.competitionMode) return;
        const name = (this.currentPlayerName || 'PLAYER').slice(0, 20);
        const entry = {
            name,
            score: this.score,
            level: this.level,
            lines: this.lines,
            ts: Date.now()
        };
        this.competitionScores.push(entry);
        // Keep history bounded to avoid unbounded localStorage growth.
        if (this.competitionScores.length > 200) {
            this.competitionScores = this.competitionScores.slice(-200);
        }
        this.saveCompetitionScores();
        this.renderCompetitionBoards();
    }

    setLeaderboardContent(listEl, entries) {
        if (!listEl) return;
        listEl.innerHTML = '';

        if (!entries.length) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'leaderboard-empty';
            emptyItem.textContent = 'NO SCORES YET';
            listEl.appendChild(emptyItem);
            return;
        }

        entries.forEach((entry) => {
            const item = document.createElement('li');
            item.className = 'leaderboard-item';
            item.textContent = `${entry.name}  ${entry.score}`;
            listEl.appendChild(item);
        });
    }

    renderCompetitionBoards() {
        const byScore = [...this.competitionScores]
            .sort((a, b) => (b.score - a.score) || (a.ts - b.ts))
            .slice(0, 10);
        const latest = [...this.competitionScores]
            .sort((a, b) => b.ts - a.ts)
            .slice(0, 10);

        this.setLeaderboardContent(this.topScoresList, byScore);
        this.setLeaderboardContent(this.latestScoresList, latest);
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

    playTone(freq, duration, type = 'square', gain = 0.03, when = 0) {
        if (!this.audioCtx || this.audioCtx.state !== 'running' || !freq) return;
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + when);
        g.gain.setValueAtTime(gain, now + when);
        g.gain.exponentialRampToValueAtTime(0.0001, now + when + duration);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now + when);
        osc.stop(now + when + duration);
    }

    startBackgroundMusic() {
        if (this.bgmIntervalId) return;
        const tick = () => {
            if (!this.soundEnabled || !this.gameActive || this.gamePaused) return;
            if (!this.audioCtx || this.audioCtx.state !== 'running') return;

            const step = this.bgmStep % BGM_MELODY.length;
            const melodyFreq = BGM_MELODY[step];
            const bassFreq = BGM_BASS[step % BGM_BASS.length];

            if (melodyFreq > 0) {
                this.playTone(melodyFreq, BGM_BEAT_SECONDS * 0.92, 'sine', 0.014, 0);
            }
            if (bassFreq > 0) {
                this.playTone(bassFreq, BGM_BEAT_SECONDS * 0.9, 'triangle', 0.01, 0);
            }

            this.bgmStep++;
        };

        tick();
        this.bgmIntervalId = setInterval(tick, BGM_BEAT_SECONDS * 1000);
    }

    stopBackgroundMusic() {
        if (this.bgmIntervalId) {
            clearInterval(this.bgmIntervalId);
            this.bgmIntervalId = null;
        }
    }

    updateBackgroundMusicState() {
        const shouldPlay = this.soundEnabled && this.gameActive && !this.gamePaused;
        if (!shouldPlay) {
            this.stopBackgroundMusic();
            return;
        }
        this.ensureAudioReady();
        this.startBackgroundMusic();
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
            this.swipeState.holdActivated = false;

            // Set up 2-second hold timer to flip block
            if (this.gameActive && !this.gamePaused && this.currentPiece) {
                this.swipeState.holdTimeoutId = setTimeout(() => {
                    if (this.swipeState.tracking && this.gameActive && !this.gamePaused && this.currentPiece) {
                        this.swipeState.holdActivated = true;
                        // Flip: rotate 180 degrees by advancing 2 rotations
                        const oldRotation = this.currentPiece.rotation;
                        this.currentPiece.rotation = (this.currentPiece.rotation + 2) % this.currentPiece.data.rotations.length;
                        
                        // Check for collision after 180-degree rotation
                        if (this.collides(this.currentPiece)) {
                            // Revert if collision
                            this.currentPiece.rotation = oldRotation;
                        } else {
                            // Success: refresh lock delay and show feedback
                            this.refreshLockDelayFromAction(this.currentPiece);
                            this.playSfx('rotate');
                            this.showFxMessage('FLIP', '#ffff00', 400);
                        }
                    }
                }, 2000);
            }
        };

        const updateSwipeMove = (x, y) => {
            if (!this.swipeState.tracking || !this.gameActive || this.gamePaused || !this.currentPiece) {
                this.fastDropActive = false;
                return;
            }

            const dx = x - this.swipeState.startX;
            const dy = y - this.swipeState.startY;
            const movementThreshold = Math.max(20, Math.round(this.canvas.clientWidth * 0.06));

            // Cancel hold if user moves finger significantly
            if (!this.swipeState.holdActivated && (Math.abs(dx) > movementThreshold || Math.abs(dy) > movementThreshold)) {
                if (this.swipeState.holdTimeoutId) {
                    clearTimeout(this.swipeState.holdTimeoutId);
                    this.swipeState.holdTimeoutId = null;
                }
            }

            const slideDownThreshold = Math.max(14, Math.round(this.canvas.clientHeight * 0.03));
            if (!this.fastDropDisabledForPiece && dy > slideDownThreshold && Math.abs(dy) > Math.abs(dx)) {
                this.fastDropActive = true;
            }
            if (dy < -slideDownThreshold && Math.abs(dy) > Math.abs(dx)) {
                this.fastDropActive = false;
                this.fastDropDisabledForPiece = false;
            }
        };

        const endSwipe = (x, y) => {
            if (!this.swipeState.tracking) return;
            this.swipeState.tracking = false;
            this.swipeState.pointerId = null;

            // Cancel hold timer if still pending
            if (this.swipeState.holdTimeoutId) {
                clearTimeout(this.swipeState.holdTimeoutId);
                this.swipeState.holdTimeoutId = null;
            }

            // If hold was already triggered, skip normal swipe logic
            if (this.swipeState.holdActivated) {
                this.swipeState.holdActivated = false;
                return;
            }

            if (!this.gameActive || this.gamePaused || !this.currentPiece) return;

            const dx = x - this.swipeState.startX;
            const dy = y - this.swipeState.startY;
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);
            const elapsed = performance.now() - this.swipeState.startTime;

            const swipeThreshold = Math.max(24, Math.round(this.canvas.clientWidth * 0.08));
            const tapThreshold = Math.max(22, Math.round(this.canvas.clientWidth * 0.06));

            if (this.fastDropActive) {
                return;
            }

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
            this.fastDropDisabledForPiece = false;
        }, { passive: true });

        this.canvas.addEventListener('pointercancel', () => {
            this.swipeState.tracking = false;
            this.swipeState.pointerId = null;
            this.swipeState.holdActivated = false;
            if (this.swipeState.holdTimeoutId) {
                clearTimeout(this.swipeState.holdTimeoutId);
                this.swipeState.holdTimeoutId = null;
            }
            this.fastDropDisabledForPiece = false;
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
            this.fastDropDisabledForPiece = false;
        }, { passive: false });

        this.canvas.addEventListener('touchcancel', () => {
            this.swipeState.tracking = false;
            this.swipeState.pointerId = null;
            this.swipeState.holdActivated = false;
            if (this.swipeState.holdTimeoutId) {
                clearTimeout(this.swipeState.holdTimeoutId);
                this.swipeState.holdTimeoutId = null;
            }
            this.fastDropDisabledForPiece = false;
        }, { passive: true });
    }

    resizeCanvases() {
        this.updateViewportCssVars();
        if (this.canvas.width !== this.baseCanvasWidth || this.canvas.height !== this.baseCanvasHeight) {
            this.canvas.width = this.baseCanvasWidth;
            this.canvas.height = this.baseCanvasHeight;
        }
        const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        const isMobileLayout = viewportWidth <= 900 || isTouchDevice;
        const desktopSidePanelWidth = 240;
        const horizontalPadding = isMobileLayout ? 8 : 80;
        const mobileBottomReserve = isMobileLayout ? Math.max(44, Math.round(viewportHeight * 0.08)) : 0;

        let topUiHeight = 0;
        if (isMobileLayout && this.gameSection && !this.gameSection.classList.contains('hidden-view')) {
            const mobileHud = this.gameSection.querySelector('.mobile-hud');
            const gameActions = this.gameSection.querySelector('.game-actions');
            const fxMessage = this.fxMessageEl;
            topUiHeight =
                (mobileHud ? mobileHud.offsetHeight : 0) +
                (gameActions ? gameActions.offsetHeight : 0) +
                (fxMessage && fxMessage.classList.contains('active') ? fxMessage.offsetHeight : 0) +
                10;
        }

        const verticalPadding = isMobileLayout ? topUiHeight + 12 : 120;
        const availableWidth = isMobileLayout
            ? viewportWidth - horizontalPadding
            : viewportWidth - horizontalPadding - desktopSidePanelWidth;
        const availableHeight = isMobileLayout
            ? Math.max(120, viewportHeight - verticalPadding - mobileBottomReserve)
            : viewportHeight - 120;

        const scaleLimit = isMobileLayout ? 1 : 1.25;
        const minScale = isMobileLayout ? 0.2 : 0.45;
        const tunedScale = Math.max(
            minScale,
            Math.min(
                scaleLimit,
                Math.min(availableWidth / this.baseCanvasWidth, availableHeight / this.baseCanvasHeight)
            )
        );
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
            visualOffset: 0,
            data: TETROMINOES[type]
        };
    }

    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createRandomPiece();
        this.canHold = true;
        this.lockDelayActive = false;
        this.lockDelayStart = 0;
        this.fastDropActive = false;
        this.fastDropDisabledForPiece = true;
        this.currentPiece.visualOffset = 0;

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
            visualOffset: 0,
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
                visualOffset: 0,
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
        this.refreshLockDelayFromAction(piece);
        return true;
    }

    moveLeft(piece) {
        piece.x--;
        if (this.collides(piece)) {
            piece.x++;
            return false;
        }
        this.refreshLockDelayFromAction(piece);
        return true;
    }

    moveRight(piece) {
        piece.x++;
        if (this.collides(piece)) {
            piece.x--;
            return false;
        }
        this.refreshLockDelayFromAction(piece);
        return true;
    }

    softDrop(piece) {
        piece.y++;
        if (this.collides(piece)) {
            piece.y--;
            return false;
        }
        if (piece === this.currentPiece) {
            this.lockDelayActive = false;
            this.lockDelayStart = 0;
        }
        return true;
    }

    isPieceGrounded(piece) {
        if (!piece) return false;
        piece.y++;
        const grounded = this.collides(piece);
        piece.y--;
        return grounded;
    }

    refreshLockDelayFromAction(piece) {
        if (piece !== this.currentPiece) return;
        if (this.isPieceGrounded(piece)) {
            this.lockDelayActive = true;
            this.lockDelayStart = performance.now();
        }
    }

    hardDrop(piece) {
        let distance = 0;
        while (this.softDrop(piece)) {
            distance++;
        }
        piece.visualOffset = 0;
        if (distance > 0) {
            this.score += distance * HARD_DROP_BONUS;
            this.shakeFrames = 4;
            this.playSfx('drop');
        }
        this.placePiece(piece);
        this.spawnNewPiece();
    }

    placePiece(piece) {
        piece.visualOffset = 0;
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

        this.updateBackgroundMusicState();
    }

    gameOver() {
        this.gameActive = false;
        this.fastDropActive = false;
        this.updateBackgroundMusicState();
        this.recordCompetitionScore();
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
                }
                for (let i = 0; i < rowsToRemove.length; i++) {
                    this.board.unshift(new Array(BOARD_WIDTH).fill(null));
                }
                this.clearingRows.clear();
            }
            // Don't process gravity or movement during animation
            return;
        }

        const now = performance.now();
        if (this.currentPiece && this.isPieceGrounded(this.currentPiece)) {
            if (!this.lockDelayActive) {
                this.lockDelayActive = true;
                this.lockDelayStart = now;
                this.currentPiece.visualOffset = 0;
            } else if (now - this.lockDelayStart >= LOCK_DELAY_MS) {
                this.placePiece(this.currentPiece);
                this.spawnNewPiece();
                return;
            }
        }

        // Smooth gravity: accumulate visual offset instead of discrete steps
        // Skip gravity if lock delay is active (piece is waiting to lock)
        if (!this.lockDelayActive) {
            const gravity = GRAVITY_BASE + (this.level - 1) * 0.01;
            this.currentPiece.visualOffset += gravity;
        }

        // Move grid position when visual offset accumulates to a full block
        while (this.currentPiece.visualOffset >= 1) {
            if (!this.softDrop(this.currentPiece)) {
                // Collision detected: clamp visualOffset and activate lock delay
                this.currentPiece.visualOffset = 0;
                if (!this.lockDelayActive) {
                    this.lockDelayActive = true;
                    this.lockDelayStart = now;
                }
                break;
            }
            this.currentPiece.visualOffset -= 1;
        }

        // Drag-down fast fall affects only the current piece.
        if (this.fastDropActive && this.currentPiece) {
            this.currentPiece.visualOffset += FAST_DROP_STEPS * 0.25;
            while (this.currentPiece.visualOffset >= 1) {
                if (!this.softDrop(this.currentPiece)) {
                    this.currentPiece.visualOffset = 0;
                    if (!this.lockDelayActive) {
                        this.lockDelayActive = true;
                        this.lockDelayStart = now;
                    }
                    // Stop drag-fast mode once grounded so lock-delay movement stays available.
                    this.fastDropActive = false;
                    this.fastDropDisabledForPiece = true;
                    break;
                }
                this.currentPiece.visualOffset -= 1;
            }
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
        if (this.gameActive && this.currentPiece && this.shadowEnabled) {
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
            data: piece.data,
            visualOffset: 0  // Ghost never uses animation offset
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
        const visualY = ghost.y;  // Ghost renders at integer grid position
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;
                const gx = ghost.x + x;
                const gy = visualY + y;
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

        // Main tile fill with diagonal ramp to feel more volumetric.
        const fillGradient = targetCtx.createLinearGradient(blockX, blockY, blockX + blockSize, blockY + blockSize);
        fillGradient.addColorStop(0, this.shiftColor(color, 34));
        fillGradient.addColorStop(0.55, color);
        fillGradient.addColorStop(1, this.shiftColor(color, -36));
        targetCtx.fillStyle = fillGradient;
        targetCtx.fillRect(blockX, blockY, blockSize, blockSize);

        // Top cap highlight.
        const capHeight = Math.max(2, Math.floor(blockSize * 0.18));
        const capGradient = targetCtx.createLinearGradient(blockX, blockY, blockX, blockY + capHeight + 2);
        capGradient.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
        capGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        targetCtx.fillStyle = capGradient;
        targetCtx.fillRect(blockX + 1, blockY + 1, Math.max(1, blockSize - 2), capHeight);

        // Left bevel highlight and right shadow to create raised edges.
        targetCtx.fillStyle = 'rgba(255, 255, 255, 0.24)';
        targetCtx.fillRect(blockX + 1, blockY + 1, 2, Math.max(1, blockSize - 2));

        targetCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        targetCtx.fillRect(blockX + blockSize - 3, blockY + 1, 2, Math.max(1, blockSize - 2));
        targetCtx.fillRect(
            blockX + 1,
            blockY + blockSize - 3,
            Math.max(1, blockSize - 1),
            2
        );

        // Inner vignette keeps each cube readable on bright boards.
        targetCtx.strokeStyle = 'rgba(10, 24, 84, 0.28)';
        targetCtx.lineWidth = 1;
        targetCtx.strokeRect(blockX + 1.5, blockY + 1.5, blockSize - 3, blockSize - 3);

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
        const visualY = piece.y + (piece.visualOffset || 0);

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;

                const boardX = piece.x + x;
                const boardY = visualY + y;

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

        const mobileScoreEl = document.getElementById('mobileScoreDisplay');
        if (mobileScoreEl) {
            mobileScoreEl.textContent = this.score;
        }

        const mobileLevelEl = document.getElementById('mobileLevelDisplay');
        if (mobileLevelEl) {
            mobileLevelEl.textContent = this.level;
        }

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
        const baseGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        baseGradient.addColorStop(0, '#1a45b6');
        baseGradient.addColorStop(0.52, '#0c2b88');
        baseGradient.addColorStop(1, '#081f67');
        this.ctx.fillStyle = baseGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const highlightGradient = this.ctx.createRadialGradient(
            this.canvas.width * 0.25,
            this.canvas.height * 0.12,
            10,
            this.canvas.width * 0.25,
            this.canvas.height * 0.12,
            this.canvas.height * 0.75
        );
        highlightGradient.addColorStop(0, 'rgba(178, 214, 255, 0.22)');
        highlightGradient.addColorStop(1, 'rgba(178, 214, 255, 0)');
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const evenCell = (x + y) % 2 === 0;
                this.ctx.fillStyle = evenCell ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 10, 40, 0.05)';
                this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

                // Cell-level bevel hint for a subtle recessed playfield texture.
                this.ctx.strokeStyle = 'rgba(173, 207, 255, 0.04)';
                this.ctx.strokeRect(x * BLOCK_SIZE + 0.5, y * BLOCK_SIZE + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        }

        const vignette = this.ctx.createRadialGradient(
            this.canvas.width * 0.5,
            this.canvas.height * 0.55,
            this.canvas.width * 0.35,
            this.canvas.width * 0.5,
            this.canvas.height * 0.55,
            this.canvas.width * 0.86
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 8, 40, 0.34)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    gameLoop() {
        this.update();
        this.draw();
        this.updateUI();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize correctly for both static and dynamic script loading.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Game();
    });
} else {
    new Game();
}
