/**
 * ResultScene — Performance summary with animated rank reveal.
 */
import { CONFIG } from '../config.js';

const RANK_COLORS = {
    S: '#FFD700', A: '#00D4FF', B: '#2ECC71',
    C: '#F1C40F', D: '#E67E22', F: '#E74C3C',
};

export default class ResultScene extends Phaser.Scene {
    constructor() {
        super('Result');
    }

    init(data) {
        this.results = data.results;
        this.songData = data.song;
    }

    create() {
        this.cameras.main.fadeIn(500);
        this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'bg_menu');

        const r = this.results;
        const rankColor = RANK_COLORS[r.rank] || '#ffffff';

        // Title
        this.add.text(CONFIG.WIDTH / 2, 35, 'RESULTS', {
            fontFamily: 'Orbitron',
            fontSize: '32px',
            color: '#9B59B6',
            letterSpacing: 6,
        }).setOrigin(0.5);

        // Song name
        this.add.text(CONFIG.WIDTH / 2, 70, r.songName || 'Unknown', {
            fontFamily: 'Inter',
            fontSize: '18px',
            color: '#888899',
        }).setOrigin(0.5);

        this.add.rectangle(CONFIG.WIDTH / 2, 95, 300, 2, 0x9B59B6, 0.3);

        // Rank (animated, big center)
        const rank = this.add.text(CONFIG.WIDTH / 2, 220, r.rank, {
            fontFamily: 'Orbitron',
            fontSize: '120px',
            fontStyle: 'bold',
            color: rankColor,
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5).setAlpha(0).setScale(3);

        this.tweens.add({
            targets: rank,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 800,
            ease: 'Back.easeOut',
            delay: 400,
        });

        // Pulsing glow on rank
        this.tweens.add({
            targets: rank,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            delay: 1400,
        });

        // Stats panel
        const panelX = CONFIG.WIDTH / 2;
        const panelY = 350;
        const statSpacing = 30;

        const stats = [
            { label: 'Score', value: r.score.toLocaleString(), color: '#ffffff' },
            { label: 'Max Combo', value: `${r.combo}x`, color: '#FFD700' },
            { label: 'Accuracy', value: `${r.accuracy.toFixed(1)}%`, color: '#00D4FF' },
            { label: 'Perfect', value: r.perfects.toString(), color: '#FFD700' },
            { label: 'Great', value: r.greats.toString(), color: '#00D4FF' },
            { label: 'Good', value: r.goods.toString(), color: '#2ECC71' },
            { label: 'Miss', value: r.misses.toString(), color: '#E74C3C' },
        ];

        stats.forEach((stat, i) => {
            const y = panelY + i * statSpacing;

            this.add.text(panelX - 120, y, stat.label, {
                fontFamily: 'Inter',
                fontSize: '16px',
                color: '#888899',
            }).setOrigin(0, 0.5).setDepth(5);

            const valueText = this.add.text(panelX + 120, y, stat.value, {
                fontFamily: 'Orbitron',
                fontSize: '18px',
                color: stat.color,
            }).setOrigin(1, 0.5).setDepth(5).setAlpha(0);

            // Staggered reveal
            this.tweens.add({
                targets: valueText,
                alpha: 1,
                x: panelX + 120,
                duration: 300,
                delay: 800 + i * 100,
                ease: 'Power2',
            });
        });

        // Buttons
        const buttonY = CONFIG.HEIGHT - 80;

        const retryBtn = this.add.text(CONFIG.WIDTH / 2 - 100, buttonY, '↻ RETRY', {
            fontFamily: 'Orbitron',
            fontSize: '20px',
            color: '#00D4FF',
        }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

        const backBtn = this.add.text(CONFIG.WIDTH / 2 + 100, buttonY, '← BACK', {
            fontFamily: 'Orbitron',
            fontSize: '20px',
            color: '#9B59B6',
        }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerover', () => retryBtn.setColor('#ffffff'));
        retryBtn.on('pointerout', () => retryBtn.setColor('#00D4FF'));
        retryBtn.on('pointerdown', () => {
            this.scene.start('Game', { song: this.songData });
        });

        backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#9B59B6'));
        backBtn.on('pointerdown', () => {
            this.scene.start('SongSelect');
        });

        // Keyboard shortcuts
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('Game', { song: this.songData });
        });
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('SongSelect');
        });

        // Footer hint
        this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30, 'ENTER Retry  •  ESC Back', {
            fontFamily: 'Inter',
            fontSize: '13px',
            color: '#444455',
        }).setOrigin(0.5);
    }
}
