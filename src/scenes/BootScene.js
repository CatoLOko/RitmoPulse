/**
 * BootScene — Generates all textures procedurally and preloads data.
 * No external image assets needed.
 */
import { CONFIG } from '../config.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load chart & song data
        this.load.json('songlist', 'data/songlist.json');
    }

    create() {
        this.generateArrowTextures();
        this.generateReceptorTextures();
        this.generateSustainTextures();
        this.generateParticleTexture();
        this.generateBackgrounds();
        this.generateUITextures();
        this.scene.start('Splash');
    }

    /** Draw an UP arrow polygon on a graphics object */
    drawArrow(g, cx, cy, size, filled, color, alpha = 1) {
        const s = size / 2;
        const headH = s * 0.65;
        const stemW = s * 0.4;
        const stemH = s * 0.55;

        const points = [
            { x: cx, y: cy - s },                          // tip
            { x: cx + s, y: cy - s + headH },              // right wing
            { x: cx + stemW, y: cy - s + headH },          // inner right
            { x: cx + stemW, y: cy + s },                  // bottom right
            { x: cx - stemW, y: cy + s },                  // bottom left
            { x: cx - stemW, y: cy - s + headH },          // inner left
            { x: cx - s, y: cy - s + headH },              // left wing
        ];

        if (filled) {
            g.fillStyle(color, alpha);
            g.beginPath();
            g.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                g.lineTo(points[i].x, points[i].y);
            }
            g.closePath();
            g.fillPath();
        } else {
            g.lineStyle(3, color, alpha);
            g.beginPath();
            g.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                g.lineTo(points[i].x, points[i].y);
            }
            g.closePath();
            g.strokePath();
        }
    }

    /** Rotation angle for each lane (base shape is UP arrow) */
    getLaneAngle(lane) {
        return [270, 180, 0, 90][lane]; // left, down, up, right
    }

    generateArrowTextures() {
        const size = CONFIG.NOTE_SIZE;
        const texSize = size + 8; // padding for glow
        const center = texSize / 2;

        for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
            const g = this.make.graphics({ add: false });

            // Glow layer
            this.drawArrow(g, center, center, size + 4, true, CONFIG.LANE_COLORS[i], 0.2);
            // Main arrow
            this.drawArrow(g, center, center, size, true, CONFIG.LANE_COLORS[i], 1);
            // Highlight edge
            this.drawArrow(g, center, center, size - 6, false, 0xffffff, 0.25);

            g.generateTexture(`note_${i}`, texSize, texSize);
            g.destroy();
        }
    }

    generateReceptorTextures() {
        const size = CONFIG.NOTE_SIZE;
        const texSize = size + 8;
        const center = texSize / 2;

        for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
            const g = this.make.graphics({ add: false });

            // Dim filled background
            this.drawArrow(g, center, center, size, true, CONFIG.LANE_COLORS[i], 0.15);
            // Bright outline
            this.drawArrow(g, center, center, size, false, CONFIG.LANE_COLORS[i], 0.7);

            g.generateTexture(`receptor_${i}`, texSize, texSize);
            g.destroy();

            // Pressed state (brighter)
            const g2 = this.make.graphics({ add: false });
            this.drawArrow(g2, center, center, size, true, CONFIG.LANE_COLORS[i], 0.5);
            this.drawArrow(g2, center, center, size, false, 0xffffff, 0.8);
            g2.generateTexture(`receptor_pressed_${i}`, texSize, texSize);
            g2.destroy();
        }
    }

    generateSustainTextures() {
        const w = CONFIG.SUSTAIN_WIDTH;
        const h = 32; // tile height for sustain body

        for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
            // Body segment (tileable)
            const g = this.make.graphics({ add: false });
            g.fillStyle(CONFIG.LANE_COLORS[i], 0.5);
            g.fillRoundedRect(2, 0, w - 4, h, 4);
            g.fillStyle(0xffffff, 0.15);
            g.fillRoundedRect(w / 2 - 3, 0, 6, h, 2);
            g.generateTexture(`sustain_body_${i}`, w, h);
            g.destroy();

            // End cap
            const g2 = this.make.graphics({ add: false });
            g2.fillStyle(CONFIG.LANE_COLORS[i], 0.7);
            g2.fillRoundedRect(2, 0, w - 4, 12, 6);
            g2.generateTexture(`sustain_cap_${i}`, w, 12);
            g2.destroy();
        }
    }

    generateParticleTexture() {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(8, 8, 8);
        g.generateTexture('particle', 16, 16);
        g.destroy();

        // Glow burst
        const g2 = this.make.graphics({ add: false });
        g2.fillStyle(0xffffff, 0.6);
        g2.fillCircle(16, 16, 16);
        g2.fillStyle(0xffffff, 0.3);
        g2.fillCircle(16, 16, 12);
        g2.generateTexture('glow', 32, 32);
        g2.destroy();
    }

    generateBackgrounds() {
        // Game background
        const g = this.make.graphics({ add: false });
        // Dark gradient
        for (let y = 0; y < CONFIG.HEIGHT; y++) {
            const t = y / CONFIG.HEIGHT;
            const r = Math.floor(10 + t * 8);
            const gr = Math.floor(10 + t * 6);
            const b = Math.floor(18 + t * 20);
            g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b));
            g.fillRect(0, y, CONFIG.WIDTH, 1);
        }

        // Subtle grid lines
        g.lineStyle(1, 0x1a1a3e, 0.3);
        for (let x = 0; x < CONFIG.WIDTH; x += 50) {
            g.lineBetween(x, 0, x, CONFIG.HEIGHT);
        }
        for (let y = 0; y < CONFIG.HEIGHT; y += 50) {
            g.lineBetween(0, y, CONFIG.WIDTH, y);
        }

        g.generateTexture('bg_game', CONFIG.WIDTH, CONFIG.HEIGHT);
        g.destroy();

        // Menu background
        const gm = this.make.graphics({ add: false });
        for (let y = 0; y < CONFIG.HEIGHT; y++) {
            const t = y / CONFIG.HEIGHT;
            const r = Math.floor(15 + t * 10);
            const gr2 = Math.floor(5 + t * 8);
            const b = Math.floor(30 + t * 30);
            gm.fillStyle(Phaser.Display.Color.GetColor(r, gr2, b));
            gm.fillRect(0, y, CONFIG.WIDTH, 1);
        }
        gm.generateTexture('bg_menu', CONFIG.WIDTH, CONFIG.HEIGHT);
        gm.destroy();
    }

    generateUITextures() {
        // Health bar background
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x1a1a2e, 0.8);
        g.fillRoundedRect(0, 0, 200, 20, 10);
        g.lineStyle(2, 0x333355, 1);
        g.strokeRoundedRect(0, 0, 200, 20, 10);
        g.generateTexture('healthbar_bg', 200, 20);
        g.destroy();

        // Health bar fill (white, will be tinted)
        const g2 = this.make.graphics({ add: false });
        g2.fillStyle(0xffffff, 1);
        g2.fillRoundedRect(2, 2, 196, 16, 8);
        g2.generateTexture('healthbar_fill', 200, 20);
        g2.destroy();
    }
}
