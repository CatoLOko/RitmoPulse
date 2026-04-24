/**
 * SplashScene — Animated logo reveal with neon aesthetics.
 */
import { CONFIG } from '../config.js';

export default class SplashScene extends Phaser.Scene {
    constructor() {
        super('Splash');
    }

    create() {
        // Dark background
        this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x0a0a12);

        // Pulsing background glow
        const bgGlow = this.add.circle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 200, 0x9B59B6, 0);
        this.tweens.add({
            targets: bgGlow,
            alpha: 0.15,
            scaleX: 2,
            scaleY: 2,
            duration: 1500,
            ease: 'Sine.easeOut',
        });

        // Title: "PROJECT"
        const projectText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 40, 'PROJECT', {
            fontFamily: 'Orbitron',
            fontSize: '52px',
            color: '#ffffff',
            letterSpacing: 16,
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);

        // Title: "PULSE"
        const pulseText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 30, 'PULSE', {
            fontFamily: 'Orbitron',
            fontSize: '72px',
            fontStyle: 'bold',
            color: '#9B59B6',
            stroke: '#6B3FA0',
            strokeThickness: 2,
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);

        // Subtitle
        const subText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 90, 'RHYTHM GAME', {
            fontFamily: 'Inter',
            fontSize: '16px',
            color: '#555566',
            letterSpacing: 8,
        }).setOrigin(0.5).setAlpha(0);

        // Animate logo in
        this.tweens.add({
            targets: projectText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 600,
            ease: 'Back.easeOut',
            delay: 300,
        });

        this.tweens.add({
            targets: pulseText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 600,
            ease: 'Back.easeOut',
            delay: 600,
        });

        this.tweens.add({
            targets: subText,
            alpha: 1,
            duration: 500,
            delay: 1000,
        });

        // Neon pulse animation on "PULSE" text
        this.tweens.add({
            targets: pulseText,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1,
            delay: 1500,
            ease: 'Sine.easeInOut',
        });

        // "Press any key" prompt
        const pressText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 80, 'Press any key to continue', {
            fontFamily: 'Inter',
            fontSize: '14px',
            color: '#444455',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: pressText,
            alpha: 0.7,
            duration: 500,
            delay: 2000,
            yoyo: true,
            repeat: -1,
        });

        // Decorative lines
        const line1 = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 75, 300, 2, 0x9B59B6, 0);
        const line2 = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 115, 300, 2, 0x9B59B6, 0);
        this.tweens.add({ targets: [line1, line2], alpha: 0.3, duration: 800, delay: 1200 });

        // Skip / auto advance
        this.time.delayedCall(4000, () => {
            this.transitionToMenu();
        });

        this.input.keyboard.on('keydown', () => {
            this.transitionToMenu();
        });

        this.transitioning = false;
    }

    transitionToMenu() {
        if (this.transitioning) return;
        this.transitioning = true;

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Menu');
        });
    }
}
