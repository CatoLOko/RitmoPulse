/**
 * MenuScene — Main menu with keyboard navigation and neon aesthetics.
 */
import { CONFIG } from '../config.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        this.cameras.main.fadeIn(500);

        // Background
        this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'bg_menu');

        // Floating particles in background
        const bgParticles = this.add.particles(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'particle', {
            x: { min: 0, max: CONFIG.WIDTH },
            y: { min: 0, max: CONFIG.HEIGHT },
            speed: { min: 10, max: 30 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.3, end: 0 },
            lifespan: 4000,
            frequency: 200,
            tint: [0x9B59B6, 0x00D4FF, 0x2ECC71],
            blendMode: 'ADD',
        });
        bgParticles.setDepth(0);

        // Title
        this.add.text(CONFIG.WIDTH / 2, 120, 'PROJECT', {
            fontFamily: 'Orbitron',
            fontSize: '36px',
            color: '#ffffff',
            letterSpacing: 12,
        }).setOrigin(0.5);

        const pulseTitle = this.add.text(CONFIG.WIDTH / 2, 170, 'PULSE', {
            fontFamily: 'Orbitron',
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#9B59B6',
        }).setOrigin(0.5);

        this.tweens.add({
            targets: pulseTitle,
            alpha: 0.6,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Decorative line
        this.add.rectangle(CONFIG.WIDTH / 2, 210, 250, 2, 0x9B59B6, 0.4);

        // Menu items
        this.menuItems = ['JOGAR', 'OPÇÕES', 'CRÉDITOS'];
        this.selectedIndex = 0;
        this.menuTexts = [];

        const startY = 300;
        const spacing = 70;

        this.menuItems.forEach((label, i) => {
            const text = this.add.text(CONFIG.WIDTH / 2, startY + i * spacing, label, {
                fontFamily: 'Orbitron',
                fontSize: '28px',
                color: '#555566',
                letterSpacing: 4,
            }).setOrigin(0.5).setDepth(5);

            this.menuTexts.push(text);
        });

        // Selection indicator (neon bracket)
        this.selectorLeft = this.add.text(0, 0, '▸', {
            fontFamily: 'Orbitron',
            fontSize: '28px',
            color: '#9B59B6',
        }).setOrigin(0.5).setDepth(5);

        this.selectorRight = this.add.text(0, 0, '◂', {
            fontFamily: 'Orbitron',
            fontSize: '28px',
            color: '#9B59B6',
        }).setOrigin(0.5).setDepth(5);

        // Glow behind selected item
        this.selectorGlow = this.add.rectangle(CONFIG.WIDTH / 2, 0, 320, 50, 0x9B59B6, 0.08)
            .setDepth(4);

        this.updateSelection();

        // Footer
        this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30, '↑↓ Navigate  •  ENTER Select', {
            fontFamily: 'Inter',
            fontSize: '13px',
            color: '#444455',
        }).setOrigin(0.5);

        // Input
        this.upKey = this.input.keyboard.addKey('UP');
        this.downKey = this.input.keyboard.addKey('DOWN');
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.wKey = this.input.keyboard.addKey('W');
        this.sKey = this.input.keyboard.addKey('S');
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
            this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
            this.updateSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.downKey) || Phaser.Input.Keyboard.JustDown(this.sKey)) {
            this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
            this.updateSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.selectItem();
        }
    }

    updateSelection() {
        this.menuTexts.forEach((text, i) => {
            if (i === this.selectedIndex) {
                text.setColor('#ffffff');
                text.setFontSize('32px');

                this.selectorLeft.setPosition(text.x - text.width / 2 - 30, text.y);
                this.selectorRight.setPosition(text.x + text.width / 2 + 30, text.y);
                this.selectorGlow.setPosition(CONFIG.WIDTH / 2, text.y);

                // Bounce animation
                this.tweens.add({
                    targets: text,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 150,
                    yoyo: true,
                    ease: 'Back.easeOut',
                });
            } else {
                text.setColor('#555566');
                text.setFontSize('28px');
                text.setScale(1);
            }
        });

        // Pulse selectors
        this.tweens.killTweensOf(this.selectorLeft);
        this.tweens.killTweensOf(this.selectorRight);
        this.tweens.add({
            targets: [this.selectorLeft, this.selectorRight],
            alpha: 0.4,
            duration: 600,
            yoyo: true,
            repeat: -1,
        });
    }

    selectItem() {
        switch (this.selectedIndex) {
            case 0: // JOGAR
                this.cameras.main.fadeOut(400, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('SongSelect');
                });
                break;
            case 1: // OPÇÕES
                // TODO: Options scene
                this.showToast('Em breve!');
                break;
            case 2: // CRÉDITOS
                this.showToast('Project Pulse — Jogo de Ritmo');
                break;
        }
    }

    showToast(message) {
        const toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 80, message, {
            fontFamily: 'Inter',
            fontSize: '16px',
            color: '#00D4FF',
            backgroundColor: '#1a1a2e',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: CONFIG.HEIGHT - 120,
            duration: 1500,
            delay: 1000,
            onComplete: () => toast.destroy(),
        });
    }
}
