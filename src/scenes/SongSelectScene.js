/**
 * SongSelectScene — Song list with difficulty, speed indicator, and keyboard navigation.
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
        this.add.text(CONFIG.WIDTH / 2, 35, 'SELECT SONG', {
            fontFamily: 'Orbitron',
            fontSize: '26px',
            color: '#9B59B6',
            letterSpacing: 6,
        }).setOrigin(0.5);

        this.add.rectangle(CONFIG.WIDTH / 2, 58, 200, 2, 0x9B59B6, 0.3);

        // Load song list
        this.songs = this.cache.json.get('songlist') || [];
        this.selectedIndex = 0;
        this.songCards = [];

        // Build song cards
        const startY = 100;
        const cardHeight = 80;
        const cardGap = 6;

        this.songs.forEach((song, i) => {
            const y = startY + i * (cardHeight + cardGap);
            const card = this.createSongCard(song, y, i);
            this.songCards.push(card);
        });

        // Selection highlight
        this.selectionBg = this.add.rectangle(CONFIG.WIDTH / 2, 0, CONFIG.WIDTH - 100, cardHeight, 0x9B59B6, 0.08)
            .setDepth(0);

        this.updateSelection();

        // Footer
        this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 25, '↑↓ Navigate  •  ENTER Play  •  ESC Back', {
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
        const nameText = this.add.text(x - 320, y, song.name, {
            fontFamily: 'Orbitron',
            fontSize: '20px',
            color: '#888899',
        }).setOrigin(0, 0.5).setDepth(5);

        // Artist
        const artistText = this.add.text(x - 320, y + 20, song.artist, {
            fontFamily: 'Inter',
            fontSize: '13px',
            color: '#555566',
        }).setOrigin(0, 0.5).setDepth(5);

        // BPM
        const bpmText = this.add.text(x + 100, y - 12, `${song.bpm} BPM`, {
            fontFamily: 'Inter',
            fontSize: '12px',
            color: '#00D4FF',
        }).setOrigin(0, 0.5).setDepth(5);

        // Difficulty stars
        const diffStars = '★'.repeat(song.difficulty) + '☆'.repeat(5 - song.difficulty);
        const diffText = this.add.text(x + 100, y + 6, diffStars, {
            fontFamily: 'Inter',
            fontSize: '14px',
            color: '#FFD700',
        }).setOrigin(0, 0.5).setDepth(5);

        // Scroll speed indicator
        const speed = song.scrollSpeed || 1.0;
        const speedLabel = speed <= 1.0 ? 'NORMAL' : speed <= 1.3 ? 'RÁPIDO' : speed <= 1.6 ? 'INTENSO' : 'EXTREMO';
        const speedColor = speed <= 1.0 ? '#2ECC71' : speed <= 1.3 ? '#F1C40F' : speed <= 1.6 ? '#E67E22' : '#E74C3C';
        const speedText = this.add.text(x + 100, y + 24, `⚡ ${speedLabel} (${speed}x)`, {
            fontFamily: 'Inter',
            fontSize: '11px',
            color: speedColor,
        }).setOrigin(0, 0.5).setDepth(5);

        // Divider line
        const divider = this.add.rectangle(x, y + 40, CONFIG.WIDTH - 140, 1, 0x222244, 0.4).setDepth(3);

        return { nameText, artistText, bpmText, diffText, speedText, divider, y };
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
                card.nameText.setFontSize('22px');
                this.selectionBg.setPosition(CONFIG.WIDTH / 2, card.y);

                // Bounce animation
                this.tweens.add({
                    targets: card.nameText,
                    scaleX: 1.03,
                    scaleY: 1.03,
                    duration: 120,
                    yoyo: true,
                    ease: 'Back.easeOut',
                });
            } else {
                card.nameText.setColor('#888899');
                card.nameText.setFontSize('20px');
                card.nameText.setScale(1);
            }
        });
    }

    startSong() {
        if (this.songs.length === 0) return;

        const song = this.songs[this.selectedIndex];

        this.sound.stopAll();

        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game', { song });
        });
    }
}
