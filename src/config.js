/**
 * Project Pulse — Game Configuration Constants
 */
export const CONFIG = {
    // Canvas
    WIDTH: 900,
    HEIGHT: 700,

    // Lane layout
    LANE_COUNT: 4,
    LANE_WIDTH: 80,
    LANE_GAP: 10,
    NOTE_SIZE: 60,

    // Highway position — notes fall DOWNWARD (Guitar Hero style)
    RECEPTOR_Y: 620,
    SPAWN_Y: -80, // above viewport

    // Scroll timing (ms for note to travel from spawn to receptor)
    SCROLL_TIME: 2000,

    // Lane colors: Left=Purple, Down=Cyan, Up=Green, Right=Red
    LANE_COLORS: [0x9B59B6, 0x00D4FF, 0x2ECC71, 0xE74C3C],
    LANE_COLORS_HEX: ['#9B59B6', '#00D4FF', '#2ECC71', '#E74C3C'],
    LANE_NAMES: ['left', 'down', 'up', 'right'],

    // Judgment windows (ms from perfect center)
    JUDGE_PERFECT: 45,
    JUDGE_GREAT: 90,
    JUDGE_GOOD: 135,
    JUDGE_MISS: 180,

    // Score values
    SCORE_PERFECT: 350,
    SCORE_GREAT: 200,
    SCORE_GOOD: 100,
    SCORE_MISS: 0,

    // Health
    HEALTH_MAX: 100,
    HEALTH_START: 50,
    HEALTH_PERFECT: 4,
    HEALTH_GREAT: 3,
    HEALTH_GOOD: 1,
    HEALTH_MISS: -8,

    // Sustain notes
    SUSTAIN_TICK_INTERVAL: 50,
    SUSTAIN_TICK_SCORE: 10,
    SUSTAIN_WIDTH: 24,

    // Combo multiplier thresholds
    COMBO_THRESHOLDS: [
        { min: 0, mult: 1 },
        { min: 10, mult: 2 },
        { min: 30, mult: 4 },
        { min: 50, mult: 8 },
    ],

    // Ranking thresholds (accuracy %)
    RANK_THRESHOLDS: [
        { min: 95, rank: 'S' },
        { min: 85, rank: 'A' },
        { min: 70, rank: 'B' },
        { min: 55, rank: 'C' },
        { min: 40, rank: 'D' },
        { min: 0,  rank: 'F' },
    ],

    // Computed: highway geometry (filled in init())
    HIGHWAY_X: 0,
    LANE_CENTERS: [],
};

// Compute derived values
const totalWidth = CONFIG.LANE_COUNT * CONFIG.LANE_WIDTH + (CONFIG.LANE_COUNT - 1) * CONFIG.LANE_GAP;
CONFIG.HIGHWAY_X = (CONFIG.WIDTH - totalWidth) / 2;
for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
    CONFIG.LANE_CENTERS[i] = CONFIG.HIGHWAY_X + i * (CONFIG.LANE_WIDTH + CONFIG.LANE_GAP) + CONFIG.LANE_WIDTH / 2;
}
