/**
 * NoteManager — Loads chart data, spawns/positions/recycles note sprites.
 * Notes scroll DOWNWARD. Position is always derived from AudioSyncManager.
 * Supports bomb notes and visual modifiers (wobble, mirror).
 */
import { CONFIG } from '../config.js';
import settingsManager from './SettingsManager.js';

export default class NoteManager {
    constructor(scene, audioSync) {
        this.scene = scene;
        this.audioSync = audioSync;

        this.notes = [];          // chart note data
        this.activeNotes = [];    // currently visible note sprites
        this.nextNoteIndex = 0;   // pointer into this.notes

        // Sustain hold tracking per lane
        this.activeHolds = [null, null, null, null];

        // Sprite groups
        this.noteGroup = scene.add.group();
        this.sustainGroup = scene.add.group();

        // Pixels per millisecond (base, may change with dynamic scroll)
        this.pxPerMs = CONFIG.RECEPTOR_Y / CONFIG.SCROLL_TIME;

        // Reference to EventManager for wobble/mirror effects
        this.eventMgr = null;
    }

    /**
     * Set reference to EventManager for visual modifiers.
     */
    setEventManager(eventMgr) {
        this.eventMgr = eventMgr;
    }

    /**
     * Load chart notes from JSON data.
     */
    loadChart(chartData) {
        this.notes = chartData.notes
            .map(n => ({
                time: n.time,
                lane: n.lane,
                type: n.type || 'tap',  // 'tap', 'sustain', or 'bomb'
                duration: n.duration || 0,
                hit: false,
                missed: false,
                sprite: null,
                sustainSprites: null,
                holdActive: false,
                lastTickTime: 0,
            }))
            .sort((a, b) => a.time - b.time);

        this.nextNoteIndex = 0;
        this.activeNotes = [];
    }

    /**
     * Update note positions and spawn/recycle as needed.
     * Called every frame from GameScene.update().
     */
    update(songPosition) {
        // Update pxPerMs based on current scroll time
        const currentScrollTime = this.audioSync.scrollTime || CONFIG.SCROLL_TIME;
        this.pxPerMs = CONFIG.RECEPTOR_Y / currentScrollTime;

        // Spawn notes that are approaching the visible area
        const spawnAheadMs = currentScrollTime + 200;

        while (this.nextNoteIndex < this.notes.length) {
            const noteData = this.notes[this.nextNoteIndex];
            if (noteData.time - songPosition > spawnAheadMs) break;

            this.spawnNote(noteData);
            this.nextNoteIndex++;
        }

        // Update positions of active notes
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const noteData = this.activeNotes[i];
            const y = this.audioSync.getNoteY(noteData.time);

            if (noteData.sprite && !noteData.sprite.destroyed) {
                noteData.sprite.y = y;

                // Apply wobble + mirror effects
                const effectiveLane = this.getEffectiveLane(noteData.lane);
                let x = CONFIG.LANE_CENTERS[effectiveLane];

                if (this.eventMgr) {
                    x += this.eventMgr.getWobbleOffset(songPosition, noteData.time);
                }

                noteData.sprite.x = x;

                // Rotation for lane direction (bomb notes don't rotate)
                if (noteData.type !== 'bomb') {
                    const angle = [270, 180, 0, 90][effectiveLane];
                    noteData.sprite.angle = angle;
                }

                // Ghost notes fading effect
                const ghostEnabled = settingsManager.get('ghostNotes');
                if (ghostEnabled && noteData.type !== 'bomb') {
                    const distance = Math.max(0, CONFIG.RECEPTOR_Y - y);
                    // Fade out completely when 150px away from receptor
                    noteData.sprite.alpha = Phaser.Math.Clamp((distance - 150) / 200, 0, 1);
                } else {
                    noteData.sprite.alpha = 1;
                }

                // Bomb note pulsing animation
                if (noteData.type === 'bomb' && !noteData._pulsing) {
                    noteData._pulsing = true;
                    this.scene.tweens.add({
                        targets: noteData.sprite,
                        scaleX: 1.15,
                        scaleY: 1.15,
                        duration: 300,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                    });
                }
            }

            // Update sustain body rendering
            if (noteData.type === 'sustain' && noteData.sustainSprites) {
                this.updateSustainVisual(noteData, songPosition);
            }

            // Recycle if way past the receptor and not hit
            if (y > CONFIG.HEIGHT + 100) {
                if (!noteData.hit && !noteData.missed) {
                    noteData.missed = true;
                }
                this.recycleNote(noteData);
                this.activeNotes.splice(i, 1);
            }
        }
    }

    /**
     * Get the effective lane, considering mirror effect.
     */
    getEffectiveLane(lane) {
        if (this.eventMgr && this.eventMgr.mirrorActive) {
            return CONFIG.LANE_COUNT - 1 - lane;
        }
        return lane;
    }

    /**
     * Spawn a note sprite.
     */
    spawnNote(noteData) {
        const effectiveLane = this.getEffectiveLane(noteData.lane);
        const x = CONFIG.LANE_CENTERS[effectiveLane];
        const y = this.audioSync.getNoteY(noteData.time);

        let sprite;
        if (noteData.type === 'bomb') {
            // Bomb note — uses special dark red texture
            sprite = this.scene.add.image(x, y, 'note_bomb');
            sprite.setDepth(11); // slightly above normal notes
        } else {
            const angle = [270, 180, 0, 90][effectiveLane];
            sprite = this.scene.add.image(x, y, `note_${effectiveLane}`);
            sprite.setAngle(angle);
            sprite.setDepth(10);
        }

        noteData.sprite = sprite;
        this.noteGroup.add(sprite);

        // Create sustain tail if needed
        if (noteData.type === 'sustain' && noteData.duration > 0) {
            this.createSustainVisual(noteData);
        }

        this.activeNotes.push(noteData);
    }

    /**
     * Create sustain note visual (body + cap extending ABOVE the note head).
     */
    createSustainVisual(noteData) {
        const effectiveLane = this.getEffectiveLane(noteData.lane);
        const x = CONFIG.LANE_CENTERS[effectiveLane];
        const totalHeight = noteData.duration * this.pxPerMs;

        const container = this.scene.add.container(x, 0);
        container.setDepth(5);

        const body = this.scene.add.tileSprite(0, 0, CONFIG.SUSTAIN_WIDTH, totalHeight, `sustain_body_${effectiveLane}`);
        body.setOrigin(0.5, 1);
        container.add(body);

        const cap = this.scene.add.image(0, -totalHeight, `sustain_cap_${effectiveLane}`);
        cap.setOrigin(0.5, 1);
        container.add(cap);

        noteData.sustainSprites = { container, body, cap, totalHeight };
        this.sustainGroup.add(container);
    }

    /**
     * Update sustain visual position and clipping during gameplay.
     */
    updateSustainVisual(noteData, songPosition) {
        const ss = noteData.sustainSprites;
        if (!ss || !ss.container || ss.container.destroyed) return;

        const noteY = this.audioSync.getNoteY(noteData.time);
        const effectiveLane = this.getEffectiveLane(noteData.lane);
        let x = CONFIG.LANE_CENTERS[effectiveLane];

        if (this.eventMgr) {
            x += this.eventMgr.getWobbleOffset(songPosition, noteData.time);
        }

        if (noteData.holdActive) {
            const endTime = noteData.time + noteData.duration;
            const remainingMs = Math.max(0, endTime - songPosition);
            const remainingHeight = remainingMs * this.pxPerMs;

            ss.container.x = x;
            ss.container.y = CONFIG.RECEPTOR_Y;
            ss.body.height = Math.max(0, remainingHeight);
            ss.cap.y = -remainingHeight;

            if (remainingMs <= 0) {
                noteData.holdActive = false;
            }
        } else {
            ss.container.x = x;
            ss.container.y = noteY;
        }
    }

    /**
     * Find the closest hittable note in a given lane.
     * Returns null if no note is within the judgment window.
     */
    getHittableNote(lane, songPosition) {
        let closest = null;
        let closestDiff = Infinity;

        for (const noteData of this.activeNotes) {
            // Check against original lane (input lane)
            if (noteData.lane !== lane || noteData.hit || noteData.missed) continue;

            const diff = Math.abs(noteData.time - songPosition);
            if (diff <= CONFIG.JUDGE_MISS && diff < closestDiff) {
                closest = noteData;
                closestDiff = diff;
            }
        }

        return closest;
    }

    /**
     * Find bomb note in a given lane that's hittable.
     */
    getBombNote(lane, songPosition) {
        for (const noteData of this.activeNotes) {
            if (noteData.type !== 'bomb') continue;
            if (noteData.lane !== lane || noteData.hit || noteData.missed) continue;

            const diff = Math.abs(noteData.time - songPosition);
            if (diff <= CONFIG.JUDGE_MISS) {
                return noteData;
            }
        }
        return null;
    }

    /**
     * Mark a note as hit and handle visual feedback.
     */
    hitNote(noteData) {
        noteData.hit = true;

        if (noteData.type === 'sustain') {
            noteData.holdActive = true;
            noteData.lastTickTime = this.audioSync.getSongPosition();
            this.activeHolds[noteData.lane] = noteData;

            if (noteData.sprite) {
                noteData.sprite.setVisible(false);
            }
        } else {
            this.destroyNoteSprite(noteData);
        }
    }

    /**
     * Update sustain hold tracking. Called each frame.
     * Returns ticks earned this frame for scoring.
     */
    updateHolds(songPosition, isLaneHeld) {
        let ticks = 0;

        for (let lane = 0; lane < CONFIG.LANE_COUNT; lane++) {
            const holdNote = this.activeHolds[lane];
            if (!holdNote || !holdNote.holdActive) continue;

            const endTime = holdNote.time + holdNote.duration;

            if (!isLaneHeld(lane)) {
                holdNote.holdActive = false;
                this.activeHolds[lane] = null;
                this.destroySustainVisual(holdNote);
                continue;
            }

            if (songPosition - holdNote.lastTickTime >= CONFIG.SUSTAIN_TICK_INTERVAL) {
                const ticksEarned = Math.floor((songPosition - holdNote.lastTickTime) / CONFIG.SUSTAIN_TICK_INTERVAL);
                ticks += ticksEarned;
                holdNote.lastTickTime += ticksEarned * CONFIG.SUSTAIN_TICK_INTERVAL;
            }

            if (songPosition >= endTime) {
                holdNote.holdActive = false;
                this.activeHolds[lane] = null;
                this.destroySustainVisual(holdNote);
            }
        }

        return ticks;
    }

    /**
     * Get notes that were missed (passed the window without being hit).
     * Bomb notes that are missed are GOOD (player avoided them).
     */
    getMissedNotes(songPosition) {
        const missed = [];
        for (const noteData of this.activeNotes) {
            if (!noteData.hit && !noteData.missed) {
                const diff = songPosition - noteData.time;
                if (diff > CONFIG.JUDGE_MISS) {
                    noteData.missed = true;
                    // Bomb notes that pass without being pressed = good!
                    if (noteData.type !== 'bomb') {
                        missed.push(noteData);
                    }
                }
            }
        }
        return missed;
    }

    /**
     * Check if all notes have been processed.
     */
    isChartComplete(songPosition) {
        return this.nextNoteIndex >= this.notes.length &&
               this.activeNotes.length === 0;
    }

    destroyNoteSprite(noteData) {
        if (noteData.sprite && !noteData.sprite.destroyed) {
            noteData.sprite.destroy();
            noteData.sprite = null;
        }
        this.destroySustainVisual(noteData);
    }

    destroySustainVisual(noteData) {
        if (noteData.sustainSprites) {
            const ss = noteData.sustainSprites;
            if (ss.container && !ss.container.destroyed) {
                ss.container.destroy();
            }
            noteData.sustainSprites = null;
        }
    }

    recycleNote(noteData) {
        this.destroyNoteSprite(noteData);
    }

    /**
     * Get total note count in the chart (excluding bombs).
     */
    getTotalNoteCount() {
        return this.notes.filter(n => n.type !== 'bomb').length;
    }

    destroy() {
        this.noteGroup.destroy(true);
        this.sustainGroup.destroy(true);
        this.activeNotes = [];
        this.activeHolds = [null, null, null, null];
    }
}
