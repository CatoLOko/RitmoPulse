/**
 * ScoreManager — Judgment evaluation, scoring, combo, and health tracking.
 */
import { CONFIG } from '../config.js';

export default class ScoreManager {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.health = CONFIG.HEALTH_START;

        // Judgment counts
        this.perfects = 0;
        this.greats = 0;
        this.goods = 0;
        this.misses = 0;

        this.totalNotes = 0;
    }

    /**
     * Evaluate timing accuracy and return judgment string.
     * @param {number} timeDiff - absolute time difference in ms
     * @returns {{ judgment: string, score: number }}
     */
    evaluate(timeDiff) {
        const abs = Math.abs(timeDiff);

        let judgment, points, healthDelta;

        if (abs <= CONFIG.JUDGE_PERFECT) {
            judgment = 'PERFECT';
            points = CONFIG.SCORE_PERFECT;
            healthDelta = CONFIG.HEALTH_PERFECT;
            this.perfects++;
        } else if (abs <= CONFIG.JUDGE_GREAT) {
            judgment = 'GREAT';
            points = CONFIG.SCORE_GREAT;
            healthDelta = CONFIG.HEALTH_GREAT;
            this.greats++;
        } else if (abs <= CONFIG.JUDGE_GOOD) {
            judgment = 'GOOD';
            points = CONFIG.SCORE_GOOD;
            healthDelta = CONFIG.HEALTH_GOOD;
            this.goods++;
        } else {
            judgment = 'MISS';
            points = CONFIG.SCORE_MISS;
            healthDelta = CONFIG.HEALTH_MISS;
            this.misses++;
        }

        if (judgment !== 'MISS') {
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            const mult = this.getMultiplier();
            this.score += points * mult;
        } else {
            this.combo = 0;
        }

        this.health = Phaser.Math.Clamp(this.health + healthDelta, 0, CONFIG.HEALTH_MAX);
        this.totalNotes++;

        return { judgment, score: points };
    }

    /**
     * Register a miss (note passed without being hit).
     */
    registerMiss() {
        this.misses++;
        this.combo = 0;
        this.health = Phaser.Math.Clamp(this.health + CONFIG.HEALTH_MISS, 0, CONFIG.HEALTH_MAX);
        this.totalNotes++;
    }

    /**
     * Add sustain tick points.
     */
    addSustainTick() {
        const mult = this.getMultiplier();
        this.score += CONFIG.SUSTAIN_TICK_SCORE * mult;
    }

    /**
     * Get current combo multiplier.
     */
    getMultiplier() {
        for (let i = CONFIG.COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
            if (this.combo >= CONFIG.COMBO_THRESHOLDS[i].min) {
                return CONFIG.COMBO_THRESHOLDS[i].mult;
            }
        }
        return 1;
    }

    /**
     * Check if health is depleted.
     */
    isDead() {
        return this.health <= 0;
    }

    /**
     * Get accuracy percentage.
     */
    getAccuracy() {
        const total = this.perfects + this.greats + this.goods + this.misses;
        if (total === 0) return 100;
        const weighted = (this.perfects * 100 + this.greats * 75 + this.goods * 50) / total;
        return weighted;
    }

    /**
     * Get letter rank based on accuracy.
     */
    getRank() {
        const acc = this.getAccuracy();
        for (const t of CONFIG.RANK_THRESHOLDS) {
            if (acc >= t.min) return t.rank;
        }
        return 'F';
    }

    /**
     * Get full results object for the ResultScene.
     */
    getResults() {
        return {
            score: this.score,
            combo: this.maxCombo,
            perfects: this.perfects,
            greats: this.greats,
            goods: this.goods,
            misses: this.misses,
            accuracy: this.getAccuracy(),
            rank: this.getRank(),
        };
    }
}
