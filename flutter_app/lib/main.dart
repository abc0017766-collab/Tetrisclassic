import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const int boardWidth = 12;
const int boardHeight = 24;
const double gravityBase = 0.01;
const int hardDropBonus = 2;
const int fastDropSteps = 2;
const int lockDelayMs = 800;
const int clearAnimationDuration = 8;
const String leaderboardStorageKey = 'tetrisCompetitionScoresV1';
const double bgmBeatSeconds = 0.34;

const List<double> bgmMelody = [
  440.0,
  493.88,
  523.25,
  587.33,
  523.25,
  493.88,
  440.0,
  392.0,
  349.23,
  392.0,
  440.0,
  493.88,
  440.0,
  392.0,
  349.23,
  0,
  392.0,
  440.0,
  493.88,
  523.25,
  493.88,
  440.0,
  392.0,
  349.23,
  329.63,
  349.23,
  392.0,
  440.0,
  392.0,
  349.23,
  329.63,
  0,
];

const List<double> bgmBass = [
  110.0,
  0,
  110.0,
  0,
  98.0,
  0,
  98.0,
  0,
  87.31,
  0,
  87.31,
  0,
  82.41,
  0,
  82.41,
  0,
  98.0,
  0,
  98.0,
  0,
  110.0,
  0,
  110.0,
  0,
  87.31,
  0,
  87.31,
  0,
  73.42,
  0,
  73.42,
  0,
];

const Map<String, Color> pieceColors = {
  'I': Color(0xFF00FFFF),
  'O': Color(0xFFFFFF00),
  'T': Color(0xFFFF00FF),
  'S': Color(0xFF00FF00),
  'Z': Color(0xFFFF0000),
  'J': Color(0xFF0000FF),
  'L': Color(0xFFFF8800),
};

const Map<String, List<List<List<int>>>> tetrominoes = {
  'I': [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  'O': [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  'T': [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  'S': [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  ],
  'Z': [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  ],
  'J': [
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
  ],
  'L': [
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  ],
};

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TetrisFlutterApp());
}

class TetrisFlutterApp extends StatelessWidget {
  const TetrisFlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        fontFamily: 'Courier',
      ),
      home: const TetrisHomePage(),
    );
  }
}

enum AppView { menu, competition, game }

class TetrisHomePage extends StatefulWidget {
  const TetrisHomePage({super.key});

  @override
  State<TetrisHomePage> createState() => _TetrisHomePageState();
}

class _TetrisHomePageState extends State<TetrisHomePage> {
  final TetrisEngine engine = TetrisEngine();
  final TextEditingController nameController = TextEditingController();

  AppView view = AppView.menu;
  Offset? panStart;
  Offset? panCurrent;
  DateTime? panStartTime;

  @override
  void initState() {
    super.initState();
    engine.addListener(_onEngineChange);
  }

  @override
  void dispose() {
    engine.removeListener(_onEngineChange);
    engine.dispose();
    nameController.dispose();
    super.dispose();
  }

  void _onEngineChange() {
    if (mounted) setState(() {});
  }

  void _startGame({required bool competitionMode}) {
    if (competitionMode) {
      final name = nameController.text.trim().replaceAll(RegExp(r'\s+'), ' ');
      engine.startCompetitionGame(name.isEmpty ? 'PLAYER' : name);
    } else {
      engine.startNormalGame();
    }
    setState(() => view = AppView.game);
  }

  void _endToMenu() {
    engine.endToMainMenu();
    setState(() => view = engine.lastEntryView == 'competition' ? AppView.competition : AppView.menu);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -1),
            radius: 1.25,
            colors: [Color(0xFF1F3FB0), Color(0xFF0E1F79), Color(0xFF07104B)],
            stops: [0.0, 0.35, 1.0],
          ),
        ),
        child: SafeArea(
          child: switch (view) {
            AppView.menu => _buildMenu(),
            AppView.competition => _buildCompetition(),
            AppView.game => _buildGame(),
          },
        ),
      ),
    );
  }

  Widget _buildMenu() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('TETRIS', style: TextStyle(fontSize: 42, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('CLASSIC', style: TextStyle(fontSize: 18, letterSpacing: 2)),
          const SizedBox(height: 24),
          _menuButton('START GAME', () => _startGame(competitionMode: false)),
          const SizedBox(height: 10),
          _menuButton('COMPETITION', () => setState(() => view = AppView.competition)),
        ],
      ),
    );
  }

  Widget _buildCompetition() {
    final top = engine.topScores;
    final latest = engine.latestScores;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Text('COMPETITION', style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: nameController,
            maxLength: 20,
            decoration: const InputDecoration(
              filled: true,
              fillColor: Color(0x660A246E),
              border: OutlineInputBorder(),
              counterText: '',
              hintText: 'ENTER NAME',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _menuButton('START GAME', () => _startGame(competitionMode: true))),
              const SizedBox(width: 10),
              Expanded(child: _menuButton('BACK', () => setState(() => view = AppView.menu))),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Row(
              children: [
                Expanded(child: _leaderboardPanel('TOP 10', top)),
                const SizedBox(width: 10),
                Expanded(child: _leaderboardPanel('LATEST 10', latest)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _leaderboardPanel(String title, List<CompetitionEntry> entries) {
    return Container(
      decoration: _panelDecoration(),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Expanded(
            child: entries.isEmpty
                ? const Center(child: Text('NO SCORES YET'))
                : ListView.builder(
                    itemCount: entries.length,
                    itemBuilder: (context, i) {
                      final e = entries[i];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 3),
                        child: Text('${i + 1}. ${e.name}  ${e.score}'),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildGame() {
    final media = MediaQuery.of(context);
    final isMobile = media.size.width <= 900;

    return Stack(
      children: [
        Column(
          children: [
            const SizedBox(height: 6),
            _buildHud(),
            const SizedBox(height: 8),
            _buildActions(),
            const SizedBox(height: 8),
            if (engine.fxMessage.isNotEmpty)
              Text(engine.fxMessage, style: TextStyle(color: engine.fxColor, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Expanded(
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final maxHeight = math.min(constraints.maxHeight - 4, media.size.height * 0.72);
                        final widthByHeight = maxHeight * (boardWidth / boardHeight);
                        final maxWidth = isMobile ? media.size.width - 24 : math.min(420.0, media.size.width * 0.56);
                        final boardPixelWidth = math.min(widthByHeight, maxWidth);
                        final boardPixelHeight = boardPixelWidth * (boardHeight / boardWidth);

                        return GestureDetector(
                          onTap: engine.rotateCurrent,
                          onPanStart: (details) {
                            panStart = details.localPosition;
                            panCurrent = details.localPosition;
                            panStartTime = DateTime.now();
                          },
                          onPanUpdate: (details) {
                            if (panStart == null) return;
                            panCurrent = details.localPosition;
                            final dx = details.localPosition.dx - panStart!.dx;
                            final dy = details.localPosition.dy - panStart!.dy;
                            engine.updateDrag(dx, dy, boardPixelHeight);
                          },
                          onPanEnd: (_) {
                            if (panStart == null || panStartTime == null) return;
                            final elapsed = DateTime.now().difference(panStartTime!).inMilliseconds;
                            final end = panCurrent ?? panStart!;
                            engine.handleSwipe(
                              dx: end.dx - panStart!.dx,
                              dy: end.dy - panStart!.dy,
                              elapsedMs: elapsed,
                              boardWidthPx: boardPixelWidth,
                              boardHeightPx: boardPixelHeight,
                            );
                            panStart = null;
                            panCurrent = null;
                            panStartTime = null;
                          },
                          child: SizedBox(
                            width: boardPixelWidth,
                            height: boardPixelHeight,
                            child: CustomPaint(painter: BoardPainter(engine)),
                          ),
                        );
                      },
                    ),
                    if (!isMobile) const SizedBox(width: 26),
                    if (!isMobile) _buildDesktopPanel(),
                  ],
                ),
              ),
            ),
          ],
        ),
        if (engine.gameOverVisible) _overlay('GAME OVER', 'TAP TO RESTART', onTap: engine.restart),
        if (engine.gamePaused) _overlay('PAUSED', 'TAP TO RESUME', onTap: engine.togglePause),
      ],
    );
  }

  Widget _overlay(String title, String subtitle, {required VoidCallback onTap}) {
    return Positioned.fill(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          color: Colors.black.withOpacity(0.86),
          alignment: Alignment.center,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(title, style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Text('SCORE: ${engine.score}', style: const TextStyle(fontSize: 16)),
              Text('LEVEL: ${engine.level}', style: const TextStyle(fontSize: 16)),
              Text('LINES: ${engine.lines}', style: const TextStyle(fontSize: 16)),
              const SizedBox(height: 20),
              Text(subtitle),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHud() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          Expanded(child: _hudCard('SCORE', '${engine.score}')),
          const SizedBox(width: 6),
          Expanded(child: _hudCard('MOVES\n${engine.moves}', 'LEVEL\n${engine.level}', split: true)),
          const SizedBox(width: 6),
          Expanded(child: _hudCard('TARGET', 'CLEAR ${(engine.lines % 10 == 0 ? 10 : 10 - (engine.lines % 10))} LINES')),
          const SizedBox(width: 6),
          Expanded(child: _nextHudCard()),
        ],
      ),
    );
  }

  Widget _nextHudCard() {
    return Container(
      decoration: _panelDecoration(),
      padding: const EdgeInsets.all(6),
      height: 78,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('NEXT', style: TextStyle(fontSize: 9)),
          const SizedBox(height: 4),
          SizedBox(
            width: 42,
            height: 42,
            child: CustomPaint(
              painter: PreviewPainter(engine.nextPiece),
            ),
          ),
        ],
      ),
    );
  }

  Widget _hudCard(String label, String value, {bool split = false}) {
    return Container(
      decoration: _panelDecoration(),
      height: 78,
      padding: const EdgeInsets.all(6),
      child: split
          ? Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: value.split('\n').map((s) => Text(s, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10))).toList(),
            )
          : Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label, style: const TextStyle(fontSize: 9)),
                const SizedBox(height: 4),
                Text(value, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
    );
  }

  Widget _buildActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          Expanded(child: _menuButton(engine.gamePaused ? 'RESUME' : 'PAUSE', engine.togglePause, dense: true)),
          const SizedBox(width: 6),
          Expanded(
            child: _menuButton(
              engine.shadowEnabled ? 'SHADOW ON' : 'SHADOW OFF',
              engine.toggleShadow,
              dense: true,
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: _menuButton(
              engine.soundEnabled ? 'SOUND ON' : 'SOUND OFF',
              engine.toggleSound,
              dense: true,
            ),
          ),
          const SizedBox(width: 6),
          Expanded(child: _menuButton('END', _endToMenu, dense: true)),
        ],
      ),
    );
  }

  Widget _buildDesktopPanel() {
    return SizedBox(
      width: 220,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _panelInfo('SCORE', '${engine.score}'),
          const SizedBox(height: 12),
          _panelInfo('LEVEL', '${engine.level}'),
          const SizedBox(height: 12),
          _panelInfo('LINES', '${engine.lines}'),
          const SizedBox(height: 12),
          _previewPanel('NEXT', engine.nextPiece),
          const SizedBox(height: 12),
          _previewPanel('HOLD', engine.holdPiece),
          const SizedBox(height: 14),
          const Text('Mobile: Swipe L/R move\nSwipe Down drop\nSwipe Up flip\nTap rotate', textAlign: TextAlign.left),
        ],
      ),
    );
  }

  Widget _panelInfo(String label, String value) {
    return Container(
      decoration: _panelDecoration(),
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 10)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _previewPanel(String label, Piece? piece) {
    return Container(
      decoration: _panelDecoration(),
      padding: const EdgeInsets.all(10),
      child: Column(
        children: [
          Text(label),
          const SizedBox(height: 8),
          SizedBox(width: 110, height: 110, child: CustomPaint(painter: PreviewPainter(piece))),
        ],
      ),
    );
  }

  BoxDecoration _panelDecoration() {
    return BoxDecoration(
      border: Border.all(color: const Color(0xFF5B8FFF), width: 2),
      gradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xED2A58D0), Color(0xF0102C88)],
      ),
      boxShadow: const [
        BoxShadow(color: Color(0x90030E44), blurRadius: 12, offset: Offset(0, 8)),
      ],
    );
  }

  Widget _menuButton(String label, VoidCallback onPressed, {bool dense = false}) {
    return SizedBox(
      height: dense ? 40 : 48,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF2C5AC8),
          foregroundColor: const Color(0xFFDCE8FF),
          textStyle: TextStyle(fontSize: dense ? 12 : 14, fontWeight: FontWeight.bold),
          shape: const RoundedRectangleBorder(),
          side: const BorderSide(color: Color(0xFF8FB8FF), width: 1.5),
        ),
        child: Text(label, textAlign: TextAlign.center),
      ),
    );
  }
}

class ProceduralAudioEngine {
  final List<AudioPlayer> _players = List.generate(16, (_) => AudioPlayer());
  final Map<String, Uint8List> _toneCache = {};
  Timer? _bgmTimer;
  int _bgmStep = 0;
  int _playerCursor = 0;

  bool _soundEnabled = true;
  bool _gameActive = false;
  bool _gamePaused = false;

  ProceduralAudioEngine() {
    for (final player in _players) {
      player.setPlayerMode(PlayerMode.lowLatency);
      player.setReleaseMode(ReleaseMode.stop);
    }
  }

  void updateState({
    required bool soundEnabled,
    required bool gameActive,
    required bool gamePaused,
  }) {
    _soundEnabled = soundEnabled;
    _gameActive = gameActive;
    _gamePaused = gamePaused;
    _updateBgmState();
  }

  void playSfx(String kind) {
    if (!_soundEnabled) return;
    if (kind == 'start') {
      _playTone(440, 0.08, waveform: 'square', gain: 0.05, delayMs: 0);
      _playTone(660, 0.10, waveform: 'square', gain: 0.05, delayMs: 90);
    } else if (kind == 'rotate') {
      _playTone(620, 0.05, waveform: 'triangle', gain: 0.04, delayMs: 0);
    } else if (kind == 'drop') {
      _playTone(220, 0.08, waveform: 'square', gain: 0.05, delayMs: 0);
    } else if (kind == 'clear') {
      _playTone(700, 0.07, waveform: 'square', gain: 0.05, delayMs: 0);
      _playTone(880, 0.09, waveform: 'square', gain: 0.05, delayMs: 80);
    } else if (kind == 'gameover') {
      _playTone(300, 0.12, waveform: 'sawtooth', gain: 0.05, delayMs: 0);
      _playTone(220, 0.18, waveform: 'sawtooth', gain: 0.05, delayMs: 130);
    } else if (kind == 'pause') {
      _playTone(500, 0.05, waveform: 'triangle', gain: 0.04, delayMs: 0);
    } else if (kind == 'hold') {
      _playTone(760, 0.04, waveform: 'triangle', gain: 0.04, delayMs: 0);
    }
  }

  void _updateBgmState() {
    final shouldPlay = _soundEnabled && _gameActive && !_gamePaused;
    if (!shouldPlay) {
      _bgmTimer?.cancel();
      _bgmTimer = null;
      return;
    }
    if (_bgmTimer != null) return;

    void tick() {
      if (!(_soundEnabled && _gameActive && !_gamePaused)) return;
      final step = _bgmStep % bgmMelody.length;
      final melodyFreq = bgmMelody[step];
      final bassFreq = bgmBass[step % bgmBass.length];

      if (melodyFreq > 0) {
        _playTone(melodyFreq, bgmBeatSeconds * 0.92, waveform: 'sine', gain: 0.014, delayMs: 0);
      }
      if (bassFreq > 0) {
        _playTone(bassFreq, bgmBeatSeconds * 0.90, waveform: 'triangle', gain: 0.01, delayMs: 0);
      }
      _bgmStep++;
    }

    tick();
    _bgmTimer = Timer.periodic(Duration(milliseconds: (bgmBeatSeconds * 1000).round()), (_) => tick());
  }

  void _playTone(
    double freq,
    double durationSec, {
    required String waveform,
    required double gain,
    required int delayMs,
  }) {
    if (freq <= 0 || !_soundEnabled) return;
    final act = () {
      final key = '${waveform}_${freq.toStringAsFixed(2)}_${durationSec.toStringAsFixed(3)}_${gain.toStringAsFixed(3)}';
      final data = _toneCache.putIfAbsent(key, () => _synthesizeWav(freq, durationSec, waveform, gain));
      final player = _players[_playerCursor % _players.length];
      _playerCursor++;
      player.play(BytesSource(data), volume: 1.0);
    };

    if (delayMs <= 0) {
      act();
    } else {
      Timer(Duration(milliseconds: delayMs), act);
    }
  }

  Uint8List _synthesizeWav(double freq, double durationSec, String waveform, double gain) {
    const sampleRate = 44100;
    final sampleCount = math.max(1, (durationSec * sampleRate).round());
    final dataSize = sampleCount * 2;
    final totalSize = 44 + dataSize;

    final bytes = Uint8List(totalSize);
    final bd = ByteData.view(bytes.buffer);

    void writeStr(int offset, String s) {
      for (int i = 0; i < s.length; i++) {
        bd.setUint8(offset + i, s.codeUnitAt(i));
      }
    }

    writeStr(0, 'RIFF');
    bd.setUint32(4, 36 + dataSize, Endian.little);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    bd.setUint32(16, 16, Endian.little);
    bd.setUint16(20, 1, Endian.little);
    bd.setUint16(22, 1, Endian.little);
    bd.setUint32(24, sampleRate, Endian.little);
    bd.setUint32(28, sampleRate * 2, Endian.little);
    bd.setUint16(32, 2, Endian.little);
    bd.setUint16(34, 16, Endian.little);
    writeStr(36, 'data');
    bd.setUint32(40, dataSize, Endian.little);

    for (int i = 0; i < sampleCount; i++) {
      final t = i / sampleRate;
      final phase = 2 * math.pi * freq * t;
      double sample;
      if (waveform == 'square') {
        sample = math.sin(phase) >= 0 ? 1.0 : -1.0;
      } else if (waveform == 'triangle') {
        final normalized = (freq * t) % 1.0;
        sample = 4.0 * (normalized - 0.5).abs() - 1.0;
      } else if (waveform == 'sawtooth') {
        final normalized = (freq * t) % 1.0;
        sample = 2.0 * normalized - 1.0;
      } else {
        sample = math.sin(phase);
      }

      final env = math.exp(-6.0 * (i / sampleCount));
      final value = (sample * gain * env * 32767).clamp(-32767, 32767).toInt();
      bd.setInt16(44 + i * 2, value, Endian.little);
    }

    return bytes;
  }

  Future<void> dispose() async {
    _bgmTimer?.cancel();
    for (final player in _players) {
      await player.dispose();
    }
  }
}

class CompetitionEntry {
  CompetitionEntry({
    required this.name,
    required this.score,
    required this.level,
    required this.lines,
    required this.ts,
  });

  final String name;
  final int score;
  final int level;
  final int lines;
  final int ts;

  Map<String, dynamic> toJson() => {
        'name': name,
        'score': score,
        'level': level,
        'lines': lines,
        'ts': ts,
      };

  factory CompetitionEntry.fromJson(Map<String, dynamic> json) {
    return CompetitionEntry(
      name: (json['name'] ?? 'PLAYER').toString(),
      score: (json['score'] ?? 0) as int,
      level: (json['level'] ?? 1) as int,
      lines: (json['lines'] ?? 0) as int,
      ts: (json['ts'] ?? DateTime.now().millisecondsSinceEpoch) as int,
    );
  }
}

class Piece {
  Piece({
    required this.type,
    required this.rotation,
    required this.x,
    required this.y,
    required this.visualOffset,
    required this.flipped,
  });

  final String type;
  int rotation;
  int x;
  int y;
  double visualOffset;
  bool flipped;

  Piece copy() {
    return Piece(
      type: type,
      rotation: rotation,
      x: x,
      y: y,
      visualOffset: visualOffset,
      flipped: flipped,
    );
  }

  Color get color => pieceColors[type] ?? Colors.white;
}

class TetrisEngine extends ChangeNotifier {
  final ProceduralAudioEngine _audio = ProceduralAudioEngine();

  List<List<Color?>> board = List.generate(boardHeight, (_) => List<Color?>.filled(boardWidth, null));

  Piece? currentPiece;
  Piece? nextPiece;
  Piece? holdPiece;

  bool canHold = true;
  bool gameActive = false;
  bool gamePaused = false;
  bool gameOverVisible = false;
  bool lockDelayActive = false;
  int lockDelayStart = 0;
  bool fastDropActive = false;
  bool fastDropDisabledForPiece = false;
  bool shadowEnabled = true;
  bool soundEnabled = true;

  int score = 0;
  int moves = 0;
  int level = 1;
  int lines = 0;
  int combo = -1;
  bool backToBack = false;
  int shakeFrames = 0;

  bool competitionMode = false;
  String currentPlayerName = '';
  String lastEntryView = 'menu';
  final List<CompetitionEntry> competitionScores = [];

  final Set<int> clearingRows = <int>{};
  int clearAnimationFrame = 0;

  String fxMessage = '';
  Color fxColor = const Color(0xFF00FFCC);
  Timer? _fxTimer;

  final List<String> bag = <String>[];

  Timer? _ticker;
  final Stopwatch _clock = Stopwatch()..start();
  int _lastTickMs = 0;

  TetrisEngine() {
    _loadCompetitionScores();
    _syncAudioState();
    _startTicker();
  }

  void _syncAudioState() {
    _audio.updateState(
      soundEnabled: soundEnabled,
      gameActive: gameActive,
      gamePaused: gamePaused,
    );
  }

  List<CompetitionEntry> get topScores {
    final list = [...competitionScores]..sort((a, b) {
        final scoreCmp = b.score.compareTo(a.score);
        return scoreCmp != 0 ? scoreCmp : a.ts.compareTo(b.ts);
      });
    return list.take(10).toList();
  }

  List<CompetitionEntry> get latestScores {
    final list = [...competitionScores]..sort((a, b) => b.ts.compareTo(a.ts));
    return list.take(10).toList();
  }

  void _startTicker() {
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(milliseconds: 16), (_) {
      final nowMs = _clock.elapsedMilliseconds;
      final dtSec = ((nowMs - _lastTickMs).clamp(0, 50)) / 1000.0;
      _lastTickMs = nowMs;
      _update(dtSec);
      notifyListeners();
    });
  }

  void startNormalGame() {
    competitionMode = false;
    currentPlayerName = '';
    lastEntryView = 'menu';
    _startGame();
  }

  void startCompetitionGame(String name) {
    competitionMode = true;
    currentPlayerName = name;
    lastEntryView = 'competition';
    _startGame();
  }

  void _startGame() {
    board = List.generate(boardHeight, (_) => List<Color?>.filled(boardWidth, null));
    score = 0;
    moves = 0;
    level = 1;
    lines = 0;
    combo = -1;
    backToBack = false;
    shakeFrames = 0;

    clearingRows.clear();
    clearAnimationFrame = 0;

    gameActive = true;
    gamePaused = false;
    gameOverVisible = false;
    lockDelayActive = false;
    lockDelayStart = 0;
    fastDropActive = false;
    fastDropDisabledForPiece = false;

    holdPiece = null;
    canHold = true;
    bag.clear();

    nextPiece = _createRandomPiece();
    _spawnNewPiece();
    _showFx('READY', const Color(0xFF00FFCC), 550);
    _audio.playSfx('start');
    _syncAudioState();
    notifyListeners();
  }

  void endToMainMenu() {
    gameActive = false;
    gamePaused = false;
    gameOverVisible = false;
    fastDropActive = false;
    fastDropDisabledForPiece = false;
    _showFx('', const Color(0xFF00FFCC), 0);
    _syncAudioState();
    notifyListeners();
  }

  void restart() {
    _startGame();
  }

  void togglePause() {
    if (!gameActive) return;
    gamePaused = !gamePaused;
    _audio.playSfx('pause');
    _syncAudioState();
    notifyListeners();
  }

  void toggleShadow() {
    shadowEnabled = !shadowEnabled;
    _audio.playSfx('rotate');
    notifyListeners();
  }

  void toggleSound() {
    soundEnabled = !soundEnabled;
    _syncAudioState();
    if (soundEnabled) {
      _audio.playSfx('rotate');
    }
    notifyListeners();
  }

  void rotateCurrent() {
    if (!gameActive || gamePaused || currentPiece == null) return;
    if (rotate(currentPiece!)) {
      _audio.playSfx('rotate');
    }
    notifyListeners();
  }

  void moveLeft() {
    if (!gameActive || gamePaused || currentPiece == null) return;
    moveLeftPiece(currentPiece!);
    notifyListeners();
  }

  void moveRight() {
    if (!gameActive || gamePaused || currentPiece == null) return;
    moveRightPiece(currentPiece!);
    notifyListeners();
  }

  void hardDropCurrent() {
    if (!gameActive || gamePaused || currentPiece == null) return;
    hardDrop(currentPiece!);
    notifyListeners();
  }

  void holdCurrent() {
    if (!gameActive || gamePaused || currentPiece == null || !canHold) return;

    _audio.playSfx('hold');

    final nextCurrent = Piece(
      type: currentPiece!.type,
      rotation: 0,
      x: boardWidth ~/ 2 - 1,
      y: 0,
      visualOffset: 0,
      flipped: false,
    );

    if (holdPiece == null) {
      holdPiece = nextCurrent.copy();
      currentPiece = nextPiece;
      nextPiece = _createRandomPiece();
    } else {
      final swap = holdPiece!.type;
      holdPiece = nextCurrent.copy();
      currentPiece = Piece(
        type: swap,
        rotation: 0,
        x: boardWidth ~/ 2 - 1,
        y: 0,
        visualOffset: 0,
        flipped: false,
      );
    }

    canHold = false;
    if (_collides(currentPiece!)) {
      _gameOver();
    }
    notifyListeners();
  }

  void updateDrag(double dx, double dy, double boardHeightPx) {
    if (!gameActive || gamePaused || currentPiece == null) return;
    final slideDownThreshold = math.max(14, (boardHeightPx * 0.03).round());
    if (!fastDropDisabledForPiece && dy > slideDownThreshold && dy.abs() > dx.abs()) {
      fastDropActive = true;
    }
    if (dy < -slideDownThreshold && dy.abs() > dx.abs()) {
      fastDropActive = false;
      fastDropDisabledForPiece = false;
    }
  }

  void handleSwipe({
    required double dx,
    required double dy,
    required int elapsedMs,
    required double boardWidthPx,
    required double boardHeightPx,
  }) {
    if (!gameActive || gamePaused || currentPiece == null) return;

    final absX = dx.abs();
    final absY = dy.abs();
    final swipeThreshold = math.max(24, (boardWidthPx * 0.08).round());
    final tapThreshold = math.max(22, (boardWidthPx * 0.06).round());

    if (fastDropActive) {
      fastDropDisabledForPiece = false;
      return;
    }

    if (absX < tapThreshold && absY < tapThreshold && elapsedMs < 360) {
      if (rotate(currentPiece!)) {
        _audio.playSfx('rotate');
      }
      fastDropDisabledForPiece = false;
      return;
    }

    if (absX >= swipeThreshold || absY >= swipeThreshold) {
      if (absX > absY) {
        if (dx > 0) {
          moveRightPiece(currentPiece!);
        } else {
          moveLeftPiece(currentPiece!);
        }
      } else if (dy > 0) {
        softDrop(currentPiece!);
      } else {
        flipBlock();
      }
    }

    fastDropDisabledForPiece = false;
  }

  void _update(double dtSec) {
    if (!gameActive || gamePaused || currentPiece == null) return;

    if (clearingRows.isNotEmpty) {
      clearAnimationFrame += 1;
      if (clearAnimationFrame >= clearAnimationDuration) {
        final rowsToRemove = clearingRows.toList()..sort((a, b) => b.compareTo(a));
        for (final row in rowsToRemove) {
          board.removeAt(row);
        }
        for (int i = 0; i < rowsToRemove.length; i++) {
          board.insert(0, List<Color?>.filled(boardWidth, null));
        }
        clearingRows.clear();
      }
      return;
    }

    final now = DateTime.now().millisecondsSinceEpoch;
    if (_isPieceGrounded(currentPiece!)) {
      if (!lockDelayActive) {
        lockDelayActive = true;
        lockDelayStart = now;
        currentPiece!.visualOffset = 0;
      } else if (now - lockDelayStart >= lockDelayMs) {
        placePiece(currentPiece!);
        _spawnNewPiece();
        return;
      }
    }

    final frameScale = dtSec * 60.0;

    if (!lockDelayActive) {
      final gravity = gravityBase + (level - 1) * 0.01;
      currentPiece!.visualOffset += gravity * frameScale;
    }

    while (currentPiece!.visualOffset >= 1) {
      if (!softDrop(currentPiece!)) {
        currentPiece!.visualOffset = 0;
        if (!lockDelayActive) {
          lockDelayActive = true;
          lockDelayStart = now;
        }
        break;
      }
      currentPiece!.visualOffset -= 1;
    }

    if (fastDropActive) {
      currentPiece!.visualOffset += (fastDropSteps * 0.25) * frameScale;
      while (currentPiece!.visualOffset >= 1) {
        if (!softDrop(currentPiece!)) {
          currentPiece!.visualOffset = 0;
          if (!lockDelayActive) {
            lockDelayActive = true;
            lockDelayStart = now;
          }
          fastDropActive = false;
          fastDropDisabledForPiece = true;
          break;
        }
        currentPiece!.visualOffset -= 1;
      }
    }
  }

  void _gameOver() {
    gameActive = false;
    gameOverVisible = true;
    fastDropActive = false;
    _recordCompetitionScore();
    _showFx('GAME OVER', const Color(0xFFFF3366), 900);
    _audio.playSfx('gameover');
    _syncAudioState();
  }

  void _recordCompetitionScore() {
    if (!competitionMode) return;
    final entry = CompetitionEntry(
      name: currentPlayerName.isEmpty ? 'PLAYER' : currentPlayerName.substring(0, math.min(20, currentPlayerName.length)),
      score: score,
      level: level,
      lines: lines,
      ts: DateTime.now().millisecondsSinceEpoch,
    );
    competitionScores.add(entry);
    if (competitionScores.length > 200) {
      competitionScores.removeRange(0, competitionScores.length - 200);
    }
    _saveCompetitionScores();
  }

  Future<void> _loadCompetitionScores() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(leaderboardStorageKey);
      if (raw == null || raw.isEmpty) return;
      final data = jsonDecode(raw) as List<dynamic>;
      competitionScores
        ..clear()
        ..addAll(data.map((e) => CompetitionEntry.fromJson(e as Map<String, dynamic>)));
      notifyListeners();
    } catch (_) {
      competitionScores.clear();
    }
  }

  Future<void> _saveCompetitionScores() async {
    final prefs = await SharedPreferences.getInstance();
    final json = jsonEncode(competitionScores.map((e) => e.toJson()).toList());
    await prefs.setString(leaderboardStorageKey, json);
    notifyListeners();
  }

  void _showFx(String text, Color color, int durationMs) {
    fxMessage = text;
    fxColor = color;
    _fxTimer?.cancel();
    if (durationMs > 0 && text.isNotEmpty) {
      _fxTimer = Timer(Duration(milliseconds: durationMs), () {
        fxMessage = '';
        notifyListeners();
      });
    }
  }

  Piece _createRandomPiece() {
    final type = _drawFromBag();
    return Piece(
      type: type,
      rotation: 0,
      x: boardWidth ~/ 2 - 1,
      y: 0,
      visualOffset: 0,
      flipped: false,
    );
  }

  void _spawnNewPiece() {
    currentPiece = nextPiece;
    nextPiece = _createRandomPiece();
    canHold = true;
    lockDelayActive = false;
    lockDelayStart = 0;
    fastDropActive = false;
    fastDropDisabledForPiece = true;
    currentPiece!.visualOffset = 0;

    if (_collides(currentPiece!)) {
      _gameOver();
    }
  }

  void _refillBag() {
    final pieces = tetrominoes.keys.toList();
    pieces.shuffle();
    bag.addAll(pieces);
  }

  String _drawFromBag() {
    if (bag.isEmpty) {
      _refillBag();
    }
    return bag.removeLast();
  }

  List<List<int>> shapeForPiece(Piece piece) {
    final shape = tetrominoes[piece.type]![piece.rotation].map((row) => [...row]).toList();
    if (piece.flipped) {
      for (final row in shape) {
        final reversed = row.reversed.toList();
        row
          ..clear()
          ..addAll(reversed);
      }
    }
    return shape;
  }

  bool _collides(Piece piece) {
    final shape = shapeForPiece(piece);

    for (int y = 0; y < shape.length; y++) {
      for (int x = 0; x < shape[y].length; x++) {
        if (shape[y][x] == 0) continue;

        final boardX = piece.x + x;
        final boardY = piece.y + y;

        if (boardX < 0 || boardX >= boardWidth || boardY >= boardHeight) return true;
        if (boardY >= 0 && board[boardY][boardX] != null) return true;
      }
    }

    return false;
  }

  bool rotate(Piece piece) {
    final old = piece.rotation;
    piece.rotation = (piece.rotation + 1) % tetrominoes[piece.type]!.length;
    if (_collides(piece)) {
      piece.rotation = old;
      return false;
    }
    _refreshLockDelayFromAction(piece);
    return true;
  }

  bool moveLeftPiece(Piece piece) {
    piece.x -= 1;
    if (_collides(piece)) {
      piece.x += 1;
      return false;
    }
    _refreshLockDelayFromAction(piece);
    return true;
  }

  bool moveRightPiece(Piece piece) {
    piece.x += 1;
    if (_collides(piece)) {
      piece.x -= 1;
      return false;
    }
    _refreshLockDelayFromAction(piece);
    return true;
  }

  bool softDrop(Piece piece) {
    piece.y += 1;
    if (_collides(piece)) {
      piece.y -= 1;
      return false;
    }
    if (identical(piece, currentPiece)) {
      lockDelayActive = false;
      lockDelayStart = 0;
    }
    return true;
  }

  bool _isPieceGrounded(Piece piece) {
    piece.y += 1;
    final grounded = _collides(piece);
    piece.y -= 1;
    return grounded;
  }

  void _refreshLockDelayFromAction(Piece piece) {
    if (!identical(piece, currentPiece)) return;
    if (_isPieceGrounded(piece)) {
      lockDelayActive = true;
      lockDelayStart = DateTime.now().millisecondsSinceEpoch;
    }
  }

  void hardDrop(Piece piece) {
    int distance = 0;
    while (softDrop(piece)) {
      distance++;
    }
    piece.visualOffset = 0;
    if (distance > 0) {
      score += distance * hardDropBonus;
      shakeFrames = 4;
      _audio.playSfx('drop');
    }
    placePiece(piece);
    _spawnNewPiece();
  }

  void flipBlock() {
    if (currentPiece == null) return;
    final old = currentPiece!.flipped;
    currentPiece!.flipped = !currentPiece!.flipped;
    if (_collides(currentPiece!)) {
      currentPiece!.flipped = old;
    } else {
      _refreshLockDelayFromAction(currentPiece!);
      _showFx('FLIP', const Color(0xFFFFFF00), 400);
      _audio.playSfx('rotate');
    }
  }

  void placePiece(Piece piece) {
    piece.visualOffset = 0;
    moves++;
    final shape = shapeForPiece(piece);

    for (int y = 0; y < shape.length; y++) {
      for (int x = 0; x < shape[y].length; x++) {
        if (shape[y][x] == 0) continue;

        final boardX = piece.x + x;
        final boardY = piece.y + y;
        if (boardY >= 0 && boardY < boardHeight && boardX >= 0 && boardX < boardWidth) {
          board[boardY][boardX] = piece.color;
        }
      }
    }

    _clearLines();
  }

  void _clearLines() {
    int linesCleared = 0;
    for (int y = boardHeight - 1; y >= 0; y--) {
      bool full = true;
      for (int x = 0; x < boardWidth; x++) {
        if (board[y][x] == null) {
          full = false;
          break;
        }
      }
      if (full) {
        clearingRows.add(y);
        linesCleared++;
      }
    }

    if (linesCleared > 0) {
      lines += linesCleared;
      _addScore(linesCleared);
      clearAnimationFrame = 0;
      shakeFrames = math.max(shakeFrames, 6);
      _audio.playSfx('clear');
      if (linesCleared == 4) {
        _showFx('TETRIS!', const Color(0xFFFFEF33), 900);
      } else {
        _showFx('$linesCleared LINE${linesCleared > 1 ? 'S' : ''}', const Color(0xFF00FFCC), 650);
      }
    } else {
      combo = -1;
    }
  }

  void _addScore(int linesCleared) {
    int points = 0;
    switch (linesCleared) {
      case 1:
        points = 100 * level;
        break;
      case 2:
        points = 300 * level;
        break;
      case 3:
        points = 500 * level;
        break;
      case 4:
        points = 800 * level;
        break;
      default:
        break;
    }

    if (linesCleared > 0) {
      combo++;
      if (combo > 0) {
        points += combo * 50 * level;
      }

      if (linesCleared == 4) {
        if (backToBack) {
          points = (points * 1.5).floor();
        }
        backToBack = true;
      } else {
        backToBack = false;
      }
    }

    score += points;

    final newLevel = (lines ~/ 10) + 1;
    if (newLevel != level) {
      level = newLevel;
    }
  }

  Piece? get ghostPiece {
    if (currentPiece == null) return null;
    final ghost = currentPiece!.copy()..visualOffset = 0;
    while (true) {
      ghost.y += 1;
      if (_collides(ghost)) {
        ghost.y -= 1;
        break;
      }
    }
    if (ghost.y == currentPiece!.y) return null;
    return ghost;
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _fxTimer?.cancel();
    unawaited(_audio.dispose());
    super.dispose();
  }
}

class BoardPainter extends CustomPainter {
  BoardPainter(this.engine) : super(repaint: engine);

  final TetrisEngine engine;

  @override
  void paint(Canvas canvas, Size size) {
    final cellW = size.width / boardWidth;
    final cellH = size.height / boardHeight;

    final basePaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF1A45B6), Color(0xFF0C2B88), Color(0xFF081F67)],
        stops: [0, 0.52, 1],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, basePaint);

    for (int y = 0; y < boardHeight; y++) {
      for (int x = 0; x < boardWidth; x++) {
        final even = (x + y).isEven;
        final overlay = Paint()..color = even ? const Color(0x10FFFFFF) : const Color(0x12000A28);
        canvas.drawRect(Rect.fromLTWH(x * cellW, y * cellH, cellW, cellH), overlay);
      }
    }

    if (engine.shadowEnabled) {
      final ghost = engine.ghostPiece;
      if (ghost != null) {
        _drawPiece(canvas, ghost, cellW, cellH, alpha: 0.32);
      }
    }

    for (int y = 0; y < boardHeight; y++) {
      for (int x = 0; x < boardWidth; x++) {
        final color = engine.board[y][x];
        if (color != null) {
          _drawBlock(canvas, x * cellW, y * cellH, cellW, cellH, color);
        }
      }
    }

    if (engine.currentPiece != null && engine.gameActive) {
      _drawPiece(canvas, engine.currentPiece!, cellW, cellH);
    }

    final border = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = const Color(0xFFA8CBFF);
    canvas.drawRect(Offset.zero & size, border);
  }

  void _drawPiece(Canvas canvas, Piece piece, double cellW, double cellH, {double alpha = 1}) {
    final shape = engine.shapeForPiece(piece);
    final visualY = piece.y + piece.visualOffset;

    for (int y = 0; y < shape.length; y++) {
      for (int x = 0; x < shape[y].length; x++) {
        if (shape[y][x] == 0) continue;
        final bx = piece.x + x;
        final by = visualY + y;
        if (by >= 0) {
          _drawBlock(canvas, bx * cellW, by * cellH, cellW, cellH, piece.color.withOpacity(alpha));
        }
      }
    }
  }

  void _drawBlock(Canvas canvas, double x, double y, double w, double h, Color color) {
    final rect = Rect.fromLTWH(x + 1, y + 1, math.max(2, w - 2), math.max(2, h - 2));
    final fill = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          _shift(color, 34),
          color,
          _shift(color, -36),
        ],
      ).createShader(rect);
    canvas.drawRect(rect, fill);

    final topGlow = Paint()
      ..color = Colors.white.withOpacity(0.22)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawRect(rect, topGlow);

    final shadow = Paint()
      ..color = const Color(0x90071450)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawRect(rect.deflate(1.2), shadow);
  }

  Color _shift(Color c, int amount) {
    int clamp(int v) => math.max(0, math.min(255, v));
    return Color.fromARGB(
      c.alpha,
      clamp(c.red + amount),
      clamp(c.green + amount),
      clamp(c.blue + amount),
    );
  }

  @override
  bool shouldRepaint(covariant BoardPainter oldDelegate) => true;
}

class PreviewPainter extends CustomPainter {
  PreviewPainter(this.piece);

  final Piece? piece;

  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()..color = const Color(0xFF102A88);
    canvas.drawRect(Offset.zero & size, bg);

    if (piece == null) return;

    final shape = tetrominoes[piece!.type]![piece!.rotation];
    final block = math.max(12, (math.min(size.width, size.height) / 6).floorToDouble());
    final offsetX = (size.width - shape[0].length * block) / 2;
    final offsetY = (size.height - shape.length * block) / 2;

    final color = pieceColors[piece!.type] ?? Colors.white;
    for (int y = 0; y < shape.length; y++) {
      for (int x = 0; x < shape[y].length; x++) {
        if (shape[y][x] == 0) continue;
        final rect = Rect.fromLTWH(offsetX + x * block + 1, offsetY + y * block + 1, block - 2, block - 2);
        canvas.drawRect(rect, Paint()..color = color);
      }
    }
  }

  @override
  bool shouldRepaint(covariant PreviewPainter oldDelegate) => oldDelegate.piece != piece;
}
