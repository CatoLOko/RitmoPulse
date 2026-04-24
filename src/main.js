/**
 * Project Pulse — Main Entry Point
 */
import { CONFIG } from './config.js';
import BootScene from './scenes/BootScene.js';
import SplashScene from './scenes/SplashScene.js';
import MenuScene from './scenes/MenuScene.js';
import SongSelectScene from './scenes/SongSelectScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a12',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [BootScene, SplashScene, MenuScene, SongSelectScene, GameScene, ResultScene, GameOverScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        antialias: true,
        pixelArt: false,
    },
};

const game = new Phaser.Game(config);
