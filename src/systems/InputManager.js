/**
 * InputManager — Keyboard input handling with key-repeat filtering.
 * Maps arrow keys and WASD to 4 lanes.
 */
import { CONFIG } from '../config.js';

export default class InputManager {
    constructor(scene) {
        this.scene = scene;

        // Current state: is the key currently held down?
        this.held = [false, false, false, false];

        // Edge triggers: was the key JUST pressed this frame?
        this.justPressed = [false, false, false, false];

        // Edge triggers: was the key JUST released this frame?
        this.justReleased = [false, false, false, false];

        // Phaser key objects
        this.keys = {
            left:  [scene.input.keyboard.addKey('LEFT'),  scene.input.keyboard.addKey('A')],
            down:  [scene.input.keyboard.addKey('DOWN'),  scene.input.keyboard.addKey('S')],
            up:    [scene.input.keyboard.addKey('UP'),    scene.input.keyboard.addKey('W')],
            right: [scene.input.keyboard.addKey('RIGHT'), scene.input.keyboard.addKey('D')],
        };

        this.laneKeys = [this.keys.left, this.keys.down, this.keys.up, this.keys.right];

        // ESC for pause
        this.escKey = scene.input.keyboard.addKey('ESC');
        this.enterKey = scene.input.keyboard.addKey('ENTER');
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
