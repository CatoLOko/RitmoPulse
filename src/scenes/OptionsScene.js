/**
 * OptionsScene — Settings UI with key remapping, volume, scroll speed, and toggles.
 */
import { CONFIG } from '../config.js';
import settingsManager from '../systems/SettingsManager.js';

const LANE_LABELS = ['← ESQUERDA', '↓ BAIXO', '↑ CIMA', '→ DIREITA'];
const LANE_NAMES = ['left', 'down', 'up', 'right'];

export default class OptionsScene extends Phaser.Scene {
    constructor() {
        super('Options');
    }

    create() {
        this.cameras.main.fadeIn(400);
        this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'bg_menu');

        // Title
        this.add.text(CONFIG.WIDTH / 2, 35, 'OPÇÕES', {
            fontFamily: 'Orbitron', fontSize: '30px', color: '#9B59B6', letterSpacing: 6,
        }).setOrigin(0.5);
        this.add.rectangle(CONFIG.WIDTH / 2, 60, 200, 2, 0x9B59B6, 0.3);

        // Tabs
        this.tabs = ['CONTROLES', 'ÁUDIO', 'GAMEPLAY'];
        this.activeTab = 0;
        this.tabTexts = [];
        this.tabContents = [];

        const tabY = 90;
        this.tabs.forEach((label, i) => {
            const x = 200 + i * 250;
            const t = this.add.text(x, tabY, label, {
                fontFamily: 'Orbitron', fontSize: '16px', color: '#555566',
            }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
            t.on('pointerdown', () => this.switchTab(i));
            this.tabTexts.push(t);
        });

        this.tabUnderline = this.add.rectangle(200, tabY + 18, 140, 3, 0x9B59B6, 0.8).setDepth(10);

        // Build all tab contents
        this.buildControlsTab();
        this.buildAudioTab();
        this.buildGameplayTab();

        this.switchTab(0);

        // Footer
        this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 25, 'ESC Voltar', {
            fontFamily: 'Inter', fontSize: '13px', color: '#444455',
        }).setOrigin(0.5);

        this.escKey = this.input.keyboard.addKey('ESC');

        // Rebind state
        this.isRebinding = false;
        this.rebindLane = -1;
        this.rebindIsAlt = false;
        this.rebindText = null;
    }

    update() {
        if (!this.isRebinding && Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Menu'));
        }
    }

    switchTab(index) {
        this.activeTab = index;
        this.tabTexts.forEach((t, i) => {
            t.setColor(i === index ? '#ffffff' : '#555566');
        });
        const x = 200 + index * 250;
        this.tweens.add({ targets: this.tabUnderline, x, duration: 200, ease: 'Power2' });

        this.tabContents.forEach((container, i) => {
            container.setVisible(i === index);
        });
    }

    // ─── CONTROLS TAB ───────────────────────────────────────────────
    buildControlsTab() {
        const c = this.add.container(0, 0).setDepth(5);
        this.tabContents.push(c);

        const startY = 140;
        c.add(this.add.text(CONFIG.WIDTH / 2, startY, 'Teclas Primárias e Alternativas', {
            fontFamily: 'Inter', fontSize: '14px', color: '#888899',
        }).setOrigin(0.5));

        this.keyDisplays = [];

        LANE_LABELS.forEach((label, i) => {
            const y = startY + 45 + i * 65;
            const color = CONFIG.LANE_COLORS_HEX[i];

            // Lane label
            c.add(this.add.text(150, y, label, {
                fontFamily: 'Orbitron', fontSize: '16px', color,
            }).setOrigin(0, 0.5));

            // Primary key button
            const primKey = settingsManager.getKey(i);
            const primBtn = this.createKeyButton(380, y, primKey, i, false);
            c.add(primBtn.bg);
            c.add(primBtn.text);

            // "ou" label
            c.add(this.add.text(480, y, 'ou', {
                fontFamily: 'Inter', fontSize: '13px', color: '#555566',
            }).setOrigin(0.5));

            // Alt key button
            const altKey = settingsManager.getAltKey(i);
            const altBtn = this.createKeyButton(580, y, altKey, i, true);
            c.add(altBtn.bg);
            c.add(altBtn.text);

            this.keyDisplays.push({ prim: primBtn, alt: altBtn });
        });

        // Reset keys button
        const resetY = startY + 45 + 4 * 65 + 20;
        const resetBtn = this.add.text(CONFIG.WIDTH / 2, resetY, '↺ RESETAR TECLAS', {
            fontFamily: 'Orbitron', fontSize: '16px', color: '#E74C3C',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        resetBtn.on('pointerover', () => resetBtn.setColor('#ffffff'));
        resetBtn.on('pointerout', () => resetBtn.setColor('#E74C3C'));
        resetBtn.on('pointerdown', () => {
            settingsManager.resetKeys();
            this.refreshKeyDisplays();
        });
        c.add(resetBtn);

        // Rebind overlay
        this.rebindOverlay = this.add.container(0, 0).setDepth(100).setVisible(false);
        const overlayBg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.8);
        const overlayText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 20, 'Pressione uma tecla...', {
            fontFamily: 'Orbitron', fontSize: '28px', color: '#00D4FF',
        }).setOrigin(0.5);
        const overlaySub = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 25, 'ESC para cancelar', {
            fontFamily: 'Inter', fontSize: '14px', color: '#555566',
        }).setOrigin(0.5);
        this.rebindOverlay.add([overlayBg, overlayText, overlaySub]);
    }

    createKeyButton(x, y, keyName, lane, isAlt) {
        const bg = this.add.rectangle(x, y, 80, 40, 0x1a1a2e, 0.9)
            .setStrokeStyle(2, 0x333355)
            .setInteractive({ useHandCursor: true });
        const text = this.add.text(x, y, this.formatKeyName(keyName), {
            fontFamily: 'Orbitron', fontSize: '15px', color: '#ffffff',
        }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setStrokeStyle(2, 0x9B59B6));
        bg.on('pointerout', () => bg.setStrokeStyle(2, 0x333355));
        bg.on('pointerdown', () => this.startRebind(lane, isAlt, text));

        return { bg, text };
    }

    startRebind(lane, isAlt, textObj) {
        this.isRebinding = true;
        this.rebindLane = lane;
        this.rebindIsAlt = isAlt;
        this.rebindText = textObj;
        this.rebindOverlay.setVisible(true);

        this.input.keyboard.once('keydown', (event) => {
            if (event.key === 'Escape') {
                this.cancelRebind();
                return;
            }

            const keyCode = event.key.toUpperCase();
            const phaserKey = this.browserKeyToPhaser(event.code, keyCode);

            if (isAlt) {
                settingsManager.setAltKey(lane, phaserKey);
            } else {
                settingsManager.setKey(lane, phaserKey);
            }

            this.rebindText.setText(this.formatKeyName(phaserKey));
            this.cancelRebind();
        });
    }

    cancelRebind() {
        this.isRebinding = false;
        this.rebindOverlay.setVisible(false);
    }

    refreshKeyDisplays() {
        for (let i = 0; i < 4; i++) {
            this.keyDisplays[i].prim.text.setText(this.formatKeyName(settingsManager.getKey(i)));
            this.keyDisplays[i].alt.text.setText(this.formatKeyName(settingsManager.getAltKey(i)));
        }
    }

    browserKeyToPhaser(code, key) {
        // Map common browser key codes to Phaser key names
        const map = {
            'ArrowLeft': 'LEFT', 'ArrowRight': 'RIGHT', 'ArrowUp': 'UP', 'ArrowDown': 'DOWN',
            'Space': 'SPACE', 'Enter': 'ENTER', 'ShiftLeft': 'SHIFT', 'ShiftRight': 'SHIFT',
            'ControlLeft': 'CTRL', 'ControlRight': 'CTRL',
        };
        if (map[code]) return map[code];
        if (code.startsWith('Key')) return code.replace('Key', '');
        if (code.startsWith('Digit')) return code.replace('Digit', '');
        return key.toUpperCase();
    }

    formatKeyName(key) {
        const names = {
            'LEFT': '←', 'RIGHT': '→', 'UP': '↑', 'DOWN': '↓',
            'SPACE': 'SPC', 'ENTER': 'ENT', 'SHIFT': 'SHIFT',
        };
        return names[key] || key;
    }

    // ─── AUDIO TAB ──────────────────────────────────────────────────
    buildAudioTab() {
        const c = this.add.container(0, 0).setDepth(5);
        this.tabContents.push(c);

        const sliders = [
            { label: 'Volume Música', key: 'musicVolume', color: 0x9B59B6 },
            { label: 'Volume SFX', key: 'sfxVolume', color: 0x00D4FF },
            { label: 'Volume Geral', key: 'masterVolume', color: 0x2ECC71 },
            { label: 'Offset de Áudio (ms)', key: 'audioOffset', color: 0xF1C40F, min: -100, max: 100, step: 5 },
        ];

        const startY = 160;
        sliders.forEach((s, i) => {
            const y = startY + i * 80;
            this.createSlider(c, 150, y, s.label, s.key, s.color, s.min, s.max, s.step);
        });
    }

    createSlider(container, x, y, label, settingKey, color, min = 0, max = 1, step = 0.05) {
        const sliderWidth = 400;
        const sliderX = x + 150;

        container.add(this.add.text(x, y, label, {
            fontFamily: 'Inter', fontSize: '16px', color: '#888899',
        }).setOrigin(0, 0.5));

        // Track
        const track = this.add.rectangle(sliderX + sliderWidth / 2, y, sliderWidth, 6, 0x222244, 1)
            .setInteractive({ useHandCursor: true });
        container.add(track);

        // Fill
        const currentVal = settingsManager.get(settingKey);
        const pct = (currentVal - min) / (max - min);
        const fill = this.add.rectangle(sliderX, y, sliderWidth * pct, 6, color, 1).setOrigin(0, 0.5);
        container.add(fill);

        // Thumb
        const thumbX = sliderX + sliderWidth * pct;
        const thumb = this.add.circle(thumbX, y, 12, color, 1).setInteractive({ useHandCursor: true, draggable: true });
        container.add(thumb);

        // Value text
        const isOffset = min < 0;
        const displayVal = isOffset ? `${Math.round(currentVal)}ms` : `${Math.round(currentVal * 100)}%`;
        const valText = this.add.text(sliderX + sliderWidth + 30, y, displayVal, {
            fontFamily: 'Orbitron', fontSize: '14px', color: '#ffffff',
        }).setOrigin(0, 0.5);
        container.add(valText);

        // Drag logic
        this.input.setDraggable(thumb);
        thumb.on('drag', (pointer, dragX) => {
            const clampedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderWidth);
            thumb.x = clampedX;
            const newPct = (clampedX - sliderX) / sliderWidth;
            fill.width = sliderWidth * newPct;

            let newVal = min + newPct * (max - min);
            if (step >= 1) newVal = Math.round(newVal / step) * step;
            else newVal = Math.round(newVal / step) * step;

            settingsManager.set(settingKey, newVal);
            valText.setText(isOffset ? `${Math.round(newVal)}ms` : `${Math.round(newVal * 100)}%`);
        });

        // Click on track to jump
        track.on('pointerdown', (pointer) => {
            const localX = pointer.x - (sliderX - sliderWidth / 2) + sliderWidth / 2;
            // Recalculate to get the actual position on the track
            const clampedX = Phaser.Math.Clamp(pointer.x, sliderX, sliderX + sliderWidth);
            thumb.x = clampedX;
            const newPct = (clampedX - sliderX) / sliderWidth;
            fill.width = sliderWidth * newPct;

            let newVal = min + newPct * (max - min);
            if (step >= 1) newVal = Math.round(newVal / step) * step;
            else newVal = Math.round(newVal / step) * step;

            settingsManager.set(settingKey, newVal);
            valText.setText(isOffset ? `${Math.round(newVal)}ms` : `${Math.round(newVal * 100)}%`);
        });
    }

    // ─── GAMEPLAY TAB ───────────────────────────────────────────────
    buildGameplayTab() {
        const c = this.add.container(0, 0).setDepth(5);
        this.tabContents.push(c);

        const startY = 160;

        // Scroll speed multiplier slider
        this.createSlider(c, 150, startY, 'Velocidade das Notas', 'scrollSpeedMultiplier', 0xE74C3C, 0.5, 3.0, 0.1);

        // Background effects toggle
        const effectsY = startY + 100;
        c.add(this.add.text(150, effectsY, 'Efeitos Visuais', {
            fontFamily: 'Inter', fontSize: '16px', color: '#888899',
        }).setOrigin(0, 0.5));

        const effectsOn = settingsManager.get('backgroundEffects');
        const toggleBg = this.add.rectangle(550, effectsY, 70, 34, effectsOn ? 0x2ECC71 : 0x333355, 1)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x444466);
        const toggleKnob = this.add.circle(effectsOn ? 575 : 525, effectsY, 13, 0xffffff, 1);
        const toggleLabel = this.add.text(640, effectsY, effectsOn ? 'ON' : 'OFF', {
            fontFamily: 'Orbitron', fontSize: '14px', color: effectsOn ? '#2ECC71' : '#666677',
        }).setOrigin(0, 0.5);
        c.add(toggleBg);
        c.add(toggleKnob);
        c.add(toggleLabel);

        toggleBg.on('pointerdown', () => {
            const current = settingsManager.get('backgroundEffects');
            const newVal = !current;
            settingsManager.set('backgroundEffects', newVal);
            this.tweens.add({ targets: toggleKnob, x: newVal ? 575 : 525, duration: 150 });
            toggleBg.setFillStyle(newVal ? 0x2ECC71 : 0x333355);
            toggleLabel.setText(newVal ? 'ON' : 'OFF').setColor(newVal ? '#2ECC71' : '#666677');
        });

        // FPS counter toggle
        const fpsY = effectsY + 80;
        c.add(this.add.text(150, fpsY, 'Contador FPS', {
            fontFamily: 'Inter', fontSize: '16px', color: '#888899',
        }).setOrigin(0, 0.5));

        const fpsOn = settingsManager.get('showFPS');
        const fpsBg = this.add.rectangle(550, fpsY, 70, 34, fpsOn ? 0x2ECC71 : 0x333355, 1)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x444466);
        const fpsKnob = this.add.circle(fpsOn ? 575 : 525, fpsY, 13, 0xffffff, 1);
        const fpsLabel = this.add.text(640, fpsY, fpsOn ? 'ON' : 'OFF', {
            fontFamily: 'Orbitron', fontSize: '14px', color: fpsOn ? '#2ECC71' : '#666677',
        }).setOrigin(0, 0.5);
        c.add(fpsBg);
        c.add(fpsKnob);
        c.add(fpsLabel);

        fpsBg.on('pointerdown', () => {
            const current = settingsManager.get('showFPS');
            const newVal = !current;
            settingsManager.set('showFPS', newVal);
            this.tweens.add({ targets: fpsKnob, x: newVal ? 575 : 525, duration: 150 });
            fpsBg.setFillStyle(newVal ? 0x2ECC71 : 0x333355);
            fpsLabel.setText(newVal ? 'ON' : 'OFF').setColor(newVal ? '#2ECC71' : '#666677');
        });

        // Reset all settings
        const resetY = fpsY + 100;
        const resetAll = this.add.text(CONFIG.WIDTH / 2, resetY, '↺ RESETAR TUDO', {
            fontFamily: 'Orbitron', fontSize: '16px', color: '#E74C3C',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        resetAll.on('pointerover', () => resetAll.setColor('#ffffff'));
        resetAll.on('pointerout', () => resetAll.setColor('#E74C3C'));
        resetAll.on('pointerdown', () => {
            settingsManager.resetToDefaults();
            this.scene.restart();
        });
        c.add(resetAll);
    }
}
