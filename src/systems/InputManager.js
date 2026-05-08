/**
 * InputManager — Keyboard input handling with dynamic key bindings.
 * Reads bindings from SettingsManager instead of hardcoding.
 */
import { CONFIG } from '../config.js';
import settingsManager from './SettingsManager.js';

export default class InputManager {
    constructor(scene) {
        this.scene = scene;

        // Current state: is the key currently held down?
        this.held = [false, false, false, false];

        // Edge triggers: was the key JUST pressed this frame?
        this.justPressed = [false, false, false, false];

        // Edge triggers: was the key JUST released this frame?
        this.justReleased = [false, false, false, false];

        // Build key bindings from settings
        this.laneKeys = [];
        this.buildKeyBindings();

        // ESC for pause
        this.escKey = scene.input.keyboard.addKey('ESC');
        this.enterKey = scene.input.keyboard.addKey('ENTER');
    }

    /**
     * Build Phaser key objects from SettingsManager bindings.
     */
    buildKeyBindings() {
        this.laneKeys = [];
        for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
            const primary = settingsManager.getKey(i);
            const alt = settingsManager.getAltKey(i);
            const keys = [
                this.scene.input.keyboard.addKey(primary),
            ];
            // Only add alt key if it's different from primary
            if (alt && alt !== primary) {
                keys.push(this.scene.input.keyboard.addKey(alt));
            }
            this.laneKeys.push(keys);
        }
    }

    /**
     * Call at the START of each update frame.
     */
    update() {
        for (let lane = 0; lane < CONFIG.LANE_COUNT; lane++) {
            const keyGroup = this.laneKeys[lane];
            const isDown = keyGroup.some(k => k.isDown);
            const wasDown = this.held[lane];

            this.justPressed[lane] = isDown && !wasDown;
            this.justReleased[lane] = !isDown && wasDown;
            this.held[lane] = isDown;
        }
    }

    /**
     * Was the given lane key just pressed this frame?
     */
    isLaneJustPressed(lane) {
        return this.justPressed[lane];
    }

    /**
     * Is the given lane key currently held down?
     */
    isLaneHeld(lane) {
        return this.held[lane];
    }

    /**
     * Was the given lane key just released this frame?
     */
    isLaneJustReleased(lane) {
        return this.justReleased[lane];
    }

    /**
     * Was ESC just pressed?
     */
    isEscPressed() {
        return Phaser.Input.Keyboard.JustDown(this.escKey);
    }

    /**
     * Was Enter just pressed?
     */
    isEnterPressed() {
        return Phaser.Input.Keyboard.JustDown(this.enterKey);
    }

    destroy() {
        this.scene.input.keyboard.removeAllKeys(true);
    }
}
