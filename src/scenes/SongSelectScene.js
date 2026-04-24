/**
 * SongSelectScene — Song list with difficulty, high scores, and keyboard navigation.
 */
import { CONFIG } from '../config.js';

export default class SongSelectScene extends Phaser.Scene {
    constructor() {
        super('SongSelect');
    }

    create() {
        this.cameras.main.fadeIn(400);
        this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'bg_menu');

        // Title
        this.add.text(CONFIG.WIDTH / 2, 40, 'SELECT SONG', {
            fontFamily: 'Orbitron',
            fontSize: '28px',
            color: '#9B59B6',
            letterSpacing: 6,
        }).setOrigin(0.5);

        this.add.rectangle(CONFIG.WIDTH / 2, 65, 200, 2, 0x9B59B6, 0.3);

        // Load song list
        this.songs = this.cache.json.get('songlist') || [];
        this.selectedIndex = 0;
        this.songCards = [];

        // Build song cards
        const startY = 120;
        const cardHeight = 90;
        const cardGap = 10;

        this.songs.forEach((song, i) => {
            const y = startY + i * (cardHeight + cardGap);
            const card = this.createSongCard(song, y, i);
            this.songCards.push(card);
        });

        // Selection highlight
        this.selectionBg = this.add.rectangle(CONFIG.WIDTH / 2, 0, CONFIG.WIDTH - 100, cardHeight, 0x9B59B6, 0.08)
            .setDepth(0);

        this.updateSelection();

        // Info panel (right side, bottom)
        this.infoPanel = this.add.container(0, 0).setDepth(10);

        // Footer
        this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30, '↑↓ Navigate  •  ENTER Play  •  ESC Back', {
            fontFamily: 'Inter',
            fontSize: '13px',
            color: '#444455',
        }).setOrigin(0.5);

        // Input
        this.upKey = this.input.keyboard.addKey('UP');
        this.downKey = this.input.keyboard.addKey('DOWN');
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.escKey = this.input.keyboard.addKey('ESC');
    }

    createSongCard(song, y, index) {
        const x = CONFIG.WIDTH / 2;

        // Song name
        const nameText = this.add.text(x - 280, y, song.name, {
            fontFamily: 'Orbitron',
            fontSize: '22px',
            color: '#888899',
        }).setOrigin(0, 0.5).setDepth(5);

        // Artist
        const artistText = this.add.text(x - 280, y + 22, song.artist, {
            fontFamily: 'Inter',
            fontSize: '14px',
            color: '#555566',
        }).setOrigin(0, 0.5).setDepth(5);

        // BPM
        const bpmText = this.add.text(x + 120, y - 8, `${song.bpm} BPM`, {
            fontFamily: 'Inter',
            fontSize: '13px',
            color: '#00D4FF',
        }).setOrigin(0, 0.5).setDepth(5);

        // Difficulty stars
        const diffStars = '★'.repeat(song.difficulty) + '☆'.repeat(5 - song.difficulty);
        const diffText = this.add.text(x + 120, y + 14, diffStars, {
            fontFamily: 'Inter',
            fontSize: '16px',
            color: '#FFD700',
        }).setOrigin(0, 0.5).setDepth(5);

        // Divider line
        const divider = this.add.rectangle(x, y + 45, CONFIG.WIDTH - 140, 1, 0x222244, 0.5).setDepth(3);

        return { nameText, artistText, bpmText, diffText, divider, y };
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
            this.selectedIndex = (this.selectedIndex - 1 + this.songs.length) % this.songs.length;
            this.updateSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
            this.selectedIndex = (this.selectedIndex + 1) % this.songs.length;
            this.updateSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.startSong();
        }
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.scene.start('Menu');
        }
    }

    updateSelection() {
        this.songCards.forEach((card, i) => {
            if (i === this.selectedIndex) {
                card.nameText.setColor('#ffffff');
                card.nameText.setFontSize('24px');
                this.selectionBg.setPosition(CONFIG.WIDTH / 2, card.y);
            } else {
                card.nameText.setColor('#888899');
                card.nameText.setFontSize('22px');
            }
        });
    }

    startSong() {
        if (this.songs.length === 0) return;

        const song = this.songs[this.selectedIndex];

        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game', { song });
        });
    }
}
