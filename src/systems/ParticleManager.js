/**
 * ParticleManager — Visual feedback for note hits, misses, and combo milestones.
 */
import { CONFIG } from '../config.js';

export default class ParticleManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Emit a hit burst at the receptor for the given lane.
     */
    emitHit(lane, judgment) {
        const x = CONFIG.LANE_CENTERS[lane];
        const y = CONFIG.RECEPTOR_Y;
        const color = CONFIG.LANE_COLORS[lane];

        let count, speed, scale, lifespan;

        switch (judgment) {
            case 'PERFECT':
                count = 20;
                speed = 250;
                scale = { start: 0.8, end: 0 };
                lifespan = 600;
                this.flashScreen(lane);
                break;
            case 'GREAT':
                count = 12;
                speed = 180;
                scale = { start: 0.5, end: 0 };
                lifespan = 400;
                break;
            case 'GOOD':
                count = 6;
                speed = 120;
                scale = { start: 0.3, end: 0 };
                lifespan = 300;
                break;
            default:
                return; // no particles for miss
        }

        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: speed * 0.5, max: speed },
            scale: scale,
            lifespan: lifespan,
            quantity: count,
            blendMode: 'ADD',
            tint: color,
            gravityY: 100,
            emitting: false,
        });
        particles.setDepth(20);
        particles.explode(count);

        // Clean up after particles finish
        this.scene.time.delayedCall(lifespan + 100, () => {
            if (particles && !particles.destroyed) particles.destroy();
        });
    }

    /**
     * Flash the lane area for PERFECT hits.
     */
    flashScreen(lane) {
        const x = CONFIG.LANE_CENTERS[lane];
        const flash = this.scene.add.image(x, CONFIG.RECEPTOR_Y, 'glow');
        flash.setScale(3);
        flash.setAlpha(0.6);
        flash.setTint(CONFIG.LANE_COLORS[lane]);
        flash.setBlendMode('ADD');
        flash.setDepth(15);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 5,
            scaleY: 5,
            duration: 300,
            ease: 'Power2',
            onComplete: () => flash.destroy(),
        });
    }

    /**
     * Red flash on receptor for a miss.
     */
    emitMiss(lane) {
        const x = CONFIG.LANE_CENTERS[lane];
        const flash = this.scene.add.image(x, CONFIG.RECEPTOR_Y, 'glow');
        flash.setScale(1.5);
        flash.setAlpha(0.5);
        flash.setTint(0xff0000);
        flash.setBlendMode('ADD');
        flash.setDepth(15);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy(),
        });
    }

    /**
     * Combo milestone burst.
     */
    emitComboMilestone(combo) {
        const cx = CONFIG.WIDTH / 2;
        const cy = CONFIG.HEIGHT / 2;

        const text = this.scene.add.text(cx, cy, `${combo} COMBO!`, {
            fontFamily: 'Orbitron',
            fontSize: '48px',
            color: '#FFD700',
            stroke: '#000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(30).setAlpha(0);

        this.scene.tweens.add({
            targets: text,
            alpha: 1,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
            hold: 400,
            ease: 'Back.easeOut',
            onComplete: () => text.destroy(),
        });
    }
}
