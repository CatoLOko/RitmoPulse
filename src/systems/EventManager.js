/**
 * EventManager — Processes timed chart events for dynamic level effects.
 * Events are defined in the chart JSON alongside notes.
 */
import { CONFIG } from '../config.js';
import settingsManager from './SettingsManager.js';

export default class EventManager {
    constructor(scene) {
        this.scene = scene;
        this.events = [];
        this.nextEventIndex = 0;
        this.activeEffects = [];

        // References set by GameScene
        this.highway = null;
        this.background = null;
        this.receptors = [];

        this.enabled = settingsManager.get('backgroundEffects');
    }

    /**
     * Load events from chart data.
     */
    loadEvents(chartData) {
        this.events = (chartData.events || [])
            .map(e => ({ ...e, fired: false }))
            .sort((a, b) => a.time - b.time);
        this.nextEventIndex = 0;
        this.activeEffects = [];
    }

    /**
     * Set references to scene objects for effects.
     */
    setTargets({ highway, background, receptors, camera }) {
        this.highway = highway;
        this.background = background;
        this.receptors = receptors;
        this.camera = camera || this.scene.cameras.main;
    }

    /**
     * Update — fire events as song progresses.
     */
    update(songPosition) {
        if (!this.enabled) return;

        // Fire new events
        while (this.nextEventIndex < this.events.length) {
            const evt = this.events[this.nextEventIndex];
            if (evt.time > songPosition) break;
            if (!evt.fired) {
                this.fireEvent(evt, songPosition);
                evt.fired = true;
            }
            this.nextEventIndex++;
        }

        // Update active effects
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            if (songPosition >= effect.endTime) {
                if (effect.cleanup) effect.cleanup();
                this.activeEffects.splice(i, 1);
            }
        }
    }

    /**
     * Dispatch an event to the appropriate handler.
     */
    fireEvent(evt, songPosition) {
        switch (evt.type) {
            case 'flashBg':
                this.doFlashBg(evt);
                break;
            case 'shake':
                this.doShake(evt);
                break;
            case 'speedChange':
                this.doSpeedChange(evt);
                break;
            case 'laneZoom':
                this.doLaneZoom(evt);
                break;
            case 'colorShift':
                this.doColorShift(evt);
                break;
            case 'darkout':
                this.doDarkout(evt);
                break;
            case 'textPopup':
                this.doTextPopup(evt);
                break;
            case 'pulseReceptors':
                this.doPulseReceptors(evt);
                break;
        }
    }

    /**
     * Flash the background with a color.
     */
    doFlashBg(evt) {
        const color = Phaser.Display.Color.HexStringToColor(evt.color || '#E74C3C');
        const flash = this.scene.add.rectangle(
            CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
            CONFIG.WIDTH, CONFIG.HEIGHT,
            color.color, 0.4
        ).setDepth(0.5).setBlendMode('ADD');

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: evt.duration || 300,
            ease: 'Power2',
            onComplete: () => flash.destroy(),
        });
    }

    /**
     * Camera shake effect.
     */
    doShake(evt) {
        const intensity = (evt.intensity || 5) / 1000;
        const duration = evt.duration || 300;
        this.camera.shake(duration, intensity);
    }

    /**
     * Temporarily change scroll speed.
     */
    doSpeedChange(evt) {
        const targetSpeed = evt.speed || 1.5;
        const duration = evt.duration || 2000;

        // Store reference to audioSync's scroll speed override
        if (this.scene.audioSync) {
            const originalTime = this.scene.currentScrollTime;
            const newTime = 2000 / targetSpeed;

            this.scene.tweens.addCounter({
                from: originalTime,
                to: newTime,
                duration: 500, // transition time
                ease: 'Sine.easeInOut',
                onUpdate: (tween) => {
                    this.scene.currentScrollTime = tween.getValue();
                },
            });

            this.activeEffects.push({
                endTime: this.scene.audioSync.getSongPosition() + duration,
                cleanup: () => {
                    this.scene.tweens.addCounter({
                        from: this.scene.currentScrollTime,
                        to: originalTime,
                        duration: 500,
                        ease: 'Sine.easeInOut',
                        onUpdate: (tween) => {
                            this.scene.currentScrollTime = tween.getValue();
                        },
                    });
                }
            });
        }
    }

    /**
     * Zoom the highway in or out.
     */
    doLaneZoom(evt) {
        const targetZoom = evt.zoom || 1.1;
        const duration = evt.duration || 1000;

        this.camera.zoomTo(targetZoom, 500, 'Sine.easeInOut');

        this.activeEffects.push({
            endTime: this.scene.audioSync.getSongPosition() + duration,
            cleanup: () => {
                this.camera.zoomTo(1.0, 500, 'Sine.easeInOut');
            }
        });
    }

    /**
     * Temporarily shift lane colors.
     */
    doColorShift(evt) {
        const tintColor = Phaser.Display.Color.HexStringToColor(evt.color || '#FFD700').color;
        const duration = evt.duration || 2000;

        this.receptors.forEach(r => r.setTint(tintColor));

        this.activeEffects.push({
            endTime: this.scene.audioSync.getSongPosition() + duration,
            cleanup: () => {
                this.receptors.forEach(r => r.clearTint());
            }
        });
    }

    /**
     * Darken everything except the highway.
     */
    doDarkout(evt) {
        const duration = evt.duration || 5000;

        const overlay = this.scene.add.rectangle(
            CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
            CONFIG.WIDTH, CONFIG.HEIGHT,
            0x000000, 0
        ).setDepth(0.5);

        this.scene.tweens.add({
            targets: overlay,
            alpha: 0.6,
            duration: 500,
            ease: 'Power2',
        });

        this.activeEffects.push({
            endTime: this.scene.audioSync.getSongPosition() + duration,
            cleanup: () => {
                this.scene.tweens.add({
                    targets: overlay,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => overlay.destroy(),
                });
            }
        });
    }

    /**
     * Show floating text in the center.
     */
    doTextPopup(evt) {
        const text = this.scene.add.text(
            CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 80,
            evt.text || '!!!',
            {
                fontFamily: 'Orbitron',
                fontSize: '42px',
                fontStyle: 'bold',
                color: evt.color || '#FFD700',
                stroke: '#000000',
                strokeThickness: 4,
            }
        ).setOrigin(0.5).setDepth(30).setAlpha(0).setScale(0.5);

        this.scene.tweens.add({
            targets: text,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: text,
                    alpha: 0,
                    y: text.y - 60,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    duration: 800,
                    delay: 600,
                    onComplete: () => text.destroy(),
                });
            }
        });
    }

    /**
     * Pulse all receptors to the beat.
     */
    doPulseReceptors(evt) {
        const duration = evt.duration || 4000;
        const beatInterval = evt.interval || 577; // ms per beat

        let elapsed = 0;
        const timer = this.scene.time.addEvent({
            delay: beatInterval,
            repeat: Math.floor(duration / beatInterval),
            callback: () => {
                this.receptors.forEach(r => {
                    this.scene.tweens.add({
                        targets: r,
                        scaleX: 1.25,
                        scaleY: 1.25,
                        duration: 80,
                        yoyo: true,
                        ease: 'Sine.easeOut',
                    });
                });
            },
        });

        this.activeEffects.push({
            endTime: this.scene.audioSync.getSongPosition() + duration,
            cleanup: () => {
                timer.remove();
            }
        });
    }

    destroy() {
        for (const effect of this.activeEffects) {
            if (effect.cleanup) effect.cleanup();
        }
        this.activeEffects = [];
    }
}
