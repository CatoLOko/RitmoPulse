/**
 * SettingsManager — Global singleton for game settings.
 * Persists to localStorage, provides defaults, and notifies listeners.
 */

const STORAGE_KEY = 'projectpulse_settings';

const DEFAULTS = {
    // Key bindings (Phaser key codes)
    keyBindings: {
        left: 'LEFT',
        down: 'DOWN',
        up: 'UP',
        right: 'RIGHT',
    },
    altKeyBindings: {
        left: 'A',
        down: 'S',
        up: 'W',
        right: 'D',
    },

    // Audio
    masterVolume: 0.7,
    musicVolume: 0.8,
    sfxVolume: 0.5,
    audioOffset: 0, // ms

    // Gameplay
    scrollSpeedMultiplier: 1.0,  // user multiplier (combined with per-song speed)
    backgroundEffects: true,
    showFPS: false,
    gameMode: 'Standard', // Standard, Zen, Sudden Death
    ghostNotes: false,
};

class SettingsManager {
    constructor() {
        this.settings = this.load();
    }

    /**
     * Load settings from localStorage, merging with defaults.
     */
    load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return this.mergeDefaults(parsed);
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        return JSON.parse(JSON.stringify(DEFAULTS));
    }

    /**
     * Deep merge stored settings with defaults (handles new settings added in updates).
     */
    mergeDefaults(stored) {
        const merged = JSON.parse(JSON.stringify(DEFAULTS));
        for (const key of Object.keys(merged)) {
            if (key in stored) {
                if (typeof merged[key] === 'object' && !Array.isArray(merged[key])) {
                    merged[key] = { ...merged[key], ...stored[key] };
                } else {
                    merged[key] = stored[key];
                }
            }
        }
        return merged;
    }

    /**
     * Save current settings to localStorage.
     */
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    /**
     * Get a setting value.
     */
    get(key) {
        return this.settings[key];
    }

    /**
     * Set a setting value and auto-save.
     */
    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    /**
     * Get the effective scroll time for a given song's scroll speed.
     * Lower scroll time = faster notes.
     * Formula: baseScrollTime / (songScrollSpeed * userMultiplier)
     */
    getEffectiveScrollTime(songScrollSpeed = 1.0) {
        const baseTime = 2000; // ms at 1.0x
        const userMult = this.settings.scrollSpeedMultiplier;
        return baseTime / (songScrollSpeed * userMult);
    }

    /**
     * Get primary key binding for a lane.
     */
    getKey(lane) {
        const names = ['left', 'down', 'up', 'right'];
        return this.settings.keyBindings[names[lane]];
    }

    /**
     * Get alt key binding for a lane.
     */
    getAltKey(lane) {
        const names = ['left', 'down', 'up', 'right'];
        return this.settings.altKeyBindings[names[lane]];
    }

    /**
     * Set primary key binding for a lane.
     */
    setKey(lane, keyCode) {
        const names = ['left', 'down', 'up', 'right'];
        this.settings.keyBindings[names[lane]] = keyCode;
        this.save();
    }

    /**
     * Set alt key binding for a lane.
     */
    setAltKey(lane, keyCode) {
        const names = ['left', 'down', 'up', 'right'];
        this.settings.altKeyBindings[names[lane]] = keyCode;
        this.save();
    }

    /**
     * Reset all settings to defaults.
     */
    resetToDefaults() {
        this.settings = JSON.parse(JSON.stringify(DEFAULTS));
        this.save();
    }

    /**
     * Reset only key bindings to defaults.
     */
    resetKeys() {
        this.settings.keyBindings = JSON.parse(JSON.stringify(DEFAULTS.keyBindings));
        this.settings.altKeyBindings = JSON.parse(JSON.stringify(DEFAULTS.altKeyBindings));
        this.save();
    }
}

// Singleton instance
const settingsManager = new SettingsManager();
export default settingsManager;
