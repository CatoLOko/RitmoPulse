/**
 * HUD — In-game heads-up display: Score, Combo, Health Bar, Song Progress.
 */
import { CONFIG } from '../config.js';

export default class HUD {
    constructor(scene) {
        this.scene = scene;

        // Score display (top right)
        this.scoreText = scene.add.text(CONFIG.WIDTH - 30, 25, '0', {
            fontFamily: 'Orbitron',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(1, 0.5).setDepth(50);

        this.scoreLabel = scene.add.text(CONFIG.WIDTH - 30, 50, 'SCORE', {
            fontFamily: 'Inter',
            fontSize: '12px',
            color: '#888899',
        }).setOrigin(1, 0).setDepth(50);

        // Combo counter (center, below receptor area)
        this.comboText = scene.add.text(CONFIG.WIDTH / 2, CONFIG.RECEPTOR_Y + 45, '', {
            fontFamily: 'Orbitron',
            fontSize: '28px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(50).setAlpha(0);

        this.comboLabel = scene.add.text(CONFIG.WIDTH / 2, CONFIG.RECEPTOR_Y + 68, 'COMBO', {
            fontFamily: 'Inter',
            fontSize: '11px',
            color: '#997700',
        }).setOrigin(0.5).setDepth(50).setAlpha(0);

        // Multiplier badge
        this.multText = scene.add.text(CONFIG.WIDTH - 30, 75, '', {
            fontFamily: 'Orbitron',
            fontSize: '16px',
            color: '#00D4FF',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(1, 0).setDepth(50);

        // Health bar (top left)
        this.healthBg = scene.add.image(30, 25, 'healthbar_bg').setOrigin(0, 0.5).setDepth(50);
        this.healthFill = scene.add.image(30, 25, 'healthbar_fill').setOrigin(0, 0.5).setDepth(51);
        this.healthLabel = scene.add.text(30, 42, 'HEALTH', {
            fontFamily: 'Inter',
            fontSize: '11px',
            color: '#888899',
        }).setOrigin(0, 0).setDepth(50);

        // Song progress bar (bottom)
        this.progressBg = scene.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 8, CONFIG.WIDTH - 40, 6, 0x1a1a2e, 0.8)
            .setDepth(50);
        this.progressFill = scene.add.rectangle(20, CONFIG.HEIGHT - 8, 0, 6, 0x9B59B6, 1)
            .setOrigin(0, 0.5).setDepth(51);

        // Song info (top center)
        this.songTitle = null;

        this.currentScore = 0;
        this.displayedScore = 0;
    }

    /**
     * Set the song title displayed at top.
     */
    setSongInfo(title, artist) {
        this.songTitle = this.scene.add.text(CONFIG.WIDTH / 2, 15, `${title} — ${artist}`, {
            fontFamily: 'Inter',
            fontSize: '14px',
            color: '#666677',
        }).setOrigin(0.5, 0).setDepth(50);
    }

    /**
     * Update all HUD elements. Called each frame.
     */
    update(scoreManager, songPosition, songDuration) {
        // Smooth score counter animation
        this.currentScore = scoreManager.score;
        this.displayedScore = Phaser.Math.Linear(this.displayedScore, this.currentScore, 0.15);
        this.scoreText.setText(Math.floor(this.displayedScore).toLocaleString());

        // Combo
        const combo = scoreManager.combo;
        if (combo >= 2) {
            this.comboText.setText(combo.toString());
            this.comboText.setAlpha(1);
            this.comboLabel.setAlpha(1);
        } else {
            this.comboText.setAlpha(0);
            this.comboLabel.setAlpha(0);
        }

        // Multiplier
        const mult = scoreManager.getMultiplier();
        if (mult > 1) {
            this.multText.setText(`×${mult}`);
            this.multText.setAlpha(1);
        } else {
            this.multText.setAlpha(0);
        }

        // Health bar
        const healthPct = scoreManager.health / CONFIG.HEALTH_MAX;
        this.healthFill.setScale(healthPct, 1);

        // Health bar color
        if (healthPct > 0.6) {
            this.healthFill.setTint(0x2ECC71);
        } else if (healthPct > 0.3) {
            this.healthFill.setTint(0xF1C40F);
        } else {
            this.healthFill.setTint(0xE74C3C);
        }

        // Song progress
        if (songDuration > 0) {
            const pct = Phaser.Math.Clamp(songPosition / songDuration, 0, 1);
            this.progressFill.width = (CONFIG.WIDTH - 40) * pct;
        }
    }

    /**
     * Animate combo pop on increment.
     */
    popCombo() {
        this.scene.tweens.add({
            targets: this.comboText,
            scaleX: 1.4,
            scaleY: 1.4,
            duration: 80,
            yoyo: true,
            ease: 'Back.easeOut',
        });
    }

    destroy() {
        this.scoreText.destroy();
        this.scoreLabel.destroy();
        this.comboText.destroy();
        this.comboLabel.destroy();
        this.multText.destroy();
        this.healthBg.destroy();
        this.healthFill.destroy();
        this.healthLabel.destroy();
        this.progressBg.destroy();
        this.progressFill.destroy();
        if (this.songTitle) this.songTitle.destroy();
    }
}
