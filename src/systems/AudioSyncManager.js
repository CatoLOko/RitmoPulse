/**
 * AudioSyncManager — Precise audio-visual synchronization via Web Audio API.
 * All note positions must derive from this manager's songPosition, never frame deltas.
 */
import { CONFIG } from '../config.js';

export default class AudioSyncManager {
    constructor(scene) {
        this.scene = scene;
        this.audioContext = null;
        this.songStartTime = 0;
        this.songDuration = 0;
        this.playing = false;
        this.paused = false;
        this.pauseTime = 0;
        this.offset = 0; // user-calibrated latency offset (ms)
        this.currentSound = null;
    }

    /**
     * Initialize the audio context (must be called from a user gesture).
     */
    init() {
        if (this.scene.sound && this.scene.sound.context) {
            this.audioContext = this.scene.sound.context;
        } else {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Play a song by key (must be preloaded in the scene).
     */
    playSong(key) {
        this.init();

        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound.destroy();
        }

        this.currentSound = this.scene.sound.add(key, { volume: 0.7 });
        this.currentSound.play();
        this.songStartTime = this.audioContext.currentTime;
        this.songDuration = this.currentSound.duration * 1000; // ms
        this.playing = true;
        this.paused = false;
    }

    /**
     * Get the current song position in milliseconds.
     * This is THE authoritative time source for note positioning.
     */
    getSongPosition() {
        if (!this.playing) return 0;
        if (this.paused) return this.pauseTime;

        const elapsed = (this.audioContext.currentTime - this.songStartTime) * 1000;
        return elapsed + this.offset;
    }

    /**
     * Check if the song has finished.
     */
    isFinished() {
        if (!this.playing || !this.currentSound) return false;
        return !this.currentSound.isPlaying && this.getSongPosition() > 1000;
    }

    pause() {
        if (this.playing && !this.paused) {
            this.pauseTime = this.getSongPosition();
            this.paused = true;
            if (this.currentSound) this.currentSound.pause();
        }
    }

    resume() {
        if (this.playing && this.paused) {
            if (this.currentSound) this.currentSound.resume();
            // Recalculate start time to account for pause duration
            this.songStartTime = this.audioContext.currentTime - (this.pauseTime - this.offset) / 1000;
            this.paused = false;
        }
    }

    stop() {
        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound.destroy();
            this.currentSound = null;
        }
        this.playing = false;
        this.paused = false;
    }

    /**
     * Compute the Y position for a note given its hit time.
     * Notes fall DOWNWARD: spawn at top, receptor at bottom.
     */
    getNoteY(noteTime) {
        const songPos = this.getSongPosition();
        const timeDiff = noteTime - songPos; // positive = note is above receptor
        const pixelsPerMs = CONFIG.RECEPTOR_Y / CONFIG.SCROLL_TIME;
        return CONFIG.RECEPTOR_Y - timeDiff * pixelsPerMs;
    }
}
