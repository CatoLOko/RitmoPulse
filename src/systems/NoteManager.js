/**
 * NoteManager — Loads chart data, spawns/positions/recycles note sprites.
 * Notes scroll DOWNWARD. Position is always derived from AudioSyncManager.
 */
import { CONFIG } from '../config.js';

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

        // Pixels per millisecond
        this.pxPerMs = CONFIG.RECEPTOR_Y / CONFIG.SCROLL_TIME;
    }

    /**
     * Load chart notes from JSON data.
     */
    loadChart(chartData) {
        this.notes = chartData.notes
            .map(n => ({
                time: n.time,
                lane: n.lane,
                type: n.type || 'tap',
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
        // Spawn notes that are approaching the visible area
        const spawnAheadMs = CONFIG.SCROLL_TIME + 200; // spawn a bit early

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

                // Rotation for lane direction
                const angle = [270, 180, 0, 90][noteData.lane];
                noteData.sprite.angle = angle;
            }

            // Update sustain body rendering
            if (noteData.type === 'sustain' && noteData.sustainSprites) {
                this.updateSustainVisual(noteData, songPosition);
            }

            // Recycle if way past the receptor and not hit
            if (y > CONFIG.HEIGHT + 100) {
                if (!noteData.hit && !noteData.missed) {
                    noteData.missed = true;
                    // The GameScene will handle scoring the miss
                }
                this.recycleNote(noteData);
                this.activeNotes.splice(i, 1);
            }
        }
    }

    /**
     * Spawn a note sprite.
     */
    spawnNote(noteData) {
        const x = CONFIG.LANE_CENTERS[noteData.lane];
        const y = this.audioSync.getNoteY(noteData.time);
        const angle = [270, 180, 0, 90][noteData.lane];

        // Create note sprite
        const sprite = this.scene.add.image(x, y, `note_${noteData.lane}`);
        sprite.setAngle(angle);
        sprite.setDepth(10);
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
        const x = CONFIG.LANE_CENTERS[noteData.lane];
        const lane = noteData.lane;
        const totalHeight = noteData.duration * this.pxPerMs;

        // Container for sustain parts
        const container = this.scene.add.container(x, 0);
        container.setDepth(5);

        // Body — a tiled sprite stretching upward from the note head
        const body = this.scene.add.tileSprite(0, 0, CONFIG.SUSTAIN_WIDTH, totalHeight, `sustain_body_${lane}`);
        body.setOrigin(0.5, 1); // anchor at bottom
        container.add(body);

        // Cap at the top
        const cap = this.scene.add.image(0, -totalHeight, `sustain_cap_${lane}`);
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
        const x = CONFIG.LANE_CENTERS[noteData.lane];

        if (noteData.holdActive) {
            // While being held, the bottom of the sustain stays at receptor
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
            // Free-falling: container bottom = note head position
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
     * Mark a note as hit and handle visual feedback.
     */
    hitNote(noteData) {
        noteData.hit = true;

        if (noteData.type === 'sustain') {
            // Start hold tracking
            noteData.holdActive = true;
            noteData.lastTickTime = this.audioSync.getSongPosition();
            this.activeHolds[noteData.lane] = noteData;

            // Hide the note head but keep sustain visible
            if (noteData.sprite) {
                noteData.sprite.setVisible(false);
            }
        } else {
            // Tap note: remove sprite
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
                // Player released early — end the hold
                holdNote.holdActive = false;
                this.activeHolds[lane] = null;
                this.destroySustainVisual(holdNote);
                continue;
            }

            // Award tick points
            if (songPosition - holdNote.lastTickTime >= CONFIG.SUSTAIN_TICK_INTERVAL) {
                const ticksEarned = Math.floor((songPosition - holdNote.lastTickTime) / CONFIG.SUSTAIN_TICK_INTERVAL);
                ticks += ticksEarned;
                holdNote.lastTickTime += ticksEarned * CONFIG.SUSTAIN_TICK_INTERVAL;
            }

            // Check if hold is complete
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
     */
    getMissedNotes(songPosition) {
        const missed = [];
        for (const noteData of this.activeNotes) {
            if (!noteData.hit && !noteData.missed) {
                const diff = songPosition - noteData.time;
                if (diff > CONFIG.JUDGE_MISS) {
                    noteData.missed = true;
                    missed.push(noteData);
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
     * Get total note count in the chart.
     */
    getTotalNoteCount() {
        return this.notes.length;
    }

    destroy() {
        this.noteGroup.destroy(true);
        this.sustainGroup.destroy(true);
        this.activeNotes = [];
        this.activeHolds = [null, null, null, null];
    }
}
