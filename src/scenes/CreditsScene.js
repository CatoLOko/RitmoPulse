/**
 * CreditsScene — Auto-scrolling credits with neon styling.
 */
import { CONFIG } from '../config.js';

export default class CreditsScene extends Phaser.Scene {
    constructor() {
        super('Credits');
    }

    create() {
        this.cameras.main.fadeIn(400);
        this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'bg_menu');

        const credits = [
            { type: 'title', text: 'PROJECT PULSE' },
            { type: 'spacer' },
            { type: 'heading', text: '— GAME DESIGN —' },
            { type: 'name', text: 'Concept & Game Design Document' },
            { type: 'spacer' },
            { type: 'heading', text: '— DESENVOLVIMENTO —' },
            { type: 'name', text: 'Programação & Engine' },
            { type: 'name', text: 'UI/UX & Visual Design' },
            { type: 'name', text: 'Chart System & Level Design' },
            { type: 'spacer' },
            { type: 'heading', text: '— MÚSICA —' },
            { type: 'name', text: '"...And Justice for All" — Metallica' },
            { type: 'name', text: '"Neon Pulse" — Project Pulse OST' },
            { type: 'name', text: '"Midnight City" — M83' },
            { type: 'name', text: '"Thunderstruck" — AC/DC' },
            { type: 'name', text: '"Take On Me" — A-ha' },
            { type: 'spacer' },
            { type: 'heading', text: '— ENGINE —' },
            { type: 'name', text: 'Phaser 3 — phaser.io' },
            { type: 'name', text: 'Web Audio API' },
            { type: 'spacer' },
            { type: 'heading', text: '— INSPIRAÇÃO —' },
            { type: 'name', text: 'Guitar Hero' },
            { type: 'name', text: 'Friday Night Funkin\'' },
            { type: 'name', text: 'StepMania / DDR' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'heading', text: '— AGRADECIMENTOS —' },
            { type: 'name', text: 'Obrigado por jogar!' },
            { type: 'spacer' },
            { type: 'title', text: '🎸' },
        ];

        // Build credit elements in a container
        const container = this.add.container(0, 0).setDepth(5);
        let y = CONFIG.HEIGHT + 50; // start below screen

        const styles = {
            title: { fontFamily: 'Orbitron', fontSize: '42px', color: '#9B59B6', fontStyle: 'bold' },
            heading: { fontFamily: 'Orbitron', fontSize: '18px', color: '#00D4FF', letterSpacing: 4 },
            name: { fontFamily: 'Inter', fontSize: '16px', color: '#aaaabb' },
        };

        for (const item of credits) {
            if (item.type === 'spacer') {
                y += 40;
                continue;
            }

            const style = styles[item.type] || styles.name;
            const text = this.add.text(CONFIG.WIDTH / 2, y, item.text, style).setOrigin(0.5);
            container.add(text);
            y += item.type === 'title' ? 70 : 35;
        }

        // Auto-scroll upward
        const totalHeight = y - CONFIG.HEIGHT;
        this.tweens.add({
            targets: container,
            y: -(totalHeight + 100),
            duration: totalHeight * 25, // ~25ms per pixel = slow readable scroll
            ease: 'Linear',
            onComplete: () => {
                this.scene.start('Menu');
            }
        });

        // Skip with ESC
        this.add.text(CONFIG.WIDTH - 30, CONFIG.HEIGHT - 25, 'ESC Voltar', {
            fontFamily: 'Inter', fontSize: '12px', color: '#444455',
        }).setOrigin(1, 0.5).setDepth(50);

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('Menu');
        });

        // Decorative side particles
        this.add.particles(0, CONFIG.HEIGHT / 2, 'particle', {
            x: { min: 0, max: CONFIG.WIDTH },
            y: { min: 0, max: CONFIG.HEIGHT },
            speed: { min: 5, max: 20 },
            scale: { start: 0.08, end: 0 },
            alpha: { start: 0.2, end: 0 },
            lifespan: 5000,
            frequency: 300,
            tint: [0x9B59B6, 0x00D4FF],
            blendMode: 'ADD',
        });
    }
}
