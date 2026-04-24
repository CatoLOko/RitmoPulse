/**
 * JudgmentPopup — Floating judgment text at the receptor zone.
 */
import { CONFIG } from '../config.js';

const JUDGMENT_STYLES = {
    PERFECT: { color: '#FFD700', fontSize: '30px', glow: true },
    GREAT:   { color: '#00D4FF', fontSize: '26px', glow: false },
    GOOD:    { color: '#2ECC71', fontSize: '22px', glow: false },
    MISS:    { color: '#E74C3C', fontSize: '22px', glow: false },
};

export default class JudgmentPopup {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Show a judgment popup at the given lane.
     */
    show(lane, judgment) {
        const style = JUDGMENT_STYLES[judgment] || JUDGMENT_STYLES.MISS;
        const x = CONFIG.LANE_CENTERS[lane];
        const y = CONFIG.RECEPTOR_Y - 50;

        const text = this.scene.add.text(x, y, judgment, {
            fontFamily: 'Orbitron',
            fontSize: style.fontSize,
            color: style.color,
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(25).setAlpha(0);

        // Entrance: scale up + fade in
        this.scene.tweens.add({
            targets: text,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 80,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Float up and fade out
                this.scene.tweens.add({
                    targets: text,
                    y: y - 40,
                    alpha: 0,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    duration: 400,
                    ease: 'Power2',
                    onComplete: () => text.destroy(),
                });
            }
        });

        // Extra glow for PERFECT
        if (style.glow) {
            const glow = this.scene.add.text(x, y, judgment, {
                fontFamily: 'Orbitron',
                fontSize: style.fontSize,
                color: '#ffffff',
                fontStyle: 'bold',
            }).setOrigin(0.5).setDepth(24).setAlpha(0).setBlendMode('ADD');

            this.scene.tweens.add({
                targets: glow,
                alpha: 0.5,
                duration: 80,
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: glow,
                        y: y - 40,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => glow.destroy(),
                    });
                }
            });
        }
    }

    /**
     * Show judgment at center (for non-lane-specific events).
     */
    showCenter(judgment) {
        const style = JUDGMENT_STYLES[judgment] || JUDGMENT_STYLES.MISS;
        const x = CONFIG.WIDTH / 2;
        const y = CONFIG.RECEPTOR_Y - 60;

        const text = this.scene.add.text(x, y, judgment, {
            fontFamily: 'Orbitron',
            fontSize: style.fontSize,
            color: style.color,
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(25);

        this.scene.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => text.destroy(),
        });
    }
}
