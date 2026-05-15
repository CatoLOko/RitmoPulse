/**
 * AudioSyncManager — Precise audio-visual synchronization via Web Audio API.
 * Supports dynamic scroll speed (per-song + user multiplier).
 */
import { CONFIG } from '../config.js';
import settingsManager from './SettingsManager.js';

export default class AudioSyncManager {
    constructor(scene) {
        this.scene = scene;
        this.audioContext = null;
        this.songStartTime = 0;
        this.songDuration = 0;
        this.playing = false;
        this.paused = false;
        this.pauseTime = 0;
        this.offset = settingsManager.get('audioOffset') || 0;
        this.currentSound = null;

        // Scroll time — can be changed dynamically by EventManager
        this.scrollTime = CONFIG.SCROLL_TIME;
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
     * Set the effective scroll time based on song speed and user settings.
     */
    setScrollSpeed(songScrollSpeed) {
        this.scrollTime = settingsManager.getEffectiveScrollTime(songScrollSpeed);
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

        const musicVol = settingsManager.get('musicVolume') * settingsManager.get('masterVolume');
        this.currentSound = this.scene.sound.add(key, { volume: musicVol });
        this.currentSound.play();
        this.songStartTime = this.audioContext.currentTime;
        this.songDuration = this.currentSound.duration * 1000; // ms
        this.playing = true;
        this.paused = false;
    }

    /**
     * Get the current song position in milliseconds.
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

    play8BitVersion(notes) {
        this.init();
        
        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound.destroy();
            this.currentSound = null;
        }

        this.songStartTime = this.audioContext.currentTime;
        
        // Find last note time for duration
        let maxTime = 0;
        notes.forEach(n => {
            const end = n.time + (n.duration || 0);
            if (end > maxTime) maxTime = end;
        });
        this.songDuration = maxTime + 3000;
        
        this.playing = true;
        this.paused = false;
        this.synthNodes = [];

        // Base frequencies for 8-bit tracks (Pentatonic scale or similar)
        const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        const vol = settingsManager.get('musicVolume') * settingsManager.get('masterVolume') * 0.15; // Lower volume for square waves

        notes.forEach(note => {
            if (note.type === 'bomb') return;
            
            const timeInSeconds = note.time / 1000;
            const startTime = this.songStartTime + timeInSeconds;
            const duration = (note.type === 'sustain' && note.duration > 0) ? (note.duration / 1000) : 0.15;
            
            const osc = this.audioContext.createOscillator();
            osc.type = 'square'; // 8-bit sound
            osc.frequency.value = freqs[note.lane];
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
            gain.gain.setValueAtTime(vol, startTime + duration - 0.02);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
            
            this.synthNodes.push(osc);
        });
    }

    pause() {
        if (this.playing && !this.paused) {
            this.pauseTime = this.getSongPosition();
            this.paused = true;
            if (this.currentSound) this.currentSound.pause();
            if (this.audioContext.state === 'running') this.audioContext.suspend();
        }
    }

    resume() {
        if (this.playing && this.paused) {
            if (this.currentSound) this.currentSound.resume();
            if (this.audioContext.state === 'suspended') this.audioContext.resume();
            
            // Adjust songStartTime based on how long we were paused
            const currentCtxTime = this.audioContext.currentTime;
            this.songStartTime = currentCtxTime - (this.pauseTime - this.offset) / 1000;
            this.paused = false;
        }
    }

    stop() {
        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound.destroy();
            this.currentSound = null;
        }
        if (this.synthNodes) {
            this.synthNodes.forEach(osc => {
                try { osc.stop(); osc.disconnect(); } catch (e) {}
            });
            this.synthNodes = [];
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.playing = false;
        this.paused = false;
    }

    /**
     * Compute the Y position for a note given its hit time.
     * Notes fall DOWNWARD: spawn at top, receptor at bottom.
     * Uses dynamic scrollTime (affected by song speed + user settings + events).
     */
    getNoteY(noteTime, scrollTimeOverride) {
        const songPos = this.getSongPosition();
        const timeDiff = noteTime - songPos;
        const st = scrollTimeOverride || this.scrollTime;
        const pixelsPerMs = CONFIG.RECEPTOR_Y / st;
        return CONFIG.RECEPTOR_Y - timeDiff * pixelsPerMs;
    }
}
