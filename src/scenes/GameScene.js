/**
 * GameScene — Core gameplay: note highway, input detection, scoring, and HUD.
 * Notes scroll DOWNWARD (Guitar Hero style).
 */
import { CONFIG } from '../config.js';
import AudioSyncManager from '../systems/AudioSyncManager.js';
import InputManager from '../systems/InputManager.js';
import NoteManager from '../systems/NoteManager.js';
import ScoreManager from '../systems/ScoreManager.js';
import ParticleManager from '../systems/ParticleManager.js';
import HUD from '../ui/HUD.js';
import JudgmentPopup from '../ui/JudgmentPopup.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.songData = data.song;
    }

    preload() {
        // Load the chart JSON
        if (this.songData && this.songData.chartFile) {
            this.load.json('current_chart', this.songData.chartFile);
        }
        // Load the audio file
        if (this.songData && this.songData.audioFile) {
            this.load.audio('current_song', this.songData.audioFile);
        }
    }

    create() {
        this.cameras.main.fadeIn(300);

        // Background
        this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'bg_game');

        // Draw the note highway
        this.createHighway();

        // Create receptor arrows
        this.createReceptors();

        // Initialize systems
        this.audioSync = new AudioSyncManager(this);
        this.inputMgr = new InputManager(this);
        this.scoreMgr = new ScoreManager();
        this.noteMgr = new NoteManager(this, this.audioSync);
        this.particleMgr = new ParticleManager(this);
        this.hud = new HUD(this);
        this.judgmentPopup = new JudgmentPopup(this);

        // Set song info
        if (this.songData) {
            this.hud.setSongInfo(this.songData.name, this.songData.artist);
        }

        // Load chart
        const chartData = this.cache.json.get('current_chart');
        if (chartData) {
            this.noteMgr.loadChart(chartData);
        }

        // Game state
        this.gameStarted = false;
        this.gameOver = false;
        this.paused = false;
        this.lastCombo = 0;

        // Pause overlay
        this.pauseOverlay = null;

        // Start countdown
        this.startCountdown();
    }

    /**
     * Draw the note highway (4 lane backgrounds).
     */
    createHighway() {
        const hwX = CONFIG.HIGHWAY_X;
        const totalWidth = CONFIG.LANE_COUNT * CONFIG.LANE_WIDTH + (CONFIG.LANE_COUNT - 1) * CONFIG.LANE_GAP;

        // Highway background
        const hwBg = this.add.graphics();
        hwBg.fillStyle(0x0a0a18, 0.7);
        hwBg.fillRoundedRect(hwX - 10, 0, totalWidth + 20, CONFIG.HEIGHT, 4);
        hwBg.setDepth(1);

        // Lane dividers
        const dividers = this.add.graphics();
        dividers.lineStyle(1, 0x222244, 0.4);
        for (let i = 1; i < CONFIG.LANE_COUNT; i++) {
            const x = hwX + i * (CONFIG.LANE_WIDTH + CONFIG.LANE_GAP) - CONFIG.LANE_GAP / 2;
            dividers.lineBetween(x, 0, x, CONFIG.HEIGHT);
        }
        dividers.setDepth(2);

        // Receptor line (horizontal glow line at receptor Y)
        const receptorLine = this.add.graphics();
        receptorLine.lineStyle(2, 0x9B59B6, 0.5);
        receptorLine.lineBetween(hwX - 10, CONFIG.RECEPTOR_Y, hwX + totalWidth + 10, CONFIG.RECEPTOR_Y);
        receptorLine.setDepth(3);

        // Side glow edges
        const leftGlow = this.add.rectangle(hwX - 10, CONFIG.HEIGHT / 2, 4, CONFIG.HEIGHT, 0x9B59B6, 0.15).setDepth(2);
        const rightGlow = this.add.rectangle(hwX + totalWidth + 10, CONFIG.HEIGHT / 2, 4, CONFIG.HEIGHT, 0x9B59B6, 0.15).setDepth(2);
    }

    /**
     * Create receptor arrows at the bottom (Guitar Hero style).
     */
    createReceptors() {
        this.receptors = [];
        const angles = [270, 180, 0, 90]; // left, down, up, right

        for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
            const x = CONFIG.LANE_CENTERS[i];
            const receptor = this.add.image(x, CONFIG.RECEPTOR_Y, `receptor_${i}`);
            receptor.setAngle(angles[i]);
            receptor.setDepth(8);
            this.receptors.push(receptor);
        }
    }

    /**
     * Countdown before song starts.
     */
    startCountdown() {
        const counts = ['3', '2', '1', 'GO!'];
        let index = 0;

        const showCount = () => {
            if (index >= counts.length) {
                this.startSong();
                return;
            }

            const text = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 50, counts[index], {
                fontFamily: 'Orbitron',
                fontSize: index === 3 ? '64px' : '72px',
                color: index === 3 ? '#2ECC71' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
            }).setOrigin(0.5).setDepth(100).setAlpha(0).setScale(2);

            this.tweens.add({
                targets: text,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        scaleX: 0.5,
                        scaleY: 0.5,
                        duration: 500,
                        onComplete: () => text.destroy(),
                    });
                }
            });

            index++;
            this.time.delayedCall(700, showCount);
        };

        this.time.delayedCall(500, showCount);
    }

    /**
     * Start playing the song.
     */
    startSong() {
        this.gameStarted = true;

        // Check if audio was loaded
        if (this.cache.audio.exists('current_song')) {
            this.audioSync.playSong('current_song');
        } else {
            // No audio file — run in silent/demo mode with a timer
            this.audioSync.init();
            this.audioSync.songStartTime = this.audioSync.audioContext.currentTime;
            this.audioSync.playing = true;
            this.audioSync.songDuration = 180000; // 3 min default
        }
    }

    update(time, delta) {
        if (!this.gameStarted || this.gameOver) return;

        // Handle pause
        if (this.inputMgr.isEscPressed()) {
            this.togglePause();
            return;
        }

        if (this.paused) return;

        // Update input state
        this.inputMgr.update();

        const songPos = this.audioSync.getSongPosition();

        // Update note positions
        this.noteMgr.update(songPos);

        // Check for missed notes
        const missedNotes = this.noteMgr.getMissedNotes(songPos);
        for (const note of missedNotes) {
            this.scoreMgr.registerMiss();
            this.judgmentPopup.show(note.lane, 'MISS');
            this.particleMgr.emitMiss(note.lane);
        }

        // Process input for each lane
        for (let lane = 0; lane < CONFIG.LANE_COUNT; lane++) {
            if (this.inputMgr.isLaneJustPressed(lane)) {
                this.handleLanePress(lane, songPos);
            }

            // Receptor visual feedback
            if (this.inputMgr.isLaneHeld(lane)) {
                this.receptors[lane].setTexture(`receptor_pressed_${lane}`);
            } else {
                this.receptors[lane].setTexture(`receptor_${lane}`);
            }
        }

        // Update sustain holds
        const sustainTicks = this.noteMgr.updateHolds(songPos, (lane) => this.inputMgr.isLaneHeld(lane));
        for (let t = 0; t < sustainTicks; t++) {
            this.scoreMgr.addSustainTick();
        }

        // Combo milestone check
        if (this.scoreMgr.combo > 0 && this.scoreMgr.combo !== this.lastCombo) {
            if (this.scoreMgr.combo % 50 === 0) {
                this.particleMgr.emitComboMilestone(this.scoreMgr.combo);
            }
            this.lastCombo = this.scoreMgr.combo;
        }

        // Update HUD
        this.hud.update(this.scoreMgr, songPos, this.audioSync.songDuration);

        // Check for game over (health depleted)
        if (this.scoreMgr.isDead()) {
            this.endGame(false);
        }

        // Check for song completion
        if (this.audioSync.isFinished() || this.noteMgr.isChartComplete(songPos)) {
            if (songPos > 2000) { // ensure we're past the start
                this.endGame(true);
            }
        }
    }

    /**
     * Handle a key press on a specific lane.
     */
    handleLanePress(lane, songPos) {
        const note = this.noteMgr.getHittableNote(lane, songPos);

        if (!note) return; // no note to hit — ghost tap (no penalty)

        const timeDiff = note.time - songPos;
        const { judgment } = this.scoreMgr.evaluate(timeDiff);

        // Hit the note
        this.noteMgr.hitNote(note);

        // Visual feedback
        this.judgmentPopup.show(lane, judgment);
        this.particleMgr.emitHit(lane, judgment);

        if (judgment !== 'MISS') {
            this.hud.popCombo();
        }

        // Receptor pulse
        this.tweens.add({
            targets: this.receptors[lane],
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 60,
            yoyo: true,
            ease: 'Back.easeOut',
        });
    }

    /**
     * Toggle pause state.
     */
    togglePause() {
        this.paused = !this.paused;

        if (this.paused) {
            this.audioSync.pause();
            this.showPauseOverlay();
        } else {
            this.audioSync.resume();
            this.hidePauseOverlay();
        }
    }

    showPauseOverlay() {
        this.pauseOverlay = this.add.container(0, 0).setDepth(200);

        const bg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.7);
        this.pauseOverlay.add(bg);

        const title = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 60, 'PAUSED', {
            fontFamily: 'Orbitron',
            fontSize: '48px',
            color: '#9B59B6',
        }).setOrigin(0.5);
        this.pauseOverlay.add(title);

        const resume = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 10, 'Press ESC to resume', {
            fontFamily: 'Inter',
            fontSize: '18px',
            color: '#888899',
        }).setOrigin(0.5);
        this.pauseOverlay.add(resume);

        const quit = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 50, 'Press Q to quit', {
            fontFamily: 'Inter',
            fontSize: '16px',
            color: '#555566',
        }).setOrigin(0.5);
        this.pauseOverlay.add(quit);

        this.quitKey = this.input.keyboard.addKey('Q');
        this.quitKey.once('down', () => {
            if (this.paused) {
                this.audioSync.stop();
                this.scene.start('Menu');
            }
        });
    }

    hidePauseOverlay() {
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
    }

    /**
     * End the game (either by completion or game over).
     */
    endGame(completed) {
        if (this.gameOver) return;
        this.gameOver = true;

        this.audioSync.stop();

        const results = this.scoreMgr.getResults();
        results.songName = this.songData ? this.songData.name : 'Unknown';
        results.completed = completed;

        this.time.delayedCall(1000, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                if (completed) {
                    this.scene.start('Result', { results, song: this.songData });
                } else {
                    this.scene.start('GameOver', { results, song: this.songData });
                }
            });
        });
    }

    shutdown() {
        if (this.audioSync) this.audioSync.stop();
        if (this.noteMgr) this.noteMgr.destroy();
        if (this.hud) this.hud.destroy();
    }
}
