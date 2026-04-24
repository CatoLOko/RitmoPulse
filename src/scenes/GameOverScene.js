/**
 * GameOverScene — Displayed when health reaches zero.
 */
import { CONFIG } from '../config.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.results = data.results;
        this.songData = data.song;
    }

    create() {
        this.cameras.main.fadeIn(500);

        // Dark red-tinted background
        this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x0a0408);

        // Vignette effect
        const vignette = this.add.graphics();
        vignette.fillStyle(0x300000, 0.3);
        vignette.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        // GAME OVER text
        const gameOverText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 80, 'GAME OVER', {
            fontFamily: 'Orbitron',
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#E74C3C',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setAlpha(0).setScale(2);

        this.tweens.add({
            targets: gameOverText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 800,
            ease: 'Bounce.easeOut',
        });

        // Shaking effect
        this.tweens.add({
            targets: gameOverText,
            x: CONFIG.WIDTH / 2 + 3,
            duration: 50,
            yoyo: true,
            repeat: 10,
            delay: 800,
        });

        // Score info
        const r = this.results;

        this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 20, `Score: ${r.score.toLocaleString()}`, {
            fontFamily: 'Orbitron',
            fontSize: '24px',
            color: '#888899',
        }).setOrigin(0.5);

        this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 55, `Max Combo: ${r.combo}x`, {
            fontFamily: 'Inter',
            fontSize: '18px',
            color: '#666677',
        }).setOrigin(0.5);

        // Buttons
        const retryBtn = this.add.text(CONFIG.WIDTH / 2 - 100, CONFIG.HEIGHT / 2 + 120, '↻ RETRY', {
            fontFamily: 'Orbitron',
            fontSize: '22px',
            color: '#E74C3C',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const menuBtn = this.add.text(CONFIG.WIDTH / 2 + 100, CONFIG.HEIGHT / 2 + 120, '← MENU', {
            fontFamily: 'Orbitron',
            fontSize: '22px',
            color: '#555566',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerover', () => retryBtn.setColor('#ffffff'));
        retryBtn.on('pointerout', () => retryBtn.setColor('#E74C3C'));
        retryBtn.on('pointerdown', () => {
            this.scene.start('Game', { song: this.songData });
        });

        menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#555566'));
        menuBtn.on('pointerdown', () => {
            this.scene.start('Menu');
        });

        // Keyboard
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('Game', { song: this.songData });
        });
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('Menu');
        });

        // Footer
        this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30, 'ENTER Retry  •  ESC Menu', {
            fontFamily: 'Inter',
            fontSize: '13px',
            color: '#444455',
        }).setOrigin(0.5);
    }
}
